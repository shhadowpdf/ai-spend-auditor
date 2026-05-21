import {pricingData} from "../data/pricingData.js";
import {runAudit} from "../utils/audit.engine.js";
import { queryGroq } from "../utils/groq.js";
import {
    createPublicAuditRecord,
    updatePublicAuditLeadCapture,
    saveAudit,
} from "../db/publicAuditStore.js";
import { markAuditNotified } from "../db/publicAuditStore.js";
import { detectPricingChanges as detectPricingChangesUtil } from "../utils/pricingDetectorChange.js";
import { sendPricingChangeNotificationEmail } from "../utils/email.js";
import { resolvePublicOrigin } from "../utils/url.js";
import {
    LEAD_INTEREST_TYPES,
    sendAuditConfirmationEmail,
    sendLeadCaptureConfirmationEmail,
} from "../utils/email.js";

export const getSupportedTools = (req, res) => {
    const filteredInfo = Object.keys(pricingData).map((tool)=> (
        {
            id: tool,
            name: pricingData[tool].name,
            plans: pricingData[tool].plans.map((plan)=> ({
                id: plan.id,
                name: plan.name,
                price: plan.price,
                requiresSeat: plan.requiresSeat,
                seats: plan?.seats
            }))
        }
    ));

    return res.status(200).json(filteredInfo)
}

function capturePricingSnapshot(auditItems) {
    if (!Array.isArray(auditItems)) {
        return {};
    }

    return auditItems.reduce((snapshot, item) => {
        const toolInfo = pricingData[item.toolId];

        if (!toolInfo || snapshot[item.toolId]) {
            return snapshot;
        }

        snapshot[item.toolId] = {
            name: toolInfo.name,
            plans: toolInfo.plans,
        };

        return snapshot;
    }, {});
}

export const getUserAudit = async (req,res) => {
    try {
        const userData = req.body;
        const result = await runAudit(userData);
        let LLMResponse = "";

        try {
            LLMResponse = await queryGroq(JSON.stringify(result, null, 2));
        } catch (error) {
            console.warn("Unable to generate AI summary for audit.", error?.message || error);
        }

        const companyName = userData?.companyName?.trim() || null;
        const email = userData?.email?.trim() || null;
        let share = null;

        try {
            const storedAudit = await createPublicAuditRecord({
                companyName,
                email,
                publicOrigin: resolvePublicOrigin(req),
                report: result,
                llmResponse: LLMResponse,
            });

            share = {
                publicId: storedAudit.publicId,
                publicUrl: storedAudit.publicUrl,
                createdAt: storedAudit.createdAt,
                storage: storedAudit.storage,
            };

            try {
                await saveAudit({
                    auditId: storedAudit.publicId,
                    userEmail: email,
                    inputStack: {
                        companyName,
                        email,
                        ...userData,
                    },
                    outputResult: result,
                    pricingSnapshot: capturePricingSnapshot(userData.auditItems),
                });
            } catch (innerError) {
                console.error("Unable to save internal audit record.", innerError);
            }
        } catch (error) {
            console.error("Unable to save public audit.", error);
        }

        if (email) {
            try {
                await sendAuditConfirmationEmail({
                    email,
                    companyName,
                    report: result,
                    publicUrl: share?.publicUrl || null,
                });
            } catch (error) {
                console.error(
                    "Unable to send audit confirmation email.",
                    error
                );
            }
        }

        return res.json({
            data: result,
            LLMResponse,
            meta: {
                companyName,
                email,
            },
            share,
        });
    } catch (error) {
        console.error("Audit processing failed.", error);
        return res.status(500).json({
            message: "Unable to process audit right now.",
        });
    }
}

export const captureAuditLead = async (
    req,
    res
) => {
    try {
        const publicId =
            req.body?.publicId?.trim() || "";
        const email =
            req.body?.email?.trim() || "";
        const companyName =
            req.body?.companyName?.trim() ||
            null;
        const interestType =
            req.body?.interestType ===
            LEAD_INTEREST_TYPES.HIGH_SAVINGS
                ? LEAD_INTEREST_TYPES.HIGH_SAVINGS
                : LEAD_INTEREST_TYPES.NOTIFY_ME;

        if (!publicId) {
            return res.status(400).json({
                message:
                    "Missing audit identifier.",
            });
        }

        if (!email) {
            return res.status(400).json({
                message:
                    "Email is required to save this request.",
            });
        }

        const updatedAudit =
            await updatePublicAuditLeadCapture({
                publicId,
                email,
                companyName,
                interestType,
            });

        if (!updatedAudit) {
            return res.status(404).json({
                message:
                    "Audit not found for lead capture.",
            });
        }

        try {
            await sendLeadCaptureConfirmationEmail({
                email: updatedAudit.email,
                companyName:
                    updatedAudit.companyName,
                publicUrl:
                    updatedAudit.publicUrl,
                interestType,
            });
        } catch (error) {
            console.error(
                "Unable to send lead capture confirmation email.",
                error
            );
        }

        return res.status(200).json({
            message:
                interestType ===
                LEAD_INTEREST_TYPES.HIGH_SAVINGS
                    ? "Credex follow-up request saved."
                    : "Optimization watch request saved.",
            meta: {
                companyName:
                    updatedAudit.companyName,
                email: updatedAudit.email,
            },
            share: {
                publicId: updatedAudit.publicId,
                publicUrl: updatedAudit.publicUrl,
                createdAt: updatedAudit.createdAt,
                storage: updatedAudit.storage,
            },
            leadCapture:
                updatedAudit.report
                    ?.leadCapture || null,
        });
    } catch (error) {
        console.error(
            "Unable to capture audit lead.",
            error
        );
        return res.status(500).json({
            message:
                "Unable to save that request right now.",
        });
    }
}

export const detectPricingChanges = async (req, res) => {
    try {
        const result = await detectPricingChangesUtil();

        // Group affected audits by user email and notify once per user
        const groups = {};
        (result.affected || []).forEach((item) => {
            const email = item.userEmail || item.invalidatedAudit?.userEmail;
            if (!email) return;
            if (!groups[email]) groups[email] = [];
            groups[email].push(item);
        });

        for (const [email, items] of Object.entries(groups)) {
            try {
                const companyName = items[0]?.invalidatedAudit?.inputStack?.companyName || null;
                await sendPricingChangeNotificationEmail({
                    email,
                    companyName,
                    affectedAudits: items,
                });

                const notifiedAt = new Date().toISOString();
                for (const it of items) {
                    await markAuditNotified(it.auditId, notifiedAt);
                }
            } catch (err) {
                console.error("Unable to notify user", email, err?.message || err);
            }
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Pricing change detection failed.", error);
        return res.status(500).json({
            message: "Unable to detect pricing changes right now.",
        });
    }
};

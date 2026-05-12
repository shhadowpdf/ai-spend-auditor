import {pricingData} from "../data/pricingData.js";
import {runAudit} from "../utils/audit.engine.js";
import { queryGroq } from "../utils/groq.js";
import { createPublicAuditRecord } from "../db/publicAuditStore.js";
import { resolvePublicOrigin } from "../utils/url.js";

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
        } catch (error) {
            console.error("Unable to save public audit.", error);
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

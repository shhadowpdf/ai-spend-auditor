import { getPublicAuditRecord } from "../db/publicAuditStore.js";
import {
  renderPublicAuditNotFoundPage,
  renderPublicAuditOgImage,
  renderPublicAuditPage,
} from "../utils/publicAudit.js";
import {
  joinUrl,
  resolvePublicOrigin,
} from "../utils/url.js";

function resolveAppUrl(req) {
  return resolvePublicOrigin(req);
}

export const getPublicAudit = async (
  req,
  res
) => {
  const publicAudit =
    await getPublicAuditRecord(
      req.params.publicId
    );

  if (!publicAudit) {
    return res.status(404).json({
      message: "Public audit not found.",
    });
  }

  return res.json(publicAudit.publicReport);
};

export const getPublicAuditOgImage = async (
  req,
  res
) => {
  const publicAudit =
    await getPublicAuditRecord(
      req.params.publicId
    );

  if (!publicAudit) {
    return res.status(404).type("text/plain")
      .send("Public audit not found.");
  }

  return res
    .status(200)
    .type("image/svg+xml")
    .send(renderPublicAuditOgImage(publicAudit));
};

export const renderPublicAudit = async (
  req,
  res
) => {
  const publicAudit =
    await getPublicAuditRecord(
      req.params.publicId
    );
  const appUrl = resolveAppUrl(req);

  if (!publicAudit) {
    return res
      .status(404)
      .type("html")
      .send(
        renderPublicAuditNotFoundPage(appUrl)
      );
  }

  const canonicalUrl = publicAudit.publicUrl;
  const ogImageUrl = joinUrl(
    resolvePublicOrigin(req),
    `/public/audits/${publicAudit.publicId}/og-image.svg`
  );

  return res
    .status(200)
    .type("html")
    .send(
      renderPublicAuditPage(publicAudit, {
        canonicalUrl,
        ogImageUrl,
        appUrl,
      })
    );
};

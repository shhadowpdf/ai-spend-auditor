import { ENV } from "./ENV.js";

export function stripTrailingSlash(value = "") {
  return value.replace(/\/+$/, "");
}

export function joinUrl(origin, path) {
  const normalizedOrigin = stripTrailingSlash(origin);
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${normalizedOrigin}${normalizedPath}`;
}

export function resolvePublicOrigin(req) {
  if (ENV.PUBLIC_URL) {
    return stripTrailingSlash(ENV.PUBLIC_URL);
  }

  const forwardedProto = req
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = req
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProto || req.protocol || "http";
  const host = forwardedHost || req.get("host");

  return `${protocol}://${host}`;
}

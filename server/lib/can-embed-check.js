export const CAN_EMBED_CACHE_TTL_MS = 60 * 60 * 1000;

export function headersAllowEmbed(xFrameOptions, contentSecurityPolicy) {
  const xfo = (xFrameOptions ?? "").toLowerCase().trim();
  const csp = (contentSecurityPolicy ?? "").toLowerCase();
  if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;
  if (csp.includes("frame-ancestors") && !csp.includes("frame-ancestors *")) return false;
  // Require an explicit allow signal — missing X-Frame-Options is not enough for SPAs.
  return xfo.includes("allowall") || csp.includes("frame-ancestors *");
}

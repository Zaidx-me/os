export const CAN_EMBED_CACHE_TTL_MS = 60 * 60 * 1000;

export function headersAllowEmbed(xFrameOptions, contentSecurityPolicy) {
  const xfo = (xFrameOptions ?? "").toLowerCase();
  const csp = (contentSecurityPolicy ?? "").toLowerCase();
  const blockedByXfo = xfo.includes("deny") || xfo.includes("sameorigin");
  const blockedByCsp = csp.includes("frame-ancestors") && !csp.includes("frame-ancestors *");
  return !blockedByXfo && !blockedByCsp;
}

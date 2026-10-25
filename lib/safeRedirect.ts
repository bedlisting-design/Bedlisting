/**
 * Only allow redirects to a page on this site ("/properties?q=Odim"), never to
 * another website ("https://evil.com" or "//evil.com").
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  return raw;
}

/**
 * The admin area lives on its own subdomain (admin.yourdomain.com).
 * Locally, admin.localhost:3000 works in Chrome, Edge and Firefox with no setup.
 */
export function isAdminHost(host: string | null | undefined): boolean {
  return (host ?? "").toLowerCase().startsWith("admin.");
}

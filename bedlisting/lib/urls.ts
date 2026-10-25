/** Main site, e.g. https://bedlisting.com (from NEXTAUTH_URL). */
export function siteUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Admin site, e.g. https://admin.bedlisting.com (admin.localhost:3000 locally). */
export function adminUrl() {
  const u = new URL(siteUrl());
  return `${u.protocol}//admin.${u.host}`;
}

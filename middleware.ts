import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminHost } from "@/lib/portal";

// On the admin site, admins may also use the listing, upload and message APIs
// (they can list properties and chat like landlords). Always ADMIN-only here.
const ADMIN_SHARED_API = ["/api/properties", "/api/upload", "/api/messages"];

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role;

  // ───────────── Admin subdomain (admin.yourdomain.com) ─────────────
  if (isAdminHost(req.headers.get("host"))) {
    // NextAuth endpoints must stay reachable so the admin can sign in.
    if (pathname.startsWith("/api/auth")) return NextResponse.next();

    if (ADMIN_SHARED_API.some((p) => pathname.startsWith(p))) {
      if (role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    if (pathname === "/admin/login") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (isAdminPath(pathname)) {
      if (role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return NextResponse.next();
    }

    // Anything else on the admin host (including "/") goes to the admin area.
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // ───────────── Main site (tenants and landlords) ─────────────
  // Admin pages and admin APIs do not exist on the public domain.
  if (isAdminPath(pathname)) {
    return NextResponse.rewrite(new URL("/not-found-admin", req.url));
  }

  // Browsing lodges needs a free account. Visitors are sent to sign up and then
  // brought back to exactly the page (and search) they asked for.
  const isBrowsePath = pathname === "/properties" || pathname.startsWith("/properties/");
  if (isBrowsePath && !token) {
    const registerUrl = new URL("/register", req.url);
    registerUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(registerUrl);
  }
  // The listings data behind those pages is closed to visitors too.
  if (pathname.startsWith("/api/properties") && req.method === "GET" && !token) {
    return NextResponse.json({ error: "Create a free account to browse listings." }, { status: 401 });
  }

  const needsLogin =
    pathname.startsWith("/landlord") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/credits") ||
    pathname.startsWith("/roommates") ||
    pathname.startsWith("/profile");

  if (needsLogin && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/landlord") && role !== "LANDLORD" && role !== "AGENT") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { notFound } from "next/navigation";

// Middleware rewrites /admin* on the public domain here, so the admin area
// looks like it doesn't exist.
export default function NotFoundAdmin() {
  notFound();
}

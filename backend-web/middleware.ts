import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Admin-route protection middleware.
 *
 * Constraints:
 * - The admin UI stores token in `localStorage` (see `lib/auth.ts`), which is not
 *   accessible from middleware (runs on the edge/server).
 *
 * Therefore, this middleware can only enforce auth via *cookies*.
 * If you want true route protection, set an auth cookie on login.
 *
 * Current behavior:
 * - Always allows the login page: `/admin/login`
 * - For any other `/admin/*` route, requires cookie `teektok_admin_token`
 * - Redirects to `/admin/login?next=...` when missing
 *
 * Later improvement:
 * - Change cookie name/format if backend issues HttpOnly cookies.
 * - Validate token structure (e.g., JWT) if applicable.
 */

const ADMIN_PREFIX = "/admin";
const ADMIN_LOGIN_PATH = "/admin/login";

// Cookie key used by middleware.
// NOTE: This is separate from localStorage ("teektok.admin.token").
// To make middleware effective, you must set this cookie on login.
const ADMIN_TOKEN_COOKIE = "teektok_admin_token";

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

function isLoginPath(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only guard /admin routes.
  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  // Allow login route.
  if (isLoginPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = ADMIN_LOGIN_PATH;

    // Preserve where the user wanted to go.
    const next = `${pathname}${search || ""}`;
    url.searchParams.set("next", next);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

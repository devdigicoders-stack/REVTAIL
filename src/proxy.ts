import {
  NextRequest,
  NextResponse,
} from "next/server";

import { verifyToken } from "@/lib/auth";

// ============================================================
// PUBLIC ROUTES
// These routes may live under /tester, /brand, etc.
// but must NOT require authentication.
// ============================================================

const PUBLIC_ROUTES = [
  "/tester/signup",
  "/brand/signup",
];

// ============================================================
// CHECK PUBLIC ROUTE
// ============================================================

function isPublicRoute(
  pathname: string
) {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`
      )
  );
}

// ============================================================
// PROXY
// ============================================================

export async function proxy(
  request: NextRequest
) {
  const {
    pathname,
  } = request.nextUrl;

  // ============================================================
  // 1. ALLOW PUBLIC ROUTES FIRST
  // ============================================================

  if (
    isPublicRoute(
      pathname
    )
  ) {
    return NextResponse.next();
  }

  // ============================================================
  // 2. GET JWT
  // ============================================================

  const token =
    request.cookies.get(
      "revtail_token"
    )?.value;

  // ============================================================
  // 3. NO TOKEN -> LOGIN
  // ============================================================

  if (!token) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  // ============================================================
  // 4. VERIFY JWT
  // ============================================================

  const payload =
    await verifyToken(
      token
    );

  // ============================================================
  // 5. INVALID / EXPIRED TOKEN
  // ============================================================

  if (!payload) {
    const response =
      NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );

    response.cookies.delete(
      "revtail_token"
    );

    return response;
  }

  // ============================================================
  // 6. ROLE
  // ============================================================

  const role =
    payload.role as string;

  // ============================================================
  // 7. ADMIN PROTECTION
  // ============================================================

  if (
    pathname.startsWith(
      "/admin"
    ) &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(
      new URL(
        "/unauthorized",
        request.url
      )
    );
  }

  // ============================================================
  // 8. BRAND PROTECTION
  // ============================================================

  if (
    pathname.startsWith(
      "/brand"
    ) &&
    role !== "BRAND"
  ) {
    return NextResponse.redirect(
      new URL(
        "/unauthorized",
        request.url
      )
    );
  }

  // ============================================================
  // 9. TESTER PROTECTION
  // ============================================================

  if (
    pathname.startsWith(
      "/tester"
    ) &&
    role !== "TESTER"
  ) {
    return NextResponse.redirect(
      new URL(
        "/unauthorized",
        request.url
      )
    );
  }

  // ============================================================
  // 10. ALLOW
  // ============================================================

  return NextResponse.next();
}

// ============================================================
// MATCHER
// ============================================================

export const config = {
  matcher: [
    "/admin/:path*",
    "/brand/:path*",
    "/tester/:path*",
  ],
};
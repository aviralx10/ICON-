import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/auth");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

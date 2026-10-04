import { NextResponse } from "next/server";

// Sends visitors without a session cookie to /login. The cookie is set by the demo login;
// AppShell enforces the same rule on the client, so a stale cookie can't get anyone in.
export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  if (!request.cookies.get("lexpro_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)$).*)"],
};

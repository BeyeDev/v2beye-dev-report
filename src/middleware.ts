import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isPublicRoute = pathname === "/";
  const isApiRoute = pathname.startsWith("/api");

  // Allow access to auth API routes
  if (isApiAuthRoute) return;

  // Prevent access to protected API routes without login
  if (isApiRoute && !isLoggedIn) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Prevent access to public routes (like login) if already logged in
  if (isPublicRoute && isLoggedIn) {
    return Response.redirect(new URL("/dashboard/reports", req.nextUrl));
  }

  // Redirect to login if accessing protected routes without login
  if (!isLoggedIn && !isPublicRoute && !isApiRoute) {
    return Response.redirect(new URL("/", req.nextUrl));
  }

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

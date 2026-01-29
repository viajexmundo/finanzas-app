import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only routes
    const adminRoutes = ["/dashboard/usuarios", "/dashboard/configuracion", "/dashboard/bancos"];
    if (adminRoutes.some((route) => path.startsWith(route))) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Editor and Admin routes (can modify data)
    const editorRoutes = ["/dashboard/cuentas/nuevo", "/dashboard/cuentas/editar"];
    if (editorRoutes.some((route) => path.startsWith(route))) {
      if (token?.role === "VIEWER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};

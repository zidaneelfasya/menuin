import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;

  // 1. Ekstrak subdomain (contoh: kebabngawi.localhost:3000 atau kebabngawi.menuin.id)
  const currentHost = hostname.replace(/:\d+$/, ""); // Hapus port jika ada (misal :3000)
  let subdomain: string | null = null;

  if (currentHost.endsWith(".localhost")) {
    subdomain = currentHost.replace(".localhost", "");
  } else if (currentHost.endsWith(".menuin.id")) {
    subdomain = currentHost.replace(".menuin.id", "");
  }

  // Abaikan domain/subdomain non-tenant
  if (
    subdomain === "www" ||
    subdomain === "app" ||
    subdomain === "localhost" ||
    subdomain === ""
  ) {
    subdomain = null;
  }

  // 2. Jika ada subdomain tenant, lakukan URL rewrite ke /store/[slug]
  if (
    subdomain &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|mp3|css|js|map|txt)$/i)
  ) {
    // Hindari double prefix jika path sudah berawalan /store/[subdomain]
    const targetPath = pathname.startsWith(`/store/${subdomain}`)
      ? pathname
      : `/store/${subdomain}${pathname === "/" ? "" : pathname}`;

    url.pathname = targetPath;
    return NextResponse.rewrite(url, {
      request: {
        headers: request.headers,
      },
    });
  }

  // 3. Extract outletKey jika mengakses route /outlet/[outletKey]
  if (pathname.startsWith("/outlet/")) {
    const parts = pathname.split("/");
    // parts[0] = "", parts[1] = "outlet", parts[2] = "[outletKey]"
    if (parts.length >= 3 && parts[2]) {
      const outletKey = parts[2];
      request.headers.set("x-menuin-outlet-key", outletKey);
    }
  }

  // 4. Jalankan Supabase auth middleware
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

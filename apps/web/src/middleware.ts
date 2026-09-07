import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 1. Extract outletKey if the request is for an outlet route
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/outlet/')) {
    const parts = pathname.split('/');
    // parts[0] = "", parts[1] = "outlet", parts[2] = "[outletKey]"
    if (parts.length >= 3 && parts[2]) {
      const outletKey = parts[2];
      // Inject header into the request that server components will see
      request.headers.set('x-menuin-outlet-key', outletKey);
    }
  }

  // 2. Run the Supabase auth middleware
  const response = await updateSession(request);

  // Note: To ensure Next.js Server Components receive the header we just set,
  // we must pass the modified request headers to the response. 
  // Next 13+ requires setting x-middleware-request-<header> to forward headers 
  // to the downstream request if we didn't use NextResponse.next({ request }).
  // updateSession already uses NextResponse.next({ request }), so it's forwarded.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

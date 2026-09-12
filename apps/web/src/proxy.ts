import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  const currentHost = hostname.split(':')[0]; // remove port
  const isLocalhost = currentHost.endsWith('localhost');
  const baseDomain = isLocalhost ? 'localhost' : 'menuin.id';

  let subdomain = null;
  if (currentHost !== baseDomain && currentHost !== `www.${baseDomain}`) {
    if (currentHost.endsWith(`.${baseDomain}`)) {
      subdomain = currentHost.replace(`.${baseDomain}`, '');
    }
  }

  if (
    subdomain === 'www' ||
    subdomain === 'app' ||
    subdomain === 'localhost' ||
    !subdomain
  ) {
    subdomain = null;
  }

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

  // 2. Rewrite if it's a subdomain (Storefront)
  let customResponse;
  const isInternal =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    Boolean(pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|mp3|css|js|map|txt)$/i));
  const isAlreadyStore = pathname.startsWith('/store');
  
  if (subdomain && !isInternal && !isAlreadyStore) {
    // Rewrite all root/subdomain paths to /store/[subdomain]
    url.pathname = `/store/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
    customResponse = NextResponse.rewrite(url, { request: { headers: request.headers } });
  }

  // 3. Run the Supabase auth middleware
  const response = await updateSession(request, customResponse);

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

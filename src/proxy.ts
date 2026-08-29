import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. favicon.ico)
         */
        '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
    ],
};

const RESERVED_SUBDOMAINS = [
    'www',
    'app',
    'api',
    'admin',
    'dashboard',
    'auth',
    'docs',
    'status',
    'support',
    'mail',
    'billing',
    'webhook'
];

import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(req: NextRequest) {
    const url = req.nextUrl;

    // Get hostname of request (e.g. demo.localhost:3000, demo.menuin.id)
    let hostname = req.headers.get('host');

    if (!hostname) {
        return await updateSession(req);
    }

    // Strip port if exists
    hostname = hostname.split(':')[0];

    // Define allowed domains (localhost and production domain)
    const allowedDomains = ['localhost', 'menuin.id'];

    // Check if the current hostname is a subdomain
    const isSubdomain = allowedDomains.some((domain) =>
        hostname.endsWith(`.${domain}`)
    );

    if (isSubdomain) {
        // Extract the subdomain (slug)
        const slug = hostname.split('.')[0];

        // Block reserved subdomains
        if (RESERVED_SUBDOMAINS.includes(slug)) {
            return await updateSession(req);
        }

        // Rewrite to the store catalog route
        const newPath = url.pathname === '/' ? `/store/${slug}` : `/store/${slug}${url.pathname}`;
        console.log("PROXY REWRITE TO:", newPath);

        // For public subdomains, we don't strictly need updateSession unless we want auth there too,
        // but typically subdomains are public catalogs. We'll just rewrite.
        return NextResponse.rewrite(new URL(`${newPath}${url.search}`, req.url));
    }

    return await updateSession(req);
}

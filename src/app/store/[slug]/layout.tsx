import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Search } from "lucide-react";
import { connection } from "next/server";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const result = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (result.length === 0) return { title: "Not Found" };
  
  const tenant = result[0];
  return {
    title: `${tenant.name} - Online Order`,
    description: tenant.storeDescription || `Pesan online dari ${tenant.name}`,
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const result = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  
  if (result.length === 0 || !result[0].storefrontEnabled) {
    notFound();
  }

  const tenant = result[0];
  const primaryColor = tenant.primaryColor || "#f43f5e"; // Default to a nice rose red for food apps

  return (
    <div className={inter.className} style={{ "--primary": primaryColor } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --catalog-primary: ${primaryColor};
        }
        .bg-catalog-primary { background-color: var(--catalog-primary); }
        .text-catalog-primary { color: var(--catalog-primary); }
        .border-catalog-primary { border-color: var(--catalog-primary); }
        .hover\\:bg-catalog-primary\\/90:hover { background-color: color-mix(in srgb, var(--catalog-primary) 90%, transparent); }
      `}} />
      <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-gray-800">
        
        {tenant.storeBannerUrl && (
          <div className="w-full h-40 md:h-56 relative overflow-hidden bg-gray-900">
            <img src={tenant.storeBannerUrl} alt="Store Banner" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Cek Pesanan Button (Banner) */}
            <a 
              href="/status"
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/30 transition-all shadow-sm flex items-center gap-2 z-10"
            >
              <Search className="w-4 h-4" />
              <span>Cek Pesanan</span>
            </a>

            <a href="/" className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto flex items-end gap-4 cursor-pointer hover:opacity-90 transition-opacity">
              {tenant.storeLogoUrl ? (
                <img src={tenant.storeLogoUrl} alt={tenant.name} className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-lg bg-white" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-catalog-primary flex items-center justify-center text-white font-bold text-2xl border-2 border-white shadow-lg">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-white pb-1 flex-1">
                <h1 className="font-bold text-2xl leading-tight drop-shadow-md">{tenant.name}</h1>
                {tenant.storeDescription && (
                  <p className="text-sm text-gray-200 line-clamp-1 drop-shadow-md">{tenant.storeDescription}</p>
                )}
              </div>
            </a>
          </div>
        )}
        
        {!tenant.storeBannerUrl && (
          <header className="bg-white sticky top-0 z-40 border-b shadow-sm">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
              <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                {tenant.storeLogoUrl ? (
                  <img src={tenant.storeLogoUrl} alt={tenant.name} className="h-10 w-10 rounded-full object-cover border" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-catalog-primary flex items-center justify-center text-white font-bold text-xl">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-lg leading-tight">{tenant.name}</h1>
                  {tenant.storeDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{tenant.storeDescription}</p>
                  )}
                </div>
              </a>
              
              <a 
                href={`/store/${tenant.slug}/status`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-full border transition-all flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cek Pesanan</span>
              </a>
            </div>
          </header>
        )}

        <main className="max-w-2xl mx-auto px-4 py-4">
          {children}
        </main>
      </div>
    </div>
  );
}

import { db } from "@/lib/db";
import { tenants, transactionItems, products } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { connection } from "next/server";
import { headers } from "next/headers";
import { StoreHeroHeader } from "@/components/store/store-hero-header";
import { StoreLayoutClient } from "@/components/store/store-layout-client";

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

  // Query total products sold and total product count for this outlet
  const [totalSalesResult, totalProductsResult] = await Promise.all([
    db
      .select({
        totalSold: sql<number>`COALESCE(SUM(${transactionItems.quantity}), 0)::int`,
      })
      .from(transactionItems)
      .where(eq(transactionItems.tenantId, tenant.id)),
    db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenant.id),
          eq(products.isActive, true),
          eq(products.isAvailableOnline, true)
        )
      ),
  ]);

  const totalSold = Number(totalSalesResult[0]?.totalSold || 0);
  const totalProducts = Number(totalProductsResult[0]?.count || 0);

  const headersList = await headers();
  const host = headersList.get('host') || "";
  const isSubdomain = host.includes('.localhost') || host.includes('.menuin.id');
  
  const statusLink = isSubdomain ? '/status' : `/store/${tenant.slug}/status`;
  const homeLink = isSubdomain ? '/' : `/store/${tenant.slug}`;

  return (
    <div className={inter.className} style={{ "--primary": primaryColor } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --catalog-primary: ${primaryColor};
          --outlet-primary: ${primaryColor};
          --catalog-primary-light: color-mix(in srgb, var(--catalog-primary) 10%, white);
          --catalog-primary-border: color-mix(in srgb, var(--catalog-primary) 30%, transparent);
        }
        .bg-catalog-primary { background-color: var(--catalog-primary); }
        .text-catalog-primary { color: var(--catalog-primary); }
        .border-catalog-primary { border-color: var(--catalog-primary); }
        .bg-catalog-primary-light { background-color: var(--catalog-primary-light); }
        .border-catalog-primary-border { border-color: var(--catalog-primary-border); }
        .hover\\:bg-catalog-primary\\/90:hover { background-color: color-mix(in srgb, var(--catalog-primary) 90%, transparent); }
        .hover\\:bg-catalog-primary\\/10:hover { background-color: color-mix(in srgb, var(--catalog-primary) 10%, transparent); }
        .bg-outlet-primary { background-color: var(--outlet-primary); }
        .text-outlet-primary { color: var(--outlet-primary); }
        .border-outlet-primary { border-color: var(--outlet-primary); }

        /* Mencegah horizontal scroll di semua rasio layar */
        html, body {
          max-width: 100vw !important;
          overflow-x: clip !important;
          position: relative;
        }

        /* Menghilangkan tampilan vertical & horizontal scrollbar */
        html, body, * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
        }
      `}} />
      <StoreLayoutClient
        headerProps={{
          tenant,
          statusLink,
          homeLink,
          totalSold,
          totalProducts,
        }}
      >
        {children}
      </StoreLayoutClient>
    </div>
  );
}

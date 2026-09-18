import { ReactNode } from "react";
import { CatalogNav } from "./catalog-nav";

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto h-full p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Katalog Menuin</h1>
        <p className="text-muted-foreground mt-2">
          Atur tampilan, visibilitas produk, dan pengaturan pemesanan untuk website katalog publik Anda.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        <aside className="w-full md:w-56 flex-shrink-0">
          <CatalogNav />
        </aside>
        
        <main className="flex-1 min-w-0 bg-card border rounded-xl shadow-sm overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}



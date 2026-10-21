"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Store, Paintbrush, Eye, Settings, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export function CatalogNav() {
  const pathname = usePathname();
  const params = useParams();
  const outletKey = (params.outletKey as string) || "";

  const navItems = [
    { href: `/outlet/${outletKey}/katalog`, icon: Store, label: "Status & Overview", exact: true },
    { href: `/outlet/${outletKey}/katalog/appearance`, icon: Paintbrush, label: "Tampilan Self QR" },
    { href: `/outlet/${outletKey}/katalog/visibility`, icon: Eye, label: "Visibilitas Produk" },
    { href: `/outlet/${outletKey}/katalog/ordering`, icon: Settings, label: "Pengaturan Pesanan" },
    { href: `/outlet/${outletKey}/katalog/tables`, icon: QrCode, label: "Meja & QR Code" },
  ];

  return (
    <div className="flex flex-col h-full p-2 md:p-3">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-2.5 px-2 py-2 mb-2 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 truncate">Katalog Menu</h2>
          <p className="text-[11px] text-slate-500 truncate">Toko Online & Self QR</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex space-x-1.5 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-xs md:text-sm transition-all duration-150 whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-[#0e59f9] text-white font-semibold shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-slate-500")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

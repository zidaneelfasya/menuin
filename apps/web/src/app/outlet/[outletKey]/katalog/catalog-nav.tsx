"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Store, Paintbrush, Eye, Settings, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export function CatalogNav() {
  const pathname = usePathname();
  const params = useParams();
  const outletKey = params.outletKey as string;

  const navItems = [
    { href: `/outlet/${outletKey}/katalog`, icon: Store, label: "Status & Overview", exact: true },
    { href: `/outlet/${outletKey}/katalog/appearance`, icon: Paintbrush, label: "Tampilan Storefront" },
    { href: `/outlet/${outletKey}/katalog/visibility`, icon: Eye, label: "Visibilitas Produk" },
    { href: `/outlet/${outletKey}/katalog/ordering`, icon: Settings, label: "Pengaturan Pesanan" },
    { href: `/outlet/${outletKey}/katalog/tables`, icon: QrCode, label: "Meja & QR Code" },
  ];

  return (
    <div className="flex flex-col h-full p-2 md:p-3">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-2.5 px-2 py-3 mb-2  ">
        
        <div className="min-w-0">
          <h2 className="text-lg font-semibold font-sans text-gray-900 truncate">Katalog Menu</h2>
          <p className="text-[10px] text-gray-500 truncate">Toko Online & QR</p>
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
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs md:text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-[#0e59f9]/10 text-[#0e59f9] font-semibold shadow-xs" 
                  : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#0e59f9]" : "text-gray-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


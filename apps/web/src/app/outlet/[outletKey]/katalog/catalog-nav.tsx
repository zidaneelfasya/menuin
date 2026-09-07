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
    <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
      {navItems.map((item) => {
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href);
          
        return (
          <Link 
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

import React from "react";
import SiteShell from "@/components/landing/site-shell";
import { createClient } from "@/lib/supabase/server";

/** Layout bersama landing dan halaman di navbar (Tentang, Fitur, Harga, dst.). */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  let isLoggedIn = false;
  let userName = "";

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    isLoggedIn = Boolean(user);
    userName =
      user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
  } catch {
    // pengunjung yang belum login tetap dilayani
  }

  return (
    <SiteShell isLoggedIn={isLoggedIn} userName={userName}>
      {children}
    </SiteShell>
  );
}

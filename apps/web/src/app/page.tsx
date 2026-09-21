import { Suspense } from "react";
import LandingPage from "@/components/landing-page";
import { createClient } from "@/lib/supabase/server";

async function LandingPageWithAuth() {
  let user = null;
  let userName = "";

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
    userName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "";
  } catch {
    // fallback gracefully for unauthenticated visitors
  }

  return <LandingPage isLoggedIn={Boolean(user)} userName={userName} />;
}

export default function Home() {
  // Fallback-nya sengaja kosong.
  //
  // Sebelumnya fallback ini merender <LandingPage /> utuh, sehingga seluruh
  // halaman ada dua kali di DOM: id ganda (#ekosistem, #pilar, #harga),
  // dua ScrollTrigger memperebutkan section yang sama, dan anchor nav
  // melompat ke salinan yang salah.
  return (
    <Suspense fallback={null}>
      <LandingPageWithAuth />
    </Suspense>
  );
}


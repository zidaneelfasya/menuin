import { Suspense } from "react";
import LandingPageV2 from "@/components/landing-page-v2";
import { createClient } from "@/lib/supabase/server";

async function Landing2WithAuth() {
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
    // fallback gracefully
  }

  return <LandingPageV2 isLoggedIn={Boolean(user)} userName={userName} />;
}

export default function Landing2() {
  return (
    <Suspense fallback={null}>
      <Landing2WithAuth />
    </Suspense>
  );
}

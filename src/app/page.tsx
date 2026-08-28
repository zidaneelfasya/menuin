import LandingPage from "@/components/landing-page";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
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

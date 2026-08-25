import LandingPage from "@/components/landing-page";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { connection } from "next/server";

async function HomeContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "";

  return <LandingPage isLoggedIn={Boolean(user)} userName={userName} />;
}

export default function Home() {
  return (
    <Suspense fallback={<LandingPage isLoggedIn={false} />}>
      <HomeContent />
    </Suspense>
  );
}

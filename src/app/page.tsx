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

  return <LandingPage isLoggedIn={Boolean(user)} />;
}

export default function Home() {
  return (
    <Suspense fallback={<LandingPage isLoggedIn={false} />}>
      <HomeContent />
    </Suspense>
  );
}

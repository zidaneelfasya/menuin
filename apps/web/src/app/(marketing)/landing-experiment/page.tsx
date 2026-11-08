import { Suspense } from "react";
import LandingExperimentPage from "@/components/landing-experiment-page";
import ExperimentLoader from "@/components/landing/experiment-loader";
import { createClient } from "@/lib/supabase/server";

async function LandingExperimentWithAuth() {
  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    // fallback gracefully for unauthenticated visitors
  }

  return <LandingExperimentPage isLoggedIn={Boolean(user)} />;
}

export default function LandingExperimentRoute() {
  return (
    <Suspense fallback={<ExperimentLoader />}>
      <LandingExperimentWithAuth />
    </Suspense>
  );
}

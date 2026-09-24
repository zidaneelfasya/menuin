import { Suspense } from "react";
import SignUpSuccessContent from "./sign-up-success-content";

export const metadata = {
  title: "Pendaftaran Berhasil - Menuin",
  description: "Silakan periksa email Anda untuk memverifikasi akun Menuin.",
};

export default function SignUpSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignUpSuccessContent />
    </Suspense>
  );
}

import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50/30 relative overflow-hidden font-sans flex items-center justify-center p-6 md:p-10">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB]" />
      
      {/* Background circles decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}

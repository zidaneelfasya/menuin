"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { signUpAction } from "@/lib/actions/auth";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("name", name);
      formData.append("restaurantName", restaurantName);

      const result = await signUpAction(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      localStorage.setItem("menuin_dummy_business", restaurantName);
      localStorage.setItem("menuin_dummy_email", email);

      router.push(`/checkout?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="w-full max-w-[1024px] min-h-[640px] flex rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-300">
        
        {/* Brand Panel */}
        <div className="hidden md:flex flex-1 bg-[#2563EB] flex-col items-center justify-center p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40" />
          
          <div className="relative z-10 flex flex-col items-center max-w-[320px]">
            <Image
              src="/menuin-putih.png"
              alt="Menuin"
              width={180}
              height={50}
              style={{ height: "auto" }}
              className="mb-8 object-contain"
              priority
            />
            <p className="text-white/80 text-sm leading-relaxed">
              Mulai kelola bisnis kuliner Anda dengan sistem yang simpel dan modern.
            </p>
          </div>
        </div>

        {/* Form Panel */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 md:py-16">
          {/* Mobile logo header */}
          <div className="md:hidden mb-8 flex items-center justify-between">
            <Image
              src="/logo-menuin-memanjang.svg"
              alt="Menuin"
              width={120}
              height={34}
              style={{ height: "auto" }}
              className="object-contain"
              priority
            />
            <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">POS</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Daftar akun baru
            </h1>
            <p className="text-[#64748B] text-sm">
              Mulai kelola outlet kuliner Anda secara digital dengan Menuin.
            </p>
          </div>

          <div 
            className="flex flex-col gap-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSignUp(e as any);
              }
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="restaurantName"
                className="text-xs font-semibold text-[#334155] uppercase tracking-wider"
              >
                Nama Restoran / Outlet
              </Label>
              <Input
                id="restaurantName"
                type="text"
                placeholder="Contoh: Kopi Kenangan"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:bg-white transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-semibold text-[#334155] uppercase tracking-wider"
              >
                Nama Lengkap Pemilik
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Nama Anda"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:bg-white transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold text-[#334155] uppercase tracking-wider"
              >
                Email Bisnis
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="pemilik@restoran.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:bg-white transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-[#334155] uppercase tracking-wider"
              >
                Kata Sandi
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 focus-visible:bg-white transition-all duration-200"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <Button
              type="button"
              onClick={(e) => handleSignUp(e as any)}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Daftar & Mulai Sekarang"}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-[#64748B]">
            Sudah punya akun?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

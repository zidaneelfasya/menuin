"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { getCurrentUser } from "@/lib/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      const user = await getCurrentUser();
      if (user?.role === 'SYSTEM_ADMIN') {
        router.push("/system-admin");
      } else {
        router.push("/tenants/pos");
      }
    } catch (error: any) {
      let errorMessage = error?.message || error?.error_description || "Terjadi kesalahan saat masuk";
      
      // Jika pesan error berupa string '{}', kemungkinan ini dari response 500 yang gagal diparsing
      if (typeof errorMessage === 'string' && errorMessage === '{}') {
        errorMessage = "Terjadi masalah pada server (Internal Server Error). Silakan coba lagi nanti.";
      }
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes("Invalid login credentials")) {
          errorMessage = "Email atau password salah, atau akun belum terdaftar.";
        } else if (errorMessage.includes("Email not confirmed")) {
          errorMessage = "Email belum diverifikasi. Silakan cek kotak masuk email Anda.";
        } else if (errorMessage.includes("Failed to fetch")) {
          errorMessage = "Koneksi terputus. Periksa jaringan internet Anda.";
        }
      } else if (typeof errorMessage === 'object') {
        try {
          errorMessage = JSON.stringify(errorMessage);
          if (errorMessage === '{}') {
            errorMessage = "Terjadi masalah pada server. Silakan coba lagi nanti.";
          }
        } catch (e) {
          errorMessage = "Terjadi kesalahan saat masuk.";
        }
      }
      
      setError(String(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] p-4 md:p-8"
    >
      <div className="w-full max-w-[960px] min-h-[580px] flex rounded-2xl overflow-hidden border border-[#E5E5E5] bg-white">
        {/* Brand Panel */}
        <div className="hidden md:flex flex-1 bg-[#2563EB] flex-col items-center justify-center p-12 relative">
          <Image
            src="/logo/logo.jpeg"
            alt="Menuin"
            width={200}
            height={60}
            className="brightness-0 invert mb-8"
            style={{ height: "auto" }}
            priority
          />
          <p className="text-white/70 text-sm text-center max-w-[240px] leading-relaxed">
            Sistem POS modern untuk restoran dan bisnis kuliner Anda.
          </p>
        </div>

        {/* Form Panel */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14">
          {/* Mobile logo */}
          <div className="md:hidden mb-10">
            <Image
              src="/logo/logo.jpeg"
              alt="Menuin"
              width={140}
              height={42}
              className="mb-6"
              style={{ height: "auto" }}
              priority
            />
          </div>

          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-[#111] tracking-[-0.02em] mb-2">
              Selamat datang kembali
            </h1>
            <p className="text-[#666] text-[15px]">
              Masuk ke akun Anda untuk melanjutkan.
            </p>
          </div>

          <div 
            className="flex flex-col gap-5"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin(e as any);
              }
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-[#111]"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@restoran.id"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] px-4 text-[15px] placeholder:text-[#AAAAAA] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-[#111]"
                >
                  Kata sandi
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] px-4 text-[15px] placeholder:text-[#AAAAAA] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 text-[13px] text-[#DC2626] font-medium">
                {error}
              </div>
            )}

            <Button
              type="button"
              onClick={(e) => handleLogin(e as any)}
              className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[15px] font-semibold transition-colors mt-1"
              disabled={isLoading}
            >
              {isLoading ? "Masuk..." : "Masuk"}
            </Button>
          </div>

          <p className="mt-8 text-center text-[14px] text-[#666]">
            Belum punya akun?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

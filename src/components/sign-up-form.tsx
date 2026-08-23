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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
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
    <div
      className={cn(
        "min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] p-4 md:p-8",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-[960px] min-h-[580px] flex rounded-2xl overflow-hidden border border-[#E5E5E5] bg-white">
        {/* Brand Panel */}
        <div className="hidden md:flex flex-1 bg-[#2563EB] flex-col items-center justify-center p-12 relative">
          <Image
            src="/logo-nemuin.jpeg"
            alt="Menuin"
            width={200}
            height={60}
            className="brightness-0 invert mb-8"
            priority
          />
          <p className="text-white/70 text-sm text-center max-w-[240px] leading-relaxed">
            Mulai kelola bisnis kuliner Anda dengan sistem yang simpel dan modern.
          </p>
        </div>

        {/* Form Panel */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14">
          {/* Mobile logo */}
          <div className="md:hidden mb-10">
            <Image
              src="/logo-nemuin.jpeg"
              alt="Menuin"
              width={140}
              height={42}
              className="mb-6"
              priority
            />
          </div>

          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-[#111] tracking-[-0.02em] mb-2">
              Buat akun baru
            </h1>
            <p className="text-[#666] text-[15px]">
              Daftarkan bisnis Anda dan mulai gunakan Menuin.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="restaurantName"
                className="text-[13px] font-medium text-[#111]"
              >
                Nama restoran
              </Label>
              <Input
                id="restaurantName"
                type="text"
                placeholder="Contoh: Kopi Kenangan"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="h-12 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] px-4 text-[15px] placeholder:text-[#AAAAAA] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="name"
                className="text-[13px] font-medium text-[#111]"
              >
                Nama pemilik
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Nama lengkap Anda"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] px-4 text-[15px] placeholder:text-[#AAAAAA] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] transition-colors"
              />
            </div>

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
              <Label
                htmlFor="password"
                className="text-[13px] font-medium text-[#111]"
              >
                Kata sandi
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
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
              type="submit"
              className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[15px] font-semibold transition-colors mt-1"
              disabled={isLoading}
            >
              {isLoading ? "Mendaftarkan..." : "Daftar & Lanjut"}
            </Button>
          </form>

          <p className="mt-8 text-center text-[14px] text-[#666]">
            Sudah punya akun?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

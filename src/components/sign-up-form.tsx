"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      formData.append('restaurantName', restaurantName);

      const result = await signUpAction(formData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Save details to localStorage so checkout page can pre-fill if parameter query fails
      localStorage.setItem("menuin_dummy_business", restaurantName);
      localStorage.setItem("menuin_dummy_email", email);

      // Redirect to checkout since payment is required to access dashboard
      router.push(`/checkout?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md", className)} {...props}>
      <div className="relative group">
        {/* Glow effect backdrop */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <Card className="relative bg-white/95 backdrop-blur-md border border-slate-100/80 shadow-2xl rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <CardHeader className="space-y-2 pt-8 pb-4 px-6 md:px-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-heading">
                MENUIN
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Registration
              </span>
            </div>
            <CardTitle className="text-2xl font-bold font-rounded text-slate-900">Daftar Akun Baru</CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Buat akun Menuin dan daftarkan bisnis Anda untuk mengaktifkan sistem POS
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 md:px-8 pb-8 font-sans">
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-1">
                  <Label htmlFor="restaurantName" className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Restoran / Bisnis
                  </Label>
                  <Input
                    id="restaurantName"
                    type="text"
                    placeholder="Contoh: Kopi Kenangan"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="h-11 rounded-lg border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/80 transition-all"
                  />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Pemilik
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nama Lengkap Anda"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-lg border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/80 transition-all"
                  />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@restoran.id"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-lg border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/80 transition-all"
                  />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kata Sandi
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/80 transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600 font-medium">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition-all duration-300 shadow-md shadow-blue-500/10 active:scale-[0.98] mt-3" 
                  disabled={isLoading}
                >
                  {isLoading ? "Mendaftarkan..." : "Daftar & Lanjut Pembayaran"}
                </Button>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-5 font-sans">
                Sudah memiliki akun?{" "}
                <Link
                  href="/auth/login"
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4"
                >
                  Masuk di sini
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

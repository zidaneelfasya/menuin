"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
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
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/pos");
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
                POS Platform
              </span>
            </div>
            <CardTitle className="text-2xl font-bold font-rounded text-slate-900">Selamat Datang Kembali</CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Masuk ke akun Anda untuk mulai mengelola transaksi
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 md:px-8 pb-8">
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Alamat Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@restoran.id"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-lg border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/80 transition-all font-sans"
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Kata Sandi
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
                    className="h-11 rounded-lg border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/80 transition-all font-sans"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600 font-medium">
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition-all duration-300 shadow-md shadow-blue-500/10 active:scale-[0.98] mt-2" 
                  disabled={isLoading}
                >
                  {isLoading ? "Mengautentikasi..." : "Masuk Akun"}
                </Button>
              </div>
              
              <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-5">
                Belum memiliki akun?{" "}
                <Link
                  href="/auth/signup"
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

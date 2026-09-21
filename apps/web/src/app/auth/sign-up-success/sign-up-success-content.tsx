"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MailCheck, 
  Mail, 
  Copy, 
  Check, 
  ArrowRight, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resendVerificationEmailAction } from "@/lib/actions/auth";

export default function SignUpSuccessContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      const stored = localStorage.getItem("menuin_dummy_email");
      if (stored) setEmail(stored);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleCopyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Alamat email berhasil disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin email");
    }
  };

  const handleResend = async () => {
    if (!email || isResending || resendCountdown > 0) return;

    setIsResending(true);
    try {
      const res = await resendVerificationEmailAction(email);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Tautan verifikasi baru berhasil dikirim ke email Anda!");
        setResendCountdown(60);
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim ulang email verifikasi");
    } finally {
      setIsResending(false);
    }
  };

  const getEmailProviderLink = (userEmail: string) => {
    const domain = userEmail.split("@")[1]?.toLowerCase();
    if (!domain) return null;

    if (domain.includes("gmail.com") || domain.includes("googlemail.com")) {
      return {
        label: "Buka Google Mail (Gmail)",
        url: "https://mail.google.com",
      };
    }
    if (domain.includes("yahoo.com")) {
      return {
        label: "Buka Yahoo Mail",
        url: "https://mail.yahoo.com",
      };
    }
    if (domain.includes("outlook.com") || domain.includes("hotmail.com") || domain.includes("live.com")) {
      return {
        label: "Buka Outlook Mail",
        url: "https://outlook.live.com",
      };
    }
    return {
      label: "Buka Aplikasi Email",
      url: "mailto:",
    };
  };

  const providerLink = email ? getEmailProviderLink(email) : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="w-full max-w-[520px] rounded-3xl border border-[#E2E8F0] bg-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] p-6 sm:p-10 text-center flex flex-col items-center transition-all duration-300">
        {/* Brand Logo */}
        <div className="mb-6 flex items-center justify-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <Image
              src="/logo-menuin-memanjang.svg"
              alt="Menuin Logo"
              width={130}
              height={36}
              style={{ height: "auto" }}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        {/* Success Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
          <MailCheck className="w-8 h-8" strokeWidth={2.2} />
        </div>

        {/* Titles */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mb-2">
          Pendaftaran Berhasil!
        </h1>
        <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          Akun Anda telah berhasil dibuat. Silakan cek email Anda untuk melakukan verifikasi akun sebelum masuk ke aplikasi Menuin.
        </p>

        {/* Email Display Card */}
        {email ? (
          <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 my-5 text-left flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Email Verifikasi Dikirim Ke
                </div>
                <div className="text-sm font-semibold text-[#0F172A] truncate" title={email}>
                  {email}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyEmail}
              className="h-8 px-2.5 text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-white rounded-lg shrink-0 border border-transparent hover:border-[#E2E8F0]"
              title="Salin Email"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="w-full h-4" />
        )}

        {/* Step-by-step checklist card */}
        <div className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-6 text-left">
          <div className="text-xs font-semibold text-blue-950 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            Langkah Verifikasi:
          </div>
          <ul className="text-xs text-blue-900/90 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <span>Buka kotak masuk (Inbox) di aplikasi email Anda.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <span>
                Cari email konfirmasi dari <strong>Menuin</strong> (periksa folder <em>Spam / Junk / Promosi</em> jika tidak ditemukan).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <span>
                Klik tautan atau tombol <strong>Konfirmasi Akun</strong> untuk memverifikasi alamat email Anda.
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {providerLink && (
            <a
              href={providerLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10 hover:shadow-md transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{providerLink.label}</span>
            </a>
          )}

          <Button
            asChild
            variant={providerLink ? "outline" : "default"}
            className={cn(
              "w-full h-11 rounded-xl text-sm font-semibold transition-all duration-200",
              providerLink
                ? "border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#334155]"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/10 hover:shadow-md"
            )}
          >
            <Link href="/auth/login" className="flex items-center justify-center gap-2">
              <span>Sudah Verifikasi? Masuk ke Akun</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          {email && (
            <Button
              type="button"
              variant="ghost"
              disabled={isResending || resendCountdown > 0}
              onClick={handleResend}
              className="w-full h-10 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100/70 rounded-xl transition-colors mt-1"
            >
              {isResending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sedang mengirim ulang email...</span>
                </span>
              ) : resendCountdown > 0 ? (
                <span>Kirim ulang email verifikasi ({resendCountdown}d)</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tidak menerima email? Kirim ulang</span>
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-[#F1F5F9] w-full text-center">
          <p className="text-xs text-[#64748B]">
            Salah memasukkan alamat email?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Daftar ulang di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

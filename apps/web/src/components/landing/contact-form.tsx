"use client";

import React, { useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { CONTACT, whatsappLink } from "@/components/landing/site-config";

/**
 * Form kontak. Tidak ada backend: isian dirangkai menjadi pesan WhatsApp
 * yang sudah terisi, lalu dibuka di tab baru.
 */
export default function ContactForm() {
  const [form, setForm] = useState({ name: "", business: "", outlets: "1", topic: "Coba Menuin", message: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      `Halo Menuin, saya ${form.name}${form.business ? ` dari ${form.business}` : ""}.`,
      `Keperluan: ${form.topic}`,
      `Jumlah outlet: ${form.outlets}`,
      form.message ? `\n${form.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
  };

  const field =
    "mt-2 block w-full rounded-xl border border-black/[0.1] bg-white px-4 py-3 text-[15px] text-[#0a0a0a] outline-none transition focus:border-[#0E59F9] focus:ring-4 focus:ring-[#0E59F9]/10";

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
      <form onSubmit={onSubmit} className="rounded-[28px] bg-white p-7 ring-1 ring-black/[0.08] sm:p-10 lg:col-span-7">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block text-[13.5px] font-medium text-[#3f3f46]">
            Nama
            <input required value={form.name} onChange={set("name")} className={field} placeholder="Nama Anda" />
          </label>
          <label className="block text-[13.5px] font-medium text-[#3f3f46]">
            Nama usaha
            <input value={form.business} onChange={set("business")} className={field} placeholder="Contoh: Kopi Jotos" />
          </label>
          <label className="block text-[13.5px] font-medium text-[#3f3f46]">
            Keperluan
            <select value={form.topic} onChange={set("topic")} className={field}>
              <option>Coba Menuin</option>
              <option>Tanya harga & paket</option>
              <option>Paket Enterprise</option>
              <option>Bantuan teknis</option>
              <option>Kerja sama</option>
            </select>
          </label>
          <label className="block text-[13.5px] font-medium text-[#3f3f46]">
            Jumlah outlet
            <select value={form.outlets} onChange={set("outlets")} className={field}>
              <option>1</option>
              <option>2–5</option>
              <option>6–20</option>
              <option>Lebih dari 20</option>
            </select>
          </label>
        </div>
        <label className="mt-5 block text-[13.5px] font-medium text-[#3f3f46]">
          Pesan
          <textarea
            rows={5}
            value={form.message}
            onChange={set("message")}
            className={`${field} resize-none`}
            placeholder="Ceritakan sedikit tentang outlet Anda dan yang ingin ditanyakan."
          />
        </label>
        <button
          type="submit"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#0E59F9] px-7 text-[15px] font-medium text-white transition-colors hover:bg-[#0C4CD6]"
        >
          <Send className="h-4 w-4" />
          Kirim lewat WhatsApp
        </button>
        <p className="mt-3 text-[12.5px] text-[#71717a]">Pesan akan dibuka di WhatsApp dan bisa Anda ubah sebelum dikirim.</p>
      </form>

      <aside className="space-y-4 lg:col-span-5">
        <a
          href={whatsappLink("Halo Menuin, saya ingin bertanya.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 rounded-[24px] bg-[#fafafa] p-7 ring-1 ring-black/[0.05] transition-colors hover:bg-white hover:ring-black/[0.1]"
        >
          <MessageCircle className="mt-0.5 h-6 w-6 text-[#0E59F9]" strokeWidth={1.7} />
          <span>
            <span className="block text-[17px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">WhatsApp</span>
            <span className="mt-1 block text-[14.5px] text-[#52525b]">{CONTACT.whatsappDisplay}</span>
            <span className="mt-1 block text-[13px] text-[#71717a]">Cara tercepat untuk bertanya atau minta demo.</span>
          </span>
        </a>
        <a
          href={`mailto:${CONTACT.email}`}
          className="flex items-start gap-4 rounded-[24px] bg-[#fafafa] p-7 ring-1 ring-black/[0.05] transition-colors hover:bg-white hover:ring-black/[0.1]"
        >
          <Mail className="mt-0.5 h-6 w-6 text-[#0E59F9]" strokeWidth={1.7} />
          <span>
            <span className="block text-[17px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">Email</span>
            <span className="mt-1 block text-[14.5px] text-[#52525b]">{CONTACT.email}</span>
            <span className="mt-1 block text-[13px] text-[#71717a]">Untuk kerja sama dan kebutuhan Enterprise.</span>
          </span>
        </a>
      </aside>
    </div>
  );
}

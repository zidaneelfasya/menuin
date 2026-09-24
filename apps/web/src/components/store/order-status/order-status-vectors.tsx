"use client";

import React from "react";
import { motion } from "framer-motion";

interface VectorProps {
  primaryColor?: string;
  className?: string;
}

/**
 * Resolves the CSS color to use for tenant primary accents.
 * Prioritizes passed prop, then CSS variable --catalog-primary, then --outlet-primary, fallback to #0E59F9.
 */
function getAccentColor(primaryColor?: string): string {
  if (primaryColor) return primaryColor;
  return "var(--catalog-primary, var(--outlet-primary, #0E59F9))";
}

/**
 * 1. Menunggu Pembayaran
 * Asset: menunggu_pembayaran.svg
 * Dinamis: Warna jam (circle + 2 hands) dan dekorasi line menjadi warna catalog-primary.
 * Bagian dompet & kartu tetap hitam / dark charcoal.
 * Animasi halus tanpa efek pulse/denyut.
 */
export function MenungguPembayaranVector({ primaryColor, className = "" }: VectorProps) {
  const accent = getAccentColor(primaryColor);

  return (
    <svg
      viewBox="0 0 151 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none ${className}`}
      aria-label="Menunggu Pembayaran"
    >
      {/* Wallet Body (Hitam) */}
      <path
        d="M74 92.4883H19.5C10.6634 92.4883 3.5 85.3248 3.5 76.4883V28.539C3.5 25.7579 5.76948 23.5112 8.5505 23.5393L90.6212 24.3683C97.201 24.4348 102.5 29.7875 102.5 36.3677V48.4883"
        stroke="#111827"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Wallet Clasp (Hitam) */}
      <path
        d="M79.8505 70.4677C81.496 70.2741 82.673 68.7833 82.4795 67.1378C82.2859 65.4923 80.795 64.3152 79.1495 64.5088L79.5 67.4883L79.8505 70.4677ZM80.4138 48.4883V51.4883H102V48.4883V45.4883H80.4138V48.4883ZM71 59.9297H74V57.9021H71H68V59.9297H71ZM79.5 67.4883L79.1495 64.5088C76.4084 64.8313 74 62.6896 74 59.9297H71H68C68 66.2812 73.5425 71.2099 79.8505 70.4677L79.5 67.4883ZM80.4138 48.4883V45.4883C73.5578 45.4883 68 51.0461 68 57.9021H71H74C74 54.3598 76.8716 51.4883 80.4138 51.4883V48.4883Z"
        fill="#111827"
      />

      {/* Back Slip / Card (Hitam) */}
      <path
        d="M92 26.4883V14.0011C92 7.36629 86.1705 2.24154 79.5904 3.09177L16.9496 11.1858C8.97205 12.2166 3 19.01 3 27.0539V62.9883V73.9883"
        stroke="#111827"
        strokeWidth="6"
      />

      {/* Dynamic Jam (Clock circle & hands -> catalog primary) */}
      <g>
        <circle
          cx="109.5"
          cy="85.9883"
          r="22.5"
          fill="#D9D9D9"
          fillOpacity="0.06"
          stroke={accent}
          strokeWidth="6"
        />
        {/* Jam Hands (Hour & Minute) - Steady without blinking */}
        <line
          x1="109"
          y1="73.4883"
          x2="109"
          y2="87.4883"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="121"
          y1="88.4883"
          x2="109"
          y2="88.4883"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Dynamic Dekorasi Line (Top right -> catalog primary with gentle smooth drift, no pulse) */}
      <motion.line
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        x1="121.907"
        y1="28.3889"
        x2="129.901"
        y2="14.5815"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <motion.line
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        x1="137"
        y1="40.2456"
        x2="146.757"
        y2="30.4883"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 2. Pesanan Diterima
 * Asset: pesanan_diterima.svg
 * Dinamis: Warna centang dan bulatannya menjadi warna catalog-primary.
 * Bagian papan nota, penjepit, dan baris daftar tetap hitam.
 * Animasi halus tanpa efek pulse/denyut.
 */
export function PesananDiterimaVector({ primaryColor, className = "" }: VectorProps) {
  const accent = getAccentColor(primaryColor);

  return (
    <svg
      viewBox="0 0 139 118"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none ${className}`}
      aria-label="Pesanan Diterima"
    >
      {/* Clipboard Body (Hitam) */}
      <path
        d="M68.5 107H7C4.79086 107 3 105.209 3 103V13C3 10.7909 4.79086 9 7 9H28.375M104.5 45V13C104.5 10.7909 102.709 9 100.5 9H79.125"
        stroke="#111827"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Clipboard Top Clip (Hitam) */}
      <rect x="31" y="3" width="42" height="11" rx="5.5" stroke="#111827" strokeWidth="6" />

      {/* List Lines (Hitam) */}
      <line x1="26" y1="40" x2="77" y2="40" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <line
        x1="24.9922"
        y1="61.5"
        x2="61.0041"
        y2="61.5"
        stroke="#111827"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Dynamic Bulatan (Circle Badge -> catalog primary) */}
      <path
        d="M107.5 58C123.24 58 136 70.7599 136 86.5C136 102.24 123.24 115 107.5 115C91.7599 115 79 102.24 79 86.5C79 70.7599 91.7599 58 107.5 58Z"
        stroke={accent}
        strokeWidth="6"
      />

      {/* Dynamic Centang (Checkmark inside circle -> catalog primary) */}
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
        d="M92.8672 85.5195L103.773 95.3446C104.177 95.7088 104.798 95.6829 105.171 95.2864L121.867 77.5195"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 3. Sedang Disiapkan / Processing
 * Asset: processing.svg
 * Dinamis: Warna api dan asap menjadi warna catalog-primary.
 * Bagian wajan dan gagang tetap hitam/putih.
 * Animasi uap asap bergerak naik-turun halus; nyala api bergoyang halus TANPA pulse denyut.
 */
export function ProcessingVector({ primaryColor, className = "" }: VectorProps) {
  const accent = getAccentColor(primaryColor);

  return (
    <svg
      viewBox="0 0 227 218"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none ${className}`}
      aria-label="Sedang Disiapkan"
    >
      {/* Pan Handle (Hitam) */}
      <path
        d="M19.3948 92.9474L105.45 77.5776L110.61 106.468L24.5547 121.838C16.5769 123.263 8.95442 117.95 7.52954 109.973C6.10466 101.995 11.4169 94.3723 19.3948 92.9474Z"
        stroke="#111827"
        strokeWidth="8"
      />
      <path
        d="M26.335 91.4632L19.0968 92.99C11.1674 94.6627 6.09483 102.447 7.76737 110.376C9.43993 118.306 17.2243 123.378 25.1538 121.706L32.392 120.179C40.3216 118.506 45.394 110.722 43.7214 102.793C42.075 94.987 34.5065 89.95 26.7068 91.3898L26.335 91.4632Z"
        stroke="#111827"
        strokeWidth="8"
      />

      {/* Pan Body / Wok (Putih dengan outline hitam) */}
      <path
        d="M212.149 54.1043C213.368 53.9021 214.477 54.8422 214.477 56.0775L214.477 83.0653C214.477 92.6956 207.613 100.959 198.147 102.726L126.094 116.176C116.17 118.028 106.422 112.194 103.364 102.574L94.8851 75.8997C94.5162 74.7389 95.2618 73.521 96.4632 73.3211L212.149 54.1043Z"
        fill="white"
        stroke="#111827"
        strokeWidth="8"
      />

      {/* Dynamic Asap 1 (Smoke trail 1 -> catalog primary, smooth upward drift, NO opacity pulse) */}
      <motion.path
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        d="M119.626 10C119.626 10 113.571 23.5113 118.625 29C121.721 32.3627 124.806 29.4035 127.627 33C131.53 37.976 126.126 49 126.126 49"
        stroke={accent}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Dynamic Asap 2 (Smoke trail 2 -> catalog primary, smooth upward drift, NO opacity pulse) */}
      <motion.path
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
        d="M161.138 4C161.138 4 155.083 17.5113 160.137 23C163.233 26.3627 166.318 23.4035 169.139 27C173.042 31.976 167.638 43 167.638 43"
        stroke={accent}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Dynamic Api (Flame underneath the pan -> catalog primary, gentle horizontal flicker drift, NO scale pulse/denyut) */}
      <motion.path
        animate={{ x: [0, 1.2, -1.2, 0], y: [0, -0.8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        d="M153.298 137.104C155.64 138.761 158.288 140.766 160.827 142.976C164.896 146.516 168.338 150.287 170.014 153.744C173.878 161.719 176.374 171.858 177.338 176.239C178.227 180.277 183.542 181.7 186.2 178.209C188.07 175.753 191.676 170.851 193.744 166.83C195.486 163.444 196.99 159.025 198.085 155.363C199.54 157.185 201.157 159.326 202.694 161.612C205.215 165.361 207.357 169.253 208.348 172.627C210.031 178.359 209.339 185.856 207.515 193.392C205.719 200.811 202.969 207.713 201.092 211.971C200.565 213.167 199.325 214 197.798 214H122.507C120.871 214 119.544 213.036 119.064 211.689C117.881 208.365 116.369 203.7 115.235 198.776C114.089 193.798 113.393 188.819 113.676 184.779C114.024 179.809 116.024 173.811 118.529 168.118C120.308 164.075 122.265 160.359 123.857 157.526L134.995 174.411C136.982 177.423 141.464 177.428 143.404 174.298C145.209 171.386 149.868 163.742 151.864 159.072C153.502 155.241 153.843 150.041 153.787 145.465C153.752 142.564 153.548 139.664 153.298 137.104Z"
        stroke={accent}
        strokeWidth="8"
      />
    </svg>
  );
}

/**
 * 4. Pesanan Sudah Siap / Ready
 * Asset: ready.svg
 * Dinamis: Warna asap di atas tudung saji menjadi warna catalog-primary.
 * Bagian tudung saji (cloche), pegangan, dan piring tetap hitam.
 * Animasi uap asap bergerak naik-turun halus TANPA pulse denyut.
 */
export function ReadyVector({ primaryColor, className = "" }: VectorProps) {
  const accent = getAccentColor(primaryColor);

  return (
    <svg
      viewBox="0 0 145 152"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none ${className}`}
      aria-label="Pesanan Sudah Siap"
    >
      {/* Cloche / Tudung Saji (Hitam) */}
      <path
        d="M16.2227 149.496C16.2227 149.496 9.22267 75.9961 73.7212 75.9961C134.723 75.9961 130.223 149.496 130.223 149.496"
        stroke="#111827"
        strokeWidth="6"
      />

      {/* Cloche Handle (Hitam) */}
      <path
        d="M63.3759 74.5087C63.3759 74.5087 61.3752 60.2947 73.0845 60.2973C84.7937 60.2998 83.375 74.5087 83.375 74.5087"
        stroke="#111827"
        strokeWidth="4"
      />

      {/* Platter Base (Hitam) */}
      <line x1="3" y1="148.996" x2="142" y2="148.996" stroke="#111827" strokeWidth="6" strokeLinecap="round" />

      {/* Dynamic Asap Tengah (Smoke Center -> catalog primary, smooth upward drift, NO opacity pulse) */}
      <motion.path
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        d="M68.2306 3C68.2306 3 60.6886 13.5113 65.7423 19C68.8385 22.3627 71.9232 19.4035 74.7443 23C78.6475 27.976 70.2305 37.5 70.2305 37.5"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Dynamic Asap Kanan (Smoke Right -> catalog primary, smooth upward drift, NO opacity pulse) */}
      <motion.path
        animate={{ y: [0, -3.5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        d="M100.231 20C100.231 20 92.6886 30.5113 97.7423 36C100.839 39.3627 103.923 36.4035 106.744 40C110.648 44.976 102.23 54.5 102.23 54.5"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Dynamic Asap Kiri (Smoke Left -> catalog primary, smooth upward drift, NO opacity pulse) */}
      <motion.path
        animate={{ y: [0, -3.5, 0] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        d="M36.5002 21C36.5002 21 28.9582 31.5113 34.0119 37C37.108 40.3627 40.1927 37.4035 43.0139 41C46.9171 45.976 38.5 55.5 38.5 55.5"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 5. Pesanan Selesai
 * Asset: selesai.svg
 * Dinamis: Warna centang dan bulatannya dan juga dekorasi line menjadi warna catalog-primary.
 * Bagian kantong belanja dan pegangan tali tetap hitam.
 * Animasi halus tanpa efek pulse/denyut.
 */
export function SelesaiVector({ primaryColor, className = "" }: VectorProps) {
  const accent = getAccentColor(primaryColor);

  return (
    <svg
      viewBox="0 0 158 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto select-none ${className}`}
      aria-label="Pesanan Selesai"
    >
      {/* Takeout Bag (Hitam) */}
      <path
        d="M18.1123 31.7695H91.4023C96.1353 31.7695 100.06 35.4353 100.382 40.1572L105.647 117.39C106.002 122.589 101.879 127.001 96.668 127.001H12.8457C7.63445 127.001 3.51294 122.589 3.86719 117.39L9.13281 40.1572C9.45482 35.4353 13.3794 31.7695 18.1123 31.7695Z"
        stroke="#111827"
        strokeWidth="6"
      />

      {/* Bag Handles (Hitam) */}
      <path
        d="M78.2254 48.0942V28.308V26.0072C78.2254 13.3007 67.9247 3 55.2182 3C42.5116 3 32.2109 13.3007 32.2109 26.0072V28.308V48.0942"
        stroke="#111827"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Dynamic Dekorasi Line 1 & 2 (Right side lines -> catalog primary, gentle drift, NO pulse) */}
      <motion.line
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        x1="129.379"
        y1="46.6473"
        x2="144.878"
        y2="34.671"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <motion.line
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
        x1="134"
        y1="68"
        x2="155"
        y2="68"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Dynamic Bulatan (Circle Badge on Bag -> catalog primary) */}
      <path
        d="M55 62C67.7025 62 78 72.2975 78 85C78 97.7025 67.7025 108 55 108C42.2975 108 32 97.7025 32 85C32 72.2975 42.2975 62 55 62Z"
        stroke={accent}
        strokeWidth="6"
      />

      {/* Dynamic Centang (Checkmark inside circle -> catalog primary) */}
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
        d="M42.9219 84.1914L51.7961 92.1865C52.2003 92.5507 52.8215 92.5249 53.1941 92.1284L66.8584 77.5882"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

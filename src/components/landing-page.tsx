"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Check, 
  ChevronDown, 
  ArrowRight, 
  PlayCircle, 
  QrCode, 
  CreditCard, 
  Monitor, 
  TrendingUp,
  Printer,
  ScanBarcode,
  Clock,
  Store,
  Receipt,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Layers,
  DollarSign,
  CheckCircle2,
  Building2,
  ShoppingBag,
  Smartphone,
  Laptop,
  Tv,
  BadgeCheck,
  AlertCircle,
  Volume2,
  BarChart3,
  Users,
  Search
} from "lucide-react";
import PricingTableDark from "@/components/ui/pricing-table-dark";
import FaqEditorial from "@/components/ui/faq-editorial";
import FooterReadyToBegin from "@/components/ui/footer-ready-to-begin";
import FooterSuperfluidStyle from "@/components/ui/footer-superfluid-style";



function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const faqs = [
  { q: "What is MENUIN?", a: "MENUIN is an all-in-one cloud SaaS platform for F&B businesses — managing digital table ordering, QR payments, POS cashier registers, shift reconciliation, and business analytics in a unified system." },
  { q: "Do customers need to download an app?", a: "No. Guests simply scan the QR code at their table using their phone camera to browse the menu and order directly via their mobile browser." },
  { q: "Does MENUIN include a POS Cashier Register?", a: "Yes. It comes with a full-featured POS register to manage dine-in, take-away, and online orders with real-time receipt printing and reporting." },
  { q: "Is it suitable for small businesses and multi-outlets?", a: "Yes. MENUIN scales effortlessly from single specialty cafes and bakeries to multi-branch restaurant chains." },
  { q: "Can multiple team members and cashiers use it?", a: "Yes. You can invite multiple users with granular role-based permissions (Cashier, Store Manager, Superadmin)." },
];

const features = [
  {
    title: "Elegant Digital QR Menu",
    desc: "Every table has a dedicated QR code. Guests browse your interactive menu from their seats without app installation.",
    icon: QrCode,
  },
  {
    title: "Self-Checkout & Instant Payments",
    desc: "Customers select items, customize notes, and pay instantly via QRIS or integrated payment gateways.",
    icon: CreditCard,
  },
  {
    title: "High-Speed POS Cashier",
    desc: "Manage direct counter and take-away orders with fast receipt printing and instant kitchen sync.",
    icon: Monitor,
  },
  {
    title: "In-Depth Analytics & Shift Audit",
    desc: "Track live revenue, top-selling items, cash drawer reconciliation, and team performance across all branches.",
    icon: TrendingUp,
  },
];

const logos = [
  { name: "Midtrans", src: "/img/brand_logo/midtrans.svg" },
  { name: "QRIS", src: "https://upload.wikimedia.org/wikipedia/commons/e/e1/QRIS_logo.svg" },
  { name: "BCA", src: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
  { name: "Mandiri", src: "/img/brand_logo/mandiri.svg" },
  { name: "BNI", src: "/img/brand_logo/bni.svg" },
  { name: "Komdigi", src: "/img/brand_logo/komdigi.svg" },
  { name: "Kemenparekraf", src: "/img/brand_logo/kemenparkraf.svg" },
  { name: "Pesona Indonesia", src: "/img/brand_logo/pesona_indo.svg" }
];

function HeroImageStack() {
  const images = ["/img/hero/img1.png", "/img/hero/img2.png", "/img/hero/img3.png"];

  const [indexes, setIndexes] = useState({
    front: 0,
    middle: 1,
    back: 2,
    collapsing: -1,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timer = setInterval(() => {
      setIndexes(prev => ({
        ...prev,
        collapsing: prev.front,
      }));

      timeoutId = setTimeout(() => {
        setIndexes(prev => ({
          front: prev.middle,
          middle: prev.back,
          back: prev.collapsing,
          collapsing: -1,
        }));
      }, 1200);
    }, 5000);

    return () => {
      clearInterval(timer);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[1000px] mx-auto aspect-[16/10] md:aspect-[16/9] mt-20 perspective-[1200px]">
      {images.map((src, i) => {
        let style: React.CSSProperties = {
          transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        };
        let className = "absolute top-0 left-0 w-full h-full rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-[1200ms] border border-[#E5E5E5] bg-white overflow-hidden";

        if (i === indexes.front) {
          style = { ...style, transform: "translate3d(0, 0, 0) scale(1)", opacity: 1, zIndex: 30 };
        } else if (i === indexes.middle) {
          style = { ...style, transform: "translate3d(0, -6%, -50px) scale(0.94)", opacity: 0.6, zIndex: 20 };
        } else if (i === indexes.back) {
          style = { ...style, transform: "translate3d(0, -12%, -100px) scale(0.88)", opacity: 0.3, zIndex: 10 };
        } else if (i === indexes.collapsing) {
          style = { ...style, transform: "translate3d(0, 20%, 150px) scale(1.02) rotateX(-8deg)", opacity: 0, zIndex: 40 };
        } else {
          style = { ...style, transform: "translate3d(0, -15%, -150px) scale(0.85)", opacity: 0, zIndex: 0 };
        }

        return (
          <div key={i} className={className} style={style}>
            <Image
              src={src}
              alt={`Dashboard preview ${i + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 1000px"
              className="object-cover object-top"
              priority={i === indexes.front || i === indexes.collapsing}
            />
          </div>
        );
      })}
    </div>
  );
}

const testimonialsData = [
  {
    name: 'Budi Santoso',
    role: 'Founder, Sunset Coffee Bar',
    avatar: 'https://i.pravatar.cc/150?u=budi',
    rating: 5.0,
    text: 'Long register lines disappeared immediately. Guests order and pay right from their tables. The POS register runs remarkably fast!',
    sentiment: 'Highly Satisfied'
  },
  {
    name: 'Siti Aminah',
    role: 'General Manager, Raya Resto Chain',
    avatar: 'https://i.pravatar.cc/150?u=siti',
    rating: 4.8,
    text: 'Stock management is outstanding. We get automated low-inventory alerts before ingredients run out. It keeps our daily operations spotless.',
    sentiment: 'Highly Satisfied'
  },
  {
    name: 'Andi Wijaya',
    role: 'Owner, Burger Bros',
    avatar: 'https://i.pravatar.cc/150?u=andi',
    rating: 5.0,
    text: 'Instant QRIS checkout processes seamlessly with zero latency. Sales reports provide granular insights into our best-selling items.',
    sentiment: 'Top Recommended'
  },
  {
    name: 'Dewi Lestari',
    role: 'Proprietor, Artisan Bakery Cafe',
    avatar: 'https://i.pravatar.cc/150?u=dewi',
    rating: 4.9,
    text: 'The interface is sleek and very intuitive for our kitchen crew. Table orders sync directly to the kitchen display with zero error.',
    sentiment: 'Highly Satisfied'
  },
  {
    name: 'Reza Rahadian',
    role: 'Co-Founder, Brew & Roast Co.',
    avatar: 'https://i.pravatar.cc/150?u=reza',
    rating: 5.0,
    text: 'Exceptional uptime even during peak weekend rushes. It has been the most reliable tech investment for our hospitality business.',
    sentiment: 'Top Recommended'
  },
  {
    name: 'Ayu Pratama',
    role: 'Multi-Unit Operator, Gourmet Bites',
    avatar: 'https://i.pravatar.cc/150?u=ayu',
    rating: 4.7,
    text: 'Opening a new branch takes only minutes to configure. Multi-outlet reports give me complete financial visibility from anywhere.',
    sentiment: 'Highly Satisfied'
  }
];

function SkeletonCard() {
  return (
    <div className="w-[300px] shrink-0 h-[120px] testimonial-wrapper">
      <div className="w-full h-full bg-white/50 backdrop-blur-sm rounded-[24px] p-4 border border-gray-100 flex flex-col shadow-sm opacity-50 grayscale testimonial-inner origin-center will-change-transform">

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center flex-1 min-w-0 mr-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="w-20 max-w-full h-2.5 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 max-w-full h-2 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="w-14 h-2 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Text Body */}
        <div className="flex flex-col gap-1 mt-auto mb-1">
          <div className="w-full h-2 bg-gray-200 rounded animate-pulse" />
          <div className="w-[85%] h-2 bg-gray-100 rounded animate-pulse" />
        </div>

      </div>
    </div>
  );
}

function RealCard({ data }: { data: any }) {
  return (
    <div className="w-[300px] shrink-0 h-[120px] testimonial-wrapper">
      <div className="w-full h-full bg-white rounded-[24px] p-4 border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-shadow flex flex-col testimonial-inner origin-center will-change-transform">

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center flex-1 min-w-0 mr-2">
            <img src={data.avatar} alt={data.name} className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[12px] font-bold text-[#111] leading-tight truncate block">{data.name.toLowerCase()}</span>
              <span className="text-[10px] text-[#888] truncate block">{data.role.toLowerCase()}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-[9px] ${i < Math.floor(data.rating) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
              ))}
              <span className="text-[10px] font-bold text-[#111] ml-1">{data.rating}</span>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#E8F8F0] text-[#139E60] text-[8px] font-black tracking-wide uppercase border border-[#D0EBE0]">
              {data.sentiment}
            </span>
          </div>
        </div>

        {/* Text Body */}
        <p className="text-[11px] text-[#666] leading-relaxed line-clamp-2 mt-auto mb-1">
          "{data.text}"
        </p>

      </div>
    </div>
  );
}

// --- UNIFIED HIGH-FIDELITY POS WORKSPACE SHOWCASE ---

type ShowcaseTab = 'qr-order' | 'pos' | 'shift' | 'outlets';

function InteractivePOSShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('qr-order');
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [activeOutletIdx, setActiveOutletIdx] = useState(0);

  const sampleProducts = [
    { 
      name: 'Signature Mocca Cake', 
      sku: 'BLP-001', 
      price: 'Rp 45.000', 
      category: 'Bakery & Cakes', 
      stock: 24,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Baked Cheese Cake', 
      sku: 'BLP-002', 
      price: 'Rp 50.000', 
      category: 'Bakery & Cakes', 
      stock: 18,
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Pandan Chiffon Cake', 
      sku: 'BLK-001', 
      price: 'Rp 35.000', 
      category: 'Bakery & Cakes', 
      stock: 30,
      image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Cheese Pastry Cookies', 
      sku: 'KKR-002', 
      price: 'Rp 90.000', 
      category: 'Pastries', 
      stock: 15,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Iced Palm Sugar Latte', 
      sku: 'MNM-001', 
      price: 'Rp 18.000', 
      category: 'Beverages', 
      stock: 85,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Iced Fresh Milk Tea', 
      sku: 'MNM-002', 
      price: 'Rp 15.000', 
      category: 'Beverages', 
      stock: 60,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80'
    },
  ];

  const filteredProducts = activeCategory === 'All Items' 
    ? sampleProducts 
    : sampleProducts.filter(p => p.category === activeCategory);

  const outlets = [
    { name: 'Central Outlet (HQ)', address: 'Sudirman Ave No. 42', role: 'SUPERADMIN', revenue: 'Rp 14.850.000', cashier: '4 Active Registers', orders: 124, status: 'Open' },
    { name: 'Mall Gandaria Branch', address: 'Gandaria City UG-12', role: 'SUPERADMIN', revenue: 'Rp 8.420.000', cashier: '2 Active Registers', orders: 68, status: 'Open' },
    { name: 'Food Truck Festival', address: 'GBK Stadium Gate 5', role: 'CASHIER', revenue: 'Rp 3.190.000', cashier: '1 Active Register', orders: 32, status: 'Open' },
  ];

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06)] overflow-hidden">
      {/* Clean Window Header */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Left: Window Dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        </div>

        {/* Center: Modern Segmented Switcher */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl gap-1 max-w-full overflow-x-auto scrollbar-none">
          {[
            { id: 'qr-order', label: 'Table QR Ordering', icon: QrCode },
            { id: 'pos', label: 'POS Register', icon: Monitor },
            { id: 'shift', label: 'Shift Audit', icon: Clock },
            { id: 'outlets', label: 'Multi-Branch', icon: Store },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ShowcaseTab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#0E59F9] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0E59F9]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Balanced Spacing */}
        <div className="w-10 hidden sm:block" />
      </div>

      {/* Tab Contents */}
      <div className="p-5 md:p-8 bg-white min-h-[460px]">
        {/* TAB 1: TABLE QR SELF-ORDERING */}
        {activeTab === 'qr-order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Customer Smartphone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[320px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[460px] select-none text-slate-900">
                {/* Browser URL / Status Bar */}
                <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-600 w-full justify-between">
                    <span className="truncate">menuin.id/table/08</span>
                    <span className="text-emerald-600 text-[9px] font-bold">QRIS Active</span>
                  </div>
                </div>

                {/* Table Header inside Customer Phone */}
                <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Bolu Anisa Cafe</h4>
                    <span className="text-[10px] text-slate-500 font-medium">Table 08 • Dine-In</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0E59F9] text-[9px] font-bold border border-blue-100">
                    Self-Order
                  </span>
                </div>

                {/* Cart Content in Customer Phone */}
                <div className="p-3.5 flex-1 overflow-y-auto space-y-2.5 text-xs bg-slate-50/50">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                    <img 
                      src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=120&q=80" 
                      alt="Signature Mocca Cake" 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between font-bold">
                        <span className="truncate">1x Signature Mocca Cake</span>
                        <span className="shrink-0 ml-1 font-extrabold text-[#0E59F9]">Rp 45.000</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Notes: Cut into 8 slices</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                    <img 
                      src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=120&q=80" 
                      alt="Iced Palm Sugar Latte" 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between font-bold">
                        <span className="truncate">2x Iced Palm Sugar Latte</span>
                        <span className="shrink-0 ml-1 font-extrabold text-[#0E59F9]">Rp 36.000</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Notes: Less ice, less sugar</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rp 81.000</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Table Promo Discount (10%)</span>
                      <span>-Rp 8.100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Tax (10%)</span>
                      <span>+Rp 7.290</span>
                    </div>
                  </div>
                </div>

                {/* Phone Bottom Sticky Checkout */}
                <div className="p-3 bg-white border-t border-slate-200">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] text-slate-500 font-semibold">Total Due (Table 08)</span>
                    <span className="text-sm font-extrabold text-slate-900">Rp 80.190</span>
                  </div>
                  <button 
                    type="button"
                    className="w-full h-9 rounded-xl bg-[#0E59F9] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#0B48CC] transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay with QRIS Instantly</span>
                  </button>
                  <span className="text-[9px] text-center text-slate-400 block mt-1">
                    Directly sent to Kitchen & POS Register
                  </span>
                </div>
              </div>
            </div>

            {/* Right: The 3-Step Instant Table Flow */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0E59F9] mb-1.5 block">
                  Table Self-Service Ordering
                </span>
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                  Guests Order & Pay Directly From Their Tables
                </h3>
                <p className="text-xs md:text-sm text-slate-600 mt-2 leading-relaxed">
                  Eliminate cashier lines and streamline your staff workflow. Guests scan their table QR code using native phone cameras, customize items, and pay instantly without downloading any app.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0E59F9] flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Scan Table QR Code</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      No app download required. Standard smartphone cameras immediately open the responsive digital web catalog.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0E59F9] flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Customize Items & Pay Instantly</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Guests select flavors, add preparation notes, and checkout via QRIS or Pay at Cashier.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Instant Dispatch to Kitchen & Register</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kitchen display systems and cashier registers receive exact table tickets in real time, cutting order errors to zero.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POS REGISTER */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Product Catalog */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Product Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  readOnly 
                  value="Signature Mocca Cake"
                  placeholder="Search products..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 outline-none select-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 hidden sm:inline">
                  Quick Filter
                </span>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All Items', 'Bakery & Cakes', 'Pastries', 'Beverages'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Products Grid with Admin-Style Photos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p, idx) => (
                  <div 
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 hover:border-[#0E59F9]/50 hover:shadow-md transition-all bg-white flex flex-col justify-between overflow-hidden select-none group cursor-pointer"
                  >
                    {/* Aspect 4/3 Product Image like Admin POS */}
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-700 text-[9px] font-mono font-bold shadow-xs">
                        {p.sku}
                      </span>
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium">
                        Stock: {p.stock}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0E59F9] transition-colors leading-tight line-clamp-1">
                        {p.name}
                      </h4>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#0E59F9]">{p.price}</span>
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0E59F9] flex items-center justify-center font-bold text-xs group-hover:bg-[#0E59F9] group-hover:text-white transition-colors shadow-2xs">
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Order Cart & Struk Preview */}
            <div className="lg:col-span-5 bg-slate-50/70 rounded-2xl p-4 md:p-5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Order #MN-8921</h3>
                    <p className="text-[11px] text-slate-500">Table 04 • Dine-In Register</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0E59F9] text-[11px] font-bold border border-blue-100">
                    2 Items
                  </span>
                </div>

                <div className="py-3 space-y-2.5 border-b border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src="https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=120&q=80" 
                        alt="Baked Cheese Cake" 
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" 
                      />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">1x Baked Cheese Cake</p>
                        <p className="text-[10px] text-slate-400 font-mono">BLP-002</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0 ml-2">Rp 50.000</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=120&q=80" 
                        alt="Iced Palm Sugar Latte" 
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" 
                      />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">2x Iced Palm Sugar Latte</p>
                        <p className="text-[10px] text-slate-400 font-mono">MNM-001</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0 ml-2">Rp 36.000</span>
                  </div>
                </div>

                <div className="py-2.5 space-y-1 text-xs text-slate-600 border-b border-slate-200">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp 86.000</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Promo Discount (10%)</span>
                    <span>-Rp 8.600</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restaurant Tax (PB1 10%)</span>
                    <span>+Rp 7.740</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Due</span>
                  <span className="text-lg font-black text-slate-900">Rp 85.140</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="py-1.5 text-center text-xs font-semibold rounded-lg bg-white border border-[#0E59F9] text-[#0E59F9] shadow-sm">
                    QRIS
                  </div>
                  <div className="py-1.5 text-center text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600">
                    Cash
                  </div>
                  <div className="py-1.5 text-center text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600">
                    Debit / Card
                  </div>
                </div>

                <button 
                  type="button"
                  className="w-full h-10 rounded-xl bg-[#0E59F9] text-white text-xs font-bold hover:bg-[#0C4CD6] transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Process Order & Print Receipt (58/80mm)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SHIFT MANAGEMENT */}
        {activeTab === 'shift' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0E59F9] font-bold text-sm">
                  SR
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Morning Shift 1 — Cashier: Sarah Rahma</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      ACTIVE SHIFT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Shift Schedule: 07:00 - 15:00 • Register Terminal 01</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total Shift Orders</span>
                <span className="text-sm font-bold text-slate-900">72 Completed Orders</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">Starting Float (Cash In)</span>
                <span className="text-base font-extrabold text-slate-900 mt-1 block">Rp 200.000</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Initial drawer count</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">Cash Sales</span>
                <span className="text-base font-extrabold text-emerald-600 mt-1 block">+Rp 1.425.000</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">24 Cash Transactions</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">Non-Cash & QRIS</span>
                <span className="text-base font-extrabold text-[#0E59F9] mt-1 block">Rp 2.890.000</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">48 Digital Transactions</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">Petty Cash Expense</span>
                <span className="text-base font-extrabold text-rose-600 mt-1 block">-Rp 25.000</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Operational Cash Out</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">Automated Cash Drawer Reconciliation</h4>
                  <p className="text-xs text-emerald-800">
                    Expected Drawer Cash: <strong className="text-emerald-950">Rp 1.600.000</strong> • Physical Cash Counted: <strong className="text-emerald-950">Rp 1.600.000</strong>
                  </p>
                </div>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-sm">
                Variance: Rp 0 (100% Balanced)
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MULTI OUTLET & ANALYTICS */}
        {activeTab === 'outlets' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {outlets.map((outlet, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveOutletIdx(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeOutletIdx === idx
                      ? 'border-[#0E59F9] bg-blue-50/20 shadow-sm ring-1 ring-[#0E59F9]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                      {outlet.role}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">{outlet.status}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{outlet.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{outlet.address}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Real-time Revenue</span>
                      <span className="text-xs font-bold text-slate-900">{outlet.revenue}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{outlet.cashier}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0E59F9]" />
                <span className="font-semibold text-slate-900">Multi-Tenant PostgreSQL Architecture:</span>
                <span>Each branch data is cryptographically isolated via independent tenant IDs.</span>
              </div>
              <span className="font-mono text-slate-400 hidden lg:inline">UUID: d9f2e8-4a1b</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage({
  isLoggedIn = false,
  userName = "",
}: {
  isLoggedIn?: boolean;
  userName?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const marqueeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();
    let cache: any = null;

    const buildCache = () => {
      if (!marqueeContainerRef.current) return null;

      const contentsList = Array.from(marqueeContainerRef.current.querySelectorAll('.marquee-content')) as HTMLElement[];
      const oldTransforms = contentsList.map(c => c.style.transform);
      contentsList.forEach(c => c.style.transform = 'none');

      const containerRect = marqueeContainerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerCenter = containerRect.left + containerRect.width / 2;

      const tracks = Array.from(marqueeContainerRef.current.querySelectorAll('.row-top, .row-middle, .row-bottom')).map(track => {
        const isMiddle = track.classList.contains('row-middle');
        const isBottom = track.classList.contains('row-bottom');
        let delay = 0;
        if (isMiddle) delay = -12.5;
        if (isBottom) delay = -6;

        const contents = Array.from(track.querySelectorAll('.marquee-content')).map(content => {
          const contentEl = content as HTMLElement;
          const contentRect = contentEl.getBoundingClientRect();
          const contentWidth = contentRect.width;

          const wrappers = Array.from(content.querySelectorAll('.testimonial-wrapper')).map(wrapper => {
            const el = wrapper as HTMLElement;
            const inner = el.querySelector('.testimonial-inner') as HTMLElement;
            const isTopRow = el.closest('.row-top') !== null;
            const isBottomRow = el.closest('.row-bottom') !== null;

            const rect = el.getBoundingClientRect();
            const initialCenter = rect.left + rect.width / 2;

            return { inner, initialCenter, isTopRow, isBottomRow };
          });

          return { content: contentEl, contentWidth, wrappers };
        });

        return { delay, contents };
      });

      contentsList.forEach((c, i) => c.style.transform = oldTransforms[i]);

      return { containerWidth, containerCenter, tracks };
    };

    // logic untuk membuat animasi testimonial lengkung & halus
    const updateCards = (time: number) => {
      if (!cache) {
        cache = buildCache();
        if (!cache) {
          animationFrameId = requestAnimationFrame(updateCards);
          return;
        }
      }

      if (!marqueeContainerRef.current) return;
      const { containerWidth, containerCenter, tracks } = cache;
      const duration = 15;
      const elapsed = (time - startTime) / 1000;

      for (let i = 0; i < tracks.length; i++) {
        const trackInfo = tracks[i];
        const totalElapsed = elapsed - trackInfo.delay;
        let progress = (totalElapsed % duration) / duration;
        if (progress < 0) progress += 1;

        const translateXPercent = -100 + (progress * 100);

        for (let j = 0; j < trackInfo.contents.length; j++) {
          const contentInfo = trackInfo.contents[j];
          if (!contentInfo.content || !contentInfo.content.isConnected) continue;
          const translateXPixels = (translateXPercent / 100) * contentInfo.contentWidth;

          contentInfo.content.style.transform = `translate3d(${translateXPercent}%, 0, 0)`;

          for (let k = 0; k < contentInfo.wrappers.length; k++) {
            const wrapperInfo = contentInfo.wrappers[k];
            if (!wrapperInfo.inner || !wrapperInfo.inner.isConnected) continue;

            const currentCenter = wrapperInfo.initialCenter + translateXPixels;
            const distanceFromCenter = (currentCenter - containerCenter) / (containerWidth / 2);

            const clampedDistance = Math.max(-1.5, Math.min(1.5, distanceFromCenter));
            const curveIntensity = clampedDistance * clampedDistance;

            const maxOffset = 180;
            const maxRotation = 15;

            let translateY = 0;
            let rotateZ = 0;

            if (wrapperInfo.isTopRow) {
              translateY = -curveIntensity * maxOffset;
              rotateZ = -clampedDistance * maxRotation;
            } else if (wrapperInfo.isBottomRow) {
              translateY = curveIntensity * maxOffset;
              rotateZ = clampedDistance * maxRotation;
            }

            wrapperInfo.inner.style.transform = `translate3d(0, ${translateY}px, 0) rotateZ(${rotateZ}deg) scale(1)`;
          }
        }
      }

      animationFrameId = requestAnimationFrame(updateCards);
    };

    cache = buildCache();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cache = buildCache();
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(updateCards);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const userInitial = (userName || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased selection:bg-[#0E59F9] selection:text-white overflow-x-hidden">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="mx-auto max-w-[1200px] h-[72px] flex items-center justify-between px-6">
          <a href="/" className="flex items-center">
            <Image src="/menuin.png" alt="MENUIN - Smart POS System" width={110} height={32} style={{ width: "auto" }} priority />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <a href="#" className="text-slate-900 font-semibold">Home</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <a
                href="/pos"
                className="h-10 pl-2 pr-4 flex items-center rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-all gap-2.5 shadow-sm group"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0E59F9] to-[#3B82F6] text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
                  {userInitial}
                </div>
                <span>Open POS Register</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <>
                <a href="/auth/login" className="text-[14px] font-semibold text-slate-700 hover:text-[#0E59F9] transition-colors mr-2">Sign In</a>
                <a href="/auth/signup" className="h-10 px-5 flex items-center rounded-full bg-[#0E59F9] text-white text-[14px] font-semibold hover:bg-[#0C4CD6] transition-all shadow-sm hover:shadow-md">
                  Start Free Trial
                </a>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6L18 18" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 12H20M4 6H20M4 18H20" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-slate-200 px-6 py-6 space-y-5 shadow-xl">
            <nav className="flex flex-col gap-4 text-[15px] font-medium text-slate-700">
              <a href="#" onClick={() => setMobileOpen(false)} className="text-slate-900 font-semibold">Home</a>
              <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
              <a href="#testimonials" onClick={() => setMobileOpen(false)}>Testimonials</a>
              <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
            </nav>
            <div className="h-px bg-slate-100" />
            <div className="flex flex-col gap-3">
              {isLoggedIn ? (
                <a href="/pos" className="flex items-center justify-center gap-2.5 h-11 rounded-full bg-slate-900 text-white text-[14px] font-semibold">
                  <div className="w-6 h-6 rounded-full bg-[#0E59F9] text-white flex items-center justify-center font-bold text-[11px]">
                    {userInitial}
                  </div>
                  <span>Open POS Register</span>
                </a>
              ) : (
                <>
                  <a href="/auth/login" className="flex items-center justify-center h-11 rounded-full border border-slate-200 text-[14px] font-semibold text-slate-800">Sign In</a>
                  <a href="/auth/signup" className="flex items-center justify-center h-11 rounded-full bg-[#0E59F9] text-white text-[14px] font-semibold">Start Free Trial</a>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-32 md:pt-44 px-6 overflow-hidden z-0">
        {/* Soft Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#E0EDFF]/80 to-[#B8D0FC] -z-10" />

        {/* Abstract intense blue glow behind the dashboard */}
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[400px] md:h-[600px] -z-10 pointer-events-none">
          {/* Blob 1 (Main thick core) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] md:w-[80%] h-[120%] bg-[#0E59F9]/40 blur-[90px] md:blur-[140px] rounded-[100%] rotate-6" />
          {/* Blob 2 (Left side organic shape) */}
          <div className="absolute top-[30%] left-[-20%] md:left-[5%] w-[100%] md:w-[55%] h-[100%] bg-[#4989F8]/50 blur-[90px] md:blur-[130px] rounded-[40%_60%_70%_30%] -rotate-12" />
          {/* Blob 3 (Right side organic shape) */}
          <div className="absolute top-[40%] right-[-20%] md:right-[5%] w-[110%] md:w-[65%] h-[110%] bg-[#0C4CD6]/40 blur-[100px] md:blur-[150px] rounded-[60%_40%_30%_70%] rotate-45" />
        </div>

        <div className="mx-auto max-w-[1200px] text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
              <span className="flex h-5 items-center px-2 rounded-full bg-[#0E59F9] text-white text-[10px] font-bold uppercase tracking-wider">Next-Gen POS</span>
              <span className="text-[12px] font-medium text-slate-600 pr-1">Smart Table QR & POS Cashier System</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-[clamp(36px,5.2vw,64px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-slate-900 max-w-[900px] mx-auto">
              Smart Cloud POS with <br className="hidden sm:inline" />
              <span className="text-[#0E59F9]">Integrated Table QR & Cashier</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-[16px] md:text-[18px] text-slate-600 leading-relaxed max-w-[680px] mx-auto">
              Guests scan table QR codes to order and pay instantly via QRIS. Orders flow directly to the kitchen and cashier register in real-time, eliminating lines completely.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={isLoggedIn ? "/pos" : "/auth/signup"}
                className="h-12 px-7 flex items-center justify-center rounded-full bg-[#0E59F9] text-white text-[15px] font-semibold hover:bg-[#0C4CD6] transition-all shadow-md shadow-blue-500/20 hover:shadow-lg w-full sm:w-auto gap-2"
              >
                <span>{isLoggedIn ? "Open POS Register" : "Get Started Free"}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="h-12 px-7 flex items-center justify-center rounded-full bg-white border border-slate-200 text-[15px] font-semibold text-slate-800 hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto gap-2"
              >
                <PlayCircle className="w-4 h-4 text-slate-600" />
                Explore Features
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            {/* Negative margin bottom pulls the section's bottom edge up, effectively clipping the image via overflow-hidden */}
            <div className="mt-16 md:mt-24 -mb-16 md:-mb-32">
              <HeroImageStack />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="relative z-20 py-12 md:py-16 border-b border-black/[0.04] bg-white shadow-[0_-50px_50px_rgba(14,89,249,0.15)] overflow-hidden">
        <div className="mx-auto max-w-[1200px] text-center">
          <p className="text-[14px] font-medium text-[#666] mb-4">Supported & Integrated With:</p>

          <div
            className="flex overflow-hidden relative w-full pt-6 pb-4 group"
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
          >
            <div className="flex shrink-0 animate-marquee items-center justify-around gap-16 min-w-full pr-16 group-hover:[animation-play-state:paused]">
              {logos.map((logo, i) => (
                <img
                  key={`logo1-${i}`}
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 md:h-12 w-auto object-contain brightness-0 opacity-40 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                />
              ))}
            </div>
            <div className="flex shrink-0 animate-marquee items-center justify-around gap-16 min-w-full pr-16 group-hover:[animation-play-state:paused]" aria-hidden="true">
              {logos.map((logo, i) => (
                <img
                  key={`logo2-${i}`}
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 md:h-12 w-auto object-contain brightness-0 opacity-40 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (Authentic High-Fidelity Workspace Showcase) */}
      <section className="py-24 md:py-32 px-6 bg-slate-50/50 border-y border-slate-200/70" id="features">
        <div className="mx-auto max-w-[1200px]">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0E59F9] mb-3 block">
                Integrated POS & Table Ordering
              </span>
              <h2 className="text-[clamp(32px,4.5vw,48px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-slate-900">
                Modern Table Self-Ordering.<br />
                <span className="text-[#0E59F9]">Fast Cashier, Automated Kitchen.</span>
              </h2>
              <p className="text-base md:text-lg text-slate-600 mt-4 leading-relaxed">
                Guests self-order and pay from their seats via QRIS, cashiers process counter orders with rapid receipt printing, and all branches stay synced in real time.
              </p>
            </div>
          </FadeIn>

          {/* Main Interactive Software Frame */}
          <FadeIn delay={0.15}>
            <InteractivePOSShowcase />
          </FadeIn>

          {/* 3 High-Impact Value Pillars */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FadeIn delay={0.2} className="h-full">
              <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0E59F9] flex items-center justify-center mb-4">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Table QR Self-Ordering</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Guests sit at their table, scan the QR sticker with their phone camera without downloading any app, customize menu items, and checkout via QRIS. Reduces register lines by up to 80%.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Browser-Based (No App)</span>
                  <span className="text-emerald-600 font-bold">Instant QRIS Sync</span>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} className="h-full">
              <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">POS Register & Live Reports</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    For walk-in and take-away counter orders. Search products effortlessly, print 58/80mm thermal receipts, and every transaction syncs automatically to sales and inventory analytics.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>58/80mm Thermal Receipt</span>
                  <span className="text-emerald-600 font-bold">Real-Time Reporting</span>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.4} className="h-full">
              <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Shift Cash Audit & Multi-Branch</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Enforce opening float entry and track petty cash expenses. At shift closing, the system automatically matches counted physical cash with system totals to ensure zero cash variance.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Multi-Tenant PostgreSQL</span>
                  <span className="text-[#0E59F9] font-bold">Variance: Rp 0</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FEATURE LIST (Side by side) */}
      <section className="py-24 md:py-32 px-6">
        <div className="mx-auto max-w-[1200px] flex flex-col lg:flex-row items-center gap-16">
          <FadeIn className="w-full lg:w-1/2">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/[0.04] bg-[#F8F9FA] aspect-square max-h-[600px] flex items-center justify-center">
              <Image src="/img/hero/img2.png" alt="Feature showcase" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-left" />
            </div>
          </FadeIn>

          <div className="w-full lg:w-1/2">
            <FadeIn delay={0.1}>
              <h2 className="text-[clamp(30px,4vw,40px)] font-bold leading-[1.15] tracking-[-0.02em] text-[#111] mb-4">
                Built to Scale <br /> <span className="text-[#0E59F9]">Your F&B Business</span>
              </h2>
              <p className="text-[16px] text-[#666] mb-10 leading-relaxed">
                Discover how MENUIN helps you streamline operations, eliminate order delays, and maximize profitability across single and multi-branch operations.
              </p>
            </FadeIn>

            <div className="space-y-8">
              {features.map((f, i) => {
                const IconComp = f.icon;
                return (
                  <FadeIn key={i} delay={0.15 + (i * 0.1)}>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[#0E59F9]">
                        <IconComp className="w-5 h-5 text-[#0E59F9]" />
                      </div>
                      <div>
                        <h4 className="text-[18px] font-bold text-[#111] mb-2">{f.title}</h4>
                        <p className="text-[15px] text-[#666] leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* WRAPPER FOR TESTIMONIAL & PRICING */}
      <div className="relative overflow-hidden bg-[#FAFAFA]">

        {/* BACKGROUND DIVIDER SVG */}
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 w-[1922px] pointer-events-none z-20 flex justify-center">
          <img src="/divider/divider.svg" alt="Divider Background" className="w-full h-auto" />
        </div>

        {/* TESTIMONIALS REVEAL */}
        <section
          ref={marqueeContainerRef}
          id="testimonials"
          className="relative pt-10 md:pt-14 pb-24 md:pb-32 z-10"
        >
          {/* HEADER */}
          <div className="relative z-[60] mx-auto mb-6 max-w-[1200px] px-6 text-center md:mb-8">
            <h2 className="text-[clamp(44px,7.2vw,78px)] font-extrabold leading-[0.96] tracking-[-0.04em] text-[#111]">
              What they said <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0E59F9] via-[#2563EB] to-[#0941B8]">
                about us.
              </span>
            </h2>
          </div>

          {/* TESTIMONIAL CANVAS */}
          <div className="relative h-[760px] w-full">

            {/* ========================================= */}
            {/* TESTIMONIAL MARQUEE */}
            {/* ========================================= */}

            {/* TOP ROW */}
            <div className="row-top absolute left-0 top-[170px] z-10 w-full">
              <div className="relative flex h-[120px] w-full">

                {/* SKELETON */}
                <div className="absolute inset-0 z-10 flex">
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel1-t-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel2-t-${i}`} />
                    ))}
                  </div>
                </div>

                {/* REAL TESTIMONIAL */}
                <div
                  className="absolute inset-0 z-20 flex"
                  style={{
                    clipPath: "inset(-200px 0 -200px 50%)",
                  }}
                >
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <RealCard
                        key={`real1-t-${i}`}
                        data={t}
                      />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <RealCard
                        key={`real2-t-${i}`}
                        data={t}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW */}
            <div className="row-middle absolute left-0 top-[315px] z-10 w-full">
              <div className="relative flex h-[120px] w-full">

                {/* SKELETON */}
                <div className="absolute inset-0 z-10 flex">
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <SkeletonCard key={`skel1-m-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <SkeletonCard key={`skel2-m-${i}`} />
                    ))}
                  </div>
                </div>

                {/* REAL */}
                <div
                  className="absolute inset-0 z-20 flex"
                  style={{
                    clipPath: "inset(-200px 0 -200px 50%)",
                  }}
                >
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <RealCard
                        key={`real1-m-${i}`}
                        data={t}
                      />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <RealCard
                        key={`real2-m-${i}`}
                        data={t}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="row-bottom absolute left-0 top-[460px] z-10 w-full">
              <div className="relative flex h-[120px] w-full">

                {/* SKELETON */}
                <div className="absolute inset-0 z-10 flex">
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel1-b-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel2-b-${i}`} />
                    ))}
                  </div>
                </div>

                {/* REAL */}
                <div
                  className="absolute inset-0 z-20 flex"
                  style={{
                    clipPath: "inset(-200px 0 -200px 50%)",
                  }}
                >
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <RealCard
                        key={`real1-b-${i}`}
                        data={t}
                      />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <RealCard
                        key={`real2-b-${i}`}
                        data={t}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================= */}
            {/* EDGE FADE */}
            {/* ========================================= */}

            <div
              className="
        pointer-events-none
        absolute
        inset-y-0
        left-0
        z-[55]
        w-[18%]
        bg-gradient-to-r
        from-[#FAFAFA]
        via-[#FAFAFA]/80
        to-transparent
      "
            />

            <div
              className="
        pointer-events-none
        absolute
        inset-y-0
        right-0
        z-[55]
        w-[18%]
        bg-gradient-to-l
        from-[#FAFAFA]
        via-[#FAFAFA]/80
        to-transparent
      "
            />
          </div>
        </section>

        {/* PRICING (Side-by-Side Editorial Layout inside wrapper with SVG Background) */}
        <section className="relative z-30 pt-36 md:pt-52 pb-28 md:pb-36 px-6 sm:px-10 lg:px-14 mt-16 md:mt-24" id="pricing">
          <div className="mx-auto max-w-[1240px] relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

              {/* Column 1: Left Editorial Typographic Header */}
              <FadeIn className="lg:col-span-4 pr-0 lg:pr-4 pt-3">
                <div className="space-y-1">
                  <h2 className="text-[clamp(32px,3.8vw,46px)] font-black leading-[1.08] tracking-[-0.04em] text-slate-900">
                    Monthly Renewal,
                  </h2>
                  <h2 className="text-[clamp(32px,3.8vw,46px)] font-black leading-[1.08] tracking-[-0.04em] text-[#0E59F9]">
                    No Fixed Term Contracts
                  </h2>
                </div>

                <p className="text-slate-500 text-sm sm:text-[14.5px] mt-6 leading-relaxed">
                  Flexible monthly subscription without long-term commitments. Digitize orders, cashier POS, tables, kitchen display, and stock in one unified platform.
                </p>

                <div className="mt-8 flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0E59F9]" />
                  <span>Instant Activation & Free Setup Support</span>
                </div>
              </FadeIn>

              {/* Column 2 & 3: Pro & Custom White Cards */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">

                {/* Pro Card */}
                <FadeIn delay={0.1}>
                  <div className="flex flex-col justify-between p-7 sm:p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all h-full">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Pro
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2 mb-6">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                          Rp199k
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-400">
                          /mo
                        </span>
                      </div>

                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {[
                          "Fast Cloud POS & Receipt Printing",
                          "Unlimited QR Code Table Self-Ordering",
                          "Automated Dynamic QRIS Payment",
                          "Kitchen Display System (KDS Dapur)",
                          "Multi-Staff & Role-Based Access Control",
                          "Live Inventory & Low Stock Alerts",
                          "Real-Time Sales, Shift & Profit Reports",
                          "Bluetooth & LAN Cashier Printer Integration",
                          "Real-Time Excel & PDF Data Export",
                        ].map((feat, idx) => (
                          <div key={idx} className="py-2.5 text-[12.5px] sm:text-[13px] font-medium text-slate-700 leading-snug">
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-4">
                      <a
                        href="/auth/signup?plan=pro"
                        className="inline-flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0E59F9] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                          Inquire Now
                        </span>
                      </a>
                    </div>
                  </div>
                </FadeIn>

                {/* Custom Card */}
                <FadeIn delay={0.2}>
                  <div className="flex flex-col justify-between p-7 sm:p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all h-full">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Custom
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2 mb-6">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                          Custom
                        </span>
                      </div>

                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {[
                          "Unlimited Outlets & Multi-Branch Network",
                          "Everything in Pro Plan Included",
                          "Custom Domain & White-Label Branding",
                          "Full API & External ERP Integrations",
                          "Dedicated Account Manager & Onboarding",
                          "24/7 Priority Support (99.9% SLA)",
                          "Custom Hardware Setup & Staff Training",
                          "Custom Feature Development on Demand",
                          "Full Historical Data & Menu Migration",
                        ].map((feat, idx) => (
                          <div key={idx} className="py-2.5 text-[12.5px] sm:text-[13px] font-medium text-slate-700 leading-snug">
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-4">
                      <a
                        href="https://wa.me/628123456789?text=Halo%20MENUIN,%20saya%20tertarik%20dengan%20Custom%20Enterprise%20Plan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0E59F9] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                          Inquire Now
                        </span>
                      </a>
                    </div>
                  </div>
                </FadeIn>

              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* EDGE FADE FOR PRICING                     */}
          {/* ========================================= */}
          <div
            className="
            hidden md:block
            pointer-events-none
            absolute
            inset-y-0
            left-0
            z-[40]
            w-[18%]
            bg-gradient-to-r
            from-[#FAFAFA]
            via-[#FAFAFA]/80
            to-transparent
          "
          />
          <div
            className="
            hidden md:block
            pointer-events-none
            absolute
            inset-y-0
            right-0
            z-[40]
            w-[18%]
            bg-gradient-to-l
            from-[#FAFAFA]
            via-[#FAFAFA]/80
            to-transparent
          "
          />
        </section>
      </div>

      {/* FAQ EDITORIAL (SPLIT 2-COLUMN LAYOUT) */}
      <FaqEditorial />

      {/* READY TO BEGIN CTA BANNER */}
      <FooterReadyToBegin />

      {/* SUPERFLUID-INSPIRED BRUTALIST BRAND FOOTER */}
      <FooterSuperfluidStyle />

    </div>
  );
}

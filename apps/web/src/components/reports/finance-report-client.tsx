"use client";

import * as React from "react";
import {
	Wallet,
	ArrowDownLeft,
	ArrowUpRight,
	ArrowDownRight,
	TrendingUp,
	TrendingDown,
	Plus,
	Trash2,
	Receipt,
	AlertCircle,
	Coins,
	ShieldCheck,
	Landmark,
	CheckCircle2,
	Calendar as CalendarIcon,
	RefreshCw,
	Printer,
	FileSpreadsheet,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Eye,
	EyeOff,
	Check,
	User,
	SlidersHorizontal,
	ArrowRight,
	Clock,
	CreditCard,
	MoreHorizontal,
	Bell,
	Share2,
	Download,
	Filter,
	DollarSign,
	Send,
	ArrowUpRight as ArrowUpRightIcon,
	CheckCircle,
	UtensilsCrossed,
	Package,
	Zap,
	Users,
	Wrench,
	Megaphone,
	Layers,
	Target,
	Search,
	MoreVertical,
	PackageSearch,
	X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableHeader,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { DateRange } from "react-day-picker";
import { format, subMonths, addMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
	getFinanceReport,
	createExpenseAction,
	createIncomeAction,
	createCashInAction,
	deleteExpenseAction,
	deleteIncomeAction,
	saveCategoryBudgetsAction,
	ReportPeriod,
} from "@/lib/actions/reports";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { formatPaymentMethodLabel } from "@/lib/utils/format";

type FinanceReportData = NonNullable<
	Awaited<ReturnType<typeof getFinanceReport>>["data"]
>;

interface FinanceReportClientProps {
	initialData: FinanceReportData;
	outletKey: string;
}

const EXPENSE_CATEGORIES = [
	{ id: "BAHAN_BAKU", label: "Bahan Baku & Dapur" },
	{ id: "PACKAGING", label: "Kemasan & Plastik" },
	{ id: "OPERASIONAL", label: "Listrik, Air & Gas" },
	{ id: "GAJI", label: "Upah & Gaji Karyawan" },
	{ id: "PEMELIHARAAN", label: "Pemeliharaan & Alat" },
	{ id: "MARKETING", label: "Promosi & Iklan" },
	{ id: "LAINNYA", label: "Biaya Lain-lain" },
];

const EXPENSE_CATEGORY_META: Record<
	string,
	{
		label: string;
		short: string;
		desc: string;
		icon: React.ElementType;
		color: string;
		bg: string;
		border: string;
	}
> = {
	BAHAN_BAKU: {
		label: "Bahan Baku & Dapur",
		short: "Bahan Baku",
		desc: "Bumbu, kopi, susu, sayuran & daging",
		icon: UtensilsCrossed,
		color: "text-amber-600",
		bg: "bg-amber-50",
		border: "border-amber-200",
	},
	PACKAGING: {
		label: "Kemasan & Plastik",
		short: "Kemasan",
		desc: "Cup, sedotan, paper bag, kemasan",
		icon: Package,
		color: "text-sky-600",
		bg: "bg-sky-50",
		border: "border-sky-200",
	},
	OPERASIONAL: {
		label: "Listrik, Air & Gas",
		short: "Operasional",
		desc: "Tagihan utilitas & operasional outlet",
		icon: Zap,
		color: "text-amber-700",
		bg: "bg-yellow-50",
		border: "border-yellow-200",
	},
	GAJI: {
		label: "Upah & Gaji Karyawan",
		short: "Gaji & Upah",
		desc: "Gaji barista, staf, koki, kasir & makan",
		icon: Users,
		color: "text-purple-600",
		bg: "bg-purple-50",
		border: "border-purple-200",
	},
	PEMELIHARAAN: {
		label: "Pemeliharaan & Alat",
		short: "Pemeliharaan",
		desc: "Servis mesin, perbaikan fasilitas toko",
		icon: Wrench,
		color: "text-slate-600",
		bg: "bg-slate-100",
		border: "border-slate-200",
	},
	MARKETING: {
		label: "Promosi & Iklan",
		short: "Marketing",
		desc: "Instagram ads, promo, cetak spanduk",
		icon: Megaphone,
		color: "text-rose-600",
		bg: "bg-rose-50",
		border: "border-rose-200",
	},
	LAINNYA: {
		label: "Biaya Lain-lain",
		short: "Lainnya",
		desc: "Pengeluaran kas kecil non-rutin",
		icon: Layers,
		color: "text-[#0e59f9]",
		bg: "bg-blue-50",
		border: "border-blue-200",
	},
};

const INCOME_CATEGORIES = [
	{ id: "PENJUALAN", label: "Penjualan" },
	{ id: "MODAL", label: "Setoran Modal" },
	{ id: "LAINNYA", label: "Pemasukan Lainnya" },
];

export interface UnifiedCashFlowItem {
	id: string;
	type: "EXPENSE" | "INCOME";
	category: string;
	amount: string | number;
	paymentMethod: string;
	description: string;
	date: string | Date;
}

function getCategoryLabel(cat: string): string {
	const foundExp = EXPENSE_CATEGORIES.find((c) => c.id === cat);
	if (foundExp) return foundExp.label;
	const foundInc = INCOME_CATEGORIES.find((c) => c.id === cat);
	if (foundInc) return foundInc.label;
	if (cat === "PENJUALAN") return "Penjualan POS";
	if (cat === "MODAL") return "Setoran Modal";
	return cat;
}

function formatTrxDate(d: string | Date): string {
	try {
		const parsed = new Date(d);
		if (isNaN(parsed.getTime())) return String(d);
		return format(parsed, "d MMM yyyy", { locale: localeId });
	} catch {
		return String(d);
	}
}

function formatTrxTime(d: string | Date): string {
	try {
		const parsed = new Date(d);
		if (isNaN(parsed.getTime())) return "";
		if (typeof d === "string" && !d.includes("T") && !d.includes(":")) {
			return "";
		}
		return `${format(parsed, "HH:mm")} WIB`;
	} catch {
		return "";
	}
}

const CASH_FLOW_FILTER_CATEGORIES = [
	{ id: "ALL", label: "Semua Kategori" },
	{ id: "PENJUALAN", label: "Penjualan POS" },
	{ id: "MODAL", label: "Setoran Modal" },
	{ id: "BAHAN_BAKU", label: "Bahan Baku & Dapur" },
	{ id: "PACKAGING", label: "Kemasan & Plastik" },
	{ id: "OPERASIONAL", label: "Operasional Listrik/Air" },
	{ id: "GAJI", label: "Gaji & Upah" },
	{ id: "PEMELIHARAAN", label: "Pemeliharaan & Alat" },
	{ id: "MARKETING", label: "Promosi & Iklan" },
	{ id: "LAINNYA", label: "Lain-lain" },
];

const CASH_FLOW_PAYMENT_METHODS = [
	{ id: "ALL", label: "Semua Metode" },
	{ id: "TUNAI", label: "Kasir Tunai" },
	{ id: "QRIS", label: "QRIS" },
	{ id: "TRANSFER", label: "Transfer Bank" },
	{ id: "DEBIT", label: "Kartu Debit" },
	{ id: "KREDIT", label: "Kartu Kredit" },
];

const EXPENSE_GROUPS = [
	{
		id: "BAHAN_KEMASAN",
		name: "Bahan Baku & Kemasan",
		shortName: "Bahan & Kemasan",
		description: "Bahan baku dapur, biji kopi, susu & packaging",
		categoryIds: ["BAHAN_BAKU", "PACKAGING"],
		color: {
			cap: "bg-[#0f172a]",
			bar: "bg-[#0f172a] hover:bg-[#1e293b]",
			hex: "#0f172a",
		},
	},
	{
		id: "OPERASIONAL_TOKO",
		name: "Operasional & Utilitas",
		shortName: "Operasional",
		description: "Listrik, air, gas & pemeliharaan outlet",
		categoryIds: ["OPERASIONAL", "PEMELIHARAAN"],
		color: {
			cap: "bg-[#2563eb]",
			bar: "bg-[#2563eb] hover:bg-[#1d4ed8]",
			hex: "#2563eb",
		},
	},
	{
		id: "GAJI_KARYAWAN",
		name: "Upah & Gaji Karyawan",
		shortName: "Gaji & Staf",
		description: "Gaji barista, kasir, staf operasional & tunjangan",
		categoryIds: ["GAJI"],
		color: {
			cap: "bg-[#0284c7]",
			bar: "bg-[#0284c7] hover:bg-[#0369a1]",
			hex: "#0284c7",
		},
	},
	{
		id: "MARKETING_LAIN",
		name: "Pemasaran & Lain-lain",
		shortName: "Promo & Lainnya",
		description: "Iklan medsos, promo, cetak & kas kecil lain-lain",
		categoryIds: ["MARKETING", "LAINNYA"],
		color: {
			cap: "bg-[#38bdf8]",
			bar: "bg-[#38bdf8] hover:bg-[#0ea5e9]",
			hex: "#38bdf8",
		},
	},
];

const INCOME_GROUPS = [
	{
		id: "PENJUALAN_KASIR",
		name: "Penjualan Kasir (POS)",
		shortName: "Penjualan POS",
		description: "Pendapatan pesanan kasir, dine-in & takeaway",
		categoryIds: ["PENJUALAN"],
		color: {
			cap: "bg-[#0f172a]",
			bar: "bg-[#0f172a] hover:bg-[#1e293b]",
			hex: "#0f172a",
		},
	},
	{
		id: "SETORAN_MODAL",
		name: "Setoran Modal Pemilik",
		shortName: "Setoran Modal",
		description: "Suntikan modal operasional & ekspansi outlet",
		categoryIds: ["MODAL"],
		color: {
			cap: "bg-[#0e59f9]",
			bar: "bg-[#0e59f9] hover:bg-[#0b48cb]",
			hex: "#0e59f9",
		},
	},
	{
		id: "PEMASUKAN_LAINNYA",
		name: "Pemasukan Lain-lain",
		shortName: "Pemasukan Lain",
		description: "Pendapatan kas lain di luar penjualan utama",
		categoryIds: ["LAINNYA"],
		color: {
			cap: "bg-[#38bdf8]",
			bar: "bg-[#38bdf8] hover:bg-[#0ea5e9]",
			hex: "#38bdf8",
		},
	},
];

// Warna pilar bar chart berurutan berdasarkan peringkat persentase:
// Paling kiri (persentase tertinggi) = Hitam, lalu gradasi Biru, dan paling ujung kanan = Biru paling muda
const PILLAR_RANK_COLORS_4 = [
	{
		cap: "bg-[#0f172a]",
		bar: "bg-[#0f172a] hover:bg-[#1e293b]",
		hex: "#0f172a",
	},
	{
		cap: "bg-[#2563eb]",
		bar: "bg-[#2563eb] hover:bg-[#1d4ed8]",
		hex: "#2563eb",
	},
	{
		cap: "bg-[#0284c7]",
		bar: "bg-[#0284c7] hover:bg-[#0369a1]",
		hex: "#0284c7",
	},
	{
		cap: "bg-[#38bdf8]",
		bar: "bg-[#38bdf8] hover:bg-[#0ea5e9]",
		hex: "#38bdf8",
	},
];

const PILLAR_RANK_COLORS_3 = [
	{
		cap: "bg-[#0f172a]",
		bar: "bg-[#0f172a] hover:bg-[#1e293b]",
		hex: "#0f172a",
	},
	{
		cap: "bg-[#0e59f9]",
		bar: "bg-[#0e59f9] hover:bg-[#0b48cb]",
		hex: "#0e59f9",
	},
	{
		cap: "bg-[#38bdf8]",
		bar: "bg-[#38bdf8] hover:bg-[#0ea5e9]",
		hex: "#38bdf8",
	},
];

// ==========================================
// NUMBER & CURRENCY FORMATTERS (NO DECIMALS)
// ==========================================

function formatRupiah(val: number | string | undefined | null): string {
	const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
	return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
}

function formatNumber(val: number | string | undefined | null): string {
	const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
	return Math.round(num).toLocaleString("id-ID");
}

function formatCompactRupiah(val: number | string | undefined | null): string {
	const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
	if (!num || num === 0) return "Rp 0";
	const abs = Math.abs(num);

	if (abs >= 1_000_000_000) {
		const m = num / 1_000_000_000;
		return `Rp ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(".", ",")}M`;
	}
	if (abs >= 1_000_000) {
		const jt = num / 1_000_000;
		return `Rp ${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1).replace(".", ",")}jt`;
	}
	if (abs >= 1_000) {
		const rb = num / 1_000;
		return `Rp ${rb % 1 === 0 ? rb.toFixed(0) : rb.toFixed(1).replace(".", ",")}rb`;
	}
	return `Rp ${Math.round(num)}`;
}

function formatCompactCurrency(
	val: number | string | undefined | null,
): string {
	const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
	if (!num || num === 0) return "0";
	const abs = Math.abs(num);

	if (abs >= 1_000_000_000) {
		const m = num / 1_000_000_000;
		const str = m.toFixed(1).replace(".", ",");
		return `${str.endsWith(",0") ? str.slice(0, -2) : str} M`;
	}
	if (abs >= 1_000_000) {
		const jt = num / 1_000_000;
		const str = jt.toFixed(1).replace(".", ",");
		return `${str.endsWith(",0") ? str.slice(0, -2) : str} Jt`;
	}
	if (abs >= 1_000) {
		const rb = num / 1_000;
		const str = rb.toFixed(1).replace(".", ",");
		return `${str.endsWith(",0") ? str.slice(0, -2) : str} rb`;
	}
	return Math.round(num).toLocaleString("id-ID");
}

function formatKpiCurrency(val: number | string | undefined | null): string {
	const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
	const abs = Math.abs(num);
	if (abs >= 1_000_000) {
		return `Rp ${formatCompactCurrency(num)}`;
	}
	return formatRupiah(num);
}

// ==========================================
// SVG VISUAL HELPERS (CATMULL-ROM SPLINE)
// ==========================================

function getCubicSplinePath(pts: { x: number; y: number }[]): string {
	if (pts.length < 2) return "";
	let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(i - 1, 0)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(i + 2, pts.length - 1)];

		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;

		d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
	}
	return d;
}

/**
 * Dynamic Trendline Sparkline for Top KPI Cards (with IntersectionObserver)
 */
function MiniSparkline({
	percentage,
	isPositive,
	metricSeed = 1,
	color,
	data,
	width = 86,
	height = 44,
	strokeWidth = 2,
	areaOpacity = 0.22,
}: {
	percentage?: number;
	isPositive?: boolean;
	metricSeed?: number;
	color?: string;
	data?: number[];
	width?: number;
	height?: number;
	strokeWidth?: number;
	areaOpacity?: number;
}) {
	const svgRef = React.useRef<SVGSVGElement>(null);
	const [isInView, setIsInView] = React.useState(false);
	const [isAnimated, setIsAnimated] = React.useState(false);

	React.useEffect(() => {
		const el = svgRef.current;
		if (!el || typeof IntersectionObserver === "undefined") {
			setIsInView(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsInView(true);
					observer.unobserve(el);
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	React.useEffect(() => {
		if (!isInView) {
			setIsAnimated(false);
			return;
		}
		setIsAnimated(false);
		const timer = setTimeout(
			() => {
				setIsAnimated(true);
			},
			40 + metricSeed * 25,
		);
		return () => clearTimeout(timer);
	}, [isInView, percentage, data, metricSeed]);

	const padX = 2;
	const midY = height / 2;

	const gradId = React.useId().replace(/:/g, "_");
	const positive =
		isPositive !== undefined
			? isPositive
			: data && data.length >= 2
				? data[data.length - 1] >= data[0]
				: (percentage ?? 0) >= 0;
	const strokeColor = color || (positive ? "#10b981" : "#f43f5e");

	const { lineD, areaD, lastPoint } = React.useMemo(() => {
		const pts: { x: number; y: number }[] = [];

		// Prioritize REAL DATA when provided
		if (data && data.length >= 2) {
			const dataMin = Math.min(...data);
			const dataMax = Math.max(...data);
			const min = dataMin;
			const max = Math.max(dataMax, min + 1);
			const range = max - min || 1;

			data.forEach((val, idx) => {
				const x = padX + (idx / (data.length - 1)) * (width - 2 * padX);
				const clampedVal = Math.max(min, Math.min(max, val));
				const y = height - 6 - ((clampedVal - min) / range) * (height - 12);
				pts.push({ x, y });
			});
		} else {
			const numPoints = 24;
			const absP = Math.abs(percentage ?? 15);
			const isUp = (percentage ?? 15) >= 0;
			const ratio = Math.min(absP / 50, 1.0);
			const maxClimb = height * 0.45;
			const actualClimb = ratio * maxClimb;

			const yStart = isUp
				? midY + actualClimb * 0.45
				: midY - actualClimb * 0.45;
			const yEnd = isUp ? midY - actualClimb * 0.55 : midY + actualClimb * 0.55;
			const phase = (metricSeed * 0.43) % 1;

			for (let i = 0; i < numPoints; i++) {
				const t = i / (numPoints - 1);
				const x = padX + t * (width - 2 * padX);
				const linearY = yStart + (yEnd - yStart) * t;

				const oct1 = Math.sin((t * 4.3 + phase * 2.1) * Math.PI * 2) * 2.0;
				const oct2 = Math.cos((t * 8.7 + phase * 4.3) * Math.PI * 2) * 1.2;
				const drift = Math.sin((t * 2.1 + phase) * Math.PI * 2) * 0.8;
				const wave = (oct1 + oct2 + drift) * Math.sin(t * Math.PI);

				const y = Math.max(2.0, Math.min(height - 2.5, linearY + wave));
				pts.push({ x, y });
			}
		}

		if (pts.length < 2) return { lineD: "", areaD: "", lastPoint: null };

		const splineD = getCubicSplinePath(pts);
		const first = pts[0];
		const last = pts[pts.length - 1];
		const fillD = `${splineD} L ${last.x.toFixed(1)},${height} L ${first.x.toFixed(1)},${height} Z`;

		return { lineD: splineD, areaD: fillD, lastPoint: last };
	}, [percentage, data, metricSeed, width, height, midY, padX]);

	if (!lineD) return null;

	return (
		<svg
			ref={svgRef}
			width={width}
			height={height}
			className="overflow-visible flex-shrink-0"
		>
			<defs>
				<linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={strokeColor} stopOpacity={areaOpacity} />
					<stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
				</linearGradient>
			</defs>
			<path
				d={areaD}
				fill={`url(#${gradId})`}
				style={{
					opacity: isAnimated ? 1 : 0,
					transition: "opacity 800ms cubic-bezier(0.23, 1, 0.32, 1)",
				}}
			/>
			<path
				d={lineD}
				fill="none"
				stroke={strokeColor}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
				pathLength={100}
				strokeDasharray={100}
				strokeDashoffset={isAnimated ? 0 : 100}
				style={{
					transition: "stroke-dashoffset 850ms cubic-bezier(0.23, 1, 0.32, 1)",
				}}
			/>
			{lastPoint && (
				<circle
					cx={lastPoint.x}
					cy={lastPoint.y}
					r="3"
					fill={strokeColor}
					style={{
						opacity: isAnimated ? 1 : 0,
						transform: isAnimated ? "scale(1)" : "scale(0)",
						transformOrigin: `${lastPoint.x}px ${lastPoint.y}px`,
						transition: "all 350ms cubic-bezier(0.34, 1.56, 0.64, 1) 600ms",
					}}
				/>
			)}
		</svg>
	);
}

/**
 * Horizontal Capsule Segmented Bar for Financial Categories (Inflows / Outflows)
 * Features modular capsule pills with gaps, monochromatic blue ramp, and interactive hover.
 */
interface FinanceCategorySegment {
	id: string;
	label: string;
	amount: number;
	percentage: number;
	colorBg: string;
	hex: string;
}

type ExpenseCategorySegment = FinanceCategorySegment;

function FinanceCategoryHorizontalBar({
	title = "Kategori Biaya",
	segments,
	totalAmount = 0,
	emptyText = "Belum ada rincian",
}: {
	title?: string;
	segments: FinanceCategorySegment[];
	totalAmount?: number;
	emptyText?: string;
}) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const [isInView, setIsInView] = React.useState(false);
	const [hoveredSegment, setHoveredSegment] =
		React.useState<FinanceCategorySegment | null>(null);

	React.useEffect(() => {
		const el = containerRef.current;
		if (!el || typeof IntersectionObserver === "undefined") {
			setIsInView(true);
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsInView(true);
					observer.unobserve(el);
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	if (
		!segments ||
		segments.length === 0 ||
		(totalAmount !== undefined && totalAmount === 0)
	) {
		return (
			<div className="space-y-1.5 w-full">
				{/* Top Header Row: Label & 0% */}
				<div className="flex items-center justify-between text-[11px] leading-tight">
					<span className="text-slate-400 font-normal">{title}</span>
					<span className="text-slate-900 font-semibold transition-colors duration-150">
						0%
					</span>
				</div>

				{/* Gray Horizontal Bar: Sleek height h-2 */}
				<div className="w-full h-2 rounded-full bg-slate-200" />

				{/* Detail Sub-line: dot + '-' and 'Rp 0' */}
				<div className="flex items-center justify-between text-[11px] min-h-[15px]">
					<span className="font-normal text-slate-400 flex items-center gap-1.5 truncate">
						<span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
						<span className="truncate">-</span>
					</span>
					<span className="font-semibold text-slate-400 flex-shrink-0 ml-1.5 text-[11px]">
						Rp 0
					</span>
				</div>
			</div>
		);
	}

	const topSegment = segments[0];
	const activeSegment = hoveredSegment ?? topSegment;

	return (
		<div ref={containerRef} className="space-y-1.5 w-full">
			{/* Top Header Row: Label & Active Percentage (Identical layout idle & hover; defaults to largest) */}
			<div className="flex items-center justify-between text-[11px] leading-tight">
				<span className="text-slate-400 font-normal">{title}</span>
				<span className="text-slate-900 font-semibold transition-colors duration-150">
					{activeSegment ? `${activeSegment.percentage.toFixed(0)}%` : "0%"}
				</span>
			</div>

			{/* Segmented Capsule Bar: Sleek height h-2, tighter gap-1, NO scaling, NO height increase, NO border/ring */}
			<div
				onMouseLeave={() => setHoveredSegment(null)}
				className="flex items-center gap-1 w-full h-2"
			>
				{segments.map((seg) => {
					const isHovered = hoveredSegment?.id === seg.id;
					return (
						<div
							key={seg.id}
							onMouseEnter={() => setHoveredSegment(seg)}
							style={{
								backgroundColor: seg.hex,
								flex: isInView
									? `${Math.max(seg.percentage, 4)} ${Math.max(seg.percentage, 4)} 0%`
									: "0 0 0%",
								minWidth: isInView ? "8px" : "0px",
							}}
							className={cn(
								"h-full rounded-full transition-all duration-150 cursor-pointer",
								isHovered
									? "opacity-100 brightness-110"
									: hoveredSegment
										? "opacity-40"
										: "opacity-100 hover:brightness-105",
							)}
						/>
					);
				})}
			</div>

			{/* Detail Sub-line: Identical layout idle & hover; defaults to largest category, seamlessly changes on hover */}
			<div className="flex items-center justify-between text-[11px] min-h-[15px]">
				{activeSegment ? (
					<>
						<span className="font-normal text-slate-600 flex items-center gap-1.5 truncate">
							<span
								className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-150"
								style={{ backgroundColor: activeSegment.hex }}
							/>
							<span className="truncate">{activeSegment.label}</span>
						</span>
						<span className="font-semibold text-slate-900 flex-shrink-0 ml-1.5 text-[11px] transition-all duration-150">
							{formatCompactRupiah(activeSegment.amount)}
						</span>
					</>
				) : (
					<span className="text-[10px] text-slate-400 font-normal">
						{emptyText}
					</span>
				)}
			</div>
		</div>
	);
}

const ExpenseCategoryHorizontalBar = FinanceCategoryHorizontalBar;

// ==========================================
// MAIN CLIENT COMPONENT
// ==========================================

export function FinanceReportClient({
	initialData,
	outletKey,
}: FinanceReportClientProps) {
	const [data, setData] = React.useState<FinanceReportData>(initialData);
	const [isLoading, setIsLoading] = React.useState(false);

	// Tab mode state: "harian" | "bulanan" | "tahunan"
	const [currentTab, setCurrentTab] = React.useState<
		"harian" | "bulanan" | "tahunan"
	>("bulanan");
	const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
	const [customRange, setCustomRange] = React.useState<DateRange | undefined>(
		undefined,
	);
	const [tempRange, setTempRange] = React.useState<DateRange | undefined>(
		undefined,
	);

	// Recent transactions search/filter
	const [transactionTypeFilter, setTransactionTypeFilter] = React.useState<
		"ALL" | "EXPENSE" | "INCOME"
	>("ALL");
	const [searchQuery, setSearchQuery] = React.useState("");
	const [categoryFilter, setCategoryFilter] = React.useState("ALL");
	const [paymentMethodFilter, setPaymentMethodFilter] = React.useState("ALL");
	const [sortBy, setSortBy] = React.useState<
		"newest" | "oldest" | "amount_high" | "amount_low"
	>("newest");
	const [currentPage, setCurrentPage] = React.useState(1);
	const [itemsPerPage, setItemsPerPage] = React.useState(10);
	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = React.useState(false);
	const [selectedDetailTransaction, setSelectedDetailTransaction] =
		React.useState<UnifiedCashFlowItem | null>(null);

	// Shift reconciliation audit collapse toggle
	const [isShiftAuditExpanded, setIsShiftAuditExpanded] = React.useState(true);

	const now = React.useMemo(() => new Date(), []);
	const todayDateStr = React.useMemo(() => format(now, "yyyy-MM-dd"), [now]);
	const [monthParam, setMonthParam] = React.useState<string>(
		format(now, "yyyy-MM"),
	);
	const [yearParam, setYearParam] = React.useState<string>(
		String(now.getFullYear()),
	);

	// Interactive hover states for Cash Flow Bar Chart
	const [chartHoveredIndex, setChartHoveredIndex] = React.useState<
		number | null
	>(null);

	// Hero chart viewport entrance observer
	const heroChartRef = React.useRef<HTMLDivElement>(null);
	const [isHeroInView, setIsHeroInView] = React.useState(false);
	const [isHeroAnimated, setIsHeroAnimated] = React.useState(false);

	// Balance privacy visibility (masking toggle)
	const [isBalanceHidden, setIsBalanceHidden] = React.useState(false);

	// Modal mode: INCOME vs EXPENSE
	const [modalMode, setModalMode] = React.useState<"INCOME" | "EXPENSE">(
		"EXPENSE",
	);

	// Expense & Income modal state
	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [category, setCategory] = React.useState("BAHAN_BAKU");
	const [isCategoryMenuOpen, setIsCategoryMenuOpen] = React.useState(false);
	const [amount, setAmount] = React.useState("");
	const [paymentMethod, setPaymentMethod] = React.useState("TUNAI");
	const [description, setDescription] = React.useState("");
	const [expenseDate, setExpenseDate] = React.useState(
		new Date().toISOString().slice(0, 10),
	);
	const [incomeCategory, setIncomeCategory] = React.useState("PENJUALAN");
	const [isIncomeCategoryMenuOpen, setIsIncomeCategoryMenuOpen] =
		React.useState(false);
	const [incomeDate, setIncomeDate] = React.useState(
		new Date().toISOString().slice(0, 10),
	);

	// Financial breakdown & dominance card state (real data)
	const [analysisFlow, setAnalysisFlow] = React.useState<"EXPENSE" | "INCOME">(
		"EXPENSE",
	);

	// Target Anggaran & Pemasukan modal state
	const [isTargetModalOpen, setIsTargetModalOpen] = React.useState(false);
	const [targetFlowTab, setTargetFlowTab] = React.useState<
		"EXPENSE" | "INCOME"
	>("EXPENSE");
	const [targetBudgetsInput, setTargetBudgetsInput] = React.useState<
		Record<string, string>
	>({});
	const [isSavingBudgets, setIsSavingBudgets] = React.useState(false);
	const [hoveredGroupKey, setHoveredGroupKey] = React.useState<string | null>(
		null,
	);

	const handleOpenTargetModal = (flow: "EXPENSE" | "INCOME" = analysisFlow) => {
		setTargetFlowTab(flow);
		const existing =
			(flow === "EXPENSE" ? data.budgets?.expense : data.budgets?.income) || {};
		const initialInput: Record<string, string> = {};
		if (flow === "EXPENSE") {
			EXPENSE_CATEGORIES.forEach((c) => {
				initialInput[c.id] = existing[c.id] ? String(existing[c.id]) : "";
			});
		} else {
			INCOME_CATEGORIES.forEach((c) => {
				initialInput[c.id] = existing[c.id] ? String(existing[c.id]) : "";
			});
		}
		setTargetBudgetsInput(initialInput);
		setIsTargetModalOpen(true);
	};

	const handleSwitchTargetModalTab = (flow: "EXPENSE" | "INCOME") => {
		setTargetFlowTab(flow);
		const existing =
			(flow === "EXPENSE" ? data.budgets?.expense : data.budgets?.income) || {};
		const initialInput: Record<string, string> = {};
		if (flow === "EXPENSE") {
			EXPENSE_CATEGORIES.forEach((c) => {
				initialInput[c.id] = existing[c.id] ? String(existing[c.id]) : "";
			});
		} else {
			INCOME_CATEGORIES.forEach((c) => {
				initialInput[c.id] = existing[c.id] ? String(existing[c.id]) : "";
			});
		}
		setTargetBudgetsInput(initialInput);
	};

	const handleSaveTargetBudgets = async () => {
		setIsSavingBudgets(true);
		try {
			const entries = Object.entries(targetBudgetsInput).map(([cat, val]) => ({
				category: cat,
				targetAmount: parseFloat(val.replace(/\D/g, "")) || 0,
			}));

			const res = await saveCategoryBudgetsAction({
				outletKey,
				flowType: targetFlowTab,
				budgets: entries,
			});

			if (res.success) {
				toast.success(
					`Target ${targetFlowTab === "EXPENSE" ? "anggaran pengeluaran" : "pemasukan"} berhasil disimpan.`,
				);
				setIsTargetModalOpen(false);
				handleTabChange(currentTab);
			} else {
				toast.error(res.error || "Gagal menyimpan target anggaran.");
			}
		} catch (err: any) {
			toast.error("Terjadi kendala saat menyimpan target.");
		} finally {
			setIsSavingBudgets(false);
		}
	};

	React.useEffect(() => {
		const el = heroChartRef.current;
		if (!el || typeof IntersectionObserver === "undefined") {
			setIsHeroInView(true);
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsHeroInView(true);
					observer.unobserve(el);
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	React.useEffect(() => {
		if (!isHeroInView) {
			setIsHeroAnimated(false);
			return;
		}
		setIsHeroAnimated(false);
		const timer = setTimeout(() => {
			setIsHeroAnimated(true);
		}, 40);
		return () => clearTimeout(timer);
	}, [isHeroInView, data.chartBuckets]);

	// Data loader
	const loadData = async (
		newPeriod: ReportPeriod,
		customStart?: string,
		customEnd?: string,
	) => {
		setIsLoading(true);
		try {
			const res = await getFinanceReport(outletKey, {
				period: newPeriod,
				startDate: customStart,
				endDate: customEnd,
			});

			if (res.success && res.data) {
				setData(res.data);
			} else {
				toast.error(res.error || "Gagal memuat laporan keuangan");
			}
		} catch (err: any) {
			toast.error("Terjadi kendala saat memperbarui laporan keuangan.");
		} finally {
			setIsLoading(false);
		}
	};

	// Month navigation options (last 12 months)
	const monthOptions = React.useMemo(() => {
		const list = [];
		const base = new Date();
		for (let i = 0; i < 12; i++) {
			const d = subMonths(base, i);
			const val = format(d, "yyyy-MM");
			const label = format(d, "MMMM yyyy", { locale: localeId });
			list.push({ value: val, label });
		}
		return list;
	}, []);

	const yearOptions = React.useMemo(() => {
		const currentYear = new Date().getFullYear();
		return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
	}, []);

	// Filter Bar Handlers
	const handleTabChange = (tab: string) => {
		const nextTab = tab as "harian" | "bulanan" | "tahunan";
		setCurrentTab(nextTab);

		if (nextTab === "harian") {
			if (customRange?.from) {
				loadData(
					"custom",
					format(customRange.from, "yyyy-MM-dd"),
					format(customRange.to || customRange.from, "yyyy-MM-dd"),
				);
			} else {
				loadData("daily", todayDateStr, todayDateStr);
			}
		} else if (nextTab === "bulanan") {
			const [y, m] = monthParam.split("-").map(Number);
			const start = format(new Date(y, m - 1, 1), "yyyy-MM-dd");
			const end = format(new Date(y, m, 0), "yyyy-MM-dd");
			loadData("monthly", start, end);
		} else if (nextTab === "tahunan") {
			loadData("yearly", `${yearParam}-01-01`, `${yearParam}-12-31`);
		}
	};

	const handleApplyRange = () => {
		if (!tempRange?.from) return;
		setCustomRange(tempRange);
		setIsCalendarOpen(false);
		const startStr = format(tempRange.from, "yyyy-MM-dd");
		const endStr = format(tempRange.to || tempRange.from, "yyyy-MM-dd");
		loadData("custom", startStr, endStr);
	};

	const handleResetToThisMonth = () => {
		setCustomRange(undefined);
		setTempRange(undefined);
		setIsCalendarOpen(false);
		const thisMonth = format(new Date(), "yyyy-MM");
		handleMonthSelect(thisMonth);
	};

	const handleMonthSelect = (val: string) => {
		setCustomRange(undefined);
		setTempRange(undefined);
		setMonthParam(val);
		setCurrentTab("bulanan");
		const [y, m] = val.split("-").map(Number);
		const start = format(new Date(y, m - 1, 1), "yyyy-MM-dd");
		const end = format(new Date(y, m, 0), "yyyy-MM-dd");
		loadData("monthly", start, end);
	};

	const handleMonthStep = (step: number) => {
		const [y, m] = monthParam.split("-").map(Number);
		const d =
			step > 0
				? addMonths(new Date(y, m - 1, 1), 1)
				: subMonths(new Date(y, m - 1, 1), 1);
		const newVal = format(d, "yyyy-MM");
		handleMonthSelect(newVal);
	};

	const handleYearSelect = (val: string) => {
		setCustomRange(undefined);
		setTempRange(undefined);
		setYearParam(val);
		setCurrentTab("tahunan");
		loadData("yearly", `${val}-01-01`, `${val}-12-31`);
	};

	const handleYearStep = (step: number) => {
		const currentY = parseInt(yearParam, 10);
		const nextY = String(currentY + step);
		handleYearSelect(nextY);
	};

	const currentPeriodLabel = React.useMemo(() => {
		if (customRange?.from) {
			const fromStr = format(customRange.from, "d MMM", { locale: localeId });
			if (
				!customRange.to ||
				format(customRange.from, "yyyy-MM-dd") ===
					format(customRange.to, "yyyy-MM-dd")
			) {
				return format(customRange.from, "d MMM yyyy", { locale: localeId });
			}
			return `${fromStr} - ${format(customRange.to, "d MMM yyyy", { locale: localeId })}`;
		}
		if (currentTab === "bulanan") {
			const [y, m] = monthParam.split("-").map(Number);
			const d = new Date(y, m - 1, 1);
			return format(d, "MMM yyyy", { locale: localeId });
		}
		if (currentTab === "tahunan") {
			return `Thn ${yearParam}`;
		}
		return "Semua Waktu";
	}, [currentTab, monthParam, yearParam, customRange]);

	const hasCustomDate = Boolean(customRange?.from);

	// Form Handlers (Income / Expense)
	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const numAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
		if (isNaN(numAmount) || numAmount <= 0) {
			toast.error(
				`Masukkan nominal ${modalMode === "INCOME" ? "pemasukan" : "biaya"} yang valid.`,
			);
			return;
		}
		if (!description.trim()) {
			toast.error(
				`Keterangan ${modalMode === "INCOME" ? "pemasukan" : "pengeluaran"} wajib diisi.`,
			);
			return;
		}

		setIsSubmitting(true);
		try {
			if (modalMode === "INCOME") {
				const res = await createIncomeAction({
					outletKey,
					category: incomeCategory,
					amount: numAmount,
					paymentMethod,
					description,
					date: incomeDate,
				});

				if (res.success) {
					toast.success("Pemasukan kas berhasil dicatat.");
					setIsModalOpen(false);
					setAmount("");
					setDescription("");
					handleTabChange(currentTab);
				} else {
					toast.error(res.error || "Gagal mencatat pemasukan.");
				}
			} else {
				const res = await createExpenseAction({
					outletKey,
					category,
					amount: numAmount,
					paymentMethod,
					description,
					date: expenseDate,
				});

				if (res.success) {
					toast.success("Pengeluaran berhasil dicatat.");
					setIsModalOpen(false);
					setAmount("");
					setDescription("");
					handleTabChange(currentTab);
				} else {
					toast.error(res.error || "Gagal menyimpan pengeluaran.");
				}
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat menyimpan transaksi.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteExpense = async (id: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?"))
			return;
		try {
			const res = await deleteExpenseAction(id, outletKey);
			if (res.success) {
				toast.success("Pengeluaran berhasil dihapus.");
				handleTabChange(currentTab);
			} else {
				toast.error(res.error || "Gagal menghapus pengeluaran.");
			}
		} catch (err) {
			toast.error("Gagal menghapus.");
		}
	};

	const handleDeleteIncome = async (id: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus catatan pemasukan ini?"))
			return;
		try {
			const res = await deleteIncomeAction(id, outletKey);
			if (res.success) {
				toast.success("Pemasukan berhasil dihapus.");
				handleTabChange(currentTab);
			} else {
				toast.error(res.error || "Gagal menghapus pemasukan.");
			}
		} catch (err) {
			toast.error("Gagal menghapus.");
		}
	};

	// Export Excel Multi-sheet
	const handleExportExcel = () => {
		try {
			const workbook = XLSX.utils.book_new();

			// Summary Sheet
			const summaryRows = [
				{ Indikator: "Outlet", Nilai: data.tenant.name },
				{
					Indikator: "Periode",
					Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}`,
				},
				{
					Indikator: "Total Kas Masuk (Cash In)",
					Nilai: data.cashFlow.totalCashIn,
				},
				{
					Indikator: "Penjualan Kasir Tunai (Fisik Laci)",
					Nilai: data.cashFlow.cashSalesTotal,
				},
				{
					Indikator: "Penerimaan QRIS / Digital (Gross)",
					Nilai:
						(data.cashFlow as any).nonCashGrandTotal ||
						data.cashFlow.nonCashSalesTotal,
				},
				{
					Indikator: "Potongan MDR Payment Gateway (0.7%)",
					Nilai:
						(data.cashFlow as any).nonCashGatewayFee ||
						(data.cashFlow as any).totalGatewayFee ||
						0,
				},
				{
					Indikator: "Pencairan Bersih Bank (Net Settled)",
					Nilai: data.cashFlow.nonCashSalesTotal,
				},
				{
					Indikator: "Kas Masuk Manual Laci",
					Nilai: data.cashFlow.manualCashIn,
				},
				{
					Indikator: "Total Kas Keluar (Cash Out)",
					Nilai: data.cashFlow.totalCashOut,
				},
				{ Indikator: "Biaya Kas Tunai", Nilai: data.cashFlow.cashExpenses },
				{
					Indikator: "Biaya Non-Tunai / Transfer Bank",
					Nilai: data.cashFlow.nonCashExpenses,
				},
				{
					Indikator: "Pengambilan Kas Manual Laci",
					Nilai: data.cashFlow.manualCashOut,
				},
				{
					Indikator: "Arus Kas Bersih (Net Cash Flow)",
					Nilai: data.cashFlow.netCashFlow,
				},
				{
					Indikator: "Net Arus Kas Laci Kasir",
					Nilai: data.cashFlow.drawerNetFlow,
				},
				{
					Indikator: "Net Saldo Bank & Digital",
					Nilai: data.cashFlow.digitalNetFlow,
				},
				{ Indikator: "Net Sales", Nilai: data.profitability.netSales },
				{
					Indikator: "Estimasi HPP Modal Produk Terjual",
					Nilai: data.profitability.totalHpp,
				},
				{
					Indikator: "Estimasi Laba Kotor (Gross Profit)",
					Nilai: data.profitability.estimatedGrossProfit,
				},
				{
					Indikator: "Margin Keuntungan (%)",
					Nilai: data.profitability.profitMargin.toFixed(1) + "%",
				},
			];
			const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
			XLSX.utils.book_append_sheet(
				workbook,
				summarySheet,
				"Ringkasan Arus Kas",
			);

			// Expenses Sheet
			const expenseRows = data.expenses.map((exp) => ({
				Tanggal: new Date(exp.date).toLocaleDateString("id-ID"),
				Kategori: exp.category,
				Deskripsi: exp.description,
				"Metode Pembayaran": exp.paymentMethod,
				"Nominal (Rp)": parseFloat(exp.amount),
			}));
			const expenseSheet = XLSX.utils.json_to_sheet(expenseRows);
			XLSX.utils.book_append_sheet(
				workbook,
				expenseSheet,
				"Daftar Pengeluaran",
			);

			// Shift Reconciliations Sheet
			const shiftRows = data.shifts.map((s) => ({
				"Shift ID": s.id.slice(0, 8),
				Kasir: (s as any).cashierName || "Kasir",
				Status: s.status,
				Mulai: new Date(s.startTime).toLocaleString("id-ID"),
				Selesai: s.endTime ? new Date(s.endTime).toLocaleString("id-ID") : "-",
				"Modal Awal": parseFloat(s.startingCash || "0"),
				"Uang Aktual Kasir": s.actualCash ? parseFloat(s.actualCash) : "-",
				"Uang Sistem Diharapkan": parseFloat(s.expectedCash || "0"),
				Selisih: s.cashDifference ? parseFloat(s.cashDifference) : "-",
			}));
			const shiftSheet = XLSX.utils.json_to_sheet(shiftRows);
			XLSX.utils.book_append_sheet(workbook, shiftSheet, "Rekonsiliasi Shift");

			const fileName = `Laporan_Keuangan_ArusKas_${data.tenant.name.replace(/\s+/g, "_")}.xlsx`;
			XLSX.writeFile(workbook, fileName);
			toast.success("File Excel keuangan berhasil diunduh.");
		} catch (e) {
			toast.error("Gagal mengekspor file Excel.");
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const {
		cashFlow,
		profitability,
		expenses,
		expenseCategoryBreakdown,
		incomes = [],
		incomeCategoryBreakdown = [],
		shifts,
		period: reportPeriod,
		tenant,
		growth = { cashIn: 0, cashOut: 0, netCashFlow: 0, grossProfit: 0 },
		chartBuckets = [],
		cashInTrend = [],
		cashOutTrend = [],
		netFlowTrend = [],
	} = data;

	// Independent ceiling scales for Inflow (Top) and Outflow (Bottom)
	const { maxInflowValue, maxOutflowValue } = React.useMemo(() => {
		if (!chartBuckets || chartBuckets.length === 0) {
			return { maxInflowValue: 1000, maxOutflowValue: 1000 };
		}
		const maxIn = Math.max(...chartBuckets.map((b) => b.cashIn || 0), 1000);
		const maxOut = Math.max(...chartBuckets.map((b) => b.cashOut || 0), 1000);
		return { maxInflowValue: maxIn, maxOutflowValue: maxOut };
	}, [chartBuckets]);

	// Asymmetric/Independent 5 ticks: Top (+MaxInflow), Mid-top (+HalfInflow), Center (0), Mid-bottom (-HalfOutflow), Bottom (-MaxOutflow)
	const chartYTicks = React.useMemo(() => {
		const halfIn = Math.round(maxInflowValue / 2);
		const halfOut = Math.round(maxOutflowValue / 2);
		return [
			{ val: maxInflowValue, label: `+${formatCompactRupiah(maxInflowValue)}` },
			{ val: halfIn, label: `+${formatCompactRupiah(halfIn)}` },
			{ val: 0, label: "0" },
			{ val: -halfOut, label: `-${formatCompactRupiah(halfOut)}` },
			{
				val: -maxOutflowValue,
				label: `-${formatCompactRupiah(maxOutflowValue)}`,
			},
		];
	}, [maxInflowValue, maxOutflowValue]);

	const activeHoverBucket =
		chartHoveredIndex !== null && chartBuckets
			? chartBuckets[chartHoveredIndex]
			: null;

	// Dynamic bar width logic (single centered column per bucket, like Sales Analytics)
	const dynamicBarWidth = React.useMemo(() => {
		const n = chartBuckets.length;
		if (n <= 3) return 64;
		if (n <= 5) return 48;
		if (n <= 8) return 36;
		if (n <= 12) return 26;
		if (n <= 16) return 18;
		if (n <= 24) return 14;
		if (n <= 31) return 11;
		return 8;
	}, [chartBuckets.length]);

	// Outflow channel ratios
	const cashExpensesTotal = cashFlow.cashExpenses + cashFlow.manualCashOut;
	const bankExpensesTotal = cashFlow.nonCashExpenses;
	const totalOutflowForRatio = Math.max(
		1,
		cashExpensesTotal + bankExpensesTotal,
	);
	const cashOutflowPercent = Math.round(
		(cashExpensesTotal / totalOutflowForRatio) * 100,
	);
	const bankOutflowPercent = 100 - cashOutflowPercent;

	// Segmented Breakdown for Outflow Card Horizontal Bar (Pill Capsules)
	const categorySegments = React.useMemo<ExpenseCategorySegment[]>(() => {
		// Curated monochromatic blue ramp strictly matching Sales Report (Kategori Penjualan Terlaris)
		const COLOR_PALETTE = [
			{ hex: "#083cb0", colorBg: "bg-[#083cb0]" }, // Rank 1: Deep Navy Blue
			{ hex: "#0e59f9", colorBg: "bg-[#0e59f9]" }, // Rank 2: Menuin Royal Blue
			{ hex: "#3b82f6", colorBg: "bg-[#3b82f6]" }, // Rank 3: Medium Blue
			{ hex: "#60a5fa", colorBg: "bg-[#60a5fa]" }, // Rank 4: Soft Medium Blue
			{ hex: "#93c5fd", colorBg: "bg-[#93c5fd]" }, // Rank 5: Light Sky Blue
			{ hex: "#cbd5e1", colorBg: "bg-[#cbd5e1]" }, // Rank 6: Subtle Slate
		];

		let items = (expenseCategoryBreakdown || []).filter(
			(item) => Number(item.amount) > 0,
		);

		// If no breakdown available, aggregate from raw expenses
		if (items.length === 0 && expenses && expenses.length > 0) {
			const grouped: Record<string, number> = {};
			expenses.forEach((e) => {
				grouped[e.category] = (grouped[e.category] || 0) + Number(e.amount);
			});
			items = Object.entries(grouped).map(([category, amount]) => ({
				category,
				amount,
				percentage: 0,
			}));
		}

		// If no categorized expenses logged yet
		if (items.length === 0) {
			if (cashFlow.totalCashOut > 0) {
				return [
					{
						id: "OPERASIONAL",
						label: "Operasional",
						amount: cashFlow.totalCashOut,
						percentage: 100,
						colorBg: COLOR_PALETTE[1].colorBg,
						hex: COLOR_PALETTE[1].hex,
					},
				];
			}
			return [];
		}

		const total =
			items.reduce((sum, item) => sum + Number(item.amount), 0) || 1;
		const sorted = [...items].sort(
			(a, b) => Number(b.amount) - Number(a.amount),
		);

		return sorted.map((item, idx) => {
			const catObj = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
			const label = catObj?.label || item.category;
			const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length];
			const pct = (Number(item.amount) / total) * 100;

			return {
				id: item.category,
				label,
				amount: Number(item.amount),
				percentage: pct,
				colorBg: palette.colorBg,
				hex: palette.hex,
			};
		});
	}, [expenseCategoryBreakdown, expenses, cashFlow.totalCashOut]);

	// Segmented Breakdown for Inflow Card Horizontal Bar (Pill Capsules)
	const incomeSegments = React.useMemo<FinanceCategorySegment[]>(() => {
		// Curated monochromatic blue ramp strictly matching Sales Report & Menuin Design System
		const COLOR_PALETTE = [
			{ hex: "#083cb0", colorBg: "bg-[#083cb0]" }, // Rank 1: Deep Navy Blue (Penjualan)
			{ hex: "#0e59f9", colorBg: "bg-[#0e59f9]" }, // Rank 2: Menuin Royal Blue (Modal)
			{ hex: "#3b82f6", colorBg: "bg-[#3b82f6]" }, // Rank 3: Medium Blue (Lainnya)
			{ hex: "#60a5fa", colorBg: "bg-[#60a5fa]" }, // Rank 4: Soft Medium Blue
			{ hex: "#93c5fd", colorBg: "bg-[#93c5fd]" }, // Rank 5: Light Sky Blue
			{ hex: "#cbd5e1", colorBg: "bg-[#cbd5e1]" }, // Rank 6: Subtle Slate
		];

		let items = (incomeCategoryBreakdown || []).filter(
			(item: any) => Number(item.amount) > 0,
		);

		// If no categorized incomes logged yet
		if (items.length === 0) {
			if (cashFlow.totalCashIn > 0) {
				return [
					{
						id: "PENJUALAN",
						label: "Penjualan",
						amount: cashFlow.totalCashIn,
						percentage: 100,
						colorBg: COLOR_PALETTE[0].colorBg,
						hex: COLOR_PALETTE[0].hex,
					},
				];
			}
			return [];
		}

		const total =
			items.reduce((sum: number, item: any) => sum + Number(item.amount), 0) ||
			1;
		const sorted = [...items].sort(
			(a: any, b: any) => Number(b.amount) - Number(a.amount),
		);

		return sorted.map((item: any, idx: number) => {
			const catObj = INCOME_CATEGORIES.find((c) => c.id === item.category);
			const label = item.label || catObj?.label || item.category;
			const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length];
			const pct = (Number(item.amount) / total) * 100;

			return {
				id: item.category,
				label,
				amount: Number(item.amount),
				percentage: pct,
				colorBg: palette.colorBg,
				hex: palette.hex,
			};
		});
	}, [incomeCategoryBreakdown, cashFlow.totalCashIn]);

	// Real Financial Breakdown Pillars (Flow: Expense vs Income, Top Categories)
	const analysisBreakdown = React.useMemo(() => {
		const isExpense = analysisFlow === "EXPENSE";
		const totalFlow = isExpense
			? Number(cashFlow.totalCashOut || 0)
			: Number(cashFlow.totalCashIn || 0);

		const growthVal = isExpense
			? (data.growth?.cashOut ?? 0)
			: (data.growth?.cashIn ?? 0);

		interface CategoryDetailItem {
			id: string;
			label: string;
			amount: number;
			targetAmount: number;
			percentageInGroup: number;
		}

		interface GroupTransactionItem {
			id: string;
			description: string;
			amount: number;
			date: string | Date;
			category: string;
		}

		interface AnalysisPillarItem {
			key: string;
			name: string;
			shortName: string;
			description: string;
			amount: number;
			targetAmount: number;
			percent: number;
			fillHeight: number;
			hasTarget: boolean;
			isOverBudget: boolean;
			color: {
				cap: string;
				bar: string;
				hex: string;
			};
			categories: CategoryDetailItem[];
			topTransactions: GroupTransactionItem[];
			totalTransactionCount: number;
		}

		let items: AnalysisPillarItem[] = [];

		const activeBudgets = isExpense
			? data.budgets?.expense || {}
			: data.budgets?.income || {};

		if (isExpense) {
			items = EXPENSE_GROUPS.map((group) => {
				const subCategories: CategoryDetailItem[] = group.categoryIds.map(
					(catId) => {
						const catBreakdown = (expenseCategoryBreakdown || []).find(
							(b) => b.category === catId,
						);
						const catMeta = EXPENSE_CATEGORIES.find((c) => c.id === catId);
						const amt = Number(catBreakdown?.amount || 0);
						const target = activeBudgets[catId] || 0;
						return {
							id: catId,
							label: catMeta?.label || catId,
							amount: amt,
							targetAmount: target,
							percentageInGroup: 0,
						};
					},
				);

				const groupAmt = subCategories.reduce((acc, c) => acc + c.amount, 0);
				const groupTarget = subCategories.reduce(
					(acc, c) => acc + c.targetAmount,
					0,
				);
				const hasTarget = groupTarget > 0;

				subCategories.forEach((c) => {
					c.percentageInGroup =
						groupAmt > 0 ? Math.round((c.amount / groupAmt) * 100) : 0;
				});

				const pct = hasTarget
					? Math.round((groupAmt / groupTarget) * 100)
					: 0;

				const isOverBudget = hasTarget && groupAmt > groupTarget;
				const fillHeight = Math.min(100, Math.max(0, pct));

				// Matching transactions for "Dari Mana Saja"
				const matchingExpenses = (expenses || [])
					.filter(
						(e) =>
							group.categoryIds.includes(e.category) && Number(e.amount) > 0,
					)
					.sort((a, b) => Number(b.amount) - Number(a.amount));

				const topTransactions: GroupTransactionItem[] = matchingExpenses
					.slice(0, 3)
					.map((e) => ({
						id: e.id,
						description: e.description || "Pengeluaran kas",
						amount: Number(e.amount),
						date: e.date,
						category: e.category,
					}));

				return {
					key: group.id,
					name: group.name,
					shortName: group.shortName,
					description: group.description,
					amount: groupAmt,
					targetAmount: groupTarget,
					percent: pct,
					fillHeight,
					hasTarget,
					isOverBudget,
					color: group.color,
					categories: subCategories,
					topTransactions,
					totalTransactionCount: matchingExpenses.length,
				};
			});
		} else {
			items = INCOME_GROUPS.map((group) => {
				const subCategories: CategoryDetailItem[] = group.categoryIds.map(
					(catId) => {
						let amt = 0;
						if (catId === "PENJUALAN") {
							amt =
								Number(cashFlow.totalCashIn || 0) -
								(incomes || []).reduce(
									(acc, i) => acc + Number(i.amount || 0),
									0,
								);
							if (amt < 0) amt = Number(cashFlow.totalCashIn || 0);
						} else {
							const catIncomes = (incomes || []).filter(
								(i) => i.category === catId,
							);
							amt = catIncomes.reduce(
								(acc, i) => acc + Number(i.amount || 0),
								0,
							);
						}
						const catMeta = INCOME_CATEGORIES.find((c) => c.id === catId);
						const target = activeBudgets[catId] || 0;
						return {
							id: catId,
							label: catMeta?.label || group.name,
							amount: amt,
							targetAmount: target,
							percentageInGroup: 0,
						};
					},
				);

				const groupAmt = subCategories.reduce((acc, c) => acc + c.amount, 0);
				const groupTarget = subCategories.reduce(
					(acc, c) => acc + c.targetAmount,
					0,
				);
				const hasTarget = groupTarget > 0;

				subCategories.forEach((c) => {
					c.percentageInGroup =
						groupAmt > 0 ? Math.round((c.amount / groupAmt) * 100) : 0;
				});

				const pct = hasTarget
					? Math.round((groupAmt / groupTarget) * 100)
					: 0;

				const isOverBudget = false;
				const fillHeight = Math.min(100, Math.max(0, pct));

				let topTransactions: GroupTransactionItem[] = [];
				let totalTransactionCount = 0;

				if (group.id === "PENJUALAN_KASIR") {
					topTransactions = (data.topIncomeRows || [])
						.slice(0, 3)
						.map((r: any, idx: number) => ({
							id: r.id || `inc-row-${idx}`,
							description: r.description || r.item || "Penjualan POS",
							amount: Number(r.amount || 0),
							date: r.date || new Date(),
							category: "PENJUALAN",
						}));
					totalTransactionCount = data.topIncomeRows?.length || 0;
				} else {
					const matchingIncomes = (incomes || []).filter((i) =>
						group.categoryIds.includes(i.category),
					);
					topTransactions = matchingIncomes.slice(0, 3).map((i) => ({
						id: i.id,
						description: i.description || "Pemasukan",
						amount: Number(i.amount),
						date: i.date,
						category: i.category,
					}));
					totalTransactionCount = matchingIncomes.length;
				}

				return {
					key: group.id,
					name: group.name,
					shortName: group.shortName,
					description: group.description,
					amount: groupAmt,
					targetAmount: groupTarget,
					percent: pct,
					fillHeight,
					hasTarget,
					isOverBudget,
					color: group.color,
					categories: subCategories,
					topTransactions,
					totalTransactionCount,
				};
			});
		}

		// Urutkan pilar bar chart dari persentase tertinggi di paling kiri ke terendah di kanan
		items.sort((a, b) => {
			if (b.percent !== a.percent) {
				return b.percent - a.percent;
			}
			return b.amount - a.amount;
		});

		// Tetapkan warna pilar sesuai urutan posisi (rank), bukan kategori tetap:
		// Posisi paling kiri (ke-0, persentase tertinggi): Hitam
		// Posisi berikutnya: Gradasi Biru
		// Posisi paling ujung kanan (persentase terendah): Biru paling muda
		const rankColors =
			items.length === 3 ? PILLAR_RANK_COLORS_3 : PILLAR_RANK_COLORS_4;
		items.forEach((item, index) => {
			if (rankColors[index]) {
				item.color = rankColors[index];
			}
		});

		const totalSum = items.reduce((acc, curr) => acc + curr.amount, 0);
		const totalTargetSum = items.reduce(
			(acc, curr) => acc + (curr.targetAmount || 0),
			0,
		);
		const anyHasTarget = items.some((i) => i.hasTarget);

		const headlinePct =
			anyHasTarget && totalTargetSum > 0
				? Math.round((totalSum / totalTargetSum) * 100)
				: 0;

		return {
			isExpense,
			totalFlow,
			growthVal,
			items,
			totalSum,
			totalTargetSum,
			anyHasTarget,
			headlinePct,
			hasData: items.some((i) => i.amount > 0) || totalFlow > 0,
		};
	}, [
		analysisFlow,
		cashFlow.totalCashOut,
		cashFlow.totalCashIn,
		expenseCategoryBreakdown,
		incomeCategoryBreakdown,
		expenses,
		incomes,
		data.growth,
		data.budgets,
		data.topIncomeRows,
	]);

	// Upcoming scheduled bills/expenses (Next 7 days)
	const upcomingBills = React.useMemo(() => {
		return [
			{ date: "1 AGU", title: "Gaji Staf - 4 karyawan", amount: 8600000 },
			{ date: "3 AGU", title: "Restock Bahan Baku Dapur", amount: 1940000 },
			{ date: "5 AGU", title: "Sewa Tempat & Utilitas Q3", amount: 4200000 },
		];
	}, []);

	const totalUpcomingScheduled = React.useMemo(() => {
		return upcomingBills.reduce((acc, curr) => acc + curr.amount, 0);
	}, [upcomingBills]);

	// Active shift alert status check
	const activeShift = React.useMemo(() => {
		return shifts.find((s) => s.status === "ACTIVE");
	}, [shifts]);

	// Unified transactions list for Cash Flow Table (combining POS Sales + Incomes + Expenses)
	const allTransactionsUnfiltered = React.useMemo<UnifiedCashFlowItem[]>(() => {
		const list: UnifiedCashFlowItem[] = [];
		const seenIds = new Set<string>();

		// 1. Add Expenses (Cash Out)
		(expenses || []).forEach((e) => {
			if (!seenIds.has(e.id)) {
				seenIds.add(e.id);
				list.push({
					id: e.id,
					type: "EXPENSE",
					category: e.category,
					amount: e.amount,
					paymentMethod: e.paymentMethod,
					description: e.description,
					date: e.date,
				});
			}
		});

		// 2. Add POS Sales from topIncomeRows (Cash In)
		if (data.topIncomeRows && data.topIncomeRows.length > 0) {
			data.topIncomeRows.forEach((r: any) => {
				if (!seenIds.has(r.id)) {
					seenIds.add(r.id);
					list.push({
						id: r.id,
						type: "INCOME",
						category: r.category || "PENJUALAN",
						amount: r.amount,
						paymentMethod: r.paymentMethod || "TUNAI",
						description: r.title
							? `${r.title}${r.description ? ` • ${r.description}` : ""}`
							: (r.description || "Penjualan POS"),
						date: r.date,
					});
				}
			});
		}

		// 3. Add Manual Incomes (Cash In)
		(incomes || []).forEach((inc: any) => {
			if (!seenIds.has(inc.id)) {
				seenIds.add(inc.id);
				list.push({
					id: inc.id,
					type: "INCOME",
					category: inc.category,
					amount: inc.amount,
					paymentMethod: inc.paymentMethod || "TUNAI",
					description: inc.description || "Pemasukan Kas",
					date: inc.date,
				});
			}
		});

		return list;
	}, [expenses, incomes, data.topIncomeRows]);

	// Live count tabs for Zone 1
	const cashFlowTabs = React.useMemo(() => [
		{
			key: "ALL" as const,
			label: "Semua Arus Kas",
			count: allTransactionsUnfiltered.length,
		},
		{
			key: "INCOME" as const,
			label: "Pemasukan (Cash In)",
			count: allTransactionsUnfiltered.filter((t) => t.type === "INCOME").length,
		},
		{
			key: "EXPENSE" as const,
			label: "Pengeluaran (Cash Out)",
			count: allTransactionsUnfiltered.filter((t) => t.type === "EXPENSE").length,
		},
	], [allTransactionsUnfiltered]);

	// Filtered & Sorted Transactions
	const filteredTransactions = React.useMemo<UnifiedCashFlowItem[]>(() => {
		let result = allTransactionsUnfiltered;

		// Tab filter: ALL / INCOME / EXPENSE
		if (transactionTypeFilter !== "ALL") {
			result = result.filter((t) => t.type === transactionTypeFilter);
		}

		// Search query filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((t) => {
				const desc = (t.description || "").toLowerCase();
				const cat = (t.category || "").toLowerCase();
				const catLabel = getCategoryLabel(t.category).toLowerCase();
				const method = (t.paymentMethod || "").toLowerCase();
				const formattedMethod = formatPaymentMethodLabel(t.paymentMethod).toLowerCase();
				return (
					desc.includes(query) ||
					cat.includes(query) ||
					catLabel.includes(query) ||
					method.includes(query) ||
					formattedMethod.includes(query)
				);
			});
		}

		// Category filter from Popover
		if (categoryFilter !== "ALL") {
			result = result.filter((t) => t.category === categoryFilter);
		}

		// Payment method filter from Popover
		if (paymentMethodFilter !== "ALL") {
			result = result.filter((t) => {
				const norm = (t.paymentMethod || "").toUpperCase();
				if (paymentMethodFilter === "TUNAI") {
					return norm === "TUNAI" || norm === "CASH";
				}
				return norm.includes(paymentMethodFilter.toUpperCase());
			});
		}

		// Sort
		return [...result].sort((a, b) => {
			if (sortBy === "newest") {
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			}
			if (sortBy === "oldest") {
				return new Date(a.date).getTime() - new Date(b.date).getTime();
			}
			if (sortBy === "amount_high") {
				return Number(b.amount || 0) - Number(a.amount || 0);
			}
			if (sortBy === "amount_low") {
				return Number(a.amount || 0) - Number(b.amount || 0);
			}
			return 0;
		});
	}, [
		allTransactionsUnfiltered,
		transactionTypeFilter,
		searchQuery,
		categoryFilter,
		paymentMethodFilter,
		sortBy,
	]);

	const filteredExpenses = filteredTransactions;

	// Pagination variables
	const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
	const paginatedTransactions = React.useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredTransactions.slice(start, start + itemsPerPage);
	}, [filteredTransactions, currentPage, itemsPerPage]);

	const hasActiveExtraFilters =
		categoryFilter !== "ALL" || paymentMethodFilter !== "ALL";

	const getPaginationNumbers = () => {
		const delta = 1;
		const range: (number | string)[] = [];
		const rangeWithDots: (number | string)[] = [];
		let l: number | undefined;

		for (let i = 1; i <= totalPages; i++) {
			if (
				i === 1 ||
				i === totalPages ||
				(i >= currentPage - delta && i <= currentPage + delta)
			) {
				range.push(i);
			}
		}

		for (const i of range) {
			if (l) {
				if ((i as number) - l === 2) {
					rangeWithDots.push(l + 1);
				} else if ((i as number) - l !== 1) {
					rangeWithDots.push("...");
				}
			}
			rangeWithDots.push(i);
			l = i as number;
		}

		return rangeWithDots;
	};

	return (
		<div className="space-y-6 print:p-0">
			{/* ==================================================== */}
			{/* 1. PRINT HEADER (VISIBLE ONLY ON PRINT) */}
			{/* ==================================================== */}
			<div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
				<div>
					<h1 className="text-2xl font-semibold uppercase tracking-tight text-slate-900">
						{tenant.name}
					</h1>
					<p className="text-xs text-slate-600">
						Laporan Arus Kas, Biaya Operasional &amp; Rekonsiliasi Shift
					</p>
				</div>
				<div className="text-right">
					<div className="text-xs font-semibold uppercase text-slate-500">
						Periode
					</div>
					<div className="text-sm font-semibold text-slate-900">
						{reportPeriod.formattedStart} &mdash; {reportPeriod.formattedEnd}
					</div>
				</div>
			</div>

			{/* ==================================================== */}
			{/* 2. TOP DASHBOARD HEADER & CONTROLS (VELA-FINANCE STYLE) */}
			{/* ==================================================== */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
				{/* Title & Live Status */}
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
							Cashflow
						</h1>
						{isLoading && (
							<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[10px] font-medium text-[#0e59f9] transition-all">
								<span className="w-1.5 h-1.5 rounded-full bg-[#0e59f9] animate-pulse" />
								Memperbarui...
							</span>
						)}
					</div>
				</div>

				{/* Right Toolbar Controls */}
				<div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
					{/* Date Selector Popover (Synchronized with currentTab) */}
					<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
						<PopoverTrigger asChild>
							<button
								type="button"
								className={cn(
									"h-9 px-3.5 rounded-full bg-white border-none text-xs font-medium text-slate-700 hover:bg-slate-100 shadow-sm-md inline-flex items-center gap-1.5 transition-colors cursor-pointer",
									hasCustomDate &&
										"bg-blue-50/70 text-[#0e59f9] font-semibold",
								)}
							>
								<CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
								<span className="capitalize">{currentPeriodLabel}</span>
								{isLoading ? (
									<RefreshCw className="w-3.5 h-3.5 text-[#0e59f9] animate-spin ml-0.5" />
								) : (
									<ChevronDown className="w-3.5 h-3.5 text-slate-400" />
								)}
							</button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							className="w-auto p-0 rounded-2xl shadow-2xl border-none bg-white"
						>
							<div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3">
								<div className="text-xs font-semibold text-slate-900">
									Pilih Jangka Waktu Laporan
								</div>
								{hasCustomDate && (
									<button
										type="button"
										onClick={handleResetToThisMonth}
										className="text-[11px] text-slate-500 hover:text-slate-900 transition-colors underline cursor-pointer"
									>
										Reset
									</button>
								)}
							</div>
							<div className="p-2 border-b border-slate-100 grid grid-cols-3 gap-1">
								<button
									type="button"
									onClick={() => {
										const thisMonth = format(new Date(), "yyyy-MM");
										handleMonthSelect(thisMonth);
										setIsCalendarOpen(false);
									}}
									className={cn(
										"px-2.5 py-1 text-xs rounded-lg text-center font-medium transition-colors cursor-pointer",
										currentTab === "bulanan" &&
											monthParam === format(new Date(), "yyyy-MM") &&
											!hasCustomDate
											? "bg-[#0e59f9] text-white font-semibold"
											: "bg-slate-50 hover:bg-slate-100 text-slate-700",
									)}
								>
									Bulan Ini
								</button>
								<button
									type="button"
									onClick={() => {
										const lastMonth = format(
											subMonths(new Date(), 1),
											"yyyy-MM",
										);
										handleMonthSelect(lastMonth);
										setIsCalendarOpen(false);
									}}
									className={cn(
										"px-2.5 py-1 text-xs rounded-lg text-center font-medium transition-colors cursor-pointer",
										currentTab === "bulanan" &&
											monthParam ===
												format(subMonths(new Date(), 1), "yyyy-MM") &&
											!hasCustomDate
											? "bg-[#0e59f9] text-white font-semibold"
											: "bg-slate-50 hover:bg-slate-100 text-slate-700",
									)}
								>
									Bulan Lalu
								</button>
								<button
									type="button"
									onClick={() => {
										handleYearSelect(String(new Date().getFullYear()));
										setIsCalendarOpen(false);
									}}
									className={cn(
										"px-2.5 py-1 text-xs rounded-lg text-center font-medium transition-colors cursor-pointer",
										currentTab === "tahunan" &&
											yearParam === String(new Date().getFullYear()) &&
											!hasCustomDate
											? "bg-[#0e59f9] text-white font-semibold"
											: "bg-slate-50 hover:bg-slate-100 text-slate-700",
									)}
								>
									Tahun Ini
								</button>
							</div>
							<div className="p-2">
								<Calendar
									mode="range"
									defaultMonth={tempRange?.from || customRange?.from || now}
									selected={tempRange}
									onSelect={setTempRange}
									numberOfMonths={1}
									locale={localeId}
								/>
							</div>
							<div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
								<div className="text-[11px] text-slate-500">
									{tempRange?.from ? (
										<>
											{format(tempRange.from, "d MMM", { locale: localeId })}
											{tempRange.to
												? ` - ${format(tempRange.to, "d MMM yyyy", { locale: localeId })}`
												: ""}
										</>
									) : (
										"Pilih rentang tanggal"
									)}
								</div>
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setIsCalendarOpen(false)}
										className="h-8 text-xs font-medium text-slate-500 hover:text-slate-800"
									>
										Batal
									</Button>
									<Button
										type="button"
										size="sm"
										onClick={handleApplyRange}
										disabled={!tempRange?.from}
										className="h-8 text-xs font-semibold bg-[#0e59f9] text-white hover:bg-blue-700 rounded-xl px-3"
									>
										Terapkan
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					{/* Export Dropdown Button */}
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
							>
								<Download className="w-3.5 h-3.5 text-white/80" />
								<span>Export</span>
								<ChevronDown className="w-3 h-3 text-white/70" />
							</button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							className="w-48 p-1.5 bg-white rounded-2xl border-none shadow-2xl text-slate-800"
						>
							<button
								type="button"
								onClick={handleExportExcel}
								className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl text-left hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
							>
								<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
								<span>Unduh Excel (.xlsx)</span>
							</button>
							<button
								type="button"
								onClick={handlePrint}
								className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl text-left hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
							>
								<Printer className="w-3.5 h-3.5 text-slate-500" />
								<span>Cetak Laporan</span>
							</button>
						</PopoverContent>
					</Popover>

					<button
						type="button"
						onClick={() => handleTabChange(currentTab)}
						disabled={isLoading}
						className={cn(
							"w-9 h-9 rounded-full border-none bg-white hover:bg-slate-100 text-slate-600 shadow-sm-md flex items-center justify-center transition-all cursor-pointer",
							isLoading && "bg-blue-50/70 text-[#0e59f9]"
						)}
						title="Segarkan Data"
					>
						<RefreshCw
							className={cn(
								"w-4 h-4 text-slate-500",
								isLoading && "animate-spin text-[#0e59f9]",
							)}
						/>
					</button>
				</div>
			</div>

			{/* ==================================================== */}
			{/* 3. ASYMMETRICAL 3-CARD TOP KPI ROW */}
			{/* Hero Blue Net Flow (2 Cols) + Inflows (1 Col) + Outflows (1 Col) */}
			{/* ==================================================== */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
				{/* KPI 1: NET FLOW - HERO BLUE CARD (Solid Menuin Blue, Takes ~50% / 6 cols) */}
				<Card className="lg:col-span-6 bg-[#0e59f9] text-white shadow-md hover:shadow-lg rounded-2xl border-none transition-all flex flex-col justify-between overflow-hidden min-h-[220px]">
					<CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
						{/* Top row: Icon + Dual Title (Indonesian & English) on left, Period Filter Dropdown on right */}
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-white text-[#0e59f9] flex items-center justify-center shadow-xs flex-shrink-0">
									<Wallet className="w-5 h-5 text-[#0e59f9]" />
								</div>
								<div>
									<span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
										Arus Kas Bersih
									</span>
									<span className="text-sm font-semibold text-white tracking-tight">
										Net Flow
									</span>
								</div>
							</div>

							{/* Static Period Label matching Inflow & Outflow Cards */}
							<span className="text-[11px] font-normal text-white/80 capitalize flex-shrink-0">
								{currentPeriodLabel}
							</span>
						</div>

						{/* Middle row: Nominal + Eye Mask + Comparison Badge below nominal on Left & Sparkline on Right */}
						<div className="my-auto py-2 flex items-end justify-between gap-4">
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<div className="text-xl sm:text-2xl font-semibold text-white tracking-tight whitespace-nowrap">
										{isBalanceHidden
											? "Rp ••••••••••"
											: formatKpiCurrency(cashFlow.netCashFlow)}
									</div>
									<button
										type="button"
										onClick={() => setIsBalanceHidden(!isBalanceHidden)}
										className="text-white/70 hover:text-white transition-colors cursor-pointer p-0.5 rounded-md hover:bg-white/10"
										title={
											isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"
										}
									>
										{isBalanceHidden ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
									</button>
								</div>

								{/* Badge perbandingan di bawah nominal */}
								<div className="mt-1.5 flex items-center gap-2 flex-wrap">
									<span
										className={cn(
											"px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 border backdrop-blur-xs",
											growth.netCashFlow >= 0
												? "bg-white/20 text-white border-white/25"
												: "bg-rose-500/30 text-rose-100 border border-rose-300/30",
										)}
									>
										{growth.netCashFlow >= 0 ? (
											<TrendingUp className="w-3.5 h-3.5 text-white" />
										) : (
											<TrendingDown className="w-3.5 h-3.5 text-rose-200" />
										)}
										<span>
											{growth.netCashFlow >= 0
												? `+${Math.round(growth.netCashFlow)}%`
												: `${Math.round(growth.netCashFlow)}%`}
										</span>
									</span>
									<span className="text-xs text-white/80 font-normal">
										{cashFlow.netCashFlow >= 0
											? "Surplus kas operasional toko"
											: "Defisit kas operasional toko"}
									</span>
								</div>
							</div>

							{/* Sparkline in White against Blue Card */}
							<div className="flex-shrink-0 pb-0.5">
								<MiniSparkline
									data={netFlowTrend}
									percentage={growth.netCashFlow}
									isPositive={growth.netCashFlow >= 0}
									metricSeed={3}
									color="#ffffff"
								/>
							</div>
						</div>

						{/* Bottom row: 3 Quick Action Pill Buttons matching Reference Hierarchy */}
						<div className="mt-3 flex items-center gap-2 sm:gap-2.5 flex-wrap">
							<button
								type="button"
								onClick={() => {
									setModalMode("INCOME");
									setAmount("");
									setDescription("");
									setIsModalOpen(true);
								}}
								className="h-10 px-5 rounded-full bg-white text-[#0e59f9] hover:bg-white/95 font-semibold text-xs inline-flex items-center gap-2 shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
							>
								<Plus className="h-3.5 w-3.5 stroke-[2.5]" />
								<span>Pemasukan</span>
							</button>
							<button
								type="button"
								onClick={() => {
									setModalMode("EXPENSE");
									setAmount("");
									setDescription("");
									setIsModalOpen(true);
								}}
								className="h-10 px-5 rounded-full bg-[#0f172a] text-white hover:bg-[#1e293b] font-semibold text-xs inline-flex items-center gap-2 shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer border border-white/10"
							>
								<ArrowUpRightIcon className="h-3.5 w-3.5 stroke-[2.5]" />
								<span>Pengeluaran</span>
							</button>
							<button
								type="button"
								onClick={() => handleOpenTargetModal("EXPENSE")}
								className="h-10 px-5 rounded-full border border-white/30 bg-white/10 backdrop-blur-xs text-white hover:bg-white/20 hover:border-white/50 font-semibold text-xs inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
							>
								<Target className="h-3.5 w-3.5 stroke-[2]" />
								<span>Atur Target</span>
							</button>
						</div>
					</CardContent>
				</Card>

				{/* KPI 2: INFLOWS (KAS MASUK - White Card, 3 Cols) */}
				<Card className="lg:col-span-3 border-none shadow-sm-md hover:shadow-md rounded-2xl bg-white transition-all flex flex-col justify-between overflow-hidden min-h-[220px]">
					<CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
						{/* Top row: Icon + Dual Title (Indonesian & English) on left, Period on right */}
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
									<ArrowDownLeft className="w-5 h-5 text-white" />
								</div>
								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Kas Masuk
									</span>
									<span className="text-sm font-semibold text-slate-900 tracking-tight">
										Inflows
									</span>
								</div>
							</div>
							<span className="text-[11px] font-normal text-slate-400 capitalize flex-shrink-0">
								{currentPeriodLabel}
							</span>
						</div>

						{/* Middle: Nominal + Comparison Badge below nominal */}
						<div className="my-auto py-2">
							<div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
								{formatKpiCurrency(cashFlow.totalCashIn)}
							</div>
							<div className="mt-1.5 flex items-center gap-2">
								<span
									className={cn(
										"px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border-none",
										growth.cashIn >= 0
											? "bg-emerald-100/80 text-emerald-700"
											: "bg-rose-100/80 text-rose-700",
									)}
								>
									{growth.cashIn >= 0 ? (
										<TrendingUp className="w-3 h-3 text-emerald-600" />
									) : (
										<TrendingDown className="w-3 h-3 text-rose-600" />
									)}
									<span>
										{growth.cashIn >= 0
											? `+${Math.round(growth.cashIn)}%`
											: `${Math.round(growth.cashIn)}%`}
									</span>
								</span>
							</div>
						</div>

						{/* Bottom: Horizontal Capsule Segmented Bar */}
						<div>
							<FinanceCategoryHorizontalBar
								title="Kategori Pemasukan"
								segments={incomeSegments}
								totalAmount={cashFlow.totalCashIn}
								emptyText="Belum ada pemasukan"
							/>
						</div>
					</CardContent>
				</Card>

				{/* KPI 3: OUTFLOWS (KAS KELUAR - White Card, 3 Cols) */}
				<Card className="lg:col-span-3 border-none shadow-sm-md hover:shadow-md rounded-2xl bg-white transition-all flex flex-col justify-between overflow-hidden min-h-[220px]">
					<CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
						{/* Top row: Icon + Dual Title (Indonesian & English) on left, Period on right */}
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
									<ArrowUpRight className="w-5 h-5 text-white" />
								</div>
								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Kas Keluar
									</span>
									<span className="text-sm font-semibold text-slate-900 tracking-tight">
										Outflows
									</span>
								</div>
							</div>
							<span className="text-[11px] font-normal text-slate-400 capitalize flex-shrink-0">
								{currentPeriodLabel}
							</span>
						</div>

						{/* Middle: Nominal + Comparison Badge below nominal */}
						<div className="my-auto py-2">
							<div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
								{formatKpiCurrency(cashFlow.totalCashOut)}
							</div>
							<div className="mt-1.5 flex items-center gap-2">
								<span
									className={cn(
										"px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border-none",
										growth.cashOut <= 0
											? "bg-emerald-100/80 text-emerald-700"
											: "bg-rose-100/80 text-rose-700",
									)}
								>
									{growth.cashOut >= 0 ? (
										<TrendingUp className="w-3 h-3 text-rose-600" />
									) : (
										<TrendingDown className="w-3 h-3 text-emerald-600" />
									)}
									<span>
										{growth.cashOut >= 0
											? `+${Math.round(growth.cashOut)}%`
											: `${Math.round(growth.cashOut)}%`}
									</span>
								</span>
							</div>
						</div>

						{/* Bottom: Horizontal Capsule Segmented Bar */}
						<div>
							<ExpenseCategoryHorizontalBar
								segments={categorySegments}
								totalAmount={cashFlow.totalCashOut}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* ==================================================== */}
			{/* 4. MIDDLE SECTION: CASHFLOW CHART & SPENDING BREAKDOWN */}
			{/* 7 Cols Cashflow + 5 Cols Spending (Vela-finance style) */}
			{/* ==================================================== */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
				{/* Left Column (7 Cols): Cashflow Chart */}
				<div
					ref={heroChartRef}
					className="lg:col-span-7 bg-white rounded-2xl border-none p-5 sm:p-6 shadow-sm-md hover:shadow-md transition-all flex flex-col justify-between space-y-4 overflow-hidden"
				>
					<div>
						{/* Header: Title on left, Active Period on right */}
						<div className="flex items-center justify-between pb-3 gap-3">
							<div className="flex items-center gap-2">
								<div className="w-7 h-7 rounded-full bg-[#0e59f9] flex items-center justify-center">
									<TrendingUp className="w-4 h-4 text-white" />
								</div>
								<h3 className="text-base font-semibold text-slate-900 tracking-tight">
									Cashflow
								</h3>
							</div>

							<span className="text-xs font-normal text-slate-400 capitalize flex-shrink-0">
								{currentPeriodLabel}
							</span>
						</div>

						{/* Nominal Stat & Legend */}
						<div className="pt-3 pb-2 flex items-center justify-between flex-wrap gap-2">
							<div className="flex items-center gap-2.5">
								<div className="text-2xl font-semibold text-slate-900 tracking-tight">
									{formatKpiCurrency(cashFlow.netCashFlow)}
								</div>
								<span
									className={cn(
										"px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 border",
										growth.netCashFlow >= 0
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: "bg-rose-50 text-rose-700 border-rose-200",
									)}
								>
									{growth.netCashFlow >= 0 ? (
										<TrendingUp className="w-3 h-3 text-emerald-600" />
									) : (
										<TrendingDown className="w-3 h-3 text-rose-600" />
									)}
									<span>
										{growth.netCashFlow >= 0
											? `+${Math.round(growth.netCashFlow)}%`
											: `${Math.round(growth.netCashFlow)}%`}
									</span>
								</span>
							</div>

							{/* Dynamic Legend with Arrow Indicators */}
							<div className="flex items-center gap-3.5 text-xs text-slate-500">
								<div className="flex items-center gap-1.5">
									<span className="w-2.5 h-2.5 rounded-full bg-[#0e59f9]" />
									<span className="font-normal text-slate-700">Kas Masuk</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
									<span className="font-normal text-slate-700">Kas Keluar</span>
								</div>
							</div>
						</div>

						{/* Canvas Plot: Y-Axis + Diverging Bipolar Capsule Bars */}
						<div className="pt-7 sm:pt-8 flex items-stretch h-60 sm:h-64">
							{/* Y-Axis Column (5 symmetric ticks: +Max, +Half, 0, -Half, -Max) */}
							<div className="w-12 sm:w-14 flex-shrink-0 flex flex-col justify-between items-end pr-2.5 pb-6 select-none text-[10px] font-sans font-medium text-slate-400">
								{chartYTicks.map((tick, idx) => (
									<span
										key={idx}
										className={cn(
											"leading-none",
											idx === 2 ? "text-slate-500 font-semibold" : "",
										)}
									>
										{tick.label}
									</span>
								))}
							</div>

							{/* Graphic Plot Area */}
							<div className="flex-1 relative pb-6 min-w-0">
								<div className="relative w-full h-full">
									{/* Horizontal Baseline Dotted Gridlines (Zero tick is clean gap without solid line) */}
									<div className="absolute inset-0 pb-6 flex flex-col justify-between pointer-events-none">
										{chartYTicks.map((tick, idx) => (
											<div key={idx} className="w-full flex items-center">
												<div
													className={cn(
														"w-full",
														idx === 0 ||
															idx === 2 ||
															idx === chartYTicks.length - 1
															? "border-b border-transparent" // Clean: No line on top boundary, zero gap, or bottom boundary
															: "border-b border-dashed border-slate-100/80",
													)}
												/>
											</div>
										))}
									</div>

									{/* Floating Tooltip Overlay (Ultra-Minimalist, Positioned Above Bars Without Separator Lines) */}
									{activeHoverBucket && chartHoveredIndex !== null && (
										<div
											className="absolute z-30 pointer-events-none -top-4 sm:-top-5 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-xs text-white text-[11px] rounded-xl px-3 py-2 shadow-xl whitespace-nowrap border border-slate-800 transition-all duration-75"
											style={{
												left: `${Math.max(14, Math.min(86, ((chartHoveredIndex + 0.5) / Math.max(1, chartBuckets.length)) * 100))}%`,
											}}
										>
											<div className="font-semibold text-white tracking-tight">
												{activeHoverBucket.label}
											</div>
											<div className="text-[10px] text-slate-300 mt-1.5 space-y-1">
												<div className="flex items-center justify-between gap-4">
													<span className="flex items-center gap-1.5 text-slate-300">
														<span className="w-1.5 h-1.5 rounded-full bg-[#0e59f9]" />
														<span>Kas Masuk:</span>
													</span>
													<span className="font-semibold text-white font-numeric">
														{formatRupiah(activeHoverBucket.cashIn)}
													</span>
												</div>
												<div className="flex items-center justify-between gap-4">
													<span className="flex items-center gap-1.5 text-slate-300">
														<span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
														<span>Kas Keluar:</span>
													</span>
													<span className="font-semibold text-white font-numeric">
														{formatRupiah(activeHoverBucket.cashOut)}
													</span>
												</div>
												<div className="flex items-center justify-between gap-4 pt-0.5">
													<span className="text-slate-400">Arus Bersih:</span>
													<span
														className={cn(
															"font-semibold font-numeric",
															activeHoverBucket.netFlow >= 0
																? "text-emerald-400"
																: "text-rose-400",
														)}
													>
														{activeHoverBucket.netFlow >= 0 ? "+" : ""}
														{formatRupiah(activeHoverBucket.netFlow)}
													</span>
												</div>
											</div>
										</div>
									)}

									{/* Diverging Columns Row (1 Column Per Date) */}
									<div className="relative w-full h-full flex items-stretch justify-between px-0.5 sm:px-1 z-10">
										{chartBuckets.map((bucket, idx) => {
											const isHovered = chartHoveredIndex === idx;
											const inPercent =
												maxInflowValue > 0 && bucket.cashIn > 0
													? Math.min(
															100,
															Math.max(
																0,
																(bucket.cashIn / maxInflowValue) * 100,
															),
														)
													: 0;
											const outPercent =
												maxOutflowValue > 0 && bucket.cashOut > 0
													? Math.min(
															100,
															Math.max(
																0,
																(bucket.cashOut / maxOutflowValue) * 100,
															),
														)
													: 0;

											const n = chartBuckets.length;
											let dayNum = parseInt(
												bucket.date?.split("-")[2] || "",
												10,
											);
											if (isNaN(dayNum)) {
												const match = bucket.label.match(/\d+/);
												dayNum = match ? parseInt(match[0], 10) : idx + 1;
											}
											const showDateTick =
												n <= 14 ||
												idx === 0 ||
												idx === n - 1 ||
												(!isNaN(dayNum) && dayNum % 5 === 0) ||
												isHovered;

											return (
												<div
													key={bucket.key || idx}
													id={`cashflow-bar-col-${idx}`}
													data-chart-column={idx}
													onMouseEnter={() => setChartHoveredIndex(idx)}
													onMouseLeave={() => setChartHoveredIndex(null)}
													onPointerDown={() => setChartHoveredIndex(idx)}
													className="flex-1 min-w-0 flex flex-col items-center justify-stretch h-full cursor-pointer group relative"
												>
													{/* Upper Hemisphere: INFLOW BAR (Grows Upwards from Zero Gap) */}
													<div className="w-full flex-1 min-h-0 flex items-end justify-center relative">
														{/* Subtle Background Track (Reference Style) */}
														<div
															style={{
																width: `${dynamicBarWidth}px`,
																maxWidth: "84%",
															}}
															className={cn(
																"h-full rounded-[4px] sm:rounded-[5px] bg-slate-100/60 transition-colors duration-150 flex items-end justify-center relative",
																isHovered && "bg-slate-100",
															)}
														>
															{/* Active Inflow Bar (Refined rounded-[4px]/[5px], not overly rounded) */}
															<div
																style={{
																	height:
																		isHeroAnimated && inPercent > 0
																			? `${Math.max(4, inPercent)}%`
																			: "0%",
																	width: "100%",
																	transition:
																		"height 700ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease",
																	transitionDelay: `${Math.min(idx * 16, 220)}ms`,
																}}
																className={cn(
																	"rounded-[4px] sm:rounded-[5px] transition-all duration-150 relative",
																	inPercent > 0
																		? isHovered
																			? "bg-[#0b4de0] shadow-[0_2px_8px_rgba(14,89,249,0.35)]"
																			: "bg-[#0e59f9] group-hover:bg-[#0b4de0]"
																		: "bg-transparent",
																)}
															>
																{/* Hollow Ring Peak Indicator on Hover (Matching Image 2 Reference) */}
																{isHovered && inPercent > 0 && (
																	<div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-white bg-[#0e59f9] shadow-xs pointer-events-none z-10" />
																)}
															</div>
														</div>
													</div>

													{/* Center Zero Gap (Parallel Spacing Without Dividing Line) */}
													<div className="w-full h-1 sm:h-1 pointer-events-none flex-shrink-0" />

													{/* Lower Hemisphere: OUTFLOW BAR (Grows Downwards from Zero Gap) */}
													<div className="w-full flex-1 min-h-0 flex items-start justify-center relative">
														{/* Subtle Background Track */}
														<div
															style={{
																width: `${dynamicBarWidth}px`,
																maxWidth: "84%",
															}}
															className={cn(
																"h-full rounded-[4px] sm:rounded-[5px] bg-slate-100/60 transition-colors duration-150 flex items-start justify-center relative",
																isHovered && "bg-slate-100",
															)}
														>
															{/* Active Outflow Bar (Menuin Deep Slate Navy) */}
															<div
																style={{
																	height:
																		isHeroAnimated && outPercent > 0
																			? `${Math.max(4, outPercent)}%`
																			: "0%",
																	width: "100%",
																	transition:
																		"height 700ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease",
																	transitionDelay: `${Math.min(idx * 16 + 20, 240)}ms`,
																}}
																className={cn(
																	"rounded-[4px] sm:rounded-[5px] transition-all duration-150 relative",
																	outPercent > 0
																		? isHovered
																			? "bg-[#0f172a] shadow-[0_2px_8px_rgba(15,23,42,0.3)]"
																			: "bg-[#1e293b] group-hover:bg-[#0f172a]"
																		: "bg-transparent",
																)}
															>
																{/* Hollow Ring Bottom Indicator on Hover */}
																{isHovered && outPercent > 0 && (
																	<div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-white bg-[#1e293b] shadow-xs pointer-events-none z-10" />
																)}
															</div>
														</div>
													</div>

													{/* Date Tick Label under the column */}
													<div className="absolute -bottom-6 w-full flex justify-center text-center pointer-events-none">
														{showDateTick && (
															<span
																className={cn(
																	"text-[10px] select-none transition-colors duration-150 leading-none whitespace-nowrap",
																	isHovered
																		? "text-[#0e59f9] font-semibold"
																		: "text-slate-400 font-normal",
																)}
															>
																{!isNaN(dayNum) && currentTab !== "tahunan"
																	? dayNum
																	: bucket.label}
															</span>
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>

						{/* Bottom Status Info Row (Consistent with Sales Analytics) */}
						<div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 pl-12 sm:pl-14 ">
							<span>{chartBuckets[0]?.label || chartBuckets[0]?.date}</span>
							<span className="text-slate-300">
								{chartBuckets.length} Titik &bull;{" "}
								{currentTab === "tahunan" ? "Bulan" : "Hari"}
							</span>
							<span>
								{chartBuckets[chartBuckets.length - 1]?.label ||
									chartBuckets[chartBuckets.length - 1]?.date}
							</span>
						</div>
					</div>
				</div>

				{/* Right Column (5 Cols): Real Data Financial Breakdown & Dominance Pillars */}
				<div className="lg:col-span-5 bg-white rounded-2xl border-none p-5 sm:p-6 shadow-sm-md hover:shadow-md transition-all flex flex-col justify-between space-y-4">
					<div>
						{/* Header: Title + Controls (Atur Target & Flow Toggle) */}
						<div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2 flex-wrap">
							<div className="flex items-center gap-2">
								<div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-700">
									{analysisBreakdown.isExpense ? (
										<CreditCard className="w-4 h-4 text-slate-700" />
									) : (
										<Wallet className="w-4 h-4 text-slate-700" />
									)}
								</div>
								<div>
									<h3 className="text-base font-semibold text-slate-900 tracking-tight">
										{analysisBreakdown.isExpense ? "Pengeluaran" : "Pemasukan"}
									</h3>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{/* Flow Toggle: Pengeluaran | Pemasukan */}
								<div className="inline-flex items-center p-1 rounded-full bg-slate-100 border-none shadow-xs">
									<button
										type="button"
										onClick={() => setAnalysisFlow("EXPENSE")}
										className={cn(
											"px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
											analysisBreakdown.isExpense
												? "bg-[#1e293b] text-white shadow-xs"
												: "text-slate-600 hover:text-slate-900",
										)}
									>
										Pengeluaran
									</button>
									<button
										type="button"
										onClick={() => setAnalysisFlow("INCOME")}
										className={cn(
											"px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
											!analysisBreakdown.isExpense
												? "bg-[#1e293b] text-white shadow-xs"
												: "text-slate-600 hover:text-slate-900",
										)}
									>
										Pemasukan
									</button>
								</div>
							</div>
						</div>

						{/* Real Financial Headline (Reference style with big percentage / amount) */}
						<div className="pt-3 pb-3">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-semibold text-slate-900 tracking-tight font-sans">
									{analysisBreakdown.hasData
										? analysisBreakdown.headlinePct
										: 0}
									<span className="text-xl font-semibold">%</span>
								</span>
								<span className="text-xs text-slate-600 font-normal truncate">
									{analysisBreakdown.hasData ? (
										analysisBreakdown.anyHasTarget ? (
											<>
												{analysisBreakdown.isExpense
													? "Total terpakai"
													: "Total tercapai"}{" "}
												<strong className="font-semibold text-slate-900">
													{formatCompactRupiah(analysisBreakdown.totalSum)}
												</strong>{" "}
												dari target{" "}
												<strong className="font-semibold text-slate-900">
													{formatCompactRupiah(
														analysisBreakdown.totalTargetSum,
													)}
												</strong>
											</>
										) : (
											<>
												Total{" "}
												{analysisBreakdown.isExpense
													? "pengeluaran"
													: "pemasukan"}{" "}
												<strong className="font-semibold text-slate-900">
													{formatCompactRupiah(analysisBreakdown.totalSum)}
												</strong>{" "}
												&bull; Target belum diatur
											</>
										)
									) : (
										"Belum ada data pada rentang waktu ini"
									)}
								</span>
							</div>
							<div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
								<div className="flex items-center gap-1 font-medium">
									{analysisBreakdown.growthVal >= 0 ? (
										<TrendingUp className="w-3.5 h-3.5 text-[#0e59f9]" />
									) : (
										<TrendingDown className="w-3.5 h-3.5 text-slate-400" />
									)}
									<span>
										{analysisBreakdown.growthVal >= 0 ? "+" : ""}
										{analysisBreakdown.growthVal.toFixed(1)}% vs periode lalu
									</span>
								</div>
								
							</div>
						</div>

						{/* Pillar Containers: Dynamic 3 or 4 columns based on items length */}
						<div
							className={cn(
								"pt-2 grid gap-2 sm:gap-2.5 relative",
								analysisBreakdown.items.length === 3
									? "grid-cols-3"
									: "grid-cols-4",
							)}
						>
							{/* Overlay saat pengguna belum mengatur target sama sekali */}
							{!analysisBreakdown.anyHasTarget && (
								<div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 sm:p-6 text-center bg-white/75 backdrop-blur-[2.5px] rounded-2xl border border-dashed border-slate-300 shadow-2xs">
									<div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0e59f9] flex items-center justify-center shadow-2xs mb-2.5">
										<Target className="w-6 h-6 text-[#0e59f9]" />
									</div>
									<h4 className="text-sm font-semibold text-slate-900 tracking-tight">
										Target {analysisBreakdown.isExpense ? "Anggaran" : "Pemasukan"} Belum Diatur
									</h4>
									<p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
										Atur target bulanan per kategori untuk memantau persentase realisasi dan capaian {analysisBreakdown.isExpense ? "biaya" : "omzet"} toko.
									</p>
									<button
										type="button"
										onClick={() => handleOpenTargetModal(analysisFlow)}
										className="mt-3.5 h-10 px-5 rounded-full bg-[#0e59f9] text-white hover:bg-[#0b48cb] font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
									>
										<Target className="w-3.5 h-3.5" />
										<span>Atur Target Sekarang</span>
									</button>
								</div>
							)}

							{analysisBreakdown.items.map((item, idx) => {
								const isHovered = hoveredGroupKey === item.key;

								return (
									<div
										key={item.key || `pillar-${idx}`}
										data-pillar-key={item.key}
										className={cn(
											"flex flex-col gap-2 flex-1 relative group select-none cursor-pointer",
											!analysisBreakdown.anyHasTarget && "pointer-events-none",
										)}
										onMouseEnter={() => setHoveredGroupKey(item.key)}
										onMouseLeave={() => setHoveredGroupKey(null)}
										onClick={() =>
											setHoveredGroupKey(isHovered ? null : item.key)
										}
									>
										{/* Top Horizontal Pill Cap Accent (No hover ring) */}
										<div
											className={cn(
												"h-1.5 w-full rounded-full transition-colors",
												item.color.cap,
											)}
										/>

										{/* Seamless Track Container (No border or ring on hover) */}
										<div className="w-full h-60 sm:h-68 rounded-2xl bg-[#f1f5f9] overflow-hidden flex flex-col justify-end relative cursor-pointer">
											{/* Filled Bar: 0% is baseline 78px, grows proportionally up to 100% */}
											<div
												className={cn(
													"w-full rounded-2xl flex flex-col justify-end p-2 sm:p-2.5 transition-all duration-700 relative overflow-hidden",
													item.color.bar,
												)}
												style={{
													height: `calc(78px + (${Math.min(100, Math.max(0, item.percent))} / 100) * (100% - 78px))`,
													minHeight: "78px",
												}}
											>
												<div className="flex items-center justify-between gap-1 leading-none">
													<span className="text-sm sm:text-base font-semibold text-white tracking-tight font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
														{item.percent}%
													</span>
													{item.isOverBudget && (
														<span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider bg-rose-500 text-white px-1 py-0.2 rounded-full shadow-xs">
															Over
														</span>
													)}
												</div>
												<div
													className="text-[10px] sm:text-[11px] font-medium text-white/95 truncate mt-1 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
													title={item.name}
												>
													{item.shortName}
												</div>
												<div className="text-[9px] sm:text-[10px] text-white/80 truncate font-sans mt-0.5 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
													{item.hasTarget
														? `${formatCompactRupiah(item.amount)} / ${formatCompactRupiah(item.targetAmount)}`
														: `${formatCompactRupiah(item.amount)} / Rp 0`}
												</div>
											</div>
										</div>

										{/* Rich Hover/Tap Floating Detail Popover (Rincian kategori tanpa riwayat transaksi) */}
										<div
											className={cn(
												"absolute top-4 z-50 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5 text-slate-800 transition-all duration-200",
												"opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto",
												isHovered &&
													"opacity-100 scale-100 pointer-events-auto",
												analysisBreakdown.items.length === 3
													? idx === 0
														? "left-0"
														: idx === 1
															? "left-1/2 -translate-x-1/2"
															: "right-0"
													: idx === 0
														? "left-0"
														: idx === 1
															? "left-0 sm:-left-6"
															: idx === 2
																? "right-0 sm:-right-6"
																: "right-0",
											)}
										>
											{/* Colored Top Accent Bar */}
											<div
												className="absolute top-0 left-4 right-4 h-1 rounded-b-full"
												style={{ backgroundColor: item.color.hex }}
											/>

											{/* Header: Title, Total, Target */}
											<div className="pt-1 pb-2 border-b border-slate-100">
												<div className="flex items-center justify-between gap-1.5">
													<span className="text-xs font-semibold text-slate-900 truncate">
														{item.name}
													</span>
													<span
														className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shadow-2xs"
														style={{ backgroundColor: item.color.hex }}
													>
														{item.percent}%
													</span>
												</div>
												<div className="flex items-baseline justify-between mt-1">
													<span className="text-sm font-semibold text-slate-900 font-sans">
														{formatRupiah(item.amount)}
													</span>
													<span className="text-[10px] text-slate-500 font-sans">
														{item.hasTarget
															? `Target ${formatCompactRupiah(item.targetAmount)}`
															: "Tanpa target"}
													</span>
												</div>
												<p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
													{item.description}
												</p>
											</div>

											{/* Subcategories Breakdown */}
											<div className="pt-2 space-y-1.5">
												<div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
													Rincian Kategori Biaya
												</div>
												{item.categories.map((sub) => (
													<div key={sub.id} className="space-y-0.5">
														<div className="flex items-center justify-between text-[11px]">
															<span className="text-slate-600 truncate max-w-[150px]">
																{sub.label}
															</span>
															<span className="font-semibold text-slate-800 font-sans">
																{formatCompactRupiah(sub.amount)}
															</span>
														</div>
														<div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
															<div
																className="h-full rounded-full transition-all duration-500"
																style={{
																	width: `${sub.percentageInGroup}%`,
																	backgroundColor: item.color.hex,
																}}
															/>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* ==================================================== */}
			{/* 5. UPCOMING ROW (HORIZONTAL STRIP - VELA STYLE) */}
			{/* ==================================================== */}

			{/* ==================================================== */}
			{/* 6. CASH FLOW TRANSACTIONS TABLE (STANDAR UNIVERSAL MENUIN 3-ZONA) */}
			{/* ==================================================== */}
			<div className="space-y-4">
				{/* Zone 1: Toolbar Row (Left: Underline Tabs, Right: Search, Filter, Sort, Export, Tambah Biaya) */}
				<div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 gap-4">
					{/* Left: Underline Tabs */}
					<div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1">
						{cashFlowTabs.map((tab) => {
							const isActive = transactionTypeFilter === tab.key;
							return (
								<button
									key={tab.key}
									type="button"
									onClick={() => {
										setTransactionTypeFilter(tab.key);
										setCurrentPage(1);
									}}
									className={cn(
										"relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
										isActive
											? "text-blue-600 font-semibold"
											: "text-slate-500 hover:text-blue-600",
									)}
								>
									<span>{tab.label}</span>
									<span
										className={cn(
											"text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors",
											isActive
												? "bg-blue-50 text-blue-700"
												: "text-slate-400 bg-slate-100",
										)}
									>
										{tab.count}
									</span>
									{isActive && (
										<motion.div
											layoutId="activeCashFlowTabUnderline"
											className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
											transition={{ type: "spring", stiffness: 450, damping: 35 }}
										/>
									)}
								</button>
							);
						})}
					</div>

					{/* Right: Search, Filter Popover, Sort Dropdown, Export, & Tambah Biaya */}
					<div className="flex items-center gap-2 pb-2.5 lg:pb-3 flex-wrap">
						{/* Search Input */}
						<div className="relative w-full sm:w-56">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								type="text"
								placeholder="Search..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-9 h-9 text-xs rounded-full bg-white border-none shadow-sm-md focus-visible:ring-blue-600"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => {
										setSearchQuery("");
										setCurrentPage(1);
									}}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						{/* Filter Popover (Funnel icon) */}
						<Popover
							open={isFilterPopoverOpen}
							onOpenChange={setIsFilterPopoverOpen}
						>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className={cn(
										"h-9 w-9 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 relative cursor-pointer",
										hasActiveExtraFilters &&
											"bg-blue-50 text-blue-600",
									)}
									title="Filter Transaksi Arus Kas"
								>
									<Filter className="w-4 h-4 text-slate-600" />
									{hasActiveExtraFilters && (
										<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="end"
								className="w-80 p-4 rounded-2xl shadow-2xl border-none bg-white space-y-4"
							>
								<div className="flex items-center justify-between pb-2 border-b border-slate-100">
									<span className="text-xs font-semibold text-slate-900">
										Filter Tambahan
									</span>
									{hasActiveExtraFilters && (
										<button
											type="button"
											onClick={() => {
												setCategoryFilter("ALL");
												setPaymentMethodFilter("ALL");
												setCurrentPage(1);
											}}
											className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
										>
											Reset Filter
										</button>
									)}
								</div>

								{/* Kategori Filter */}
								<div className="space-y-1.5">
									<Label className="text-[11px] font-medium text-slate-500 uppercase">
										Kategori Arus Kas
									</Label>
									<div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
										{CASH_FLOW_FILTER_CATEGORIES.map((cat) => (
											<button
												key={cat.id}
												type="button"
												onClick={() => {
													setCategoryFilter(cat.id);
													setCurrentPage(1);
												}}
												className={cn(
													"py-1.5 px-2.5 text-xs rounded-full border-none text-center transition-colors cursor-pointer truncate",
													categoryFilter === cat.id
														? "bg-blue-600 text-white font-medium shadow-xs"
														: "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600",
												)}
											>
												{cat.label}
											</button>
										))}
									</div>
								</div>

								{/* Metode Pembayaran Filter */}
								<div className="space-y-1.5">
									<Label className="text-[11px] font-medium text-slate-500 uppercase">
										Metode Pembayaran
									</Label>
									<div className="grid grid-cols-3 gap-1.5">
										{CASH_FLOW_PAYMENT_METHODS.map((pm) => (
											<button
												key={pm.id}
												type="button"
												onClick={() => {
													setPaymentMethodFilter(pm.id);
													setCurrentPage(1);
												}}
												className={cn(
													"py-1.5 text-xs rounded-full border-none text-center transition-colors cursor-pointer truncate",
													paymentMethodFilter === pm.id
														? "bg-blue-600 text-white font-medium shadow-xs"
														: "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600",
												)}
											>
												{pm.label}
											</button>
										))}
									</div>
								</div>

								<div className="pt-2 border-t border-slate-100 flex justify-end">
									<Button
										size="sm"
										className="h-8 text-xs rounded-full px-4 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
										onClick={() => setIsFilterPopoverOpen(false)}
									>
										Terapkan
									</Button>
								</div>
							</PopoverContent>
						</Popover>

						{/* Sort Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="h-9 w-9 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 cursor-pointer"
									title="Urutkan Data"
								>
									<SlidersHorizontal className="w-4 h-4 text-slate-600" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-48 p-1.5 rounded-2xl shadow-2xl border-none bg-white"
							>
								<DropdownMenuItem
									className={cn(
										"text-xs py-2 px-3 rounded-xl cursor-pointer",
										sortBy === "newest" && "font-semibold text-blue-600 bg-blue-50",
									)}
									onClick={() => setSortBy("newest")}
								>
									Terbaru
								</DropdownMenuItem>
								<DropdownMenuItem
									className={cn(
										"text-xs py-2 px-3 rounded-xl cursor-pointer",
										sortBy === "oldest" && "font-semibold text-blue-600 bg-blue-50",
									)}
									onClick={() => setSortBy("oldest")}
								>
									Terlama
								</DropdownMenuItem>
								<DropdownMenuSeparator className="my-1 border-slate-100" />
								<DropdownMenuItem
									className={cn(
										"text-xs py-2 px-3 rounded-xl cursor-pointer",
										sortBy === "amount_high" && "font-semibold text-blue-600 bg-blue-50",
									)}
									onClick={() => setSortBy("amount_high")}
								>
									Nominal Terbesar
								</DropdownMenuItem>
								<DropdownMenuItem
									className={cn(
										"text-xs py-2 px-3 rounded-xl cursor-pointer",
										sortBy === "amount_low" && "font-semibold text-blue-600 bg-blue-50",
									)}
									onClick={() => setSortBy("amount_low")}
								>
									Nominal Terkecil
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Export Excel Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={handleExportExcel}
							className="h-9 px-3.5 rounded-full border-none shadow-sm-md bg-white text-xs font-medium gap-1.5 cursor-pointer text-slate-700 hover:bg-slate-100"
							title="Ekspor laporan ke file Excel"
						>
							<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
							<span className="hidden sm:inline">Export Excel</span>
						</Button>

						{/* Primary Action Button: Tambah Biaya */}
						<Button
							size="sm"
							onClick={() => {
								setModalMode("EXPENSE");
								setIsModalOpen(true);
							}}
							className="h-9 px-4 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-blue-600 text-white shadow-md gap-1.5 cursor-pointer"
						>
							<Plus className="w-3.5 h-3.5" />
							<span>Tambah Biaya</span>
						</Button>
					</div>
				</div>

				{/* Zone 2: Table Data Container */}
				<div className="rounded-2xl border-none bg-white overflow-hidden shadow-sm-md">
					<div className="relative w-full overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead>
								<tr className="bg-slate-50/70 text-slate-500 font-medium border-b border-slate-100">
									<th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap min-w-[200px]">
										Transaksi &amp; Kategori
									</th>
									<th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[140px]">
										Tipe Arus Kas
									</th>
									<th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[150px]">
										Tanggal &amp; Waktu
									</th>
									<th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap w-[140px]">
										Metode Pembayaran
									</th>
									<th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-right w-[140px]">
										Nominal
									</th>
									<th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-center w-[110px]">
										Status
									</th>
									<th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-right w-[60px] print:hidden">
										Aksi
									</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-slate-100">
								{paginatedTransactions.length > 0 ? (
									paginatedTransactions.map((trx) => {
										const isIncome = trx.type === "INCOME";
										const isCash =
											trx.paymentMethod === "TUNAI" ||
											trx.paymentMethod === "CASH";
										const isPosOrder = trx.category === "PENJUALAN";

										return (
											<tr
												key={trx.id}
												onClick={() => setSelectedDetailTransaction(trx)}
												className="hover:bg-slate-100/60 transition-colors cursor-pointer group"
											>
												{/* 1. Transaksi & Kategori */}
												<td className="py-3.5 px-4">
													<div className="flex flex-col min-w-0 max-w-[280px] sm:max-w-[340px]">
														<span
															className="font-semibold text-slate-900 text-xs truncate"
															title={trx.description}
														>
															{trx.description ||
																(isIncome
																	? "Pemasukan Kas"
																	: "Biaya Operasional")}
														</span>
														<span className="text-[10px] text-slate-400 truncate">
															{getCategoryLabel(trx.category)}
														</span>
													</div>
												</td>

												{/* 2. Tipe Arus Kas */}
												<td className="py-3.5 px-4 whitespace-nowrap">
													<span
														className={cn(
															"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-none text-[11px] font-medium",
															isIncome
																? "bg-emerald-100/80 text-emerald-700"
																: "bg-slate-100 text-slate-700",
														)}
													>
														{isIncome ? (
															<>
																<ArrowDownLeft className="w-3 h-3 text-emerald-600" />
																<span>Cash In</span>
															</>
														) : (
															<>
																<ArrowUpRight className="w-3 h-3 text-slate-500" />
																<span>Cash Out</span>
															</>
														)}
													</span>
												</td>

												{/* 3. Tanggal & Waktu */}
												<td className="py-3.5 px-4 whitespace-nowrap">
													<div className="flex flex-col">
														<span className="font-medium text-slate-800 text-xs">
															{formatTrxDate(trx.date)}
														</span>
														<span className="text-[10px] text-muted-foreground">
															{formatTrxTime(trx.date)}
														</span>
													</div>
												</td>

												{/* 4. Metode Pembayaran */}
												<td className="py-3.5 px-4 whitespace-nowrap">
													<span
														className={cn(
															"inline-flex items-center px-2.5 py-0.5 rounded-full border-none text-[11px] font-medium",
															isCash
																? "bg-slate-100 text-slate-700"
																: "bg-blue-50 text-blue-700",
														)}
													>
														{isCash
															? "Kasir Tunai"
															: formatPaymentMethodLabel(trx.paymentMethod)}
													</span>
												</td>

												{/* 5. Nominal */}
												<td
													className={cn(
														"py-3.5 px-4 text-right font-semibold tabular-nums text-xs whitespace-nowrap",
														isIncome
															? "text-emerald-600"
															: "text-slate-900",
													)}
												>
													{isIncome
														? `+${formatRupiah(trx.amount)}`
														: `-${formatRupiah(trx.amount)}`}
												</td>

												{/* 6. Status */}
												<td className="py-3.5 px-4 text-center whitespace-nowrap">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full border-none text-[11px] font-medium bg-emerald-100/80 text-emerald-700">
														Sukses
													</span>
												</td>

												{/* 7. Aksi (MoreVertical Dropdown) */}
												<td
													className="py-3.5 px-4 text-right whitespace-nowrap print:hidden"
													onClick={(e) => e.stopPropagation()}
												>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full cursor-pointer"
															>
																<span className="sr-only">Menu aksi</span>
																<MoreVertical className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align="end"
															className="w-44 p-1.5 rounded-2xl shadow-2xl border-none bg-white"
														>
															<DropdownMenuItem
																className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100 flex items-center gap-2"
																onClick={() => setSelectedDetailTransaction(trx)}
															>
																<Eye className="h-3.5 w-3.5 text-slate-500" />
																<span>Rincian arus kas</span>
															</DropdownMenuItem>

															{!isPosOrder && (
																<>
																	<DropdownMenuSeparator className="my-1 border-slate-100" />
																	<DropdownMenuItem
																		onClick={() =>
																			isIncome
																				? handleDeleteIncome(trx.id)
																				: handleDeleteExpense(trx.id)
																		}
																		className="text-xs font-medium py-2 px-3 rounded-xl cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2"
																	>
																		<Trash2 className="h-3.5 w-3.5 text-red-600" />
																		<span>Hapus catatan</span>
																	</DropdownMenuItem>
																</>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan={7} className="py-16 text-center text-muted-foreground">
											<div className="flex flex-col items-center justify-center space-y-2">
												<PackageSearch className="w-9 h-9 text-slate-300" />
												<p className="text-sm font-semibold text-slate-800">
													Tidak ada transaksi arus kas ditemukan
												</p>
												<p className="text-xs text-muted-foreground max-w-sm">
													Coba sesuaikan kata kunci pencarian atau ganti filter jenis arus kas / kategori.
												</p>
											</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Zone 3: Footer Pagination Bar */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
					{/* Left: Items Per Page Selector */}
					<div className="flex items-center gap-2 text-xs text-slate-500">
						<span>Items Per Page</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="h-8 px-3 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 text-xs font-medium gap-1.5 cursor-pointer text-slate-700"
								>
									<span>{itemsPerPage}</span>
									<ChevronDown className="w-3.5 h-3.5 text-slate-400" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="w-24 p-1.5 rounded-2xl shadow-2xl border-none bg-white"
							>
								{[10, 20, 50, 100].map((size) => (
									<DropdownMenuItem
										key={size}
										onClick={() => {
											setItemsPerPage(size);
											setCurrentPage(1);
										}}
										className={cn(
											"text-xs py-1.5 px-3 rounded-xl cursor-pointer",
											itemsPerPage === size && "font-semibold text-blue-600 bg-blue-50",
										)}
									>
										{size}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Right: Page Numbers < 1 2 3 ... 8 > */}
					{totalPages > 1 && (
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon"
								disabled={currentPage === 1}
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								className="h-8 w-8 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-all aspect-square"
								aria-label="Halaman sebelumnya"
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>

							{getPaginationNumbers().map((pageItem, index) => {
								if (pageItem === "...") {
									return (
										<span
											key={`ellipsis-${index}`}
											className="w-6 text-center text-xs text-slate-400 select-none"
										>
											...
										</span>
									);
								}
								const pageNum = pageItem as number;
								const isCurrent = pageNum === currentPage;
								return (
									<button
										key={pageNum}
										type="button"
										onClick={() => setCurrentPage(pageNum)}
										className={cn(
											"h-8 w-8 text-xs rounded-full font-medium transition-all cursor-pointer flex items-center justify-center aspect-square",
											isCurrent
												? "bg-[#0e59f9] text-white font-semibold shadow-md hover:bg-[#0b4de0]"
												: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
										)}
									>
										{pageNum}
									</button>
								);
							})}

							<Button
								variant="outline"
								size="icon"
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								className="h-8 w-8 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-all aspect-square"
								aria-label="Halaman berikutnya"
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Detail Modal for Selected Cash Flow Item */}
			<Dialog
				open={!!selectedDetailTransaction}
				onOpenChange={(open) => {
					if (!open) setSelectedDetailTransaction(null);
				}}
			>
				<DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-2xl bg-white">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold text-slate-900">
							Rincian Transaksi Arus Kas
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Informasi detail pencatatan arus kas operasional outlet.
						</DialogDescription>
					</DialogHeader>

					{selectedDetailTransaction && (
						<div className="space-y-4 pt-2">
							<div className="p-4 rounded-2xl bg-slate-50 border-none shadow-xs space-y-2.5">
								<div className="flex items-center justify-between text-xs">
									<span className="text-slate-500">Tipe Arus Kas</span>
									<span
										className={cn(
											"inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full border-none text-[11px]",
											selectedDetailTransaction.type === "INCOME"
												? "bg-emerald-100/80 text-emerald-700"
												: "bg-slate-200 text-slate-700",
										)}
									>
										{selectedDetailTransaction.type === "INCOME" ? (
											<>
												<ArrowDownLeft className="w-3 h-3 text-emerald-600" />
												<span>Pemasukan (Cash In)</span>
											</>
										) : (
											<>
												<ArrowUpRight className="w-3 h-3 text-slate-500" />
												<span>Pengeluaran (Cash Out)</span>
											</>
										)}
									</span>
								</div>
								<div className="flex items-center justify-between text-xs">
									<span className="text-slate-500">Nominal</span>
									<span
										className={cn(
											"font-semibold text-sm tabular-nums",
											selectedDetailTransaction.type === "INCOME"
												? "text-emerald-600"
												: "text-slate-900",
										)}
									>
										{selectedDetailTransaction.type === "INCOME"
											? `+${formatRupiah(selectedDetailTransaction.amount)}`
											: `-${formatRupiah(selectedDetailTransaction.amount)}`}
									</span>
								</div>
								<div className="flex items-center justify-between text-xs">
									<span className="text-slate-500">Status</span>
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full border-none text-[11px] font-medium bg-emerald-100/80 text-emerald-700">
										Sukses
									</span>
								</div>
							</div>

							<div className="space-y-2 text-xs divide-y divide-slate-100">
								<div className="flex justify-between py-2">
									<span className="text-slate-500">Keterangan</span>
									<span className="font-medium text-slate-800 text-right max-w-[220px]">
										{selectedDetailTransaction.description || "-"}
									</span>
								</div>
								<div className="flex justify-between py-2">
									<span className="text-slate-500">Kategori</span>
									<span className="font-medium text-slate-800">
										{getCategoryLabel(selectedDetailTransaction.category)}
									</span>
								</div>
								<div className="flex justify-between py-2">
									<span className="text-slate-500">Metode Pembayaran</span>
									<span
										className={cn(
											"inline-flex items-center px-2.5 py-0.5 rounded-full border-none text-[11px] font-medium",
											selectedDetailTransaction.paymentMethod === "TUNAI" ||
												selectedDetailTransaction.paymentMethod === "CASH"
												? "bg-slate-100 text-slate-700"
												: "bg-blue-50 text-blue-700",
										)}
									>
										{formatPaymentMethodLabel(
											selectedDetailTransaction.paymentMethod,
										)}
									</span>
								</div>
								<div className="flex justify-between py-2">
									<span className="text-slate-500">Tanggal &amp; Waktu</span>
									<span className="font-medium text-slate-800">
										{formatTrxDate(selectedDetailTransaction.date)}
										{formatTrxTime(selectedDetailTransaction.date)
											? `, ${formatTrxTime(selectedDetailTransaction.date)}`
											: ""}
									</span>
								</div>
								<div className="flex justify-between py-2">
									<span className="text-slate-500">ID Referensi</span>
									<span className="font-mono text-[11px] text-slate-400">
										{selectedDetailTransaction.id}
									</span>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedDetailTransaction(null)}
							className="rounded-full border-none shadow-sm-md hover:bg-slate-100 text-slate-700 text-xs h-9 px-5 cursor-pointer"
						>
							Tutup
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>


			{/* ==================================================== */}
			{/* 8. MODAL: CATAT TRANSAKSI KAS (PEMASUKAN / PENGELUARAN) */}
			{/* ==================================================== */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl p-6">
					<DialogHeader>
						<DialogTitle className="text-lg font-semibold text-slate-900">
							{modalMode === "INCOME"
								? "Catat Pemasukan Kas Toko"
								: "Catat Pengeluaran Biaya Outlet"}
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							{modalMode === "INCOME"
								? "Pemasukan kas tunai akan otomatis dicatat ke shift kasir yang sedang aktif."
								: "Pengeluaran tunai akan otomatis tercatat ke laci kasir jika shift kasir sedang aktif."}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleFormSubmit} className="space-y-4 py-2">
						{modalMode === "EXPENSE" ? (
							<div className="space-y-1.5 relative">
								<Label className="text-xs font-semibold text-slate-700">
									Kategori Biaya
								</Label>

								{/* Clean Modern Dropdown Trigger */}
								<div className="relative">
									<button
										type="button"
										onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
										className="w-full h-10 px-4 rounded-full border-none shadow-sm-md bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0e59f9]"
									>
										<span className="text-xs font-semibold text-slate-800">
											{EXPENSE_CATEGORIES.find((c) => c.id === category)
												?.label || category}
										</span>
										<ChevronDown
											className={cn(
												"w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200",
												isCategoryMenuOpen && "rotate-180 text-slate-700",
											)}
										/>
									</button>

									{/* Dropdown Menu Panel with Backdrop */}
									{isCategoryMenuOpen && (
										<>
											<div
												className="fixed inset-0 z-40"
												onClick={() => setIsCategoryMenuOpen(false)}
											/>
											<div className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-white rounded-2xl border-none shadow-2xl max-h-56 overflow-y-auto space-y-0.5">
												{EXPENSE_CATEGORIES.map((cat) => {
													const isSelected = category === cat.id;

													return (
														<button
															key={cat.id}
															type="button"
															onClick={() => {
																setCategory(cat.id);
																setIsCategoryMenuOpen(false);
															}}
															className={cn(
																"w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer text-xs",
																isSelected
																	? "bg-blue-50 text-[#0e59f9] font-semibold"
																	: "hover:bg-slate-50 text-slate-700 font-medium",
															)}
														>
															<span>{cat.label}</span>
															{isSelected && (
																<Check className="w-4 h-4 text-[#0e59f9] flex-shrink-0 ml-2" />
															)}
														</button>
													);
												})}
											</div>
										</>
									)}
								</div>
							</div>
						) : (
							<div className="space-y-1.5 relative">
								<Label className="text-xs font-semibold text-slate-700">
									Kategori Pemasukan
								</Label>

								{/* Clean Modern Dropdown Trigger */}
								<div className="relative">
									<button
										type="button"
										onClick={() => setIsIncomeCategoryMenuOpen((prev) => !prev)}
										className="w-full h-10 px-4 rounded-full border-none shadow-sm-md bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0e59f9]"
									>
										<span className="text-xs font-semibold text-slate-800">
											{INCOME_CATEGORIES.find((c) => c.id === incomeCategory)
												?.label || incomeCategory}
										</span>
										<ChevronDown
											className={cn(
												"w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200",
												isIncomeCategoryMenuOpen && "rotate-180 text-slate-700",
											)}
										/>
									</button>

									{/* Dropdown Menu Panel with Backdrop */}
									{isIncomeCategoryMenuOpen && (
										<>
											<div
												className="fixed inset-0 z-40"
												onClick={() => setIsIncomeCategoryMenuOpen(false)}
											/>
											<div className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-white rounded-2xl border-none shadow-2xl max-h-56 overflow-y-auto space-y-0.5">
												{INCOME_CATEGORIES.map((cat) => {
													const isSelected = incomeCategory === cat.id;

													return (
														<button
															key={cat.id}
															type="button"
															onClick={() => {
																setIncomeCategory(cat.id);
																setIsIncomeCategoryMenuOpen(false);
															}}
															className={cn(
																"w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer text-xs",
																isSelected
																	? "bg-blue-50 text-[#0e59f9] font-semibold"
																	: "hover:bg-slate-50 text-slate-700 font-medium",
															)}
														>
															<span>{cat.label}</span>
															{isSelected && (
																<Check className="w-4 h-4 text-[#0e59f9] flex-shrink-0 ml-2" />
															)}
														</button>
													);
												})}
											</div>
										</>
									)}
								</div>
							</div>
						)}

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								{modalMode === "INCOME"
									? "Nominal Pemasukan (Rp)"
									: "Nominal Pengeluaran (Rp)"}
							</Label>
							<Input
								type="number"
								placeholder={
									modalMode === "INCOME" ? "Contoh: 1000000" : "Contoh: 150000"
								}
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								required
								min={1}
								className="h-10 text-xs rounded-full border-none shadow-sm-md bg-slate-50 px-4 focus-visible:ring-blue-600"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								{modalMode === "INCOME"
									? "Rekening / Saluran Penerimaan"
									: "Sumber Pembayaran"}
							</Label>
							<div className="grid grid-cols-3 gap-2">
								{["TUNAI", "BANK_TRANSFER", "EWALLET"].map((method) => (
									<button
										key={method}
										type="button"
										onClick={() => setPaymentMethod(method)}
										className={cn(
											"py-2 rounded-full text-xs font-semibold border-none transition-all text-center cursor-pointer shadow-xs",
											paymentMethod === method
												? "bg-[#0e59f9] text-white shadow-md"
												: "bg-slate-100 text-slate-700 hover:bg-slate-200",
										)}
									>
										{method === "TUNAI"
											? "Kasir Tunai"
											: method === "BANK_TRANSFER"
												? "Transfer Bank"
												: "E-Wallet"}
									</button>
								))}
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								{modalMode === "INCOME"
									? "Keterangan Pemasukan"
									: "Deskripsi / Keperluan"}
							</Label>
							<Input
								placeholder={
									modalMode === "INCOME"
										? "Contoh: Tambahan modal kembalian / Suntikan dana pemilik"
										: "Contoh: Belanja es batu & kantong kresek"
								}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								required
								className="h-10 text-xs rounded-full border-none shadow-sm-md bg-slate-50 px-4 focus-visible:ring-blue-600"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								{modalMode === "INCOME"
									? "Tanggal Pemasukan"
									: "Tanggal Pengeluaran"}
							</Label>
							<Input
								type="date"
								value={modalMode === "INCOME" ? incomeDate : expenseDate}
								onChange={(e) =>
									modalMode === "INCOME"
										? setIncomeDate(e.target.value)
										: setExpenseDate(e.target.value)
								}
								required
								className="h-10 text-xs rounded-full border-none shadow-sm-md bg-slate-50 px-4 focus-visible:ring-blue-600"
							/>
						</div>

						<DialogFooter className="pt-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsModalOpen(false)}
								className="h-9 px-5 text-xs font-medium cursor-pointer rounded-full border-none shadow-sm-md hover:bg-slate-100 text-slate-700"
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="h-9 px-5 text-xs font-semibold bg-[#0e59f9] hover:bg-[#0c4cd4] text-white cursor-pointer rounded-full shadow-md"
							>
								{isSubmitting
									? "Menyimpan..."
									: modalMode === "INCOME"
										? "Simpan Pemasukan"
										: "Simpan Pengeluaran"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Target Anggaran & Pemasukan Modal */}
			<Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
				<DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 shadow-2xl border-none">
					<DialogHeader className="space-y-1">
						<div className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-full bg-blue-50 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
								<Target className="w-4 h-4 text-[#0e59f9]" />
							</div>
							<div>
								<DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
									Atur Target{" "}
									{targetFlowTab === "EXPENSE"
										? "Anggaran Pengeluaran"
										: "Pemasukan & Omzet"}
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500">
									Target bulanan untuk memonitor realisasi belanja &amp; omzet
									toko.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{/* Tab Selector inside Modal: Pengeluaran | Pemasukan */}
					<div className="inline-flex w-full p-1 rounded-full bg-slate-100 border-none shadow-xs mt-1">
						<button
							type="button"
							onClick={() => handleSwitchTargetModalTab("EXPENSE")}
							className={cn(
								"flex-1 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
								targetFlowTab === "EXPENSE"
									? "bg-[#1e293b] text-white shadow-xs"
									: "text-slate-600 hover:text-slate-900",
							)}
						>
							Target Anggaran Biaya
						</button>
						<button
							type="button"
							onClick={() => handleSwitchTargetModalTab("INCOME")}
							className={cn(
								"flex-1 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
								targetFlowTab === "INCOME"
									? "bg-[#1e293b] text-white shadow-xs"
									: "text-slate-600 hover:text-slate-900",
							)}
						>
							Target Pemasukan
						</button>
					</div>

					{/* List of Category Inputs */}
					<div className="max-h-[360px] overflow-y-auto pr-1 space-y-3 py-1">
						{targetFlowTab === "EXPENSE"
							? EXPENSE_GROUPS.map((grp) => (
									<div key={grp.id} className="space-y-1.5">
										<div className="flex items-center gap-1.5 px-1 pt-1">
											<span
												className="w-2 h-2 rounded-full flex-shrink-0"
												style={{ backgroundColor: grp.color.hex }}
											/>
											<span className="text-xs font-semibold text-slate-800">
												{grp.name}
											</span>
											<span className="text-[10px] text-slate-400">
												&bull; {grp.shortName}
											</span>
										</div>

										<div className="space-y-1.5">
											{grp.categoryIds.map((catId) => {
												const cat = EXPENSE_CATEGORIES.find(
													(c) => c.id === catId,
												);
												if (!cat) return null;
												const currentVal = targetBudgetsInput[cat.id] || "";
												const formattedVal = currentVal
													? formatNumber(currentVal)
													: "";

												return (
													<div
														key={cat.id}
														className="p-2 sm:p-2.5 rounded-2xl bg-slate-50 border-none shadow-xs flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
													>
														<div className="min-w-0 flex-1">
															<Label className="text-xs font-semibold text-slate-800 block truncate">
																{cat.label}
															</Label>
															<span className="text-[10px] text-slate-400 block truncate">
																Batas anggaran bulanan
															</span>
														</div>

														<div className="w-36 sm:w-40 flex-shrink-0 relative">
															<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
																Rp
															</span>
															<Input
																type="text"
																inputMode="numeric"
																placeholder="0"
																value={formattedVal}
																onChange={(e) => {
																	const raw = e.target.value.replace(/\D/g, "");
																	setTargetBudgetsInput((prev) => ({
																		...prev,
																		[cat.id]: raw,
																	}));
																}}
																className="h-8 pl-8 pr-2.5 text-right text-xs font-semibold font-sans bg-white border-none shadow-sm-md rounded-full focus-visible:ring-[#0e59f9]"
															/>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								))
							: INCOME_CATEGORIES.map((cat) => {
									const currentVal = targetBudgetsInput[cat.id] || "";
									const formattedVal = currentVal
										? formatNumber(currentVal)
										: "";

									return (
										<div
											key={cat.id}
											className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 border-none shadow-xs flex items-center justify-between gap-3"
										>
											<div className="min-w-0 flex-1">
												<Label className="text-xs font-semibold text-slate-800 block truncate">
													{cat.label}
												</Label>
												<span className="text-[10px] text-slate-400 block truncate">
													Target omzet bulanan
												</span>
											</div>

											<div className="w-36 sm:w-40 flex-shrink-0 relative">
												<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
													Rp
												</span>
												<Input
													type="text"
													inputMode="numeric"
													placeholder="0"
													value={formattedVal}
													onChange={(e) => {
														const raw = e.target.value.replace(/\D/g, "");
														setTargetBudgetsInput((prev) => ({
															...prev,
															[cat.id]: raw,
														}));
													}}
													className="h-8 pl-8 pr-2.5 text-right text-xs font-semibold font-sans bg-white border-none shadow-sm-md rounded-full focus-visible:ring-[#0e59f9]"
												/>
											</div>
										</div>
									);
								})}
					</div>

					{/* Summary Live Calculation Footer */}
					<div className="p-3 rounded-2xl bg-blue-50/60 border-none shadow-xs flex items-center justify-between text-xs">
						<span className="text-slate-600 font-medium">
							Total Target{" "}
							{targetFlowTab === "EXPENSE" ? "Anggaran" : "Pemasukan"}:
						</span>
						<span className="font-semibold text-slate-900 font-sans">
							{formatRupiah(
								Object.values(targetBudgetsInput).reduce(
									(acc, curr) => acc + (parseFloat(curr) || 0),
									0,
								),
							)}
						</span>
					</div>

					<DialogFooter className="gap-2 sm:gap-0 pt-1">
						<Button
							type="button"
							variant="outline"
							disabled={isSavingBudgets}
							onClick={() => setIsTargetModalOpen(false)}
							className="h-9 px-5 text-xs font-medium cursor-pointer rounded-full border-none shadow-sm-md hover:bg-slate-100 text-slate-700"
						>
							Batal
						</Button>
						<Button
							type="button"
							disabled={isSavingBudgets}
							onClick={handleSaveTargetBudgets}
							className="h-9 px-5 text-xs font-semibold bg-[#0e59f9] hover:bg-[#0c4cd4] text-white cursor-pointer rounded-full shadow-md"
						>
							{isSavingBudgets ? "Menyimpan..." : "Simpan Target"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
	updateOrderStatus,
	updateOrderItemStatus,
	syncOrderPaymentStatus,
	bulkUpdateOrderStatus,
	getActiveOrders,
	getOrderById,
	getOrderByNumberForOutlet,
	confirmOrderPaymentAtCashier,
} from "@/lib/actions/orders";
import { toast } from "sonner";
import {
	Clock,
	ChefHat,
	CheckCircle2,
	ChevronRight,
	Check,
	CheckCheck,
	CreditCard,
	Search,
	X,
	XCircle,
	UtensilsCrossed,
	Store,
	ShoppingBag,
	User,
	Printer,
	ReceiptText,
	RefreshCw,
	Loader2,
	AlertCircle,
	Camera,
	Filter,
	SlidersHorizontal,
	ChevronDown,
	Kanban,
	LayoutGrid,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	ReceiptPrinter,
	ReceiptData,
	TenantReceiptSettings,
} from "@/features/pos/components/receipt-printer";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { OrderCameraScannerDialog } from "./order-camera-scanner-dialog";
import { OrderPaymentModal } from "./order-payment-modal";
import {
	playScanSuccessBeep,
	playScanErrorBeep,
	playScanWarningBeep,
} from "@/lib/utils/sound";
import { formatPaymentMethodLabel } from "@/lib/utils/format";
import {
	formatTableDisplay,
	formatQueueNumber,
} from "@/lib/orders/queue-number";

import { cn } from "@/lib/utils";

type OrderItem = {
	id: string;
	transactionId: string;
	productId?: string;
	quantity: number;
	price?: string;
	productName: string;
	subtotal: string;
	modifiers?: any;
	notes?: string | null;
	isCompleted: boolean;
};

type Order = {
	id: string;
	tenantId: string;
	source?: string | null;
	cashierMembershipId?: string | null;
	totalAmount: string;
	discount?: string | null;
	tax?: string | null;
	serviceCharge?: string | null;
	platformFee?: string | null;
	rounding?: string | null;
	grandTotal: string;
	promoCode?: string | null;
	status: string;
	orderType: string;
	paymentMethod: string;
	paymentStatus: string;
	orderNumber: string | null;
	tableNumber: string | null;
	queueNumber?: number | null;
	customerName: string | null;
	createdAt: Date;
	items: OrderItem[];
};

type OrderTypeFilter = "DINE_IN" | "TAKEAWAY" | "ONLINE";
const ALL_FILTER_TYPES: OrderTypeFilter[] = ["DINE_IN", "TAKEAWAY", "ONLINE"];

type KanbanBoardProps = {
	initialOrders: Order[];
	tenantId: string;
	cashierName?: string;
	receiptSettings?: TenantReceiptSettings;
};

function formatOrderTime(dateInput: Date | string): string {
	try {
		const date =
			typeof dateInput === "string" ? new Date(dateInput) : dateInput;
		return (
			new Intl.DateTimeFormat("id-ID", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			}).format(date) + " WIB"
		);
	} catch {
		return "--:--";
	}
}

function formatOrderFullDate(dateInput: Date | string): string {
	try {
		const date =
			typeof dateInput === "string" ? new Date(dateInput) : dateInput;
		return new Intl.DateTimeFormat("id-ID", {
			weekday: "short",
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(date);
	} catch {
		return "";
	}
}

function formatElapsed(dateInput: Date | string): string {
	try {
		const date =
			typeof dateInput === "string" ? new Date(dateInput) : dateInput;
		const now = new Date();
		const diffMin = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		if (diffMin < 1) return "Baru saja";
		if (diffMin < 60) return `${diffMin}m lalu`;
		const diffHours = Math.floor(diffMin / 60);
		if (diffHours < 24) return `${diffHours}j lalu`;
		return formatOrderTime(date);
	} catch {
		return "";
	}
}

function formatTableLabel(tableNumber: string | null | undefined): string {
	if (!tableNumber) return "";
	const trimmed = tableNumber.trim();
	if (trimmed.toLowerCase().startsWith("meja")) {
		return trimmed;
	}
	return `Meja ${trimmed}`;
}

function getOrderSource(order: {
	source?: string | null;
	cashierMembershipId?: string | null;
	orderType?: string | null;
}) {
	const src = (order.source || "").toUpperCase();
	if (src === "POS" || src === "CASHIER") {
		return {
			label: "Kasir",
			isSelfOrder: false,
		};
	}
	if (
		src === "ONLINE" ||
		src === "STOREFRONT" ||
		src === "QR" ||
		src === "WEB_ORDER" ||
		src === "SELF_ORDER"
	) {
		return {
			label: "Self Order",
			isSelfOrder: true,
		};
	}
	// Heuristic fallback: if no cashier assigned or orderType is ONLINE, it's a self order from storefront
	if (!order.cashierMembershipId || order.orderType === "ONLINE") {
		return {
			label: "Self Order",
			isSelfOrder: true,
		};
	}
	return {
		label: "Kasir",
		isSelfOrder: false,
	};
}

export type KanbanStatusFilter = "ALL" | "PENDING" | "NEW" | "PROCESSING" | "READY";
export type KanbanViewMode = "kanban" | "list";

export type StatusConfigItem = {
	title: string;
	status: string;
	nextStatus: string;
	actionText: string;
	icon: React.ReactNode;
	accentColor: { badge: string; iconBg: string; button: string };
};

export const STATUS_CONFIG_MAP: Record<string, StatusConfigItem> = {
	PENDING: {
		title: "Menunggu Pesanan",
		status: "PENDING",
		nextStatus: "NEW",
		actionText: "Bayar",
		icon: <CreditCard className="w-3.5 h-3.5 text-white" />,
		accentColor: {
			badge: "bg-slate-100 text-slate-800",
			iconBg: "bg-slate-900",
			button: "bg-slate-900 hover:bg-black text-white shadow-xs",
		},
	},
	NEW: {
		title: "Pesanan Baru",
		status: "NEW",
		nextStatus: "PROCESSING",
		actionText: "Mulai Siapkan",
		icon: <Clock className="w-3.5 h-3.5 text-white" />,
		accentColor: {
			badge: "bg-blue-50 text-blue-700",
			iconBg: "bg-blue-600",
			button: "bg-blue-600 hover:bg-blue-700 text-white",
		},
	},
	PROCESSING: {
		title: "Sedang Disiapkan",
		status: "PROCESSING",
		nextStatus: "READY",
		actionText: "Tandai Siap",
		icon: <ChefHat className="w-3.5 h-3.5 text-white" />,
		accentColor: {
			badge: "bg-amber-50 text-amber-700",
			iconBg: "bg-amber-500",
			button: "bg-amber-600 hover:bg-amber-700 text-white",
		},
	},
	READY: {
		title: "Siap Disajikan",
		status: "READY",
		nextStatus: "COMPLETED",
		actionText: "Selesaikan",
		icon: <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />,
		accentColor: {
			badge: "bg-emerald-50 text-emerald-700",
			iconBg: "bg-emerald-600",
			button: "bg-emerald-600 hover:bg-emerald-700 text-white",
		},
	},
};

export const COLUMNS: StatusConfigItem[] = [
	STATUS_CONFIG_MAP.PENDING,
	STATUS_CONFIG_MAP.NEW,
	STATUS_CONFIG_MAP.PROCESSING,
	STATUS_CONFIG_MAP.READY,
];

interface OrderCardProps {
	order: Order;
	showStatusHeader?: boolean;
	uniformHeight?: boolean;
	statusConfig: StatusConfigItem;
	onSelect: () => void;
	onToggleItem: (itemId: string, isCompleted: boolean) => void;
	onAdvanceStatus: (e: React.MouseEvent) => void;
	onCheckOnlinePayment?: (e: React.MouseEvent) => void;
	isUpdating?: boolean;
	isSyncingOnline?: boolean;
}

const OrderCard = React.memo(function OrderCard({
	order,
	showStatusHeader = false,
	uniformHeight = false,
	statusConfig,
	onSelect,
	onToggleItem,
	onAdvanceStatus,
	onCheckOnlinePayment,
	isUpdating = false,
	isSyncingOnline = false,
}: OrderCardProps) {
	const isOnline = order.orderType === "ONLINE";
	const isPendingOnline =
		order.status === "PENDING" &&
		(isOnline || order.paymentMethod === "ONLINE");

	const queueLabel = formatQueueNumber(order.queueNumber, 3);
	const tableDisplay = formatTableDisplay(order.tableNumber, order.orderType);

	return (
		<div
			onClick={onSelect}
			className="group cursor-pointer bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between gap-3 relative transition-colors"
		>
			<div>
				{/* Status Header: Displayed at the very top of the card on List Card mode */}
				{showStatusHeader && (
					<div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
						<div className="flex items-center gap-2 min-w-0">
							<div
								className={cn(
									"w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs text-white",
									statusConfig.accentColor.iconBg,
								)}
							>
								{statusConfig.icon}
							</div>
							<span className="font-semibold text-xs text-foreground tracking-tight truncate">
								{statusConfig.title}
							</span>
						</div>
						<span
							className={cn(
								"text-[11px] font-semibold px-2 py-0.5 rounded-full border-0 tabular-nums shrink-0",
								statusConfig.accentColor.badge,
							)}
						>
							{statusConfig.actionText}
						</span>
					</div>
				)}

				{/* Header: Two cleanly aligned rows */}
				<div className="space-y-1">
					{/* Baris 1: Nama Pelanggan (kiri) sejajar dengan Nomor Antrean (kanan) */}
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-sm font-semibold text-slate-900 truncate leading-snug">
							{order.customerName || "Tamu / Umum"}
						</span>
						<span className="text-sm font-semibold text-slate-900 tracking-tight tabular-nums shrink-0">
							{queueLabel}
						</span>
					</div>

					{/* Baris 2: Nomor Order/Struk (kiri) sejajar dengan Nomor Meja / Order Type (kanan) */}
					<div className="flex items-center justify-between gap-2">
						<span className="text-[12px] text-slate-500 font-sans font-medium">
							#{order.orderNumber || "-"}
						</span>
						<span className="inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md tracking-tight shrink-0">
							{tableDisplay}
						</span>
					</div>
				</div>

				{/* Date and Time Row */}
				<div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-2 pb-1">
					<span>{formatOrderFullDate(order.createdAt)}</span>
					<span>{formatOrderTime(order.createdAt)}</span>
				</div>

				{/* Items List Table (Header: Items, Qty, Price) */}
				<div className="pt-2 border-t border-slate-100">
					<div className="grid grid-cols-12 text-[10px] font-medium text-slate-400 pb-1 border-b border-slate-100 px-1">
						<span className="col-span-7">Items</span>
						<span className="col-span-2 text-center">Qty</span>
						<span className="col-span-3 text-right">Price</span>
					</div>

					{/* Fixed 3-item height on List Card mode, dynamic auto height on Kanban Board */}
					<div
						className={cn(
							"overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-hide space-y-1 pt-1",
							uniformHeight
								? "h-[88px] min-h-[88px] max-h-[88px]"
								: "max-h-36",
						)}
					>
						{order.items.length === 0 ? (
							<div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/60 italic">
								Tidak ada item menu
							</div>
						) : (
							order.items.map((item) => (
								<div
									key={item.id}
									className="grid grid-cols-12 items-center text-xs py-1 px-1 group/item cursor-pointer hover:bg-slate-100 rounded transition-colors"
									onClick={(e) => {
										e.stopPropagation();
										onToggleItem(item.id, !item.isCompleted);
									}}
									title="Klik untuk menandai menu selesai/belum"
								>
									<div className="col-span-7 flex items-center gap-1.5 min-w-0 pr-1">
										<div
											className={cn(
												"w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors",
												item.isCompleted
													? "bg-blue-600 border-blue-600 text-white"
													: "border-slate-300 bg-white opacity-70 group-hover/item:opacity-100",
											)}
										>
											{item.isCompleted && (
												<Check className="w-2.5 h-2.5 stroke-[2.5]" />
											)}
										</div>
										<span
											className={cn(
												"truncate text-xs leading-tight",
												item.isCompleted
													? "line-through text-slate-400"
													: "text-slate-800 font-normal",
											)}
										>
											{item.productName}
										</span>
									</div>
									<span className="col-span-2 text-center text-xs font-medium text-slate-600 tabular-nums">
										{item.quantity}
									</span>
									<span className="col-span-3 text-right text-xs font-medium text-slate-700 tabular-nums">
										{formatCurrency(Number(item.subtotal || 0))}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Total & Action Buttons */}
			<div className="pt-2 border-t border-slate-100">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-slate-900">
						Total
					</span>
					<span className="text-sm font-medium text-slate-900 tabular-nums">
						{formatCurrency(Number(order.grandTotal))}
					</span>
				</div>
				{/* Single Full-Width Primary Action Button */}
				<div className="mt-3">
					<Button
						type="button"
						size="sm"
						disabled={isUpdating}
						onClick={onAdvanceStatus}
						className={cn(
							"w-full h-9 text-xs font-semibold rounded-full shadow-xs transition-transform active:scale-98 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5",
							statusConfig.accentColor.button,
						)}
					>
						{isUpdating ? (
							<>
								<Loader2 className="w-3.5 h-3.5 animate-spin mr-0.5" />
								<span>Proses...</span>
							</>
						) : (
							<>
								<span>{statusConfig.actionText}</span>
								{order.status === "READY" ? (
									<Check className="w-3.5 h-3.5 stroke-[2.5]" />
								) : (
									<ChevronRight className="w-3.5 h-3.5" />
								)}
							</>
						)}
					</Button>
				</div>

				{/* Quick online payment check if order is PENDING ONLINE */}
				{isPendingOnline && onCheckOnlinePayment && (
					<div className="mt-2 pt-1.5 border-t border-dashed border-slate-100">
						<Button
							size="sm"
							variant="outline"
							onClick={onCheckOnlinePayment}
							disabled={isSyncingOnline}
							className="w-full h-7 text-[11px] px-2 border-blue-200 hover:bg-blue-50 text-blue-700 rounded-full cursor-pointer"
						>
							{isSyncingOnline ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
							) : (
								<RefreshCw className="w-3.5 h-3.5 mr-1" />
							)}
							Cek Pembayaran Online
						</Button>
					</div>
				)}
			</div>
		</div>
	);
});

export function KanbanBoard({
	initialOrders,
	tenantId,
	cashierName = "Kasir",
	receiptSettings,
}: KanbanBoardProps) {
	const [orders, setOrders] = useState<Order[]>(initialOrders);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<KanbanStatusFilter>("ALL");
	const [viewMode, setViewMode] = useState<KanbanViewMode>("kanban");

	useEffect(() => {
		try {
			const saved = localStorage.getItem("menuin_orders_view_mode");
			if (saved === "kanban" || saved === "list") {
				setViewMode(saved);
			}
		} catch {
			// Ignore localStorage error
		}
	}, []);

	const handleViewModeChange = (mode: KanbanViewMode) => {
		setViewMode(mode);
		try {
			localStorage.setItem("menuin_orders_view_mode", mode);
		} catch {
			// Ignore
		}
	};

	const [selectedTypes, setSelectedTypes] =
		useState<OrderTypeFilter[]>(ALL_FILTER_TYPES);
	const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

	const isAllSelected = selectedTypes.length === ALL_FILTER_TYPES.length;

	const toggleSelectAll = () => {
		if (isAllSelected) {
			setSelectedTypes([]);
		} else {
			setSelectedTypes([...ALL_FILTER_TYPES]);
		}
	};

	const toggleType = (type: OrderTypeFilter) => {
		if (selectedTypes.includes(type)) {
			setSelectedTypes((prev) => prev.filter((t) => t !== type));
		} else {
			setSelectedTypes((prev) => [...prev, type]);
		}
	};

	// Receipt printer states
	const [printData, setPrintData] = useState<ReceiptData | null>(null);
	const [printMode, setPrintMode] = useState<"all" | "customer" | "kitchen">(
		"customer",
	);
	const [isPrinting, setIsPrinting] = useState(false);

	// Refresh & Bulk Advance States
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [bulkModalState, setBulkModalState] = useState<{
		isOpen: boolean;
		currentStatus: string;
		nextStatus: string;
		currentStatusTitle: string;
		nextStatusTitle: string;
		orders: Order[];
	}>({
		isOpen: false,
		currentStatus: "",
		nextStatus: "",
		currentStatusTitle: "",
		nextStatusTitle: "",
		orders: [],
	});
	const [isBulkUpdating, setIsBulkUpdating] = useState(false);
	const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
	const [isSearchingScannedOrder, setIsSearchingScannedOrder] = useState(false);
	const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
	const isUpdatingStatus = Boolean(updatingOrderId);

	const router = useRouter();

	// Helper to extract clean order number from raw text or full URL
	const parseOrderNumber = (text: string): string => {
		const clean = text.trim();
		try {
			if (clean.includes("order=")) {
				const url = clean.startsWith("http")
					? new URL(clean)
					: new URL(
							`http://dummy.com${clean.startsWith("/") ? "" : "/"}${clean}`,
						);
				const orderParam = url.searchParams.get("order");
				if (orderParam) return orderParam.replace(/^#/, "").trim();
			}
		} catch {
			// fallback if not a valid URL
		}
		return clean.replace(/^#/, "").trim();
	};

	// Handler for scans from both hardware barcode scanner and camera
	const handleScanCode = async (rawCode: string) => {
		const orderNum = parseOrderNumber(rawCode);
		if (!orderNum) return;

		// 1. Search in current memory state first
		const cleanTarget = orderNum.toUpperCase();
		const existingOrder = orders.find(
			(o) =>
				(o.orderNumber &&
					o.orderNumber.replace(/^#/, "").toUpperCase() === cleanTarget) ||
				o.id === rawCode,
		);

		if (existingOrder) {
			const isAlreadyPaid =
				existingOrder.paymentStatus === "PAID" ||
				(existingOrder.status && existingOrder.status !== "PENDING");

			if (isAlreadyPaid) {
				playScanWarningBeep();
				const statusMap: Record<string, string> = {
					NEW: "Pesanan Baru (Antrean Dapur)",
					PROCESSING: "Sedang Disiapkan di Dapur",
					READY: "Siap Disajikan",
					COMPLETED: "Pesanan Selesai",
					CANCELLED: "Pesanan Dibatalkan",
					FAILED: "Pesanan Gagal",
				};
				const statusLabel =
					statusMap[existingOrder.status] || existingOrder.status;
				toast.info(
					`Pesanan #${existingOrder.orderNumber?.replace(/^#/, "") || ""} sudah lunas & berstatus "${statusLabel}".`,
					{
						description:
							"Detail pesanan tidak dibuka untuk mencegah duplikasi pembayaran.",
					},
				);
				return;
			}

			playScanSuccessBeep();
			setSelectedOrder(existingOrder);
			toast.success(
				`Pesanan #${existingOrder.orderNumber?.replace(/^#/, "") || ""} siap diproses pembayarannya`,
			);
			return;
		}

		// 2. Fallback to server action if not yet in state
		setIsSearchingScannedOrder(true);
		try {
			const res = await getOrderByNumberForOutlet(orderNum);
			if (res) {
				const loadedOrder = {
					...res,
					createdAt: new Date(res.createdAt),
				} as Order;
				setOrders((prev) => {
					if (!prev.some((o) => o.id === loadedOrder.id)) {
						return [loadedOrder, ...prev];
					}
					return prev;
				});

				const isAlreadyPaid =
					loadedOrder.paymentStatus === "PAID" ||
					(loadedOrder.status && loadedOrder.status !== "PENDING");

				if (isAlreadyPaid) {
					playScanWarningBeep();
					const statusMap: Record<string, string> = {
						NEW: "Pesanan Baru (Antrean Dapur)",
						PROCESSING: "Sedang Disiapkan di Dapur",
						READY: "Siap Disajikan",
						COMPLETED: "Pesanan Selesai",
						CANCELLED: "Pesanan Dibatalkan",
						FAILED: "Pesanan Gagal",
					};
					const statusLabel =
						statusMap[loadedOrder.status] || loadedOrder.status;
					toast.info(
						`Pesanan #${loadedOrder.orderNumber?.replace(/^#/, "") || ""} sudah lunas & berstatus "${statusLabel}".`,
						{
							description:
								"Detail pesanan tidak dibuka untuk mencegah duplikasi pembayaran.",
						},
					);
					return;
				}

				playScanSuccessBeep();
				setSelectedOrder(loadedOrder);
				toast.success(
					`Pesanan #${loadedOrder.orderNumber?.replace(/^#/, "") || ""} siap diproses pembayarannya`,
				);
			} else {
				playScanErrorBeep();
				toast.error(`Pesanan #${orderNum} tidak ditemukan`);
			}
		} catch (err: any) {
			playScanErrorBeep();
			toast.error("Gagal memproses scanner pesanan");
		} finally {
			setIsSearchingScannedOrder(false);
		}
	};

	// Hardware barcode scanner listener (seamless background scanning)
	useBarcodeScanner({
		onScan: (code) => {
			setSearchQuery("");
			handleScanCode(code);
		},
		minLength: 3,
	});

	// Update local state when props change
	useEffect(() => {
		setOrders(initialOrders);
	}, [initialOrders]);

	// Silent background reconciliation without page flash or full SSR reload
	const silentReconcile = React.useCallback(async () => {
		try {
			const fresh = await getActiveOrders();
			if (Array.isArray(fresh)) {
				setOrders(fresh as any);
			}
		} catch (err) {
			console.error("Silent reconcile failed:", err);
		}
	}, []);

	// Field resilience: auto-sync when tablet wakes from sleep, tab regains focus, or Wi-Fi reconnects
	useEffect(() => {
		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				silentReconcile();
			}
		};

		const onWindowFocus = () => {
			silentReconcile();
		};

		const onNetworkOnline = () => {
			silentReconcile();
		};

		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("focus", onWindowFocus);
		window.addEventListener("online", onNetworkOnline);

		// 90-second safety heartbeat interval
		const heartbeat = setInterval(() => {
			silentReconcile();
		}, 90000);

		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("focus", onWindowFocus);
			window.removeEventListener("online", onNetworkOnline);
			clearInterval(heartbeat);
		};
	}, [silentReconcile]);

	// Realtime subscription (Unified tenant channel with in-memory delta updates)
	useEffect(() => {
		const supabase = createClient();
		const activeStatuses = ["PENDING", "NEW", "PROCESSING", "READY"];

		const channel = supabase
			.channel(`kanban-orders-${tenantId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "transactions",
					filter: `tenant_id=eq.${tenantId}`,
				},
				async (payload) => {
					if (payload.eventType === "INSERT") {
						const newTx = payload.new as any;
						if (activeStatuses.includes(newTx.status)) {
							// Fetch full order with items deterministically
							const fullOrder = await getOrderById(newTx.id);
							if (fullOrder && activeStatuses.includes(fullOrder.status)) {
								setOrders((prev) => {
									if (prev.some((o) => o.id === fullOrder.id)) return prev;
									const next = [...prev, fullOrder as any];
									// Preserve strict FIFO order: oldest createdAt first
									return next.sort(
										(a, b) =>
											new Date(a.createdAt).getTime() -
											new Date(b.createdAt).getTime(),
									);
								});
							}
						}
					} else if (payload.eventType === "UPDATE") {
						const updatedTx = payload.new as any;
						if (!activeStatuses.includes(updatedTx.status)) {
							// Order finished/cancelled: remove directly from active state
							setOrders((prev) => prev.filter((o) => o.id !== updatedTx.id));
							return;
						}

						// Order is active:
						setOrders((prev) => {
							const exists = prev.find((o) => o.id === updatedTx.id);
							if (!exists) {
								// Order newly active or previously missed insert: fetch full order
								getOrderById(updatedTx.id).then((fullOrder) => {
									if (fullOrder && activeStatuses.includes(fullOrder.status)) {
										setOrders((current) => {
											if (current.some((o) => o.id === fullOrder.id))
												return current;
											const next = [...current, fullOrder as any];
											return next.sort(
												(a, b) =>
													new Date(a.createdAt).getTime() -
													new Date(b.createdAt).getTime(),
											);
										});
									}
								});
								return prev;
							}

							// Update in-place in memory without SSR reload
							return prev.map((o) =>
								o.id === updatedTx.id
									? {
											...o,
											status: updatedTx.status,
											paymentStatus:
												updatedTx.payment_status ||
												updatedTx.paymentStatus ||
												o.paymentStatus,
											paymentMethod:
												updatedTx.payment_method || o.paymentMethod,
											tableNumber:
												updatedTx.table_number !== undefined
													? updatedTx.table_number
													: o.tableNumber,
											customerName:
												updatedTx.customer_name !== undefined
													? updatedTx.customer_name
													: o.customerName,
										}
									: o,
							);
						});
					}
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "transaction_items",
					filter: `tenant_id=eq.${tenantId}`,
				},
				(payload) => {
					const updatedItem = payload.new as any;
					if (!updatedItem || !updatedItem.transaction_id) return;

					// Realtime item checkbox sync (Kitchen / Bar / Cashier instant sync)
					setOrders((prev) =>
						prev.map((order) => {
							if (order.id !== updatedItem.transaction_id) return order;
							return {
								...order,
								items: (order.items || []).map((item) =>
									item.id === updatedItem.id
										? {
												...item,
												isCompleted:
													updatedItem.is_completed ??
													updatedItem.isCompleted,
											}
										: item,
								),
							};
						}),
					);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [tenantId]);

	const buildReceiptData = (
		order: Order,
		paymentOverride?: {
			paymentMethod?: string;
			cashReceived?: number;
			change?: number;
		},
	): ReceiptData => ({
		transactionId: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
		date: new Date(order.createdAt),
		cashierName: cashierName,
		subtotal: Number(order.totalAmount || order.grandTotal),
		discount: Number(order.discount || 0),
		promoCode: order.promoCode || undefined,
		tax: Number(order.tax || 0),
		serviceCharge: Number(order.serviceCharge || 0),
		rounding: Number(order.rounding || 0),
		totalAmount: Number(order.grandTotal),
		cashReceived:
			paymentOverride?.cashReceived != null
				? paymentOverride.cashReceived
				: Number(order.grandTotal),
		change: paymentOverride?.change != null ? paymentOverride.change : 0,
		paymentMethod: (
			paymentOverride?.paymentMethod ||
			order.paymentMethod ||
			"TUNAI"
		).toUpperCase(),
		orderType: order.orderType,
		customerName: order.customerName || undefined,
		tableNumber: order.tableNumber || undefined,
		items: order.items.map((it) => ({
			name: it.productName,
			quantity: it.quantity,
			price: it.price ? Number(it.price) : Number(it.subtotal) / it.quantity,
			subtotal: Number(it.subtotal),
			modifiers: Array.isArray(it.modifiers) ? it.modifiers : undefined,
			notes: it.notes,
		})),
	});

	const handlePrintReceipt = (
		order: Order,
		mode: "customer" | "kitchen" | "all" = "customer",
		paymentOverride?: {
			paymentMethod?: string;
			cashReceived?: number;
			change?: number;
		},
	) => {
		setIsPrinting(true);
		const receipt = buildReceiptData(order, paymentOverride);
		setPrintData(receipt);

		// Jika setting tiket dapur aktif, maka sekali print otomatis mencetak struk pelanggan & tiket dapur
		const isKitchenEnabled = Boolean(receiptSettings?.kitchenPrintEnabled);
		const effectiveMode =
			mode === "customer" || mode === "all"
				? isKitchenEnabled
					? "all"
					: "customer"
				: mode;

		setPrintMode(effectiveMode);

		setTimeout(() => {
			window.print();
			setIsPrinting(false);
			const label =
				effectiveMode === "all" && isKitchenEnabled
					? "Struk pelanggan & tiket dapur"
					: effectiveMode === "kitchen"
						? "Tiket dapur"
						: "Struk pelanggan";
			toast.success(`${label} dicetak.`);
		}, 250);
	};

	const handleConfirmPaymentFromModal = async (payload: {
		paymentMethod:
			| "CASH"
			| "QRIS_STATIC"
			| "QRIS_DYNAMIC"
			| "CARD"
			| "TRANSFER";
		cashReceived?: number;
		change?: number;
		printReceipt?: boolean;
		rounding?: number;
		grandTotal?: number;
	}) => {
		if (!selectedOrder) return;
		const targetOrder = selectedOrder;
		setIsSubmittingPayment(true);

		const updatedGrandTotal =
			payload.grandTotal != null
				? payload.grandTotal.toString()
				: targetOrder.grandTotal;
		const updatedRounding =
			payload.rounding != null
				? payload.rounding.toString()
				: targetOrder.rounding || "0";

		// Optimistic UI update
		setOrders((prev) =>
			prev.map((o) => {
				if (o.id === targetOrder.id) {
					return {
						...o,
						status: "NEW",
						paymentStatus: "PAID",
						paymentMethod: payload.paymentMethod,
						rounding: updatedRounding,
						grandTotal: updatedGrandTotal,
					};
				}
				return o;
			}),
		);

		try {
			const res = await confirmOrderPaymentAtCashier(targetOrder.id, {
				paymentMethod: payload.paymentMethod,
				cashReceived: payload.cashReceived,
				change: payload.change,
				rounding: payload.rounding,
				grandTotal: payload.grandTotal,
			});

			if (res.error) {
				toast.error(res.error);
				silentReconcile();
			} else {
				toast.success(
					`Pembayaran ${targetOrder.orderNumber || ""} berhasil dikonfirmasi!`,
				);
				setSelectedOrder(null);

				// Trigger print if requested
				if (payload.printReceipt) {
					handlePrintReceipt(
						{
							...targetOrder,
							rounding: updatedRounding,
							grandTotal: updatedGrandTotal,
						},
						"customer",
						{
							paymentMethod: payload.paymentMethod,
							cashReceived: payload.cashReceived,
							change: payload.change,
						},
					);
				}
			}
		} catch (err: any) {
			toast.error(err?.message || "Gagal mengonfirmasi pembayaran pesanan");
			silentReconcile();
		} finally {
			setIsSubmittingPayment(false);
		}
	};

	const handleStatusChange = async (orderId: string, newStatus: string) => {
		if (updatingOrderId) return;
		setUpdatingOrderId(orderId);

		// Optimistic UI update
		setOrders((prev) => {
			if (!["PENDING", "NEW", "PROCESSING", "READY"].includes(newStatus)) {
				return prev.filter((o) => o.id !== orderId);
			}
			return prev.map((o) => {
				if (o.id === orderId) {
					const isConfirming = o.status === "PENDING" && newStatus === "NEW";
					return {
						...o,
						status: newStatus,
						paymentStatus: isConfirming ? "PAID" : o.paymentStatus,
					};
				}
				return o;
			});
		});

		try {
			const res = await updateOrderStatus(orderId, newStatus);
			if (res.error) {
				toast.error(res.error);
				silentReconcile();
			} else {
				toast.success("Status pesanan diperbarui");
				if (selectedOrder && selectedOrder.id === orderId) {
					setSelectedOrder(null);
				}
			}
		} catch (err: any) {
			toast.error(err?.message || "Gagal memperbarui status pesanan");
		} finally {
			setUpdatingOrderId(null);
		}
	};

	const getNextStatusTitle = (nextStatus: string): string => {
		switch (nextStatus) {
			case "NEW":
				return "Pesanan Baru";
			case "PROCESSING":
				return "Sedang Disiapkan";
			case "READY":
				return "Siap Disajikan";
			case "COMPLETED":
				return "Pesanan Selesai";
			default:
				return nextStatus;
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			const fresh = await getActiveOrders();
			setOrders(fresh as any);
			toast.success("Antrean pesanan berhasil diperbarui");
		} catch (err) {
			silentReconcile();
			toast.info("Memperbarui antrean pesanan...");
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleBulkAdvanceClick = (
		status: string,
		nextStatus: string,
		title: string,
		columnOrders: Order[],
	) => {
		if (columnOrders.length === 0) {
			toast.info(`Tidak ada pesanan pada status ${title}`);
			return;
		}

		setBulkModalState({
			isOpen: true,
			currentStatus: status,
			nextStatus: nextStatus,
			currentStatusTitle: title,
			nextStatusTitle: getNextStatusTitle(nextStatus),
			orders: columnOrders,
		});
	};

	const handleConfirmBulkAdvance = async () => {
		const {
			currentStatus,
			nextStatus,
			currentStatusTitle,
			nextStatusTitle,
			orders: targetOrders,
		} = bulkModalState;
		const orderIds = targetOrders.map((o) => o.id);
		if (orderIds.length === 0) {
			setBulkModalState((prev) => ({ ...prev, isOpen: false }));
			return;
		}

		setIsBulkUpdating(true);

		// Optimistic UI update
		setOrders((prev) => {
			if (!["PENDING", "NEW", "PROCESSING", "READY"].includes(nextStatus)) {
				return prev.filter((o) => !orderIds.includes(o.id));
			}
			return prev.map((o) => {
				if (orderIds.includes(o.id)) {
					const isConfirming = o.status === "PENDING" && nextStatus === "NEW";
					const allItemsCompleted = ["READY", "COMPLETED"].includes(nextStatus);
					return {
						...o,
						status: nextStatus,
						paymentStatus: isConfirming ? "PAID" : o.paymentStatus,
						items: allItemsCompleted
							? o.items.map((it) => ({ ...it, isCompleted: true }))
							: o.items,
					};
				}
				return o;
			});
		});

		try {
			const res = await bulkUpdateOrderStatus(orderIds, nextStatus);
			if (res.error) {
				toast.error(res.error);
				silentReconcile();
			} else {
				toast.success(
					`${orderIds.length} pesanan berhasil dipindahkan ke "${nextStatusTitle}"`,
				);
			}
		} catch (err) {
			toast.error("Gagal memproses perubahan status pesanan");
			silentReconcile();
		} finally {
			setIsBulkUpdating(false);
			setBulkModalState((prev) => ({ ...prev, isOpen: false }));
		}
	};

	const handleCheckOnlinePayment = async (order: Order) => {
		setSyncingOrderId(order.id);
		const toastId = toast.loading("Memeriksa status pembayaran online...");
		try {
			const res = await syncOrderPaymentStatus(order.id);
			toast.dismiss(toastId);
			if (res.success && res.isPaid) {
				toast.success(
					`Pembayaran untuk order ${order.orderNumber || ""} LUNAS terkonfirmasi!`,
				);
				setOrders((prev) =>
					prev.map((o) =>
						o.id === order.id
							? { ...o, paymentStatus: "PAID", status: res.status || "NEW" }
							: o,
					),
				);
				if (selectedOrder && selectedOrder.id === order.id) {
					setSelectedOrder((prev) =>
						prev
							? { ...prev, paymentStatus: "PAID", status: res.status || "NEW" }
							: null,
					);
				}
			} else if (res.success && !res.isPaid) {
				toast.info("Belum ada pembayaran online yang lunas untuk pesanan ini.");
			} else {
				toast.error(res.error || "Gagal sinkronisasi pembayaran.");
			}
		} catch (err: any) {
			toast.dismiss(toastId);
			toast.error("Terjadi kesalahan saat memeriksa pembayaran.");
		} finally {
			setSyncingOrderId(null);
		}
	};

	const handleToggleItem = async (
		orderId: string,
		itemId: string,
		isCompleted: boolean,
	) => {
		if (isUpdatingStatus) return;

		// Optimistic UI update
		setOrders((prev) =>
			prev.map((o) => {
				if (o.id !== orderId) return o;
				return {
					...o,
					items: o.items.map((i) =>
						i.id === itemId ? { ...i, isCompleted } : i,
					),
				};
			}),
		);

		if (selectedOrder && selectedOrder.id === orderId) {
			setSelectedOrder((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					items: prev.items.map((i) =>
						i.id === itemId ? { ...i, isCompleted } : i,
					),
				};
			});
		}

		const res = await updateOrderItemStatus(itemId, isCompleted);
		if (res.error) {
			toast.error(res.error);
			silentReconcile();
		}
	};

	const filteredOrders = useMemo(() => {
		return orders.filter((o) => {
			// Type filter
			if (!isAllSelected) {
				const isDineIn = o.orderType === "DINE_IN";
				const isTakeaway =
					o.orderType === "TAKE_AWAY" || o.orderType === "TAKEAWAY";
				const isOnline = o.orderType === "ONLINE";

				const matches =
					(isDineIn && selectedTypes.includes("DINE_IN")) ||
					(isTakeaway && selectedTypes.includes("TAKEAWAY")) ||
					(isOnline && selectedTypes.includes("ONLINE"));
				if (!matches) return false;
			}

			// Search query
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				o.orderNumber?.toLowerCase().includes(q) ||
				o.customerName?.toLowerCase().includes(q) ||
				(o.tableNumber && `meja ${o.tableNumber}`.toLowerCase().includes(q))
			);
		});
	}, [orders, selectedTypes, isAllSelected, searchQuery]);

	// List orders sorted by entry into queue (FIFO: createdAt ascending, earliest first)
	const listOrders = useMemo(() => {
		const filtered =
			statusFilter === "ALL"
				? filteredOrders
				: filteredOrders.filter((o) => o.status === statusFilter);

		return [...filtered].sort((a, b) => {
			const timeA = new Date(a.createdAt).getTime();
			const timeB = new Date(b.createdAt).getTime();
			if (timeA !== timeB) return timeA - timeB; // FIFO: earliest first
			return (a.queueNumber || 0) - (b.queueNumber || 0);
		});
	}, [filteredOrders, statusFilter]);

	// Status counts calculated from orders matching current search and type filters
	const statusCounts = useMemo(() => {
		const counts = {
			ALL: 0,
			PENDING: 0,
			NEW: 0,
			PROCESSING: 0,
			READY: 0,
		};

		filteredOrders.forEach((o) => {
			counts.ALL++;
			if (o.status === "PENDING") counts.PENDING++;
			else if (o.status === "NEW") counts.NEW++;
			else if (o.status === "PROCESSING") counts.PROCESSING++;
			else if (o.status === "READY") counts.READY++;
		});

		return counts;
	}, [filteredOrders]);

	const statusTabs = useMemo(
		() => [
			{
				key: "ALL" as KanbanStatusFilter,
				label: "Semua Pesanan",
				count: statusCounts.ALL,
			},
			{
				key: "PENDING" as KanbanStatusFilter,
				label: "Menunggu Pesanan",
				count: statusCounts.PENDING,
			},
			{
				key: "NEW" as KanbanStatusFilter,
				label: "Pesanan Baru",
				count: statusCounts.NEW,
			},
			{
				key: "PROCESSING" as KanbanStatusFilter,
				label: "Sedang Disiapkan",
				count: statusCounts.PROCESSING,
			},
			{
				key: "READY" as KanbanStatusFilter,
				label: "Siap Disajikan",
				count: statusCounts.READY,
			},
		],
		[statusCounts],
	);

	const visibleColumns = useMemo(() => {
		if (statusFilter === "ALL") return COLUMNS;
		return COLUMNS.filter((col) => col.status === statusFilter);
	}, [statusFilter, COLUMNS]);

	const renderColumn = (
		title: string,
		status: string,
		nextStatus: string,
		actionText: string,
		icon: React.ReactNode,
		accentColor: { badge?: string; iconBg: string; button: string },
	) => {
		const columnOrders = filteredOrders.filter((o) => o.status === status);

		return (
			<div
				key={status}
				className={cn(
					"flex-1 min-w-[320px] bg-white rounded-t-2xl rounded-b-none pt-3 px-3 pb-0 flex flex-col h-full min-h-0",
					statusFilter === "ALL" ? "max-w-[390px]" : "max-w-[450px]",
				)}
			>
				{/* Column Header */}
				<div className="flex items-center justify-between pb-3 px-1 shrink-0">
					<div className="flex items-center gap-2.5 min-w-0">
						<div
							className={cn(
								"w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-xs text-white",
								accentColor.iconBg,
							)}
						>
							{icon}
						</div>
						<h3 className="font-semibold text-xs sm:text-sm text-foreground tracking-tight truncate">
							{title}
						</h3>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
							{columnOrders.length}
						</span>
						{status !== "PENDING" && (
							<button
								type="button"
								onClick={() =>
									handleBulkAdvanceClick(
										status,
										nextStatus,
										title,
										columnOrders,
									)
								}
								disabled={columnOrders.length === 0}
								className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
									columnOrders.length === 0
										? "opacity-25 cursor-not-allowed text-slate-400"
										: "text-emerald-600 hover:bg-emerald-50 border-none bg-white shadow-sm-md active:scale-90 cursor-pointer"
								}`}
								title={`Selesaikan/Lanjutkan semua pesanan pada status "${title}" ke "${getNextStatusTitle(nextStatus)}"`}
							>
								<Check className="w-3.5 h-3.5 stroke-[2.5]" />
							</button>
						)}
					</div>
				</div>

				{/* Order Cards List */}
				<div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 pb-6 overscroll-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
					{columnOrders.length === 0 ? (
						<div className="h-44 flex flex-col items-center justify-center text-muted-foreground/60 text-xs text-center p-4">
							<UtensilsCrossed className="w-5 h-5 mb-2 opacity-30" />
							<span>Tidak ada pesanan di antrean ini</span>
						</div>
					) : (
						columnOrders.map((order) => {
							const statusCfg = STATUS_CONFIG_MAP[order.status] || {
								title,
								status,
								nextStatus,
								actionText,
								icon,
								accentColor: {
									badge: accentColor.badge || "",
									iconBg: accentColor.iconBg,
									button: accentColor.button,
								},
							};

							return (
								<OrderCard
									key={order.id}
									order={order}
									showStatusHeader={false}
									uniformHeight={false}
									statusConfig={statusCfg}
									onSelect={() => setSelectedOrder(order)}
									onToggleItem={(itemId, isCompleted) =>
										handleToggleItem(order.id, itemId, isCompleted)
									}
									onAdvanceStatus={(e) => {
										e.stopPropagation();
										if (status === "PENDING") {
											setSelectedOrder(order);
										} else {
											handleStatusChange(order.id, nextStatus);
										}
									}}
									onCheckOnlinePayment={(e) => {
										e.stopPropagation();
										handleCheckOnlinePayment(order);
									}}
									isUpdating={isUpdatingStatus && updatingOrderId === order.id}
									isSyncingOnline={syncingOrderId === order.id}
								/>
							);
						})
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col h-[calc(100vh-4rem)] pt-3 pb-0 gap-3 shrink-0">
			{/* Invisible print component */}
			<ReceiptPrinter
				data={printData}
				settings={receiptSettings || null}
				printMode={printMode}
			/>

			{/* Zone 1: Status Filter Tabs & Header Toolbar Row (Universal Design System) */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 gap-3 sm:gap-4 shrink-0">
				{/* Left: Underline Status Filter Tabs */}
				<div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1">
					{statusTabs.map((tab) => {
						const isActive = statusFilter === tab.key;
						return (
							<button
								key={tab.key}
								type="button"
								onClick={() => setStatusFilter(tab.key)}
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
										"text-xs px-2 py-0.5 rounded-lg font-medium transition-colors",
										isActive
											? "bg-blue-50 text-blue-700"
											: "text-slate-400",
									)}
								>
									{tab.count}
								</span>
								{isActive && (
									<motion.div
										layoutId="activeKanbanStatusTabUnderline"
										className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
										transition={{
											type: "spring",
											stiffness: 450,
											damping: 35,
										}}
									/>
								)}
							</button>
						);
					})}
				</div>

				{/* Right: Search, Filter Jenis Pesanan, Scan QR, and Refresh */}
				<div className="flex items-center gap-2 pb-2.5 lg:pb-3 flex-wrap sm:flex-nowrap shrink-0">
					{/* Search Input with Clear Button */}
					<div className="relative w-full sm:w-56 md:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<Input
							type="text"
							placeholder="Cari meja, no order, nama..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 pr-8 h-9 text-xs rounded-full bg-white border-none focus-visible:ring-blue-600 shadow-sm-md"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
								title="Hapus pencarian"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Dropdown Pengaturan Tampilan & Filter (Single Compact Icon Button 36x36px, no text label) */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="relative h-9 w-9 border-none shadow-sm-md bg-white hover:bg-slate-100 text-slate-700 shrink-0 rounded-full cursor-pointer"
								title={
									isAllSelected
										? "Pengaturan Tampilan & Filter"
										: `Pengaturan Tampilan & Filter (${selectedTypes.length} jenis pesanan aktif)`
								}
							>
								<SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
								{!isAllSelected && (
									<span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white" />
								)}
								<span className="sr-only">Pengaturan Tampilan & Filter</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-56 p-2 rounded-2xl border-none bg-white shadow-xl space-y-0.5"
						>
							{/* Seksi 1: Mode Tampilan */}
							<div className="px-3 py-1 text-xs font-semibold text-slate-500">
								Mode Tampilan
							</div>
							<DropdownMenuItem
								onClick={() => handleViewModeChange("kanban")}
								className={cn(
									"text-xs px-3 py-2 cursor-pointer rounded-full font-medium flex items-center transition-colors",
									viewMode === "kanban"
										? "bg-blue-600 text-white font-semibold shadow-2xs hover:bg-blue-500 focus:bg-blue-500 focus:text-white data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
										: "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900",
								)}
							>
								<div className="flex items-center gap-2">
									<Kanban
										className={cn(
											"w-3.5 h-3.5",
											viewMode === "kanban" ? "text-white" : "text-slate-500",
										)}
									/>
									<span>Kanban Board</span>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleViewModeChange("list")}
								className={cn(
									"text-xs px-3 py-2 cursor-pointer rounded-full font-medium flex items-center transition-colors",
									viewMode === "list"
										? "bg-blue-600 text-white font-semibold shadow-2xs hover:bg-blue-500 focus:bg-blue-500 focus:text-white data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
										: "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900",
								)}
							>
								<div className="flex items-center gap-2">
									<LayoutGrid
										className={cn(
											"w-3.5 h-3.5",
											viewMode === "list" ? "text-white" : "text-slate-500",
										)}
									/>
									<span>List Card (Antrean)</span>
								</div>
							</DropdownMenuItem>

							<DropdownMenuSeparator className="my-1.5 bg-slate-100" />

							{/* Seksi 2: Jenis Pesanan */}
							<div className="px-3 py-1 text-xs font-semibold text-slate-500">
								Jenis Pesanan
							</div>
							<DropdownMenuCheckboxItem
								checked={isAllSelected}
								onCheckedChange={toggleSelectAll}
								onSelect={(e) => e.preventDefault()}
								className="text-xs py-1.5 pl-8 pr-3 cursor-pointer rounded-full font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 transition-colors"
							>
								Semua Jenis
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								checked={selectedTypes.includes("DINE_IN")}
								onCheckedChange={() => toggleType("DINE_IN")}
								onSelect={(e) => e.preventDefault()}
								className="text-xs py-1.5 pl-8 pr-3 cursor-pointer rounded-full font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 transition-colors"
							>
								Dine In (Meja)
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								checked={selectedTypes.includes("TAKEAWAY")}
								onCheckedChange={() => toggleType("TAKEAWAY")}
								onSelect={(e) => e.preventDefault()}
								className="text-xs py-1.5 pl-8 pr-3 cursor-pointer rounded-full font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 transition-colors"
							>
								Bawa Pulang
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								checked={selectedTypes.includes("ONLINE")}
								onCheckedChange={() => toggleType("ONLINE")}
								onSelect={(e) => e.preventDefault()}
								className="text-xs py-1.5 pl-8 pr-3 cursor-pointer rounded-full font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 transition-colors"
							>
								Online
							</DropdownMenuCheckboxItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Tombol Scan QR (Hanya Icon Kamera) */}
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => setIsCameraScannerOpen(true)}
						className="h-9 w-9 border-none bg-white hover:bg-slate-100 text-slate-700 shadow-sm-md shrink-0 rounded-full cursor-pointer"
						title="Scan QR pesanan"
					>
						<Camera className="w-4 h-4 text-slate-500 shrink-0" />
						<span className="sr-only">Scan QR</span>
					</Button>

					{/* Tombol Refresh (Hanya Icon Refresh) */}
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="h-9 w-9 border-none bg-white hover:bg-slate-100 text-slate-700 shadow-sm-md shrink-0 rounded-full active:scale-95 disabled:opacity-50 cursor-pointer"
						title="Refresh antrean pesanan"
					>
						<RefreshCw
							className={cn(
								"w-4 h-4 text-slate-500 shrink-0",
								isRefreshing && "animate-spin text-blue-600",
							)}
						/>
						<span className="sr-only">Refresh</span>
					</Button>
				</div>
			</div>

			{/* Konten Utama: Kanban Board Columns atau List Card Grid */}
			{viewMode === "kanban" ? (
				/* Kanban Board Columns */
				<div className="flex gap-3.5 overflow-x-auto pb-0 flex-1 min-h-0 scrollbar-hide">
					{visibleColumns.map((col) =>
						renderColumn(
							col.title,
							col.status,
							col.nextStatus,
							col.actionText,
							col.icon,
							col.accentColor,
						),
					)}
				</div>
			) : (
				/* List Card Grid (Sorted by entry into queue - FIFO) */
				<div className="flex-1 min-h-0 overflow-y-auto pb-4 scrollbar-hide">
					{listOrders.length === 0 ? (
						<div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
							<div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
								<LayoutGrid className="w-6 h-6" />
							</div>
							<p className="text-sm font-semibold text-slate-700">
								Tidak ada antrean pesanan
							</p>
							<p className="text-xs text-muted-foreground mt-1 max-w-xs">
								{searchQuery
									? "Tidak ada pesanan yang sesuai dengan kata kunci pencarian Anda."
									: statusFilter !== "ALL"
										? `Tidak ada pesanan pada status ${statusTabs.find((t) => t.key === statusFilter)?.label || ""}.`
										: "Semua pesanan yang masuk akan tampil di sini sesuai urutan waktu masuk."}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
							{listOrders.map((order) => {
								const cfg =
									STATUS_CONFIG_MAP[order.status] || STATUS_CONFIG_MAP.PENDING;
								return (
									<OrderCard
										key={order.id}
										order={order}
										showStatusHeader={true}
										uniformHeight={true}
										statusConfig={cfg}
										onSelect={() => setSelectedOrder(order)}
										onToggleItem={(itemId, isCompleted) =>
											handleToggleItem(order.id, itemId, isCompleted)
										}
										onAdvanceStatus={(e) => {
											e.stopPropagation();
											if (order.status === "PENDING") {
												setSelectedOrder(order);
											} else {
												handleStatusChange(order.id, cfg.nextStatus);
											}
										}}
										onCheckOnlinePayment={(e) => {
											e.stopPropagation();
											handleCheckOnlinePayment(order);
										}}
										isUpdating={isUpdatingStatus && updatingOrderId === order.id}
										isSyncingOnline={syncingOrderId === order.id}
									/>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Unified Image 2 Order Payment & Detail Modal */}
			<OrderPaymentModal
				isOpen={!!selectedOrder}
				onClose={() => {
					if (!isSubmittingPayment) setSelectedOrder(null);
				}}
				order={selectedOrder}
				posSettings={receiptSettings}
				onConfirm={handleConfirmPaymentFromModal}
				onStatusChange={handleStatusChange}
				onToggleItem={handleToggleItem}
				onPrintReceipt={handlePrintReceipt}
				onCheckMidtrans={handleCheckOnlinePayment}
				isProcessing={isSubmittingPayment}
				updatingOrderId={updatingOrderId}
				syncingOrderId={syncingOrderId}
			/>

			{/* Modal Konfirmasi Selesaikan Semua Pesanan */}
			<Dialog
				open={bulkModalState.isOpen}
				onOpenChange={(open) => {
					if (!isBulkUpdating) {
						setBulkModalState((prev) => ({ ...prev, isOpen: open }));
					}
				}}
			>
				<DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-3xl p-6 text-slate-900">
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
								<CheckCheck className="w-5 h-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-semibold text-slate-900">
									Lanjutkan Semua Pesanan?
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500">
									Status: {bulkModalState.currentStatusTitle} →{" "}
									{bulkModalState.nextStatusTitle}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="py-2 space-y-3">
						<p className="text-xs text-slate-600 leading-relaxed">
							Apakah Anda yakin untuk menyelesaikan semua pesanan pada status{" "}
							<span className="text-slate-900 font-semibold">
								"{bulkModalState.currentStatusTitle}"
							</span>{" "}
							sebanyak{" "}
							<span className="text-emerald-600 font-semibold">
								{bulkModalState.orders.length} pesanan
							</span>{" "}
							dan lanjut ke status tahap selanjutnya (
							<span className="text-blue-600 font-semibold">
								"{bulkModalState.nextStatusTitle}"
							</span>
							)?
						</p>

						{/* List of Affected Orders */}
						<div className="bg-slate-50 rounded-2xl p-3 space-y-2">
							<div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
								Daftar Pesanan ({bulkModalState.orders.length})
							</div>
							<div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
								{bulkModalState.orders.map((o) => (
									<div
										key={o.id}
										className="flex items-center justify-between p-2 rounded-xl bg-white shadow-sm-md"
									>
										<div className="flex items-center gap-2">
											<span className="font-sans text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
												{o.orderNumber || "#-"}
											</span>
											<span className="text-slate-700 font-medium truncate max-w-[160px]">
												{o.customerName ||
													(o.tableNumber ? `Meja ${o.tableNumber}` : "Pesanan")}
											</span>
										</div>
										<span className="text-[11px] font-semibold text-slate-600">
											{formatCurrency(Number(o.grandTotal))}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					<DialogFooter className="grid grid-cols-2 gap-2.5 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								setBulkModalState((prev) => ({ ...prev, isOpen: false }))
							}
							disabled={isBulkUpdating}
							className="h-11 text-xs font-medium rounded-full bg-white hover:bg-slate-100 text-slate-700 border-none shadow-md cursor-pointer transition-all"
						>
							Batal
						</Button>
						<Button
							type="button"
							onClick={handleConfirmBulkAdvance}
							disabled={isBulkUpdating}
							className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
						>
							{isBulkUpdating ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>Memproses...</span>
								</>
							) : (
								<>
									<Check className="w-4 h-4 stroke-[2.5]" />
									<span>
										Ya, Lanjutkan ({bulkModalState.orders.length})
									</span>
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Camera Scanner Viewfinder Dialog */}
			<OrderCameraScannerDialog
				isOpen={isCameraScannerOpen}
				onClose={() => setIsCameraScannerOpen(false)}
				onScan={handleScanCode}
			/>

			{/* Physical Thermal Receipt Printer (Screen-hidden, active during window.print) */}
			<ReceiptPrinter
				data={printData}
				settings={receiptSettings}
				printMode={printMode}
			/>
		</div>
	);
}

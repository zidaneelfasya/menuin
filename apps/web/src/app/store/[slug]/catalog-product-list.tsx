"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { Search, ShoppingBag, Plus, Minus, Star, ArrowRight, X, Flame, ThumbsUp, Utensils } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";
import { ProductDetailSheet, type Product } from "@/components/shared/product-detail-sheet";
import { ModifierActionModal } from "@/components/shared/modifier-action-modal";
import { toast } from "sonner";

type CatalogProductListProps = {
  productsByCategory: Record<string, Product[]>;
  categories: { id: string; name: string }[];
  featuredProducts?: Product[];
  bestSellerProducts?: Product[];
  recommendedProducts?: Product[];
  tenantSlug: string;
  modifierGroups?: any[];
  tableParam?: string | null;
};

export function CatalogProductList({
  productsByCategory,
  categories,
  featuredProducts = [],
  bestSellerProducts = [],
  recommendedProducts = [],
  tenantSlug,
  modifierGroups = [],
  tableParam: initialTableParam,
}: CatalogProductListProps) {
  const searchParams = useSearchParams();
  const tableParam = initialTableParam || searchParams.get("table");

  const {
    setTenant,
    setTableNumber,
    items,
    addItem,
    removeItem,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");

  // Product Detail & Modifier Sheet state
  const [selectedProductForSheet, setSelectedProductForSheet] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Plus/Action modal (Repeat vs Make Another vs Edit)
  const [productForActionModal, setProductForActionModal] = useState<Product | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Initialize tenant & table param in zustand
  useEffect(() => {
    setTenant(tenantSlug);
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [tenantSlug, tableParam, setTenant, setTableNumber]);

  // Back button synchronization for native app feel
  useEffect(() => {
    const handlePopState = () => {
      if (isSheetOpen) {
        setIsSheetOpen(false);
        setEditingCartItem(null);
      }
      if (isActionModalOpen) {
        setIsActionModalOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isSheetOpen, isActionModalOpen]);

  const actualRecommended = recommendedProducts.length > 0 ? recommendedProducts : featuredProducts;
  const displayBestSellers = bestSellerProducts.slice(0, 5);

  const allCategories = useMemo(() => [
    ...(displayBestSellers.length > 0 ? [{ id: "bestseller", name: "Best Seller" }] : []),
    ...(actualRecommended.length > 0 ? [{ id: "recommended", name: "Rekomendasi" }] : []),
    ...categories,
    ...(productsByCategory["uncategorized"]?.length > 0 ? [{ id: "uncategorized", name: "Lainnya" }] : []),
  ], [displayBestSellers, actualRecommended, categories, productsByCategory]);

  const formatSoldCount = (sold?: number | null): string | null => {
    if (!sold || sold <= 0) return null;
    if (sold >= 1000) {
      const thousands = sold / 1000;
      const formatted = (Math.floor(thousands * 10) / 10)
        .toFixed(1)
        .replace(".0", "")
        .replace(".", ",");
      return `${formatted}rb+ terjual`;
    }
    if (sold >= 100) {
      const rounded = Math.floor(sold / 10) * 10;
      return `${rounded}+ terjual`;
    }
    return `${sold}+ terjual`;
  };

  const categoryTabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set default active tab
  useEffect(() => {
    if (!activeCategoryId && allCategories.length > 0) {
      setActiveCategoryId(allCategories[0].id);
    }
  }, [allCategories, activeCategoryId]);

  // Auto-scroll active category tab into the center of the tabs bar
  useEffect(() => {
    if (!activeCategoryId) return;
    const tabEl = tabRefs.current[activeCategoryId];
    const containerEl = categoryTabsRef.current;
    if (tabEl && containerEl) {
      const containerWidth = containerEl.clientWidth;
      const tabLeft = tabEl.offsetLeft;
      const tabWidth = tabEl.offsetWidth;
      // Geser container sehingga filter yang aktif berada di tengah layar/bar
      const targetScrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);

      containerEl.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }
  }, [activeCategoryId]);

  // Scroll spy to highlight active category tab
  useEffect(() => {
    if (searchQuery) return;

    const handleScroll = () => {
      if (isUserScrollingRef.current) return;
      const scrollY = window.scrollY + 140;
      for (const cat of allCategories) {
        const el = document.getElementById(`category-${cat.id}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveCategoryId(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allCategories, searchQuery]);

  // Smooth scroll to category
  const scrollToCategory = (id: string) => {
    setActiveCategoryId(id);
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 800);

    const el = document.getElementById(`category-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Open Product Detail Sheet
  const handleOpenProductDetail = (product: Product, editItem?: any) => {
    setSelectedProductForSheet(product);
    setEditingCartItem(editItem || null);
    setIsSheetOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: true }, "", window.location.href);
    }
  };

  // Click on "Tambah" or "Add" button
  const handleAddButtonClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const hasModifiers = Boolean(product.modifierGroupIds && product.modifierGroupIds.length > 0);
    const cartItemsForProduct = items.filter((i) => i.productId === product.id);
    const totalQty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);

    if (hasModifiers) {
      if (totalQty > 0) {
        setProductForActionModal(product);
        setIsActionModalOpen(true);
        if (typeof window !== "undefined") {
          window.history.pushState({ modal: true }, "", window.location.href);
        }
      } else {
        handleOpenProductDetail(product);
      }
    } else {
      // Products without modifiers add directly to cart
      addItem({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl,
      });
      toast.success(`${product.name} ditambahkan ke keranjang`);
    }
  };

  // Click on Plus button (+)
  const handlePlusClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const hasModifiers = Boolean(product.modifierGroupIds && product.modifierGroupIds.length > 0);

    if (hasModifiers) {
      // Open the action modal matching Gacoan Image 1
      setProductForActionModal(product);
      setIsActionModalOpen(true);
      if (typeof window !== "undefined") {
        window.history.pushState({ modal: true }, "", window.location.href);
      }
    } else {
      // Directly increment quantity of non-modifier product
      const item = items.find((i) => i.productId === product.id);
      if (item) {
        updateQuantity(item.cartItemId, item.quantity + 1);
        toast.success(`${product.name} (+1)`);
      } else {
        addItem({
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl,
        });
      }
    }
  };

  // Click on Minus button (-)
  const handleMinusClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const hasModifiers = Boolean(product.modifierGroupIds && product.modifierGroupIds.length > 0);
    const cartItemsForProduct = items.filter((i) => i.productId === product.id);

    if (cartItemsForProduct.length === 0) return;

    if (!hasModifiers) {
      const item = cartItemsForProduct[0];
      updateQuantity(item.cartItemId, item.quantity - 1);
      toast.info(`${product.name} (-1)`);
    } else if (cartItemsForProduct.length === 1 && cartItemsForProduct[0].quantity === 1) {
      updateQuantity(cartItemsForProduct[0].cartItemId, 0);
      toast.info(`${product.name} dihapus dari keranjang`);
    } else {
      // For modifier items, open the action modal so customer can see all variations and manage quantities
      setProductForActionModal(product);
      setIsActionModalOpen(true);
      if (typeof window !== "undefined") {
        window.history.pushState({ modal: true }, "", window.location.href);
      }
    }
  };

  // Render Horizontal Product Card (Gojek reference style for Best Seller & Rekomendasi Outlet)
  const renderHorizontalProductCard = (product: Product) => {
    const hasModifiers = Boolean(product.modifierGroupIds && product.modifierGroupIds.length > 0);
    const cartItemsForProduct = items.filter((i) => i.productId === product.id);
    const totalQty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
    const soldText = formatSoldCount(product.totalSold);
    const hasImageError = imageErrors[product.id];

    return (
      <div
        key={product.id}
        onClick={() => {
          if (hasModifiers && totalQty > 0) {
            setProductForActionModal(product);
            setIsActionModalOpen(true);
            if (typeof window !== "undefined") {
              window.history.pushState({ modal: true }, "", window.location.href);
            }
          } else {
            handleOpenProductDetail(product);
          }
        }}
        className="group py-2 sm:py-2 flex items-center justify-between gap-3.5 sm:gap-6 border-b border-gray-150 sm:border-gray-200 last:border-b-0 cursor-pointer transition-colors w-full"
      >
        {/* Left Column: Title, Sold Count, Description, Price, Tambah Button */}
        <div className="flex-1 min-w-0 pr-2 sm:pr-3 flex flex-col justify-between py-1">
          <div className="space-y-0.5">
            {/* Title */}
            <h4 className="font-semibold text-sm sm:text-base text-gray-900 leading-snug line-clamp-2 group-hover:text-catalog-primary transition-colors">
              {product.name}
            </h4>

            {/* Sold Count */}
            {soldText && (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 py-0.5">
                <span>{soldText}</span>
              </div>
            )}

            {/* Description */}
            {product.description && product.description.trim() !== "" && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-0.5">
                {product.description}
              </p>
            )}
          </div>

          {/* Bottom Area: Price & Tambah / Stepper Directly Below Price */}
          <div className="pt-2 mt-auto space-y-1.5">
            <div>
              <span className="font-semibold text-sm sm:text-base text-gray-900 block leading-tight">
                {formatCurrency(Number(product.price))}
              </span>
            </div>

            {/* Action Button: Located below the price */}
            <div className="py-1"> 
              {totalQty === 0 ? (
                <button
                  type="button"
                  onClick={(e) => handleAddButtonClick(e, product)}
                  className="w-full h-8 sm:h-8.5 px-4 rounded-full border border-catalog-primary bg-white text-catalog-primary hover:bg-catalog-primary hover:text-white font-semibold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  Tambah
                </button>
              ) : (
                /* Stepper without border */
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={(e) => handleMinusClick(e, product)}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-catalog-primary/10 text-catalog-primary hover:bg-catalog-primary/20 transition-colors cursor-pointer active:scale-90"
                    aria-label={`Kurangi ${product.name}`}
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900 min-w-[18px] text-center select-none font-sans">
                    {totalQty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handlePlusClick(e, product)}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-catalog-primary text-white hover:bg-catalog-primary/90 transition-colors cursor-pointer active:scale-90 shadow-2xs"
                    aria-label={`Tambah ${product.name}`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Square Image centered vertically */}
        <div className="w-24 h-24 sm:w-24 sm:h-24 rounded-2xl bg-gray-100 overflow-hidden relative border border-gray-150 shadow-2xs shrink-0 aspect-square self-center">
          {product.imageUrl && !hasImageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageErrors((prev) => ({ ...prev, [product.id]: true }))}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 p-2 text-center">
              <Utensils className="w-5 h-5 text-gray-300 mb-1" />
              <span className="text-[10px] text-gray-400 font-medium leading-tight line-clamp-1">{product.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render a Single Product Card (2-column mobile grid matching Mie Gacoan & Gojek)
  const renderProductCard = (product: Product) => {
    const hasModifiers = Boolean(product.modifierGroupIds && product.modifierGroupIds.length > 0);
    const cartItemsForProduct = items.filter((i) => i.productId === product.id);
    const totalQty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div
        key={product.id}
        onClick={() => {
          if (hasModifiers && totalQty > 0) {
            setProductForActionModal(product);
            setIsActionModalOpen(true);
            if (typeof window !== "undefined") {
              window.history.pushState({ modal: true }, "", window.location.href);
            }
          } else {
            handleOpenProductDetail(product);
          }
        }}
        className="group relative bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
      >
        {/* Product Image Area */}
        <div className="relative w-full aspect-square bg-slate-50 overflow-hidden shrink-0">
          {product.imageUrl && !imageErrors[product.id] ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageErrors((prev) => ({ ...prev, [product.id]: true }))}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 p-2 text-center">
              <Utensils className="w-6 h-6 text-gray-300 mb-1" />
              <span className="text-[11px] font-medium text-gray-400">Menu Pilihan</span>
            </div>
          )}

          {/* Top Badges */}
          {product.isFeatured && (
            <div className="absolute top-2 left-2 z-10 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs tracking-wider uppercase">
              
              <span>Best Seller</span>
            </div>
          )}
        </div>

        {/* Product Info & Action Button */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
          <div>
            <h4 className="font-semibold text-md sm:text-md text-gray-900 uppercase leading-snug line-clamp-2">
              {product.name}
            </h4>
            {product.description && product.description.trim() !== "" && (
              <p className="text-[11px] text-gray-500 line-clamp-1 mt-1 leading-tight">
                {product.description}
              </p>
            )}
            <div className="font-semibold text-xs sm:text-sm text-gray-900 mt-1">
              {formatCurrency(Number(product.price))}
            </div>
          </div>

          {/* Action Button: "Add" vs Inline Stepper */}
          <div className="pt-0.5">
            {totalQty === 0 ? (
              <button
                type="button"
                onClick={(e) => handleAddButtonClick(e, product)}
                className="w-full h-8 sm:h-9 rounded-full border-2 border-catalog-primary text-catalog-primary hover:bg-catalog-primary hover:text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                Add
              </button>
            ) : (
              <div
                className="w-full h-8 sm:h-9 flex items-center justify-between px-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => handleMinusClick(e, product)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-catalog-primary/10 text-catalog-primary hover:bg-catalog-primary/20 active:scale-90 transition-transform cursor-pointer"
                  aria-label={`Kurangi ${product.name}`}
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="font-bold text-xs sm:text-sm text-gray-900 font-sans min-w-[20px] text-center">
                  {totalQty}
                </span>
                <button
                  type="button"
                  onClick={(e) => handlePlusClick(e, product)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-catalog-primary text-white hover:bg-catalog-primary/90 active:scale-90 transition-transform cursor-pointer shadow-2xs"
                  aria-label={`Tambah ${product.name}`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-28 w-full">
      {/* Sticky Combined Header: Search Bar + Horizontal Category Tabs */}
      <div className="sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-md pt-2 pb-0 -mx-4 px-4 border-b border-gray-200 shadow-2xs space-y-2.5">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="w-full pl-10 pr-9 h-11 bg-white rounded-2xl shadow-2xs border-gray-200 focus-visible:ring-catalog-primary text-sm placeholder:text-gray-400"
            placeholder="Cari makanan atau minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Horizontal Category Navigation Bar with Active Underline Indicator */}
        {!searchQuery && (
          <div
            ref={categoryTabsRef}
            className="overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-4 border-t border-gray-100 pt-1 w-full"
          >
            {allCategories.map((cat) => {
              const isActive = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={(el) => {
                    tabRefs.current[cat.id] = el;
                  }}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className={`pb-2 pt-1 px-1 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors shrink-0 relative cursor-pointer ${
                    isActive
                      ? "text-catalog-primary"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span>{cat.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeCategoryTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-catalog-primary rounded-full z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="mt-5 space-y-9">
        {searchQuery ? (
          /* Search Results Grid */
          <div>
            <h3 className="font-semibold text-base mb-4 text-gray-900 uppercase tracking-tight">
              Hasil Pencarian "{searchQuery}"
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {allCategories
                .flatMap((cat) => productsByCategory[cat.id] || [])
                .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((product) => renderProductCard(product))}
            </div>
          </div>
        ) : (
          /* Regular Categories Showcase */
          <>
            {/* 1. Best Seller Kami Section (Gojek Style 1 Row, Maksimal 5 Menu) */}
            {displayBestSellers.length > 0 && (
              <div id="category-bestseller" className="scroll-mt-28 space-y-2 pt-2 pb-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 uppercase tracking-tight">
                    Best Seller Kami
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">
                    {displayBestSellers.length} Menu
                  </span>
                </div>

                <div className="divide-y divide-gray-150 sm:divide-gray-200">
                  {displayBestSellers.map((product) => renderHorizontalProductCard(product))}
                </div>
              </div>
            )}

            {/* 2. Rekomendasi Outlet Section (Gojek Style 1 Row) */}
            {actualRecommended.length > 0 && (
              <div id="category-recommended" className="scroll-mt-28 space-y-2 pt-4 pb-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 uppercase tracking-tight">
                      Rekomendasi Outlet
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {actualRecommended.length} Menu
                  </span>
                </div>

                <div className="divide-y divide-gray-150 sm:divide-gray-200">
                  {actualRecommended.map((product) => renderHorizontalProductCard(product))}
                </div>
              </div>
            )}

            {/* 3. Standard Category Sections (2-column mobile grid) */}
            {allCategories
              .filter((c) => c.id !== "bestseller" && c.id !== "recommended")
              .map((cat) => {
                const catProducts = productsByCategory[cat.id];
                if (!catProducts || catProducts.length === 0) return null;

                return (
                  <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-28 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 uppercase tracking-tight">
                        {cat.name}
                      </h3>
                      <span className="text-xs font-semibold text-gray-400">
                        {catProducts.length} menu
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                      {catProducts.map((product) => renderProductCard(product))}
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>

      {/* Floating Cart Bar */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-40 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-md mx-auto">
            <Link
              href={`/store/${tenantSlug}/checkout${tableParam ? `?table=${tableParam}` : ""}`}
              className="block w-full"
            >
              <div className="bg-catalog-primary text-white rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-lg hover:opacity-95 transition-transform active:scale-[0.99] gap-3">
                {/* Left: Bag icon with Badge & Total Price */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <ShoppingBag className="h-4.5 w-4.5 text-white stroke-[2.2]" />
                    </div>
                    
                  </div>

                  <div className="min-w-0 leading-tight">
                    <span className="text-[10px] text-white/80 block uppercase font-medium tracking-wider">
                      Total
                    </span>
                    <span className=" text-sm sm:text-base font-semibold text-white">
                      {formatCurrency(getTotalPrice())}
                    </span>
                  </div>
                </div>

                {/* Right: Checkout Button */}
                <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-catalog-primary text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
                  <span>Checkout</span>
                  
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* 1. Unified Product Detail & Modifier Sheet (Screenshots 2 & 3) */}
      <ProductDetailSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingCartItem(null);
        }}
        product={
          selectedProductForSheet
            ? {
                ...selectedProductForSheet,
                categoryName:
                  categories.find((c) => c.id === selectedProductForSheet.categoryId)?.name || null,
              }
            : null
        }
        allModifierGroups={modifierGroups || []}
        initialModifiers={editingCartItem?.modifiers}
        initialNotes={editingCartItem?.notes}
        initialQuantity={editingCartItem?.quantity}
        editingCartItemId={editingCartItem?.cartItemId}
        onAddToCart={(product, modifiers, notes, qty, editingCartItemId) => {
          let extraPrice = 0;
          modifiers.forEach((m) => (extraPrice += Number(m.price)));
          if (editingCartItemId) {
            removeItem(editingCartItemId);
          }
          addItem(
            {
              productId: product.id,
              name: product.name,
              price: Number(product.price) + extraPrice,
              imageUrl: product.imageUrl,
              modifiers,
              notes,
            },
            qty
          );
          toast.success(
            editingCartItemId
              ? `${product.name} diperbarui`
              : `${product.name} (${qty}x) ditambahkan ke keranjang`
          );
          setEditingCartItem(null);
        }}
      />

      {/* 2. Modifier Action Modal matching Gacoan Image 1 */}
      <ModifierActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        product={productForActionModal}
        cartItemsForProduct={
          productForActionModal
            ? items.filter((i) => i.productId === productForActionModal.id)
            : []
        }
        onUpdateQuantity={(cartItemId, newQty) => {
          updateQuantity(cartItemId, newQty);
        }}
        onEditVariation={(item) => {
          const allProds = [
            ...bestSellerProducts,
            ...actualRecommended,
            ...Object.values(productsByCategory).flat(),
          ];
          const prod = allProds.find((p) => p.id === item.productId);
          if (prod) {
            handleOpenProductDetail(prod, item);
          }
        }}
        onMakeAnother={(product) => {
          handleOpenProductDetail(product);
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { Search, ShoppingBag, Plus, Minus, Star, ArrowRight, X, Flame, ThumbsUp, Utensils, Tag } from "lucide-react";
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
  activePromotions?: any[];
  primaryColor?: string | null;
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
  activePromotions = [],
  primaryColor,
}: CatalogProductListProps) {
  const themePrimaryColor = primaryColor || "var(--catalog-primary, #0e59f9)";
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

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Helper to calculate product pricing with potongan
  const getProductPricing = useCallback((product: Product) => {
    const origPrice = Number(product.price);
    const discount = Number(product.potongan || 0);
    const finalPrice = Math.max(0, origPrice - discount);
    return {
      origPrice,
      discount,
      finalPrice,
      hasDiscount: discount > 0,
    };
  }, []);

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
      const scrollY = window.scrollY + 145;
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
      const y = el.getBoundingClientRect().top + window.scrollY - 115;
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
      const { finalPrice } = getProductPricing(product);
      addItem({
        productId: product.id,
        name: product.name,
        price: finalPrice,
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
        const { finalPrice } = getProductPricing(product);
        addItem({
          productId: product.id,
          name: product.name,
          price: finalPrice,
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


  // Render Horizontal Product Card (for Best Seller & Rekomendasi Outlet as shown in screenshot)
  const renderHorizontalProductCard = (product: Product) => {
    const hasModifiers = Boolean(product.modifierGroupIds && product.modifierGroupIds.length > 0);
    const cartItemsForProduct = isMounted ? items.filter((i) => i.productId === product.id) : [];
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
        className="group py-3.5 sm:py-4 flex items-center justify-between gap-3.5 sm:gap-6 border-b border-slate-200/80 last:border-b-0 cursor-pointer transition-colors w-full"
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
          <div className="pt-2 mt-auto space-y-2">
            <div>
              {(() => {
                const { origPrice, finalPrice, hasDiscount } = getProductPricing(product);
                if (hasDiscount) {
                  return (
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-rose-600 block leading-tight">
                          {formatCurrency(finalPrice)}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(origPrice)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <span className="font-semibold text-sm sm:text-base text-gray-900 block leading-tight">
                    {formatCurrency(origPrice)}
                  </span>
                );
              })()}
            </div>

            {/* Action Button: Located below the price */}
            <div className="py-0.5">
              {totalQty === 0 ? (
                <button
                  type="button"
                  onClick={(e) => handleAddButtonClick(e, product)}
                  className="w-full h-10 py-2.5 px-4 rounded-full bg-catalog-primary hover:bg-catalog-primary/90 text-white font-semibold text-xs sm:text-sm shadow-sm-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center border-none"
                  style={{ backgroundColor: themePrimaryColor }}
                >
                  Tambah
                </button>
              ) : (
                /* Stepper with Menuin white button rule for minus & theme pill for plus */
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-10 flex items-center justify-between gap-2 px-1"
                >
                  <button
                    type="button"
                    onClick={(e) => handleMinusClick(e, product)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-slate-900 hover:bg-slate-50 border border-slate-700 shadow-sm-md transition-all cursor-pointer active:scale-90"
                    aria-label={`Kurangi ${product.name}`}
                  >
                    <Minus className="w-4 h-4 stroke-[2.2] text-slate-700" />
                  </button>
                  <span className="text-sm font-semibold text-slate-900 min-w-[20px] text-center select-none font-numeric tabular-nums">
                    {totalQty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handlePlusClick(e, product)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-catalog-primary hover:bg-catalog-primary/90 text-white shadow-sm-md transition-all active:scale-90 cursor-pointer border-none"
                    style={{ backgroundColor: themePrimaryColor }}
                    aria-label={`Tambah ${product.name}`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.2]" />
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
    const cartItemsForProduct = isMounted ? items.filter((i) => i.productId === product.id) : [];
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
        className="group relative bg-white rounded-2xl shadow-md hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer border-none"
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
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
            {product.isFeatured && (
              <div className="bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs tracking-wider uppercase">
                <span>Best Seller</span>
              </div>
            )}
            {Number(product.potongan || 0) > 0 && (
              <div className="bg-rose-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs tracking-wider uppercase">
                <span>Hemat {formatCurrency(Number(product.potongan))}</span>
              </div>
            )}
          </div>
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
            {(() => {
              const { origPrice, finalPrice, hasDiscount } = getProductPricing(product);
              if (hasDiscount) {
                return (
                  <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-rose-600">
                      {formatCurrency(finalPrice)}
                    </span>
                    <span className="text-[11px] text-gray-400 line-through">
                      {formatCurrency(origPrice)}
                    </span>
                  </div>
                );
              }
              return (
                <div className="font-semibold text-xs sm:text-sm text-gray-900 mt-1">
                  {formatCurrency(origPrice)}
                </div>
              );
            })()}
          </div>

          {/* Action Button: "Add" vs Inline Stepper */}
          <div className="pt-0.5">
            {totalQty === 0 ? (
              <button
                type="button"
                onClick={(e) => handleAddButtonClick(e, product)}
                className="w-full h-9.5 py-2 rounded-full bg-catalog-primary hover:bg-catalog-primary/90 text-white font-semibold text-xs sm:text-sm shadow-sm-md flex items-center justify-center transition-all cursor-pointer active:scale-[0.98] border-none"
                style={{ backgroundColor: themePrimaryColor }}
              >
                Add
              </button>
            ) : (
              <div
                className="w-full h-9.5 flex items-center justify-between px-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => handleMinusClick(e, product)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-slate-900 hover:bg-slate-50 border border-slate-700 shadow-sm-md active:scale-90 transition-all cursor-pointer"
                  aria-label={`Kurangi ${product.name}`}
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.2] text-slate-700" />
                </button>
                <span className="font-semibold text-xs sm:text-sm text-slate-900 font-numeric tabular-nums min-w-[20px] text-center">
                  {totalQty}
                </span>
                <button
                  type="button"
                  onClick={(e) => handlePlusClick(e, product)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-catalog-primary hover:bg-catalog-primary/90 text-white shadow-sm-md active:scale-90 transition-all cursor-pointer border-none"
                  style={{ backgroundColor: themePrimaryColor }}
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
    <div className="w-full">
      {/* Unified Sticky Header: Search Bar + Horizontal Category Tabs */}
      <div className="sticky top-0 z-30 bg-white border-none shadow-none transition-shadow">
        {/* Search Bar */}
        <div className="relative w-full px-3.5 sm:px-4 pt-3.5 pb-2">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
            <Input
              className="w-full pl-10 pr-9 h-11 bg-white rounded-full shadow-md border-none focus-visible:ring-2 focus-visible:ring-catalog-primary text-sm placeholder:text-slate-400 text-slate-900"
              placeholder="Cari makanan atau minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs (shown when not searching) */}
        {!searchQuery && (
          <div className="px-3.5 sm:px-4">
            <div
              ref={categoryTabsRef}
              className="overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-4 pt-1 pb-2.5 w-full"
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
                    className={`pb-1.5 pt-0.5 px-1 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors shrink-0 relative cursor-pointer ${
                      isActive
                        ? "text-catalog-primary"
                        : "text-slate-500 hover:text-slate-800 font-medium"
                    }`}
                    style={isActive ? { color: themePrimaryColor } : undefined}
                  >
                    <span>{cat.name}</span>
                    {isActive && (
                      <motion.span
                        layoutId="activeCategoryTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-catalog-primary rounded-full z-10"
                        style={{ backgroundColor: themePrimaryColor }}
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
          </div>
        )}
      </div>

      {/* Main Content Area - Pure White Background */}
      <div className="bg-white px-3.5 sm:px-4 pt-4 pb-28 space-y-9 min-h-[70vh]">
        {searchQuery ? (
          /* Search Results Grid */
          <div>
            <h3 className="font-semibold text-base mb-4 text-gray-900 uppercase tracking-tight">
              Hasil Pencarian "{searchQuery}"
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {allCategories
                .flatMap((cat) => productsByCategory[cat.id] || [])
                .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((product) => renderProductCard(product))}
            </div>
          </div>
        ) : (
          /* Regular Categories Showcase */
          <>
            {/* 1. Best Seller Kami Section (Horizontal List Layout as in screenshot) */}
            {displayBestSellers.length > 0 && (
              <div id="category-bestseller" className="scroll-mt-32 space-y-2 pt-2 pb-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 uppercase tracking-tight">
                    Best Seller Kami
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">
                    {displayBestSellers.length} Menu
                  </span>
                </div>

                <div className="flex flex-col">
                  {displayBestSellers.map((product) => renderHorizontalProductCard(product))}
                </div>
              </div>
            )}

            {/* 2. Rekomendasi Outlet Section (Horizontal List Layout as in screenshot) */}
            {actualRecommended.length > 0 && (
              <div id="category-recommended" className="scroll-mt-32 space-y-2 pt-4 pb-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 uppercase tracking-tight">
                      Rekomendasi Outlet
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {actualRecommended.length} Menu
                  </span>
                </div>

                <div className="flex flex-col">
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
                  <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-32 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 uppercase tracking-tight">
                        {cat.name}
                      </h3>
                      <span className="text-xs font-semibold text-gray-400">
                        {catProducts.length} menu
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {catProducts.map((product) => renderProductCard(product))}
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>

      {/* Floating Cart Bar - Full rounded Menuin Blue with shadow-md (No upward white shadow) */}
      {isMounted && getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <Link
              href={`/store/${tenantSlug}/checkout${tableParam ? `?table=${tableParam}` : ""}`}
              className="block w-full"
            >
              <div
                className="bg-catalog-primary text-white rounded-full px-4 py-3 flex items-center justify-between shadow-md hover:bg-catalog-primary/90 transition-all active:scale-[0.99] gap-3"
                style={{ backgroundColor: themePrimaryColor }}
              >
                {/* Left: Bag icon with Badge & Total Price */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <ShoppingBag className="h-4.5 w-4.5 text-white stroke-[2.2]" />
                    </div>
                  </div>

                  <div className="min-w-0 leading-tight">
                    <span className="text-[10px] text-white/80 block uppercase font-medium tracking-wider">
                      Total
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-white font-numeric tabular-nums">
                      {formatCurrency(getTotalPrice())}
                    </span>
                  </div>
                </div>

                {/* Right: Checkout Button (White pill on blue bar) */}
                <div
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-catalog-primary text-xs sm:text-sm font-semibold tracking-wide shadow-sm-md hover:bg-slate-50 transition-colors"
                  style={{ color: themePrimaryColor }}
                >
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
        primaryColor={primaryColor || undefined}
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
          const { finalPrice } = getProductPricing(product);
          addItem(
            {
              productId: product.id,
              name: product.name,
              price: finalPrice + extraPrice,
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
        primaryColor={primaryColor || undefined}
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

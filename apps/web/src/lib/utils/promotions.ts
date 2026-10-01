export type CartItemForPromo = {
  productId: string;
  price: number;
  quantity: number;
};

export function calculatePromoDiscount(promo: any, subtotal: number, items?: CartItemForPromo[]) {
  const minOrder = parseFloat(promo.minOrder || '0');
  if (subtotal < minOrder) {
    return {
      isValid: false,
      error: `Minimal belanja Rp ${minOrder.toLocaleString('id-ID')} untuk menggunakan promo ini.`,
      discountAmount: 0,
      eligibleSubtotal: 0,
      targetType: promo.targetType || 'ALL',
      applicableProductIds: [] as string[],
      itemDiscounts: {} as Record<string, number>,
    };
  }

  let eligibleSubtotal = subtotal;
  let applicableIds: string[] = [];
  const itemDiscounts: Record<string, number> = {};

  if (promo.targetType === 'SPECIFIC_PRODUCTS') {
    if (Array.isArray(promo.applicableProductIds)) {
      applicableIds = promo.applicableProductIds;
    } else if (typeof promo.applicableProductIds === 'string') {
      try {
        applicableIds = JSON.parse(promo.applicableProductIds);
      } catch (e) {
        applicableIds = [];
      }
    }

    if (applicableIds.length > 0) {
      if (!items || items.length === 0) {
        return {
          isValid: false,
          error: 'Keranjang tidak mengandung produk yang berlaku untuk promo ini.',
          discountAmount: 0,
          eligibleSubtotal: 0,
          targetType: promo.targetType,
          applicableProductIds: applicableIds,
          itemDiscounts: {},
        };
      }

      const matchingItems = items.filter((it) => applicableIds.includes(it.productId));
      if (matchingItems.length === 0) {
        return {
          isValid: false,
          error: 'Promo ini hanya berlaku untuk menu tertentu yang belum ada di keranjang Anda.',
          discountAmount: 0,
          eligibleSubtotal: 0,
          targetType: promo.targetType,
          applicableProductIds: applicableIds,
          itemDiscounts: {},
        };
      }

      const totalQty = matchingItems.reduce((sum, it) => sum + (it.quantity || 1), 0);
      const minQty = promo.minProductQty || 1;

      if (totalQty < minQty) {
        return {
          isValid: false,
          error: `Promo ini memerlukan minimal ${minQty} pcs produk promo dalam keranjang.`,
          discountAmount: 0,
          eligibleSubtotal: 0,
          targetType: promo.targetType,
          applicableProductIds: applicableIds,
          itemDiscounts: {},
        };
      }

      eligibleSubtotal = matchingItems.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);
    }
  }

  if (eligibleSubtotal <= 0) {
    return {
      isValid: false,
      error: 'Keranjang tidak mengandung produk yang berlaku untuk promo ini.',
      discountAmount: 0,
      eligibleSubtotal: 0,
      targetType: promo.targetType || 'ALL',
      applicableProductIds: applicableIds,
      itemDiscounts: {},
    };
  }

  let discountAmount = 0;
  const promoValue = parseFloat(promo.value);

  if (promo.type === 'PERCENTAGE') {
    discountAmount = (eligibleSubtotal * promoValue) / 100;
    if (promo.maxDiscount) {
      const maxDisc = parseFloat(promo.maxDiscount);
      if (discountAmount > maxDisc) {
        discountAmount = maxDisc;
      }
    }
  } else {
    discountAmount = promoValue;
  }

  if (discountAmount > eligibleSubtotal) {
    discountAmount = eligibleSubtotal;
  }
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  // Calculate per-item discount allocation ONLY for SPECIFIC_PRODUCTS.
  // Global discounts (targetType === 'ALL') are applied at the order/subtotal level after everything is totaled,
  // NOT deducted from individual items.
  const isSpecific = promo.targetType === 'SPECIFIC_PRODUCTS' && applicableIds.length > 0;
  if (isSpecific && items && items.length > 0 && discountAmount > 0) {
    const targetItems = items.filter((it) => applicableIds.includes(it.productId));

    if (promo.type === 'PERCENTAGE') {
      const totalRawDiscount = targetItems.reduce((sum, it) => {
        return sum + ((it.price * (it.quantity || 1) * promoValue) / 100);
      }, 0);

      const scale = totalRawDiscount > 0 ? discountAmount / totalRawDiscount : 1;

      targetItems.forEach((it) => {
        const raw = (it.price * (it.quantity || 1) * promoValue) / 100;
        const itemDisc = Math.round(raw * scale);
        itemDiscounts[it.productId] = (itemDiscounts[it.productId] || 0) + itemDisc;
      });
    } else {
      // Fixed discount distributed proportionally to eligible item subtotals
      const totalEligible = targetItems.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);
      let allocatedSoFar = 0;

      targetItems.forEach((it, idx) => {
        if (idx === targetItems.length - 1) {
          // Last item gets remaining to ensure exact match
          itemDiscounts[it.productId] = Math.max(0, Math.round(discountAmount - allocatedSoFar));
        } else {
          const itemSubtotal = it.price * (it.quantity || 1);
          const share = totalEligible > 0 ? (itemSubtotal / totalEligible) * discountAmount : 0;
          const roundedShare = Math.round(share);
          allocatedSoFar += roundedShare;
          itemDiscounts[it.productId] = (itemDiscounts[it.productId] || 0) + roundedShare;
        }
      });
    }
  }

  return {
    isValid: true,
    discountAmount: Math.round(discountAmount),
    eligibleSubtotal,
    targetType: promo.targetType || 'ALL',
    applicableProductIds: applicableIds,
    itemDiscounts,
  };
}

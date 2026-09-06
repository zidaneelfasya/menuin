export interface OrderItemDto {
  id: string;
  transactionId: string;
  productId?: string;
  quantity: number;
  productName: string;
  subtotal: string;
  isCompleted: boolean;
  modifiers?: any; // or specify a better type if needed
  notes?: string | null;
}

export interface OrderDto {
  id: string;
  tenantId: string;
  userId?: string | null;
  shiftId?: string | null;
  orderNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  tableNumber: string | null;
  totalAmount: string;
  discount: string | null;
  tax: string | null;
  serviceCharge: string | null;
  platformFee: string | null;
  grandTotal: string;
  promoCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  source: string;
  orderType: string;
  items: OrderItemDto[];
  createdAt?: Date;
}

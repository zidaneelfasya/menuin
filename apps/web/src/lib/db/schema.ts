import { pgTable, text, timestamp, integer, decimal, boolean, uuid, uniqueIndex, unique, foreignKey, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const subscriptionTierEnum = pgEnum('subscription_tier', ['FREE', 'BASIC', 'PRO']);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('FREE').notNull(),
  storefrontEnabled: boolean('storefront_enabled').default(true).notNull(),
  storeDescription: text('store_description'),
  storeLogoUrl: text('store_logo_url'),
  storeBannerUrl: text('store_banner_url'),
  primaryColor: text('primary_color').default('#2563EB'), // Default blue
  
  // Ordering settings
  dineInEnabled: boolean('dine_in_enabled').default(true).notNull(),
  takeAwayEnabled: boolean('take_away_enabled').default(true).notNull(),
  deliveryEnabled: boolean('delivery_enabled').default(false).notNull(),
  customerNameRequired: boolean('customer_name_required').default(true).notNull(),
  customerPhoneRequired: boolean('customer_phone_required').default(false).notNull(),
  tableNumberRequired: boolean('table_number_required').default(false).notNull(),
  orderProcessType: text('order_process_type').default('MANUAL').notNull(), // MANUAL, AUTO
  
  // POS Settings
  posKitchenSync: boolean('pos_kitchen_sync').default(false).notNull(), // false = COMPLETED, true = PENDING (Kitchen)
  posRequireCustomer: boolean('pos_require_customer').default(false).notNull(), // false = Bebas, true = Wajib isi
  posOrderTypeSelection: text('pos_order_type_selection').default('MANUAL').notNull(), // MANUAL, DINE_IN, TAKEAWAY
  posTaxRate: decimal('pos_tax_rate', { precision: 5, scale: 2 }).default('0').notNull(),
  taxName: text('tax_name').default('Pajak (PB1)').notNull(),
  serviceChargeRate: decimal('service_charge_rate', { precision: 5, scale: 2 }).default('0').notNull(),
  
  // Potongan Komisi Platform Online Food (%)
  grabFoodFeeRate: decimal('grab_food_fee_rate', { precision: 5, scale: 2 }).default('20').notNull(),
  shopeeFoodFeeRate: decimal('shopee_food_fee_rate', { precision: 5, scale: 2 }).default('20').notNull(),
  goFoodFeeRate: decimal('go_food_fee_rate', { precision: 5, scale: 2 }).default('20').notNull(),
  
  // Preferensi Tampilan
  posPinBestSellers: boolean('pos_pin_best_sellers').default(true).notNull(),
  
  // Payment settings
  onlinePaymentEnabled: boolean('online_payment_enabled').default(false).notNull(),
  midtransServerKey: text('midtrans_server_key'),
  midtransClientKey: text('midtrans_client_key'),
  midtransEnvironment: text('midtrans_environment').default('sandbox'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roleEnum = pgEnum('tenant_role', ['OWNER', 'MANAGER', 'CASHIER', 'STAFF']);
export const invitationStatusEnum = pgEnum('invitation_status', ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']);

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  authUserId: uuid('auth_user_id'), // Relasi ke Supabase Auth (auth.users.id)
  username: text('username').notNull(),
  displayName: text('display_name').notNull(),
  email: text('email'),
  pinHash: text('pin_hash'),
  role: roleEnum('role').notNull().default('STAFF'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, SUSPENDED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantUsernameIdx: uniqueIndex('tenant_username_idx').on(table.tenantId, table.username),
    tenantIdUnique: unique('memberships_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const posDevices = pgTable('pos_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  deviceIdentifier: text('device_identifier').unique().notNull(),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, REVOKED
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdUnique: unique('pos_devices_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const posSessions = pgTable('pos_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  deviceId: uuid('device_id').notNull(),
  membershipId: uuid('membership_id').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, TERMINATED
}, (table) => {
  return {
    deviceFk: foreignKey({
      columns: [table.tenantId, table.deviceId],
      foreignColumns: [posDevices.tenantId, posDevices.id]
    }),
    membershipFk: foreignKey({
      columns: [table.tenantId, table.membershipId],
      foreignColumns: [memberships.tenantId, memberships.id]
    }),
    tenantIdUnique: unique('pos_sessions_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: text('email').notNull(),
  role: roleEnum('role').notNull().default('STAFF'),
  tokenHash: text('token_hash').notNull(),
  status: invitationStatusEnum('status').notNull().default('PENDING'),
  invitedBy: uuid('invited_by'), // FK to memberships
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    invitedByFk: foreignKey({
      columns: [table.tenantId, table.invitedBy],
      foreignColumns: [memberships.tenantId, memberships.id]
    })
  };
});

export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  ipAddress: text('ip_address'),
  action: text('action').notNull(),
  attempts: integer('attempts').notNull().default(1),
  lockUntil: timestamp('lock_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  actorMembershipId: uuid('actor_membership_id'),
  action: text('action').notNull(),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    actorMembershipFk: foreignKey({
      columns: [table.tenantId, table.actorMembershipId],
      foreignColumns: [memberships.tenantId, memberships.id]
    })
  };
});

export const promotions = pgTable('promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: text('type').default('PERCENTAGE').notNull(), // 'PERCENTAGE' | 'FIXED'
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  minOrder: decimal('min_order', { precision: 12, scale: 2 }).default('0').notNull(),
  maxDiscount: decimal('max_discount', { precision: 12, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantPromoCodeIdx: uniqueIndex('tenant_promo_code_idx').on(table.tenantId, table.code),
  };
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantSlugIdx: uniqueIndex('tenant_slug_idx').on(table.tenantId, table.slug),
    tenantIdUnique: unique('categories_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  categoryId: uuid('category_id'), // Need FK
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  barcode: text('barcode'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(5),
  imageUrl: text('image_url'),
  isAvailableOnline: boolean('is_available_online').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantSkuIdx: uniqueIndex('tenant_sku_idx').on(table.tenantId, table.sku),
    tenantBarcodeIdx: uniqueIndex('tenant_barcode_idx').on(table.tenantId, table.barcode),
    tenantIdUnique: unique('products_tenant_id_unique').on(table.tenantId, table.id),
    categoryFk: foreignKey({
      columns: [table.tenantId, table.categoryId],
      foreignColumns: [categories.tenantId, categories.id]
    })
  };
});

export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  membershipId: uuid('membership_id').notNull(),
  deviceId: uuid('device_id'), // Optional if shift doesn't require device
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  startingCash: decimal('starting_cash', { precision: 12, scale: 2 }).notNull().default('0'),
  actualCash: decimal('actual_cash', { precision: 12, scale: 2 }), // Uang aktual di laci saat shift ditutup
  expectedCash: decimal('expected_cash', { precision: 12, scale: 2 }), // Modal awal + transaksi CASH + cash in - cash out
  cashDifference: decimal('cash_difference', { precision: 12, scale: 2 }), // Selisih (actual - expected)
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, ENDED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    membershipFk: foreignKey({
      columns: [table.tenantId, table.membershipId],
      foreignColumns: [memberships.tenantId, memberships.id]
    }),
    deviceFk: foreignKey({
      columns: [table.tenantId, table.deviceId],
      foreignColumns: [posDevices.tenantId, posDevices.id]
    }),
    tenantIdUnique: unique('shifts_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const cashMovements = pgTable('cash_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(), // Add tenantId for isolation
  shiftId: uuid('shift_id').notNull(),
  type: text('type').notNull(), // IN, OUT
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    shiftFk: foreignKey({
      columns: [table.tenantId, table.shiftId],
      foreignColumns: [shifts.tenantId, shifts.id]
    })
  };
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  source: text('source').default('POS').notNull(), // POS, QR, WEB_ORDER, DELIVERY
  posSessionId: uuid('pos_session_id'), // Nullable
  cashierMembershipId: uuid('cashier_membership_id'), // Nullable
  shiftId: uuid('shift_id'), // Relates transaction to a shift
  
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).default('0'),
  tax: decimal('tax', { precision: 12, scale: 2 }).default('0'),
  serviceCharge: decimal('service_charge', { precision: 12, scale: 2 }).default('0'),
  platformFee: decimal('platform_fee', { precision: 12, scale: 2 }).default('0'),
  grandTotal: decimal('grand_total', { precision: 12, scale: 2 }).notNull(),
  promoCode: text('promo_code'),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('PENDING'), // PENDING, PAID, CANCELED, REFUNDED
  status: text('status').notNull().default('COMPLETED'),
  orderType: text('order_type').default('DINE_IN').notNull(), // DINE_IN, TAKEAWAY, DELIVERY, GRABFOOD, SHOPEEFOOD, GOFOOD
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  tableNumber: text('table_number'),
  publicToken: uuid('public_token').defaultRandom().unique(), // For public order tracking
  orderNumber: text('order_number').unique(), // For short human-readable order IDs
  snapToken: text('snap_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    posSessionFk: foreignKey({
      columns: [table.tenantId, table.posSessionId],
      foreignColumns: [posSessions.tenantId, posSessions.id]
    }),
    cashierMembershipFk: foreignKey({
      columns: [table.tenantId, table.cashierMembershipId],
      foreignColumns: [memberships.tenantId, memberships.id]
    }),
    shiftFk: foreignKey({
      columns: [table.tenantId, table.shiftId],
      foreignColumns: [shifts.tenantId, shifts.id]
    }),
    tenantIdUnique: unique('transactions_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(), // Add tenantId for isolation
  transactionId: uuid('transaction_id').notNull(),
  productId: uuid('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  modifiers: json('modifiers'), // Store array of { id, name, price } selected
  notes: text('notes'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    transactionFk: foreignKey({
      columns: [table.tenantId, table.transactionId],
      foreignColumns: [transactions.tenantId, transactions.id]
    }),
    productFk: foreignKey({
      columns: [table.tenantId, table.productId],
      foreignColumns: [products.tenantId, products.id]
    })
  };
});

export const modifierGroups = pgTable('modifier_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  minSelections: integer('min_selections').default(0).notNull(),
  maxSelections: integer('max_selections').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdUnique: unique('modifier_groups_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const modifiers = pgTable('modifiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(), // Add tenantId for isolation
  groupId: uuid('group_id').notNull(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    groupFk: foreignKey({
      columns: [table.tenantId, table.groupId],
      foreignColumns: [modifierGroups.tenantId, modifierGroups.id]
    }),
    tenantIdUnique: unique('modifiers_tenant_id_unique').on(table.tenantId, table.id),
  };
});

export const productModifierGroups = pgTable('product_modifier_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(), // Add tenantId
  productId: uuid('product_id').notNull(),
  modifierGroupId: uuid('modifier_group_id').notNull(),
}, (table) => {
  return {
    productFk: foreignKey({
      columns: [table.tenantId, table.productId],
      foreignColumns: [products.tenantId, products.id]
    }),
    modifierGroupFk: foreignKey({
      columns: [table.tenantId, table.modifierGroupId],
      foreignColumns: [modifierGroups.tenantId, modifierGroups.id]
    })
  };
});

export const testimonials = pgTable('testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  avatarUrl: text('avatar_url'),
  rating: decimal('rating', { precision: 2, scale: 1 }).notNull().default('5.0'),
  content: text('content').notNull(),
  sentiment: text('sentiment').notNull().default('Excellent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(), // Add tenantId
  transactionId: uuid('transaction_id').notNull(),
  providerTransactionId: text('provider_transaction_id'),
  provider: text('provider').default('MIDTRANS').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    transactionFk: foreignKey({
      columns: [table.tenantId, table.transactionId],
      foreignColumns: [transactions.tenantId, transactions.id]
    })
  };
});

export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  qrCodeUrl: text('qr_code_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const operatingHours = pgTable('operating_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, etc.
  openTime: text('open_time').notNull().default('09:00'),
  closeTime: text('close_time').notNull().default('22:00'),
  isClosed: boolean('is_closed').default(false).notNull(),
});

export const modifierGroupsRelations = relations(modifierGroups, ({ many }) => ({
  modifiers: many(modifiers),
}));

export const modifiersRelations = relations(modifiers, ({ one }) => ({
  group: one(modifierGroups, {
    fields: [modifiers.groupId],
    references: [modifierGroups.id],
  }),
}));


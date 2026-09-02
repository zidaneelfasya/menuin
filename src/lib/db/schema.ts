import { pgTable, text, timestamp, integer, decimal, boolean, uuid, uniqueIndex, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
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
  
  
  // Payment settings
  midtransServerKey: text('midtrans_server_key'),
  midtransClientKey: text('midtrans_client_key'),
  midtransEnvironment: text('midtrans_environment').default('sandbox'),

  isPaid: boolean('is_paid').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roleEnum = pgEnum('role', ['CASHIER', 'SUPERADMIN', 'SYSTEM_ADMIN']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('CASHIER'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  };
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
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
  };
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).default('0'),
  tax: decimal('tax', { precision: 12, scale: 2 }).default('0'),
  grandTotal: decimal('grand_total', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull().default('COMPLETED'),
  source: text('source').default('POS').notNull(), // POS, ONLINE
  orderType: text('order_type').default('DINE_IN').notNull(), // DINE_IN, TAKEAWAY, DELIVERY
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  tableNumber: text('table_number'),
  publicToken: uuid('public_token').defaultRandom().unique(), // For public order tracking
  orderNumber: text('order_number').unique(), // For short human-readable order IDs
  snapToken: text('snap_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').references(() => transactions.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  modifiers: json('modifiers'), // Store array of { id, name, price } selected
  notes: text('notes'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
});

export const modifiers = pgTable('modifiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => modifierGroups.id).notNull(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productModifierGroups = pgTable('product_modifier_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  modifierGroupId: uuid('modifier_group_id').references(() => modifierGroups.id).notNull(),
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
  transactionId: uuid('transaction_id').references(() => transactions.id).notNull(),
  providerTransactionId: text('provider_transaction_id'),
  provider: text('provider').default('MIDTRANS').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

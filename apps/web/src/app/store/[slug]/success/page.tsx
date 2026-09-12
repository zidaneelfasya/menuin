import { db } from "@/lib/db";
import { tenants, transactions, transactionItems, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;
  
  if (!token) notFound();

  // Get tenant
  const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (tenantResult.length === 0) notFound();
  const tenant = tenantResult[0];

  // Get transaction
  const txResult = await db.select().from(transactions).where(eq(transactions.publicToken, token)).limit(1);
  if (txResult.length === 0) notFound();
  const transaction = txResult[0];

  // Get items
  const items = await db
    .select({
      quantity: transactionItems.quantity,
      price: transactionItems.price,
      subtotal: transactionItems.subtotal,
      productName: products.name,
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .where(eq(transactionItems.transactionId, transaction.id));

  return (
    <div className="max-w-md mx-auto space-y-6 pt-10 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Berhasil!</h2>
        <p className="text-muted-foreground text-sm px-4">
          Terima kasih, pesanan Anda sedang kami proses.
        </p>

        <div className="mt-8 bg-[#f8fafc] rounded-2xl p-5 text-left border">
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4" /> Status
            </span>
            <span className="font-bold text-catalog-primary bg-catalog-primary/10 px-3 py-1 rounded-full text-xs">
              {transaction.status}
            </span>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipe Pesanan</span>
              <span className="font-semibold text-gray-800">{transaction.orderType.replace('_', ' ')}</span>
            </div>
            {transaction.tableNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nomor Meja</span>
                <span className="font-semibold text-gray-800">{transaction.tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metode Bayar</span>
              <span className="font-semibold text-gray-800">{transaction.paymentMethod}</span>
            </div>
            {transaction.customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Atas Nama</span>
                <span className="font-semibold text-gray-800">{transaction.customerName}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-5">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-gray-800">
              <Package className="w-4 h-4" /> Daftar Pesanan
            </h4>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600"><span className="font-medium text-gray-800">{item.quantity}x</span> {item.productName}</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(Number(item.subtotal))}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold mt-5 pt-4 border-t text-gray-900 text-lg">
              <span>Total</span>
              <span className="text-catalog-primary">{formatCurrency(Number(transaction.grandTotal))}</span>
            </div>
          </div>
        </div>

        <Link 
          href={`/`}
          className="mt-8 flex items-center justify-center gap-2 w-full py-4 px-4 bg-catalog-primary text-white rounded-2xl font-bold hover:bg-catalog-primary/90 transition-transform active:scale-95 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Pesan Lagi
        </Link>
      </div>
    </div>
  );
}

import { getActiveOrders } from "@/lib/actions/orders";
import { getCurrentUser } from "@/lib/actions/auth";
import { KanbanBoard } from "@/features/orders/components/kanban-board";
import { redirect } from "next/navigation";
import { requireFeature } from "@/lib/actions/auth-context";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Pesanan Masuk - Menuin',
};

export default async function OrdersPage() {
  await requireFeature('POS');
  const user = await getCurrentUser();
  if (!user || !user.tenantId) {
    redirect("/auth/login");
  }

  const initialOrders = await getActiveOrders();

  return (
    <div className="h-[calc(100vh-80px)] p-4 md:p-6 overflow-hidden flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Pesanan Masuk</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Pantau dan proses antrean pesanan kasir & online secara langsung.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {/* We need to pass JSON-serializable object to client component */}
        <KanbanBoard 
          initialOrders={JSON.parse(JSON.stringify(initialOrders))} 
          tenantId={user.tenantId} 
        />
      </div>
    </div>
  );
}

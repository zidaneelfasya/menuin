import { getActiveOrders } from "@/lib/actions/orders";
import { getCurrentUser } from "@/lib/actions/auth";
import { KanbanBoard } from "@/features/orders/components/kanban-board";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) {
    redirect("/auth/login");
  }

  const initialOrders = await getActiveOrders();

  return (
    <div className="h-[calc(100vh-64px)] p-6 overflow-hidden flex flex-col">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pesanan Aktif (Dapur)</h1>
          <p className="text-slate-500 mt-1">Kelola pesanan pelanggan dari aplikasi kasir dan online secara realtime.</p>
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

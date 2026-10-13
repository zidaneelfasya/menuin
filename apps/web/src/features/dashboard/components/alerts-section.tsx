import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

type LowStockAlertsProps = {
  products: { name: string; stock: number }[];
};

export function AlertsSection({ products }: LowStockAlertsProps) {
  return (
    <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Stok Produk Menipis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          {products.length > 0 ? (
            products.map((product, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium">{product.name}</div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-md border-none">
                  {product.stock} pcs
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">Semua stok produk aman.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

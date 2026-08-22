import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

type LowStockAlertsProps = {
  products: { name: string; stock: number }[];
};

export function AlertsSection({ products }: LowStockAlertsProps) {
  return (
    <Card className="rounded-2xl shadow-sm border-border/50 border-l-4 border-l-orange-500 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center text-orange-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Stok Produk Menipis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          {products.length > 0 ? (
            products.map((product, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                <div className="text-sm font-medium">{product.name}</div>
                <div className="text-sm font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">{product.stock} pcs</div>
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

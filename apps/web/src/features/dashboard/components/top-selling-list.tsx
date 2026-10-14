import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TopSellingListProps = {
  products: { name: string; totalSold: number }[];
};

export function TopSellingList({ products }: TopSellingListProps) {
  return (
    <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Produk Terlaris</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length > 0 ? (
            products.map((product, index) => (
              <div key={index} className="flex items-center">
                <div className="w-6 text-sm font-semibold text-muted-foreground">{index + 1}.</div>
                <div className="flex-1 text-sm font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">{product.totalSold} pcs</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">Belum ada data penjualan.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

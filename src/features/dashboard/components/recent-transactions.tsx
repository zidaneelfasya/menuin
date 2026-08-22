import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type RecentTransactionsProps = {
  transactions: {
    id: string;
    date: Date;
    totalAmount: string;
    paymentMethod: string;
    status: string;
  }[];
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="rounded-2xl shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Transaksi Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">
                  {tx.paymentMethod === 'qris' ? 'Pembayaran QRIS' : 'Pembayaran Tunai'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tx.date), "dd MMM yyyy, HH:mm", { locale: id })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(Number(tx.totalAmount))}
                </p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  tx.status.toLowerCase() === 'completed' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada transaksi.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

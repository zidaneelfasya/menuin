import { getTenantTables, addTenantTable } from "@/lib/actions/catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Plus, Trash2 } from "lucide-react";
import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { TableQrDialog } from "@/features/catalog/components/table-qr-dialog";

export default async function CatalogTablesPage() {
  const tablesList = await getTenantTables();
  const settings = await getTenantCatalogSettings();

  const isDev = process.env.NODE_ENV !== "production";
  const domain = isDev ? "localhost:3000" : "menuin.id";
  const catalogUrl = settings.slug ? `http://${settings.slug}.${domain}` : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Meja & QR Code</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola meja dan cetak QR Code untuk memudahkan pelanggan memesan dari meja.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tambah Meja</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (formData) => { "use server"; await addTenantTable(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama atau Nomor Meja</Label>
                  <Input id="name" name="name" placeholder="Contoh: Meja 1, VIP 2" required />
                </div>
                <Button type="submit" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Meja
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Meja</CardTitle>
              <CardDescription>
                Pelanggan yang memindai QR code akan otomatis mengisi nomor meja di checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tablesList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>Belum ada meja yang ditambahkan.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Meja</TableHead>
                      <TableHead>Link Pemesanan (QR Data)</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tablesList.map((table) => {
                      const tableUrl = catalogUrl ? `${catalogUrl}/?table=${encodeURIComponent(table.name)}` : '';
                      return (
                        <TableRow key={table.id}>
                          <TableCell className="font-medium">{table.name}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground break-all">
                            {tableUrl || 'Atur URL Katalog terlebih dahulu'}
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-1">
                            {tableUrl && <TableQrDialog tableName={table.name} url={tableUrl} />}
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

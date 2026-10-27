import { getTenantTables, addTenantTable } from "@/lib/actions/catalog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Plus, Trash2 } from "lucide-react";
import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { TableQrDialog } from "@/features/catalog/components/table-qr-dialog";
import { Suspense } from "react";
import { Metadata } from "next";
import CatalogTablesLoading from "./loading";

export const metadata: Metadata = {
  title: 'Meja & QR Code - Menuin',
};

async function TablesDataWrapper() {
  const [tablesList, settings] = await Promise.all([
    getTenantTables(),
    getTenantCatalogSettings(),
  ]);

  const isDev = process.env.NODE_ENV !== "production";
  const domain = isDev ? "localhost:3000" : "menuin.id";
  const catalogUrl = settings.slug ? `http://${settings.slug}.${domain}` : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Meja & QR Code</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola meja dan cetak QR Code untuk memudahkan pelanggan memesan dari meja.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-2xl border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Tambah Meja</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (formData) => { "use server"; await addTenantTable(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium text-slate-700">Nama atau Nomor Meja</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Contoh: Meja 1, VIP 2" 
                    required 
                    className="h-10 text-xs rounded-full bg-white border-none shadow-sm-md focus-visible:ring-blue-600"
                  />
                </div>
                <Button type="submit" className="w-full h-11 gap-2 rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-xs font-semibold cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Tambah Meja
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Daftar Meja</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pelanggan yang memindai QR code akan otomatis mengisi nomor meja di checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tablesList.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <QrCode className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Belum ada meja yang ditambahkan.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader className="bg-slate-50/70">
                      <TableRow className="border-b border-slate-200/80">
                        <TableHead className="text-xs font-semibold text-slate-500">Nama Meja</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500">Link Pemesanan (QR Data)</TableHead>
                        <TableHead className="w-[120px] text-xs font-semibold text-slate-500 text-right pr-4">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {tablesList.map((table) => {
                        const tableUrl = catalogUrl ? `${catalogUrl}/?table=${encodeURIComponent(table.name)}` : '';
                        return (
                          <TableRow key={table.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-medium text-xs text-slate-900">{table.name}</TableCell>
                            <TableCell className="text-xs font-mono text-slate-500 break-all">
                              {tableUrl || 'Atur URL Katalog terlebih dahulu'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {tableUrl && <TableQrDialog tableName={table.name} url={tableUrl} />}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                  title="Hapus Meja"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CatalogTablesPage() {
  return (
    <Suspense fallback={<CatalogTablesLoading />}>
      <TablesDataWrapper />
    </Suspense>
  );
}

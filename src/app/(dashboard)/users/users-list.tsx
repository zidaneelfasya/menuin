'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Trash2, UserCheck, Shield } from 'lucide-react';
import { createUser, deleteUser } from '@/lib/actions/users';
import { toast } from 'sonner';

export function UsersList({ initialData }: { initialData: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await createUser({ name, email, password });
      if (result.success) {
        toast.success(result.message);
        setIsAdding(false);
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat akun kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kasir "${userName}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kasir');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kasir Toko</h1>
          <p className="text-muted-foreground mt-1">
            Kelola akun kasir untuk toko Anda. Kasir hanya memiliki akses ke modul POS Kasir dan Riwayat Transaksi.
          </p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" /> {isAdding ? 'Tutup Form' : 'Tambah Kasir'}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Tambah Kasir Baru</CardTitle>
            <CardDescription>
              Kasir yang ditambahkan akan otomatis terhubung ke toko ini dan langsung dapat login untuk bertransaksi di POS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kasir</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="Contoh: Budi Kasir 1" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Login</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="kasir1@toko.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    placeholder="Minimal 6 karakter" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Kasir
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground h-32">
                  Belum ada kasir yang terdaftar di toko ini.
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {user.role === 'SUPERADMIN' ? (
                      <Shield className="h-4 w-4 text-purple-600" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {user.role === 'SUPERADMIN' ? 'Owner / Super Admin' : 'Kasir'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role === 'CASHIER' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingId === user.id}
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Akun Utama</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

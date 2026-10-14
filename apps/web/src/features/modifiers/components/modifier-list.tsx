'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash, Pencil, Search, X, Layers } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  createModifierGroup, 
  updateModifierGroup, 
  deleteModifierGroup, 
  createModifier, 
  deleteModifier, 
  toggleModifierAvailability,
  getModifierGroups 
} from '@/lib/actions/modifiers';
import { ModifierGroupDto } from '@menuin/types';

export function ModifierList({ initialData }: { initialData: ModifierGroupDto[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState<ModifierGroupDto[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isModifierOpen, setIsModifierOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeGroup, setActiveGroup] = useState<any>(null);
  
  // Form State
  const [groupName, setGroupName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [minSelections, setMinSelections] = useState<string | number>('0');
  const [maxSelections, setMaxSelections] = useState<string | number>('1');
  
  const [modifierName, setModifierName] = useState('');
  const [modifierPrice, setModifierPrice] = useState('0');

  const refreshData = async () => {
    try {
      const res = await getModifierGroups();
      if (res.success && res.data) {
        setGroups(res.data);
      }
      router.refresh();
    } catch {
      router.refresh();
    }
  };

  const openGroupModal = (group?: any) => {
    if (group) {
      setActiveGroup(group);
      setGroupName(group.name);
      setIsRequired(group.isRequired);
      setMinSelections(group.minSelections);
      setMaxSelections(group.maxSelections);
    } else {
      setActiveGroup(null);
      setGroupName('');
      setIsRequired(false);
      setMinSelections('0');
      setMaxSelections('1');
    }
    setIsGroupOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Nama grup wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { 
        name: groupName.trim(), 
        isRequired, 
        minSelections: Number(minSelections) || 0, 
        maxSelections: Number(maxSelections) || 1 
      };
      let res;
      if (activeGroup) {
        res = await updateModifierGroup(activeGroup.id, payload);
      } else {
        res = await createModifierGroup(payload);
      }
      
      if (res.success) {
        toast.success(activeGroup ? 'Grup berhasil diperbarui' : 'Grup berhasil ditambahkan');
        setIsGroupOpen(false);
        await refreshData();
      } else {
        toast.error(res.error || 'Gagal menyimpan grup');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Hapus grup ini dan semua opsinya?')) return;
    const res = await deleteModifierGroup(id);
    if (res.success) {
      toast.success('Grup berhasil dihapus');
      setGroups(prev => prev.filter(g => g.id !== id));
      router.refresh();
    } else {
      toast.error(res.error || 'Gagal menghapus grup');
    }
  };

  const openModifierModal = (group: any) => {
    setActiveGroup(group);
    setModifierName('');
    setModifierPrice('0');
    setIsModifierOpen(true);
  };

  const handleSaveModifier = async () => {
    if (!activeGroup) return;
    if (!modifierName.trim()) {
      toast.error('Nama opsi wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { name: modifierName.trim(), price: Number(modifierPrice) || 0 };
      const res = await createModifier(activeGroup.id, payload);
      if (res.success) {
        toast.success('Opsi berhasil ditambahkan');
        setIsModifierOpen(false);
        await refreshData();
      } else {
        toast.error(res.error || 'Gagal menambahkan opsi');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModifier = async (id: string) => {
    if (!confirm('Hapus opsi ini?')) return;
    const res = await deleteModifier(id);
    if (res.success) {
      toast.success('Opsi berhasil dihapus');
      setGroups(prev => prev.map(group => ({
        ...group,
        modifiers: group.modifiers?.filter((m: any) => m.id !== id) || []
      })));
      router.refresh();
    } else {
      toast.error(res.error || 'Gagal menghapus opsi');
    }
  };

  const handleToggleModifierAvailability = async (modId: string, currentAvailable: boolean) => {
    const newAvailable = !currentAvailable;
    // Optimistic update
    setGroups(prev => prev.map(group => ({
      ...group,
      modifiers: group.modifiers?.map((m: any) => m.id === modId ? { ...m, isAvailable: newAvailable } : m) || []
    })));

    const res = await toggleModifierAvailability(modId, newAvailable);
    if (!res.success) {
      toast.error(res.error || 'Gagal mengubah status ketersediaan opsi');
      // Revert
      setGroups(prev => prev.map(group => ({
        ...group,
        modifiers: group.modifiers?.map((m: any) => m.id === modId ? { ...m, isAvailable: currentAvailable } : m) || []
      })));
    } else {
      toast.success(newAvailable ? 'Bahan/opsi diaktifkan' : 'Bahan/opsi dinonaktifkan (Habis)');
    }
  };

  const filteredGroups = groups.filter(group => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchGroup = group.name.toLowerCase().includes(q);
    const matchModifier = group.modifiers?.some((m: any) => m.name.toLowerCase().includes(q));
    return matchGroup || matchModifier;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Kustomisasi Menu (Modifier)</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola grup topping, ukuran, atau request tambahan untuk produk Anda.</p>
      </div>

      {/* Zone 1 Toolbar Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 px-2">
          <Layers className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {groups.length} Grup Modifier
          </span>
          {searchQuery && (
            <span className="text-xs text-slate-400">
              ({filteredGroups.length} ditemukan)
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input 
              type="text"
              placeholder="Cari grup atau opsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs rounded-xl border-slate-200 focus-visible:ring-blue-500 bg-slate-50/50 dark:bg-slate-800/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <Button 
            onClick={() => openGroupModal()} 
            className="rounded-xl px-4 h-9 shadow-xs bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4"/>
            <span>Tambah Grup</span>
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(group => (
            <Card key={group.id} className="flex flex-col rounded-2xl border border-slate-200/90 shadow-xs bg-white dark:bg-slate-900 transition-all hover:border-slate-300/90">
              <CardHeader className="flex flex-row justify-between items-start p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">{group.name}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border-none ${group.isRequired ? 'bg-amber-100/80 text-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {group.isRequired ? 'Wajib Pilih' : 'Opsional'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Min {group.minSelections} &bull; Max {group.maxSelections}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openGroupModal(group)} className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg">
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col justify-between">
                <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {group.modifiers?.map((mod: any) => {
                    const isAvailable = mod.isAvailable !== false;
                    return (
                      <div key={mod.id} className="flex justify-between items-center py-2 text-sm first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className={!isAvailable ? "line-through text-slate-400 dark:text-slate-500" : "font-medium text-slate-700 dark:text-slate-200"}>
                            {mod.name}
                          </span>
                          {!isAvailable && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-100/70 text-rose-700 border-none">
                              Habis
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">+{Number(mod.price).toLocaleString('id-ID')}</span>
                          <Switch
                            checked={isAvailable}
                            onCheckedChange={() => handleToggleModifierAvailability(mod.id, isAvailable)}
                            aria-label={`Ketersediaan ${mod.name}`}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" onClick={() => handleDeleteModifier(mod.id)}>
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {(!group.modifiers || group.modifiers.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-2">Belum ada opsi modifier</p>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 rounded-xl border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-600 dark:text-slate-300 text-xs font-medium" 
                  onClick={() => openModifierModal(group)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Opsi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {searchQuery ? 'Tidak ada modifier yang sesuai dengan pencarian' : 'Belum ada grup modifier'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Mulai tambahkan grup kustomisasi seperti Topping, Level Pedas, atau Ukuran.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => openGroupModal()} className="mt-4 rounded-xl px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">
              <Plus className="mr-1.5 h-4 w-4"/> Tambah Grup Pertama
            </Button>
          )}
        </div>
      )}

      {/* Group Modal */}
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{activeGroup ? 'Edit Grup Modifier' : 'Tambah Grup Modifier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nama Grup (contoh: Pilihan Topping)</Label>
              <Input 
                value={groupName} 
                onChange={e => setGroupName(e.target.value)} 
                placeholder="cth: Level Pedas, Topping Ekstra"
                className="rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Wajib Dipilih?</Label>
                <p className="text-[11px] text-slate-400">Pelanggan wajib memilih sebelum menambah ke keranjang</p>
              </div>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Minimal Pilihan</Label>
                <Input 
                  type="text" 
                  inputMode="numeric" 
                  value={minSelections} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMinSelections(val === '' ? '' : Number(val).toString());
                  }} 
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Maksimal Pilihan</Label>
                <Input 
                  type="text" 
                  inputMode="numeric" 
                  value={maxSelections} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMaxSelections(val === '' ? '' : Number(val).toString());
                  }} 
                  className="rounded-xl text-sm"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Pilih maks &gt; 1 untuk pilihan ganda (checkbox), atau maks = 1 untuk radio button.</p>
          </div>
          <Button 
            onClick={handleSaveGroup} 
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Grup'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modifier Modal */}
      <Dialog open={isModifierOpen} onOpenChange={setIsModifierOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Tambah Opsi untuk {activeGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nama Opsi (contoh: Keju / Boba)</Label>
              <Input 
                value={modifierName} 
                onChange={e => setModifierName(e.target.value)} 
                placeholder="cth: Keju Mozzarella"
                className="rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Harga Tambahan (Rp)</Label>
              <Input 
                type="text" 
                inputMode="numeric" 
                value={modifierPrice} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setModifierPrice(val === '' ? '' : Number(val).toString());
                }} 
                placeholder="0 jika gratis"
                className="rounded-xl text-sm"
              />
            </div>
          </div>
          <Button 
            onClick={handleSaveModifier} 
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Opsi'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

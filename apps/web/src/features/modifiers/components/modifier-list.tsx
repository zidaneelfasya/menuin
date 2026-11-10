'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

export function ModifierList({ initialData }: { initialData: ModifierGroupDto[] }) {
  const router = useRouter();
  const [groups, setGroups] = React.useState<ModifierGroupDto[]>(initialData);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isGroupOpen, setIsGroupOpen] = React.useState(false);
  const [isModifierOpen, setIsModifierOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [activeGroup, setActiveGroup] = React.useState<any>(null);
  
  // Form State
  const [groupName, setGroupName] = React.useState('');
  const [isRequired, setIsRequired] = React.useState(false);
  const [minSelections, setMinSelections] = React.useState<string | number>('0');
  const [maxSelections, setMaxSelections] = React.useState<string | number>('1');
  
  const [modifierName, setModifierName] = React.useState('');
  const [modifierPrice, setModifierPrice] = React.useState('0');

  const refreshData = React.useCallback(async () => {
    try {
      const res = await getModifierGroups();
      if (res.success && res.data) {
        setGroups(res.data);
      }
      router.refresh();
    } catch {
      router.refresh();
    }
  }, [router]);

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
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan grup');
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
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan opsi');
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header (Menuin Typography Standard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-normal text-slate-900">
            Modifier Produk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola grup modifier, opsi kustomisasi, spesifikasi ukuran/warna, atau pilihan tambahan produk Anda.
          </p>
        </div>

        {/* Primary Action Button (Menuin Flat High-Contrast #0e59f9 Standard) */}
        <button 
          type="button"
          onClick={() => openGroupModal()} 
          className="h-10 px-5 rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] active:scale-[0.98] text-white text-xs sm:text-sm font-medium shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shrink-0 select-none"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Grup</span>
        </button>
      </div>

      {/* Toolbar Row: Search & Total Count (Menuin Pure-White Raised Tactile Pills) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input 
            type="text"
            placeholder="Cari grup atau opsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 h-10 text-xs sm:text-sm rounded-full border-none shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] bg-white text-slate-800 placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer border-none"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Total Groups Badge */}
        <div className="flex items-center gap-2">
          <div className="h-10 px-4 bg-white rounded-full shadow-sm-md border-none flex items-center gap-2 text-xs text-slate-600 font-medium select-none">
            <Layers className="h-4 w-4 text-[#0e59f9]" />
            <span>Total:</span>
            <span className="font-semibold text-slate-900 tabular-nums">{groups.length}</span>
            <span>Grup</span>
            {searchQuery && (
              <span className="text-[#0e59f9] font-medium ml-1">({filteredGroups.length} ditemukan)</span>
            )}
          </div>
        </div>
      </div>

      {/* Modifier Cards Grid (Menuin Pure-White Borderless Card Standard) */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map(group => (
            <div 
              key={group.id} 
              className="flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm-md hover:shadow-md border-none transition-all duration-200"
            >
              {/* Card Header Section */}
              <div>
                <div className="flex items-start justify-between gap-3 pb-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 tracking-normal truncate">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border-none",
                        group.isRequired 
                          ? "bg-amber-50 text-amber-700" 
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {group.isRequired ? 'Wajib pilih' : 'Opsional'}
                      </span>
                      <span className="text-xs text-slate-400 font-normal">
                        Min {group.minSelections} • Max {group.maxSelections}
                      </span>
                    </div>
                  </div>

                  {/* Action Icons (Soft tactile circles) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      type="button"
                      onClick={() => openGroupModal(group)} 
                      title="Edit grup"
                      className="h-8 w-8 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-[#0e59f9] flex items-center justify-center transition-colors cursor-pointer border-none"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteGroup(group.id)} 
                      title="Hapus grup"
                      className="h-8 w-8 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer border-none"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Modifier Options List */}
                <div className="space-y-1 pt-2 divide-y divide-slate-100/80">
                  {group.modifiers?.map((mod: any) => {
                    const isAvailable = mod.isAvailable !== false;
                    return (
                      <div key={mod.id} className="flex justify-between items-center py-2.5 text-sm first:pt-0 last:pb-0 gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn(
                            "text-xs truncate",
                            !isAvailable ? "line-through text-slate-400 font-normal" : "font-medium text-slate-700"
                          )}>
                            {mod.name}
                          </span>
                          {!isAvailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 shrink-0 border-none">
                              Habis
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-slate-500 text-xs font-semibold tabular-nums font-numeric">
                            +Rp {Number(mod.price).toLocaleString('id-ID')}
                          </span>
                          <Switch
                            checked={isAvailable}
                            onCheckedChange={() => handleToggleModifierAvailability(mod.id, isAvailable)}
                            aria-label={`Ketersediaan ${mod.name}`}
                            className="data-[state=checked]:bg-[#0e59f9]"
                          />
                          <button 
                            type="button"
                            onClick={() => handleDeleteModifier(mod.id)}
                            title="Hapus opsi"
                            className="h-7 w-7 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer border-none"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {(!group.modifiers || group.modifiers.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-3 text-center">
                      Belum ada opsi modifier
                    </p>
                  )}
                </div>
              </div>
              
              {/* Add Option Button (Menuin Blue Style Button) */}
              <button 
                type="button"
                onClick={() => openModifierModal(group)}
                className="w-full mt-5 h-9 rounded-full bg-[#0e59f9] hover:bg-blue-600 active:scale-[0.98] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-sm-md hover:shadow-md select-none"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
                <span>Tambah Opsi</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl border-none shadow-sm-md bg-white my-4">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3 mx-auto text-slate-400 shadow-sm-md">
            <Layers className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {searchQuery ? 'Tidak ada modifier yang sesuai dengan pencarian' : 'Belum ada grup modifier'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Mulai tambahkan grup modifier seperti Ukuran, Tingkat Manis, Es, Susu, atau Topping.'}
          </p>
          {!searchQuery && (
            <button 
              type="button"
              onClick={() => openGroupModal()} 
              className="mt-4 h-10 px-5 rounded-full bg-[#0e59f9] hover:bg-blue-600 active:scale-[0.98] text-white font-medium text-xs sm:text-sm shadow-md cursor-pointer border-none inline-flex items-center gap-1.5 select-none"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Grup Pertama</span>
            </button>
          )}
        </div>
      )}

      {/* Group Modal (Menuin Pure-White Rounded-3xl Soft-UI Standard) */}
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-white p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 tracking-normal">
              {activeGroup ? 'Edit Grup Modifier' : 'Tambah Grup Modifier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Nama Grup (contoh: Pilihan Ukuran / Tingkat Kemanisan)
              </Label>
              <input 
                value={groupName} 
                onChange={e => setGroupName(e.target.value)} 
                placeholder="cth: Ukuran Gelas, Tingkat Es"
                className="w-full h-10 text-xs sm:text-sm rounded-full border-none bg-slate-50/70 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] px-4 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border-none shadow-sm-md">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-slate-700">Wajib Dipilih?</Label>
                <p className="text-[11px] text-slate-400">Pelanggan wajib memilih sebelum menambah ke keranjang</p>
              </div>
              <Switch 
                checked={isRequired} 
                onCheckedChange={setIsRequired} 
                className="data-[state=checked]:bg-[#0e59f9]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Minimal Pilihan</Label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  value={minSelections} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMinSelections(val === '' ? '' : Number(val).toString());
                  }} 
                  className="w-full h-10 text-xs sm:text-sm rounded-full border-none bg-slate-50/70 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] px-4 text-slate-800 placeholder:text-slate-400 transition-all tabular-nums font-numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Maksimal Pilihan</Label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  value={maxSelections} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMaxSelections(val === '' ? '' : Number(val).toString());
                  }} 
                  className="w-full h-10 text-xs sm:text-sm rounded-full border-none bg-slate-50/70 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] px-4 text-slate-800 placeholder:text-slate-400 transition-all tabular-nums font-numeric"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Pilih maks &gt; 1 untuk pilihan ganda (checkbox), atau maks = 1 untuk radio button.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGroupOpen(false)}
              className="h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm border-none shadow-sm-md cursor-pointer transition-all active:scale-[0.98] select-none"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleSaveGroup} 
              disabled={isSubmitting}
              className="h-10 px-5 rounded-full bg-[#0e59f9] hover:bg-blue-600 text-white font-medium text-xs sm:text-sm shadow-md border-none cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 select-none"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Grup'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modifier Modal (Menuin Pure-White Rounded-3xl Soft-UI Standard) */}
      <Dialog open={isModifierOpen} onOpenChange={setIsModifierOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-white p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 tracking-normal">
              Tambah Opsi untuk {activeGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Nama Opsi (contoh: Extra Espresso / Boba)</Label>
              <input 
                value={modifierName} 
                onChange={e => setModifierName(e.target.value)} 
                placeholder="cth: Keju Mozzarella, Extra Shot"
                className="w-full h-10 text-xs sm:text-sm rounded-full border-none bg-slate-50/70 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] px-4 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Harga Tambahan (Rp)</Label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={modifierPrice} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setModifierPrice(val === '' ? '' : Number(val).toString());
                }} 
                placeholder="0 jika gratis"
                className="w-full h-10 text-xs sm:text-sm rounded-full border-none bg-slate-50/70 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] px-4 text-slate-800 placeholder:text-slate-400 transition-all tabular-nums font-numeric"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModifierOpen(false)}
              className="h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm border-none shadow-sm-md cursor-pointer transition-all active:scale-[0.98] select-none"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleSaveModifier} 
              disabled={isSubmitting}
              className="h-10 px-5 rounded-full bg-[#0e59f9] hover:bg-blue-600 text-white font-medium text-xs sm:text-sm shadow-md border-none cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 select-none"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Opsi'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

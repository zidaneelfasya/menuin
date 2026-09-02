'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createModifierGroup, updateModifierGroup, deleteModifierGroup, createModifier, deleteModifier } from '@/lib/actions/modifiers';

export function ModifierList({ initialData }: { initialData: any[] }) {
  const [groups, setGroups] = useState(initialData);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isModifierOpen, setIsModifierOpen] = useState(false);
  
  const [activeGroup, setActiveGroup] = useState<any>(null);
  
  // Form State
  const [groupName, setGroupName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState(1);
  
  const [modifierName, setModifierName] = useState('');
  const [modifierPrice, setModifierPrice] = useState('0');

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
      setMinSelections(0);
      setMaxSelections(1);
    }
    setIsGroupOpen(true);
  };

  const handleSaveGroup = async () => {
    try {
      const payload = { name: groupName, isRequired, minSelections, maxSelections };
      let res;
      if (activeGroup) {
        res = await updateModifierGroup(activeGroup.id, payload);
      } else {
        res = await createModifierGroup(payload);
      }
      
      if (res.success) {
        toast.success(activeGroup ? 'Grup diperbarui' : 'Grup ditambahkan');
        setIsGroupOpen(false);
        window.location.reload(); // simple reload to get new data
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Hapus grup ini dan semua opsinya?')) return;
    const res = await deleteModifierGroup(id);
    if (res.success) {
      toast.success('Grup dihapus');
      window.location.reload();
    } else {
      toast.error(res.error);
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
    try {
      const payload = { name: modifierName, price: modifierPrice };
      const res = await createModifier(activeGroup.id, payload);
      if (res.success) {
        toast.success('Opsi ditambahkan');
        setIsModifierOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDeleteModifier = async (id: string) => {
    if (!confirm('Hapus opsi ini?')) return;
    const res = await deleteModifier(id);
    if (res.success) {
      toast.success('Opsi dihapus');
      window.location.reload();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kustomisasi Menu (Modifier)</h1>
          <p className="text-muted-foreground">Kelola grup topping, ukuran, atau request tambahan untuk produk Anda.</p>
        </div>
        <Button onClick={() => openGroupModal()}><Plus className="mr-2 h-4 w-4"/> Tambah Grup</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => (
          <Card key={group.id} className="flex flex-col">
            <CardHeader className="flex flex-row justify-between items-start pb-2">
              <div>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  {group.isRequired ? 'Wajib Pilih' : 'Opsional'} &bull; Min {group.minSelections} &bull; Max {group.maxSelections}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openGroupModal(group)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id)} className="text-red-500"><Trash className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2 mt-4">
                {group.modifiers?.map((mod: any) => (
                  <div key={mod.id} className="flex justify-between items-center border-b pb-2 text-sm">
                    <span>{mod.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">+{Number(mod.price).toLocaleString('id-ID')}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteModifier(mod.id)}><Trash className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                {group.modifiers?.length === 0 && <p className="text-sm text-muted-foreground italic">Belum ada opsi</p>}
                
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => openModifierModal(group)}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Opsi
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Group Modal */}
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeGroup ? 'Edit Grup Modifier' : 'Tambah Grup Modifier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Grup (contoh: Pilihan Topping)</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Wajib Dipilih?</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimal Pilihan</Label>
                <Input type="number" min={0} value={minSelections} onChange={e => setMinSelections(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Maksimal Pilihan</Label>
                <Input type="number" min={1} value={maxSelections} onChange={e => setMaxSelections(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <Button onClick={handleSaveGroup} className="w-full">Simpan</Button>
        </DialogContent>
      </Dialog>

      {/* Modifier Modal */}
      <Dialog open={isModifierOpen} onOpenChange={setIsModifierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Opsi untuk {activeGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Opsi (contoh: Keju / Boba)</Label>
              <Input value={modifierName} onChange={e => setModifierName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Harga Tambahan</Label>
              <Input type="number" min={0} value={modifierPrice} onChange={e => setModifierPrice(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSaveModifier} className="w-full">Simpan</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startShift } from '@/lib/actions/shifts';
import { toast } from 'sonner';

export function StartShiftModal({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [startingCash, setStartingCash] = React.useState('0');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = Number(startingCash.replace(/\D/g, '')) || 0;
    
    const result = await startShift(amount);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Shift berhasil dimulai');
      onSuccess();
      onClose();
    } else {
      toast.error(result.error || 'Gagal memulai shift');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mulai Shift Baru</DialogTitle>
            <DialogDescription>
              Silakan masukkan modal awal kasir untuk memulai shift.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="startingCash">Modal Uang Kas Awal (Rp)</Label>
              <Input
                id="startingCash"
                type="number"
                min="0"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Memulai...' : 'Mulai Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

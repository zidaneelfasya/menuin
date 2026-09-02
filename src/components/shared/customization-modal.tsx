'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/format';

type Modifier = {
  id: string;
  name: string;
  price: string | number;
};

type ModifierGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
};

type Product = {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string | null;
  modifierGroupIds?: string[]; // Groups attached to this product
};

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allModifierGroups: ModifierGroup[];
  onAddToCart: (product: Product, selectedModifiers: Modifier[], notes: string, quantity: number) => void;
}

export function CustomizationModal({ isOpen, onClose, product, allModifierGroups, onAddToCart }: CustomizationModalProps) {
  const [selectedModifiers, setSelectedModifiers] = React.useState<Record<string, Modifier[]>>({});
  const [notes, setNotes] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);

  // Filter groups applicable to this product
  const productGroups = React.useMemo(() => {
    if (!product || !product.modifierGroupIds) return [];
    return allModifierGroups.filter(g => product.modifierGroupIds?.includes(g.id));
  }, [product, allModifierGroups]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedModifiers({});
      setNotes('');
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  const basePrice = Number(product.price);
  
  // Calculate total extra price
  let extraPrice = 0;
  Object.values(selectedModifiers).forEach(mods => {
    mods.forEach(m => {
      extraPrice += Number(m.price);
    });
  });

  const grandTotal = (basePrice + extraPrice) * quantity;

  // Validation
  const isValid = productGroups.every(group => {
    const selected = selectedModifiers[group.id] || [];
    if (group.isRequired && selected.length < group.minSelections) {
      return false;
    }
    return true;
  });

  const handleToggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers(prev => {
      const currentSelected = prev[group.id] || [];
      const isAlreadySelected = currentSelected.some(m => m.id === modifier.id);

      if (group.maxSelections === 1) {
        // Radio behavior
        return { ...prev, [group.id]: [modifier] };
      }

      if (isAlreadySelected) {
        // Remove
        return {
          ...prev,
          [group.id]: currentSelected.filter(m => m.id !== modifier.id)
        };
      } else {
        // Add if under max limit
        if (currentSelected.length < group.maxSelections) {
          return {
            ...prev,
            [group.id]: [...currentSelected, modifier]
          };
        }
        return prev;
      }
    });
  };

  const handleAddToCart = () => {
    if (!isValid) return;
    const flatSelectedModifiers = Object.values(selectedModifiers).flat();
    onAddToCart(product, flatSelectedModifiers, notes, quantity);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{formatCurrency(basePrice)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {productGroups.map(group => (
            <div key={group.id} className="space-y-3 border-b pb-4">
              <div>
                <h4 className="font-semibold">{group.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {group.isRequired ? 'Wajib pilih' : 'Opsional'} 
                  {group.maxSelections > 1 ? ` (Pilih max ${group.maxSelections})` : ' (Pilih 1)'}
                </p>
              </div>

              {group.maxSelections === 1 ? (
                <RadioGroup 
                  value={(selectedModifiers[group.id] || [])[0]?.id || ''} 
                  onValueChange={(val) => {
                    const mod = group.modifiers.find(m => m.id === val);
                    if (mod) handleToggleModifier(group, mod);
                  }}
                  className="space-y-2"
                >
                  {group.modifiers?.map(mod => (
                    <div key={mod.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={mod.id} id={`radio-${mod.id}`} />
                        <Label htmlFor={`radio-${mod.id}`} className="font-normal">{mod.name}</Label>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Number(mod.price) > 0 ? `+${formatCurrency(Number(mod.price))}` : 'Gratis'}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  {group.modifiers?.map(mod => {
                    const isSelected = (selectedModifiers[group.id] || []).some(m => m.id === mod.id);
                    return (
                      <div key={mod.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`check-${mod.id}`} 
                            checked={isSelected}
                            onCheckedChange={() => handleToggleModifier(group, mod)}
                          />
                          <Label htmlFor={`check-${mod.id}`} className="font-normal">{mod.name}</Label>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Number(mod.price) > 0 ? `+${formatCurrency(Number(mod.price))}` : 'Gratis'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="space-y-2">
            <Label>Catatan Khusus (Opsional)</Label>
            <Textarea 
              placeholder="Contoh: Jangan terlalu manis, ekstra es..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-semibold">Jumlah</span>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
              <span>{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
          <Button className="w-full" size="lg" disabled={!isValid} onClick={handleAddToCart}>
            Tambah ke Keranjang - {formatCurrency(grandTotal)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

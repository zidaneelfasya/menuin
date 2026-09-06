import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { X, CheckSquare, Square, Minus, Plus } from 'lucide-react-native';
import { formatCurrency } from '@menuin/utils';

interface Modifier {
  id: string;
  name: string;
  price: string;
}

interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
}

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
}

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  modifierGroups: ModifierGroup[];
  onAddToCart: (product: Product, modifiers: Modifier[], notes: string, quantity: number) => void;
}

export function CustomizationModal({ isOpen, onClose, product, modifierGroups, onAddToCart }: CustomizationModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setSelectedModifiers({});
      setNotes('');
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  const handleToggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers(prev => {
      const currentSelected = prev[group.id] || [];
      const isAlreadySelected = currentSelected.some(m => m.id === modifier.id);

      if (group.maxSelections === 1) {
        if (isAlreadySelected) {
          return { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [modifier] };
      }

      if (isAlreadySelected) {
        return {
          ...prev,
          [group.id]: currentSelected.filter(m => m.id !== modifier.id)
        };
      } else {
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

  const basePrice = Number(product.price);
  let extraPrice = 0;
  Object.values(selectedModifiers).forEach(mods => {
    mods.forEach(m => {
      extraPrice += Number(m.price);
    });
  });

  const grandTotal = (basePrice + extraPrice) * quantity;

  const isValid = modifierGroups.every(group => {
    const selected = selectedModifiers[group.id] || [];
    if (group.isRequired && selected.length < group.minSelections) {
      return false;
    }
    return true;
  });

  const handleSubmit = () => {
    if (!isValid) return;
    const flatSelectedModifiers = Object.values(selectedModifiers).flat();
    onAddToCart(product, flatSelectedModifiers, notes, quantity);
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl h-[85%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-slate-200">
            <View>
              <Text className="text-xl font-bold text-slate-800">{product.name}</Text>
              <Text className="text-slate-500">{formatCurrency(basePrice)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-slate-100">
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {modifierGroups.map(group => (
              <View key={group.id} className="mb-6 border-b border-slate-100 pb-4">
                <View className="mb-3">
                  <Text className="text-lg font-semibold text-slate-800">{group.name}</Text>
                  <Text className="text-sm text-slate-500">
                    {group.isRequired ? 'Wajib pilih' : 'Opsional'} 
                    {group.maxSelections > 1 ? ` (Max ${group.maxSelections})` : ' (Pilih 1)'}
                  </Text>
                </View>

                {group.modifiers?.map(mod => {
                  const isSelected = (selectedModifiers[group.id] || []).some(m => m.id === mod.id);
                  return (
                    <TouchableOpacity 
                      key={mod.id} 
                      className="flex-row items-center justify-between py-3"
                      onPress={() => handleToggleModifier(group, mod)}
                    >
                      <View className="flex-row items-center flex-1">
                        {isSelected ? (
                          <CheckSquare size={22} color="#2563eb" />
                        ) : (
                          <Square size={22} color="#cbd5e1" />
                        )}
                        <Text className="ml-3 text-slate-700 text-base">{mod.name}</Text>
                      </View>
                      <Text className="text-slate-500">
                        {Number(mod.price) > 0 ? `+${formatCurrency(Number(mod.price))}` : 'Gratis'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View className="mb-6">
              <Text className="text-base font-semibold text-slate-800 mb-2">Catatan Khusus (Opsional)</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 h-24"
                placeholder="Contoh: Jangan terlalu manis, ekstra es..."
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View className="flex-row justify-between items-center mb-10 border-t border-slate-100 pt-6">
              <Text className="text-lg font-semibold text-slate-800">Jumlah</Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus size={20} color="#64748b" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-800">{quantity}</Text>
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Plus size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-4 border-t border-slate-200 bg-white pb-8">
            <TouchableOpacity 
              className={`w-full py-4 rounded-xl items-center ${isValid ? 'bg-blue-600' : 'bg-slate-300'}`}
              disabled={!isValid}
              onPress={handleSubmit}
            >
              <Text className="text-white font-bold text-lg">
                Tambah ke Keranjang - {formatCurrency(grandTotal)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

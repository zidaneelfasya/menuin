import React from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface SearchInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChangeText,
  onClear,
  placeholder = 'Cari...',
  className = '',
  ...props
}: SearchInputProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View className={`flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-1.5 focus:border-blue-500 focus:bg-white ${className}`}>
      <Search size={18} color="#9ca3af" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        returnKeyType="search"
        className="flex-1 ml-2.5 text-sm text-gray-900 py-1.5"
        {...props}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-5 h-5 bg-gray-200 rounded-full items-center justify-center ml-1"
        >
          <X size={12} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';

interface QuantityStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 1,
  max,
  size = 'md',
  className = ''
}: QuantityStepperProps) {
  const isMin = value <= min;
  const isMax = max !== undefined && value >= max;

  const btnPadding = size === 'sm' ? 'p-1' : 'p-1.5';
  const iconSize = size === 'sm' ? 12 : 14;
  const textWidth = size === 'sm' ? 'w-5 text-xs' : 'w-7 text-sm';

  return (
    <View className={`flex-row items-center bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      <TouchableOpacity
        onPress={onDecrement}
        disabled={isMin}
        className={`${btnPadding} active:bg-gray-100 rounded-l-lg ${isMin ? 'opacity-30' : ''}`}
      >
        <Minus size={iconSize} color="#374151" />
      </TouchableOpacity>
      
      <Text className={`${textWidth} text-center font-bold text-gray-900`}>{value}</Text>
      
      <TouchableOpacity
        onPress={onIncrement}
        disabled={isMax}
        className={`${btnPadding} active:bg-gray-100 rounded-r-lg ${isMax ? 'opacity-30' : ''}`}
      >
        <Plus size={iconSize} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}

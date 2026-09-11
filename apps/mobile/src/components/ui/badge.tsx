import React from 'react';
import { View, Text } from 'react-native';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'purple';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  label,
  variant = 'default',
  icon,
  size = 'md',
  className = ''
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'outline':
        return 'bg-white border-gray-200 text-gray-700';
      case 'default':
      default:
        return 'bg-gray-100 border-gray-200 text-gray-700';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return 'text-blue-700';
      case 'success':
        return 'text-emerald-700';
      case 'warning':
        return 'text-amber-700';
      case 'error':
        return 'text-rose-700';
      case 'purple':
        return 'text-purple-700';
      case 'outline':
      case 'default':
      default:
        return 'text-gray-750 text-gray-700';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 rounded-md' : 'px-2.5 py-1 rounded-lg';
  const textSizeClasses = size === 'sm' ? 'text-[10px] font-bold' : 'text-xs font-semibold';

  return (
    <View className={`flex-row items-center border ${getVariantStyles()} ${sizeClasses} ${className}`}>
      {icon && <View className="mr-1">{icon}</View>}
      <Text className={`${getTextColor()} ${textSizeClasses}`}>{label}</Text>
    </View>
  );
}

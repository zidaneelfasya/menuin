import React from 'react';
import { View, Text } from 'react-native';
import { Button, ButtonVariant } from './button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle?: string;
  actionVariant?: ButtonVariant;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  actionVariant = 'primary',
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-12 px-6 ${className}`}>
      {icon && (
        <View className="w-14 h-14 rounded-2xl bg-gray-100 items-center justify-center mb-3 text-gray-400">
          {icon}
        </View>
      )}
      <Text className="text-base font-bold text-gray-900 text-center mb-1">{title}</Text>
      {description && (
        <Text className="text-xs text-gray-500 text-center leading-relaxed max-w-[280px] mb-4">
          {description}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button
          size="sm"
          variant={actionVariant}
          title={actionTitle}
          onPress={onAction}
          className="mt-2"
        />
      )}
    </View>
  );
}

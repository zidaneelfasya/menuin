import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  title,
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 active:bg-blue-700 border-transparent text-white';
      case 'secondary':
        return 'bg-gray-100 active:bg-gray-200 border-transparent text-gray-800';
      case 'outline':
        return 'bg-white active:bg-gray-50 border-gray-200 text-gray-700';
      case 'ghost':
        return 'bg-transparent active:bg-gray-100 border-transparent text-gray-600';
      case 'destructive':
        return 'bg-red-500 active:bg-red-600 border-transparent text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getTextVariantStyles = () => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return 'text-white';
      case 'secondary':
        return 'text-gray-800';
      case 'outline':
        return 'text-gray-700';
      case 'ghost':
        return 'text-gray-600';
      default:
        return 'text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 rounded-lg';
      case 'lg':
        return 'px-5 py-3.5 rounded-xl';
      case 'md':
      default:
        return 'px-4 py-2.5 rounded-xl';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs font-semibold';
      case 'lg':
        return 'text-base font-bold';
      case 'md':
      default:
        return 'text-sm font-semibold';
    }
  };

  const spinnerColor = variant === 'primary' || variant === 'destructive' ? '#ffffff' : '#2563eb';

  return (
    <TouchableOpacity
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      className={`flex-row items-center justify-center border ${getVariantStyles()} ${getSizeStyles()} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
          {title ? (
            <Text className={`${getTextVariantStyles()} ${getTextSizeStyles()}`}>{title}</Text>
          ) : (
            children
          )}
          {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
  icon?: React.ReactNode;
}

interface SegmentedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  scrollable?: boolean;
  className?: string;
}

export function SegmentedTabs({
  tabs,
  activeTab,
  onTabChange,
  scrollable = true,
  className = ''
}: SegmentedTabsProps) {
  const content = (
    <View className={`flex-row items-center gap-1.5 ${scrollable ? 'px-4' : 'w-full'}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            className={`flex-row items-center py-2 px-3.5 rounded-full border ${
              isActive
                ? 'bg-blue-600 border-blue-600 shadow-sm'
                : 'bg-white border-gray-200 active:bg-gray-50'
            } ${!scrollable ? 'flex-1 justify-center' : ''}`}
          >
            {tab.icon && <View className="mr-1.5">{tab.icon}</View>}
            <Text
              className={`text-xs font-semibold ${
                isActive ? 'text-white' : 'text-gray-700'
              }`}
            >
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View
                className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-red-500'
                }`}
              >
                <Text
                  className={`text-[9px] font-bold ${
                    isActive ? 'text-white' : 'text-white'
                  }`}
                >
                  {tab.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className={`py-2.5 bg-white border-b border-gray-100 ${className}`}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View className={`py-2 bg-white border-b border-gray-100 ${className}`}>
      {content}
    </View>
  );
}

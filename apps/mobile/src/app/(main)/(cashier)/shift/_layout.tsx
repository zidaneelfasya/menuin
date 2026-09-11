import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';

export default function ShiftLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Slot />
    </View>
  );
}

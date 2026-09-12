import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Settings, Users, Coffee, Tag, Plus } from 'lucide-react-native';

export default function ManageScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        
        {/* Manage Catalog */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <Coffee size={18} color="#2563eb" className="mr-2" />
              <Text className="font-semibold text-gray-900">Katalog & Menu</Text>
            </View>
            <TouchableOpacity className="bg-blue-50 px-3 py-1 rounded-full flex-row items-center">
              <Plus size={14} color="#2563eb" />
              <Text className="text-blue-600 text-xs font-medium ml-1">Tambah</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <ManageItem title="Kelola Kategori" subtitle="Atur kategori produk" />
            <ManageItem title="Kelola Item" subtitle="Tambah/edit produk dan harga" />
            <ManageItem title="Kelola Modifier" subtitle="Topping, ukuran, varian" isLast />
          </View>
        </View>

        {/* Manage Promo */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <Tag size={18} color="#059669" className="mr-2" />
              <Text className="font-semibold text-gray-900">Promo & Potongan</Text>
            </View>
            <TouchableOpacity className="bg-emerald-50 px-3 py-1 rounded-full flex-row items-center">
              <Plus size={14} color="#059669" />
              <Text className="text-emerald-600 text-xs font-medium ml-1">Buat Promo</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row justify-between items-center mb-3">
            <View>
              <Text className="font-medium text-gray-900">Diskon Kemerdekaan</Text>
              <Text className="text-gray-500 text-sm mt-1">Berlaku s/d 31 Agu</Text>
            </View>
            <TouchableOpacity className="border border-gray-200 px-3 py-1 rounded-md">
              <Text className="text-gray-600 text-sm font-medium">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manage Outlet */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3 px-1">
            <Settings size={18} color="#6b7280" className="mr-2" />
            <Text className="font-semibold text-gray-900">Pengaturan Outlet</Text>
          </View>
          <View className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <ManageItem title="Informasi Outlet" subtitle="Nama, alamat, kontak" />
            <ManageItem title="Pajak & Layanan" subtitle="Atur PPN dan Service Charge" />
            <ManageItem title="Printer & Struk" subtitle="Koneksi bluetooth printer" />
            <ManageItem title="Staff & Hak Akses" subtitle="Kelola kasir dan PIN" isLast />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ManageItem({ title, subtitle, isLast = false }: { title: string, subtitle: string, isLast?: boolean }) {
  return (
    <TouchableOpacity className={`p-4 flex-row justify-between items-center ${!isLast ? 'border-b border-gray-50' : ''}`}>
      <View>
        <Text className="font-medium text-gray-900">{title}</Text>
        <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
      </View>
      <Text className="text-gray-300 font-medium text-lg">›</Text>
    </TouchableOpacity>
  );
}

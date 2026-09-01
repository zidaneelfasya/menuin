'use server';

import { db } from '@/lib/db';
import { modifierGroups, modifiers, productModifierGroups } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const groupSchema = z.object({
  name: z.string().min(1, 'Nama grup wajib diisi'),
  isRequired: z.boolean().default(false),
  minSelections: z.number().min(0).default(0),
  maxSelections: z.number().min(1).default(1),
});

const modifierSchema = z.object({
  name: z.string().min(1, 'Nama opsi wajib diisi'),
  price: z.string().or(z.number()).transform(val => Number(val) || 0),
});

export async function getModifierGroups() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    
    // Fetch groups and their modifiers
    const groups = await db.select().from(modifierGroups).where(eq(modifierGroups.tenantId, user.tenantId));
    
    if (groups.length === 0) return { success: true, data: [] };
    
    const groupIds = groups.map(g => g.id);
    const allModifiers = await db.select().from(modifiers).where(inArray(modifiers.groupId, groupIds));
    
    const data = groups.map(group => ({
      ...group,
      modifiers: allModifiers.filter(m => m.groupId === group.id)
    }));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching modifier groups:', error);
    return { success: false, error: 'Gagal mengambil data' };
  }
}

export async function createModifierGroup(formData: z.infer<typeof groupSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    
    const validated = groupSchema.parse(formData);
    
    await db.insert(modifierGroups).values({
      tenantId: user.tenantId,
      ...validated
    });
    
    revalidatePath('/tenants/modifiers');
    return { success: true };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error: 'Gagal membuat grup' };
  }
}

export async function updateModifierGroup(id: string, formData: z.infer<typeof groupSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    
    const validated = groupSchema.parse(formData);
    
    await db.update(modifierGroups)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(and(eq(modifierGroups.id, id), eq(modifierGroups.tenantId, user.tenantId)));
    
    revalidatePath('/tenants/modifiers');
    return { success: true };
  } catch (error) {
    console.error('Error updating group:', error);
    return { success: false, error: 'Gagal update grup' };
  }
}

export async function deleteModifierGroup(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    
    const group = await db.select().from(modifierGroups).where(and(eq(modifierGroups.id, id), eq(modifierGroups.tenantId, user.tenantId)));
    if (group.length === 0) return { success: false, error: 'Not found' };
    
    await db.delete(productModifierGroups).where(eq(productModifierGroups.modifierGroupId, id));
    await db.delete(modifiers).where(eq(modifiers.groupId, id));
    await db.delete(modifierGroups).where(eq(modifierGroups.id, id));
    
    revalidatePath('/tenants/modifiers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, error: 'Gagal menghapus grup' };
  }
}

export async function createModifier(groupId: string, formData: z.infer<typeof modifierSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    
    const group = await db.select().from(modifierGroups).where(and(eq(modifierGroups.id, groupId), eq(modifierGroups.tenantId, user.tenantId)));
    if (group.length === 0) return { success: false, error: 'Group not found' };
    
    const validated = modifierSchema.parse(formData);
    
    await db.insert(modifiers).values({
      groupId,
      name: validated.name,
      price: validated.price.toString(),
    });
    
    revalidatePath('/tenants/modifiers');
    return { success: true };
  } catch (error) {
    console.error('Error creating modifier:', error);
    return { success: false, error: 'Gagal membuat opsi' };
  }
}

export async function deleteModifier(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    
    await db.delete(modifiers).where(eq(modifiers.id, id));
    revalidatePath('/tenants/modifiers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting modifier:', error);
    return { success: false, error: 'Gagal menghapus opsi' };
  }
}

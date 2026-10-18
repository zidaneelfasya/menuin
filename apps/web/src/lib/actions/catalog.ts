"use server";

import { db } from "@/lib/db";
import { tenants, businessProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { evaluatePaymentReadiness } from "@/lib/verification/state-machine";

export async function getTenantCatalogSettings() {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) {
		throw new Error("Unauthorized");
	}

	const result = await db
		.select()
		.from(tenants)
		.where(eq(tenants.id, user.tenantId))
		.limit(1);
	if (result.length === 0) {
		throw new Error("Tenant not found");
	}

	return result[0];
}

export async function updateCatalogStatus(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) {
		throw new Error("Unauthorized");
	}

	const storefrontEnabled = formData.get("storefrontEnabled") === "true";
	const slug = formData.get("slug") as string;

	// Basic slug validation
	if (slug && !/^[a-z0-9-]+$/.test(slug)) {
		return {
			error:
				"URL Katalog hanya boleh berisi huruf kecil, angka, dan strip (-).",
		};
	}

	try {
		await db
			.update(tenants)
			.set({
				storefrontEnabled,
				slug: slug || null,
			})
			.where(eq(tenants.id, user.tenantId));

		if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
		return { success: true };
	} catch (error: any) {
		if (error.code === "23505") {
			// Unique violation
			return { error: "URL Katalog ini sudah digunakan oleh tenant lain." };
		}
		console.error("Failed to update catalog status:", error);
		return { error: "Gagal menyimpan perubahan." };
	}
}

export async function updateCatalogAppearance(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) {
		throw new Error("Unauthorized");
	}

	const storeDescription = formData.get("storeDescription") as string;
	const storeLogoUrl = formData.get("storeLogoUrl") as string;
	const storeBannerUrl = formData.get("storeBannerUrl") as string;
	const primaryColor = formData.get("primaryColor") as string;
	const openHours = (formData.get("openHours") as string) || null;
	const address = (formData.get("address") as string) || null;
	const city = (formData.get("city") as string) || null;
	const mapsUrl = (formData.get("mapsUrl") as string) || null;
	const cuisineType = (formData.get("cuisineType") as string) || null;
	const wifiSsid = (formData.get("wifiSsid") as string) || null;
	const wifiPassword = (formData.get("wifiPassword") as string) || null;

	try {
		await db
			.update(tenants)
			.set({
				storeDescription,
				storeLogoUrl,
				storeBannerUrl,
				primaryColor,
				openHours,
				address,
				city,
				mapsUrl,
				cuisineType,
				wifiSsid,
				wifiPassword,
			})
			.where(eq(tenants.id, user.tenantId));

		if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
		revalidatePath("/store/[slug]", "layout");
		return { success: true };
	} catch (error) {
		console.error("Failed to update appearance:", error);
		return { error: "Gagal menyimpan tampilan." };
	}
}

export async function updateCatalogOrdering(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) {
		throw new Error("Unauthorized");
	}

	const dineInEnabled =
		formData.get("dineInEnabled") === "true" ||
		formData.get("dineInEnabled") === "on";
	const takeAwayEnabled =
		formData.get("takeAwayEnabled") === "true" ||
		formData.get("takeAwayEnabled") === "on";
	const deliveryEnabled =
		formData.get("deliveryEnabled") === "true" ||
		formData.get("deliveryEnabled") === "on";
	const customerNameRequired =
		formData.get("customerNameRequired") === "true" ||
		formData.get("customerNameRequired") === "on";
	const customerPhoneRequired =
		formData.get("customerPhoneRequired") === "true" ||
		formData.get("customerPhoneRequired") === "on";
	const tableNumberRequired =
		formData.get("tableNumberRequired") === "true" ||
		formData.get("tableNumberRequired") === "on";

	const orderProcessType =
		(formData.get("orderProcessType") as string) || "MANUAL";
	const onlinePaymentEnabled =
		formData.get("onlinePaymentEnabled") === "true" ||
		formData.get("onlinePaymentEnabled") === "on";
	const orderPrefixRaw = formData.get("orderPrefix") as string | null;

	// Guard: Server-Side Payment Readiness Engine (BV-016)
	if (onlinePaymentEnabled) {
		const [currentTenant] = await db
			.select()
			.from(tenants)
			.where(eq(tenants.id, user.tenantId))
			.limit(1);

		if (!currentTenant) {
			return { error: "Tenant tidak ditemukan." };
		}

		let bp = null;
		if (currentTenant.businessProfileId) {
			const [found] = await db
				.select()
				.from(businessProfiles)
				.where(eq(businessProfiles.id, currentTenant.businessProfileId))
				.limit(1);
			bp = found || null;
		}

		const readiness = evaluatePaymentReadiness({
			businessProfileStatus: (bp?.verificationStatus || "not_started") as any,
			outletComplianceStatus: (currentTenant.outletComplianceStatus || "incomplete") as any,
			dokuSubAccountId: currentTenant.dokuSubAccountId,
			dokuSubAccountStatus: currentTenant.dokuSubAccountStatus,
			onlinePaymentEnabled: true,
			isPlatformConfigured: Boolean(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY),
		});

		if (readiness.status === "BLOCKED") {
			return {
				error: `Pembayaran online belum dapat diaktifkan: ${readiness.blockingReasons.join("; ")}`,
			};
		}
	}

	try {
		const updatePayload: Record<string, any> = {
			dineInEnabled,
			takeAwayEnabled,
			deliveryEnabled,
			customerNameRequired,
			customerPhoneRequired,
			tableNumberRequired,
			orderProcessType,
			onlinePaymentEnabled,
		};

		if (orderPrefixRaw !== null) {
			updatePayload.orderPrefix = orderPrefixRaw
				? orderPrefixRaw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
				: null;
		}

		await db
			.update(tenants)
			.set(updatePayload)
			.where(eq(tenants.id, user.tenantId));

		if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
		revalidatePath("/store/[slug]", "layout");
		return { success: true };
	} catch (error) {
		console.error("Failed to update ordering settings:", error);
		return { error: "Gagal menyimpan pengaturan." };
	}
}

import { products, tables } from "@/lib/db/schema";
import { and, desc } from "drizzle-orm";

export async function toggleProductVisibility(
	productId: string,
	field: "isAvailableOnline" | "isFeatured",
	value: boolean,
) {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) throw new Error("Unauthorized");

	try {
		await db
			.update(products)
			.set({ [field]: value })
			.where(
				and(eq(products.id, productId), eq(products.tenantId, user.tenantId)),
			);

		if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
		return { success: true };
	} catch (error) {
		console.error("Failed to toggle visibility:", error);
		return { error: "Gagal memperbarui produk." };
	}
}

export async function getTenantTables() {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) throw new Error("Unauthorized");

	return await db
		.select()
		.from(tables)
		.where(eq(tables.tenantId, user.tenantId))
		.orderBy(desc(tables.createdAt));
}

export async function addTenantTable(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) throw new Error("Unauthorized");

	const name = formData.get("name") as string;
	if (!name) return { error: "Nama/Nomor meja harus diisi" };

	try {
		await db.insert(tables).values({
			tenantId: user.tenantId,
			name,
		});
		if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
		return { success: true };
	} catch (error) {
		console.error("Failed to add table:", error);
		return { error: "Gagal menambahkan meja." };
	}
}

export async function deleteTenantTable(tableId: string) {
	const user = await getCurrentUser();
	if (!user || !user.tenantId) throw new Error("Unauthorized");

	try {
		await db
			.delete(tables)
			.where(and(eq(tables.id, tableId), eq(tables.tenantId, user.tenantId)));
		if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
		return { success: true };
	} catch (error) {
		console.error("Failed to delete table:", error);
		return { error: "Gagal menghapus meja." };
	}
}

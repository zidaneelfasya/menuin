import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { CatalogSettingsForm } from "./catalog-settings-form";

export default async function CatalogOverviewPage() {
  const settings = await getTenantCatalogSettings();
  
  // The catalog URL based on the slug. For local development it uses .localhost:3000
  // For production it would use .menuin.id
  const isDev = process.env.NODE_ENV !== "production";
  const domain = isDev ? "localhost:3000" : "menuin.id";
  const catalogUrl = settings.slug ? `http://${settings.slug}.${domain}` : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Status & Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aktifkan website katalog menu untuk pelanggan Anda.
        </p>
      </div>

      <CatalogSettingsForm settings={settings} domain={domain} catalogUrl={catalogUrl} />
    </div>
  );
}

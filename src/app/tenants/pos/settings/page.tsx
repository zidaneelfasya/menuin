import { getTenantCatalogSettings } from "@/lib/actions/catalog";
import { updatePosSettings } from "@/lib/actions/pos-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, CreditCard, LayoutTemplate, Receipt } from "lucide-react";
import { toast } from "sonner";
import { PosSettingsForm } from "./pos-settings-form";

export const metadata = {
  title: "Pengaturan Kasir (POS) | Menuin",
};

export default async function PosSettingsPage() {
  const settings = await getTenantCatalogSettings();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Kasir (POS)</h1>
        <p className="text-muted-foreground mt-1">
          Sesuaikan alur pesanan, tampilan checkout, dan integrasi kasir toko Anda.
        </p>
      </div>

      <PosSettingsForm initialData={settings} />
    </div>
  );
}

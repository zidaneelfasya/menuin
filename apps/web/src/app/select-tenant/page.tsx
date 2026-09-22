import { getAvailableTenants, signOutAction } from '@/lib/actions/auth';
import { getAuthenticatedAccount } from '@/lib/actions/auth-context';
import { setTenantContextAction } from '@/lib/actions/tenant';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, LogOut, Store } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Pilih Outlet - MENUIN',
  description: 'Pilih restoran untuk masuk ke dashboard atau buat baru.',
};

export default async function SelectTenantPage() {
  const account = await getAuthenticatedAccount().catch(() => null);
  const tenants = await getAvailableTenants();

  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER':
        return {
          label: 'Owner',
          className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        };
      case 'MANAGER':
        return {
          label: 'Manager',
          className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        };
      case 'CASHIER':
        return {
          label: 'Kasir',
          className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        };
      default:
        return {
          label: role || 'Staf',
          className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        };
    }
  };

  // Palet gradasi avatar modern per outlet
  const avatarGradients = [
    'from-blue-600 via-indigo-600 to-violet-600',
    'from-emerald-600 via-teal-600 to-cyan-600',
    'from-amber-500 via-orange-500 to-rose-500',
    'from-indigo-600 via-purple-600 to-pink-600',
    'from-rose-600 via-pink-600 to-fuchsia-600',
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden">
      
      {/* Dynamic Ambient Gradient Background */}
      <div 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% -10%, rgba(37, 99, 235, 0.14) 0%, rgba(99, 102, 241, 0.08) 35%, transparent 70%),
            radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)
          `
        }}
      />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)] opacity-30 dark:opacity-20 pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image 
              src="/logo-menuin-memanjang.svg" 
              alt="MENUIN" 
              width={120} 
              height={30}
              className="h-7 w-auto transition-transform group-hover:scale-[1.02]"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            {account && (
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-medium">
                {account.email}
              </span>
            )}
            <form action={signOutAction}>
              <Button 
                type="submit"
                variant="ghost" 
                size="sm"
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 h-8 px-2.5 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col justify-center">
        <div className="space-y-8">
          
          {/* Section Heading */}
          <div className="text-center space-y-1.5 max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Pilih Outlet
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Pilih restoran untuk masuk ke dashboard atau daftarkan cabang baru.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant, idx) => {
              const roleInfo = getRoleBadge(tenant.role);
              const domainSlug = tenant.slug || tenant.outletKey;
              const gradientClass = avatarGradients[idx % avatarGradients.length];

              return (
                <form 
                  key={tenant.tenantId}
                  action={setTenantContextAction.bind(null, tenant.outletKey)} 
                  className="h-full"
                >
                  <button 
                    type="submit" 
                    className="w-full h-full text-left bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] dark:hover:shadow-[0_8px_30px_rgba(37,99,235,0.16)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                  >
                    {/* Top Subtle Gradient Hover Accent */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500 transition-all duration-500" />

                    <div className="space-y-3.5 w-full">
                      <div className="flex items-center justify-between">
                        {tenant.storeLogoUrl ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-700 bg-slate-50 shrink-0 shadow-2xs">
                            <img 
                              src={tenant.storeLogoUrl} 
                              alt={tenant.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${roleInfo.className}`}>
                          {roleInfo.label}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {tenant.name}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                          {domainSlug}.menuin.id
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs w-full text-slate-500 dark:text-slate-400 font-medium">
                      <span className="group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                        Masuk Outlet
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </button>
                </form>
              );
            })}

            {/* Create New Outlet */}
            <Link 
              href="/create-tenant" 
              className="h-full block group"
            >
              <div className="h-full min-h-[160px] bg-gradient-to-b from-white/60 to-slate-50/60 dark:from-slate-900/60 dark:to-slate-950/60 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400/80 dark:hover:border-blue-600/80 hover:bg-gradient-to-b hover:from-blue-50/40 hover:to-indigo-50/20 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/10 rounded-2xl p-5 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-2.5 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Tambah Outlet Baru
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Daftarkan gerai atau restoran baru
                  </p>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-900">
        &copy; {new Date().getFullYear()} MENUIN
      </footer>

    </div>
  );
}

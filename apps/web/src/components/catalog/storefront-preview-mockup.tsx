'use client';

import * as React from 'react';
import Image from 'next/image';
import { RotateCw, ExternalLink, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorefrontPreviewMockupProps {
  slug: string;
  outletKey: string;
}

export function StorefrontPreviewMockup({ slug, outletKey }: StorefrontPreviewMockupProps) {
  const [iframeKey, setIframeKey] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRotating, setIsRotating] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Storefront preview URL (relative so it works seamlessly on localhost and production)
  const storeUrl = `/store/${slug || outletKey}`;

  const handleRefresh = () => {
    setIsRotating(true);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => setIsRotating(false), 600);
  };

  // Listen to any custom event when catalog forms are saved
  React.useEffect(() => {
    const handleCatalogUpdate = () => {
      handleRefresh();
    };

    window.addEventListener('catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('catalog-updated', handleCatalogUpdate);
  }, []);

  return (
    <aside className="hidden xl:flex w-[380px] 2xl:w-[420px] flex-shrink-0 bg-white/60 border-l border-[#EAEFF8] flex-col items-center justify-between p-4 h-full relative z-20 shadow-[-2px_0_12px_rgba(0,0,0,0.02)] select-none">
      {/* Top Preview Control Header */}
      <div className="w-full flex items-center justify-between px-2 py-1.5 mb-2 bg-white rounded-xl border border-[#EAEFF8] shadow-xs">
        <div className="flex items-center gap-2">
          
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-900 leading-none">Live Storefront</span>
            <span className="text-[10px] text-gray-400 mt-0.5">iPhone 14</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            title="Muat Ulang Preview"
            className="h-7 w-7 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
          >
            <RotateCw className={cn("h-3.5 w-3.5 transition-transform duration-500", isRotating && "rotate-180")} />
          </button>
          
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Website di Tab Baru"
            className="h-7 w-7 rounded-lg text-gray-500 hover:text-primary hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Center Phone Mockup Container */}
      <div className="relative flex-1 w-full flex items-center justify-center py-2 overflow-hidden">
        {/* Phone Frame Wrapper with exact aspect ratio of iPhone 14 */}
        <div className="relative w-[280px] 2xl:w-[310px] aspect-[766/1559] max-h-[calc(100vh-10rem)] shadow-[0_12px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] rounded-[48px]">
          
          {/* Inner Screen Area */}
          <div 
            className="absolute z-10 bg-white overflow-hidden rounded-[38px] shadow-inner"
            style={{
              top: '2.31%',
              bottom: '2.37%',
              left: '5.22%',
              right: '5.22%',
            }}
          >
            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
                <p className="text-xs font-semibold text-gray-700">Memuat Storefront...</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Menghubungkan ke toko online Anda</p>
              </div>
            )}

            {/* Live Interactive Iframe */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={storeUrl}
              title="Storefront Live Preview"
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-0 select-text overflow-y-auto"
            />
          </div>

          {/* iPhone 14 Hardware Frame Overlay (Bezel, Dynamic Island, Side Buttons) */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            <Image
              src="/img/mockup/iphone14-clean.png"
              alt="iPhone 14 Device Mockup Frame"
              fill
              className="object-contain pointer-events-none select-none drop-shadow-sm"
              priority
            />
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="w-full text-center pt-2">
        <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <Smartphone className="w-3 h-3 text-gray-400 inline" />
          <span>Gunakan mouse/touchpad untuk scroll menu</span>
        </p>
      </div>
    </aside>
  );
}

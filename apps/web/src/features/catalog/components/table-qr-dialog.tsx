"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type TableQrDialogProps = {
  tableName: string;
  url: string;
};

export function TableQrDialog({ tableName, url }: TableQrDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // Set canvas size (larger for better print quality)
    canvas.width = 1000;
    canvas.height = 1000;

    img.onload = () => {
      // Draw white background
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw the SVG image
        ctx.drawImage(img, 50, 50, 900, 900); // with some padding
      }
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Code_${tableName.replace(/\s+/g, "_")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
          title="Lihat & Cetak QR Code Meja"
        >
          <QrCode className="h-4 w-4 text-slate-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm flex flex-col items-center p-6 rounded-3xl bg-white border-none shadow-2xl">
        <DialogHeader className="w-full text-center mb-2">
          <DialogTitle className="text-xl font-semibold text-slate-900">QR Code {tableName}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-white p-4 rounded-2xl shadow-md border-none mb-5 flex items-center justify-center">
          <QRCodeSVG 
            value={url} 
            size={220} 
            level={"H"} 
            includeMargin={true}
            ref={svgRef}
          />
        </div>
        
        <div className="w-full space-y-2">
          <Button 
            onClick={handleDownload} 
            className="w-full gap-2 h-11 text-xs font-semibold bg-[#0e59f9] hover:bg-[#0b4de0] text-white rounded-full shadow-xs cursor-pointer flex items-center justify-center"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full h-11 text-xs font-medium rounded-full bg-white hover:bg-slate-100 text-slate-700 border-none shadow-md cursor-pointer transition-all"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-catalog-primary hover:bg-catalog-primary/10">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm flex flex-col items-center p-8">
        <DialogHeader className="w-full text-center mb-4">
          <DialogTitle className="text-2xl font-bold">QR Code {tableName}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <QRCodeSVG 
            value={url} 
            size={250} 
            level={"H"} 
            includeMargin={true}
            ref={svgRef}
          />
        </div>
        
        <Button onClick={handleDownload} className="w-full gap-2 h-12 text-md font-bold bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-xl">
          <Download className="w-5 h-5" />
          Download QR Code
        </Button>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Settings, Minus, Plus } from 'lucide-react';
import { generateTableSignature } from '../utils/security';
import toast from 'react-hot-toast';

export const QRGenerator = () => {
  const [tableCount, setTableCount] = useState(() => {
    const saved = localStorage.getItem('rcp_table_count');
    return saved ? parseInt(saved, 10) : 10;
  });

  useEffect(() => {
    localStorage.setItem('rcp_table_count', tableCount.toString());
  }, [tableCount]);

  const handleDownload = (tableNum) => {
    const canvas = document.getElementById(`qr-canvas-${tableNum}`);
    if (!canvas) {
      toast.error('Failed to generate image');
      return;
    }

    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      const size = 300;
      tempCanvas.width = size;
      tempCanvas.height = size + 60;

      // Fill background
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw QR Canvas onto temporary canvas
      tempCtx.drawImage(canvas, 30, 20, 240, 240);

      // Add Table Text
      tempCtx.font = 'bold 20px sans-serif';
      tempCtx.fillStyle = '#0f172a'; // slate-900
      tempCtx.textAlign = 'center';
      tempCtx.fillText(`TABLE ${tableNum}`, size / 2, size + 30);

      // Trigger download
      const url = tempCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `RCP_Table_${tableNum}_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Table ${tableNum} QR downloaded`);
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Settings Panel (Hidden during Print) */}
      <div className="no-print bg-white border border-slate-100 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-500" />
            Table Configuration
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Specify the number of gaming tables in the cafe. QR codes will auto-generate for each table.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => setTableCount(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-950 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center text-sm font-black text-slate-900 font-mono">{tableCount}</span>
          <button
            type="button"
            onClick={() => setTableCount(prev => Math.min(50, prev + 1))}
            className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-950 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Header */}
      <div className="no-print flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tables: {tableCount}</span>
        <button
          type="button"
          onClick={handlePrintAll}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-655 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/10 active:scale-95 transition-all cursor-pointer min-h-[40px]"
        >
          <Printer className="w-4 h-4" />
          Print All QR Codes
        </button>
      </div>

      {/* QR Code Cards Grid (2-column on mobile, 4-column on desktop) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {tables.map((tableNum) => {
          const qrUrl = `${window.location.origin}/order?table=${tableNum}&token=${generateTableSignature(tableNum)}`;
          return (
            <div
              key={tableNum}
              className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center justify-between shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              <span className="text-sm font-black text-slate-900 mb-3">Table {tableNum}</span>
              
              <div className="p-2.5 border border-slate-100 rounded-xl mb-4 bg-white shadow-inner">
                <QRCodeCanvas
                  id={`qr-canvas-${tableNum}`}
                  value={qrUrl}
                  size={130}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <span className="text-[9px] font-mono text-slate-400 mb-4 select-all break-all text-center max-w-full truncate px-1">
                {qrUrl}
              </span>

              <div className="w-full">
                <button
                  type="button"
                  onClick={() => handleDownload(tableNum)}
                  className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-655 hover:text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer min-h-[38px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save PNG
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print-Only Layout */}
      <div className="print-only hidden">
        <div className="text-center mb-8 border-b-2 border-slate-300 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-wider">RAJESHWAR CYBER PARADISE</h1>
          <p className="text-xs text-slate-550 mt-1 uppercase font-bold tracking-widest">Table QR Code Sheet</p>
        </div>
        
        <div className="print-grid grid grid-cols-2 gap-8">
          {tables.map((tableNum) => {
            const qrUrl = `${window.location.origin}/order?table=${tableNum}&token=${generateTableSignature(tableNum)}`;
            return (
              <div key={tableNum} className="border-2 border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center break-inside-avoid page-break-inside-avoid">
                <h3 className="text-lg font-black text-slate-800 mb-4">TABLE {tableNum}</h3>
                <div className="p-2 border border-slate-100 rounded-xl mb-4 bg-white">
                  <QRCodeCanvas
                    value={qrUrl}
                    size={160}
                    level="H"
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-400 select-all tracking-tight">{qrUrl}</p>
                <p className="text-xs font-bold text-indigo-650 mt-3 uppercase tracking-wider">Scan to Order Food/Drinks</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;

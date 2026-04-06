import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Download, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const APP_URL = window.location.origin;

const pages = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/Menu' },
  { label: 'Drinks', path: '/Drinks' },
  { label: 'Reservations', path: '/Reservations' },
  { label: 'Order', path: '/Order' },
  { label: 'Contact', path: '/Contact' },
  { label: 'Table Dining', path: '/TableDining' },
  { label: 'Customize Order', path: '/CustomFood' },
];

export default function QRCodePage() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(pages[0]);
  const url = APP_URL + selected.path;

  const handleDownload = () => {
    const svg = document.getElementById('qr-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 40, 40, 320, 320);
      const link = document.createElement('a');
      link.download = `digital-bites-qr-${selected.label.replace(' ', '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .gold-gradient { background: linear-gradient(135deg,#c9a962 0%,#e4d5a7 50%,#c9a962 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .luxury-border { border: 1px solid rgba(201,169,98,0.3); }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="font-inter text-xs tracking-[0.4em] text-[#c9a962] uppercase mb-4">{t('scanQR')}</p>
          <h1 className="font-playfair text-4xl md:text-5xl gold-gradient mb-4">QR Code Access</h1>
          <p className="font-inter text-white/50 text-sm">Scan to instantly open any page on your device</p>
        </motion.div>

        {/* Page Selector */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {pages.map((p) => (
            <button
              key={p.path}
              onClick={() => setSelected(p)}
              className={`px-4 py-2 rounded-full font-inter text-sm transition-all duration-300 ${
                selected.path === p.path
                  ? 'bg-[#c9a962] text-[#0a0a0a] font-semibold'
                  : 'luxury-border text-white/70 hover:text-[#c9a962] hover:border-[#c9a962]/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* QR Display */}
        <motion.div
          key={selected.path}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <div className="p-8 rounded-3xl bg-[#1a1a1a] luxury-border shadow-2xl mb-6">
            <div className="p-4 bg-white rounded-2xl">
              <QRCodeSVG
                id="qr-svg"
                value={url}
                size={260}
                bgColor="#ffffff"
                fgColor="#0a0a0a"
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="font-playfair text-xl text-white mb-1">{selected.label}</p>
            <div className="flex items-center justify-center gap-2 text-[#c9a962]/60 font-inter text-xs">
              <LinkIcon className="w-3 h-3" />
              <span>{url}</span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#c9a962] to-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold text-sm hover:opacity-90 transition-all"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </button>
        </motion.div>
      </div>
    </div>
  );
}
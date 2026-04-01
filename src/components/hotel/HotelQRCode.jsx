/**
 * HotelQRCode.jsx
 * Displays a scannable QR code that links directly to a hotel's page.
 * Uses the free qrserver.com API — no npm install required.
 */

import React, { useState } from 'react';
import { QrCode, Download, ExternalLink } from 'lucide-react';

/** Build the QR code image URL pointing to the hotel's public page */
function getQRUrl(hotelSlug, size = 200) {
  const hotelUrl = `${window.location.origin}/hotel/${hotelSlug}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(hotelUrl)}&color=c9a962&bgcolor=0a0a0a&margin=10`;
}

export default function HotelQRCode({ hotel, size = 160 }) {
  const [imgError, setImgError] = useState(false);

  if (!hotel?.slug) return null;

  const qrUrl = getQRUrl(hotel.slug, size);
  const hotelUrl = `${window.location.origin}/hotel/${hotel.slug}`;

  /** Download QR code as PNG */
  const handleDownload = async () => {
    const downloadUrl = getQRUrl(hotel.slug, 400); // Higher res for download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `qr-${hotel.slug}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Code image */}
      <div className="p-3 bg-[#0a0a0a] rounded-xl border border-[#c9a962]/20">
        {imgError ? (
          <div
            className="flex flex-col items-center justify-center text-[#c9a962]/40"
            style={{ width: size, height: size }}
          >
            <QrCode className="w-10 h-10 mb-2" />
            <span className="font-inter text-xs text-center">QR unavailable</span>
          </div>
        ) : (
          <img
            src={qrUrl}
            alt={`QR code for ${hotel.name}`}
            width={size}
            height={size}
            onError={() => setImgError(true)}
            className="rounded"
          />
        )}
      </div>

      {/* Hotel URL label */}
      <p className="font-inter text-xs text-white/40 text-center break-all max-w-[200px]">
        {hotelUrl}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c9a962]/10 text-[#c9a962] font-inter text-xs hover:bg-[#c9a962]/20 transition-colors"
        >
          <Download className="w-3 h-3" /> Download
        </button>
        <a
          href={hotelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 font-inter text-xs hover:bg-white/10 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Open
        </a>
      </div>
    </div>
  );
}
import React, { useRef } from 'react';
import { Download, Printer } from 'lucide-react';

export default function OrderReceipt({ orderReference, customerInfo, cart, total, orderType, pickupTime, deliveryAddress }) {
  const receiptRef = useRef(null);

  const orderTypeLabel = { dine_in: 'Dine In', takeaway: 'Takeaway', delivery: 'Delivery' }[orderType] || orderType;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  const printReceipt = () => {
    const receiptHTML = receiptRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=700');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${orderReference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; background: #fff; color: #000; padding: 20px; }
          .receipt { max-width: 340px; margin: 0 auto; }
          h1 { font-size: 22px; text-align: center; margin-bottom: 4px; }
          .tagline { font-size: 11px; text-align: center; color: #555; margin-bottom: 16px; letter-spacing: 2px; text-transform: uppercase; }
          .divider { border-top: 1px dashed #999; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
          .label { color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          .value { font-weight: bold; }
          .ref { font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 3px; margin: 8px 0; }
          .items-header { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
          .item-row { display: flex; justify-content: space-between; font-size: 13px; margin: 3px 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 8px; }
          .footer { text-align: center; font-size: 11px; color: #666; margin-top: 16px; }
          .badge { background: #000; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h1>Digital Bites</h1>
          <p class="tagline">Seven Star Dining</p>
          <div class="divider"></div>

          <p class="label">Order Reference</p>
          <p class="ref">${orderReference}</p>

          <div class="divider"></div>

          <div class="row"><span class="label">Date</span><span>${dateStr}</span></div>
          <div class="row"><span class="label">Time</span><span>${timeStr}</span></div>
          <div class="row"><span class="label">Customer</span><span>${customerInfo.name}</span></div>
          <div class="row"><span class="label">Phone</span><span>${customerInfo.phone}</span></div>
          <div class="row"><span class="label">Order Type</span><span class="badge">${orderTypeLabel}</span></div>
          ${pickupTime ? `<div class="row"><span class="label">${orderType === 'delivery' ? 'Delivery Time' : 'Pickup Time'}</span><span>${pickupTime}</span></div>` : ''}
          ${deliveryAddress ? `<div class="row"><span class="label">Address</span><span style="max-width:180px;text-align:right;">${deliveryAddress}</span></div>` : ''}

          <div class="divider"></div>

          <p class="items-header">Items Ordered</p>
          ${cart.map(item => `
            <div class="item-row">
              <span>${item.name} x${item.quantity}</span>
              <span>KES ${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')}

          <div class="divider"></div>

          <div class="total-row">
            <span>TOTAL DUE</span>
            <span>KES ${total.toLocaleString()}</span>
          </div>

          <div class="divider"></div>

          <p class="footer">Please present this receipt at the cashier to complete payment.</p>
          <p class="footer" style="margin-top:6px;">Thank you for choosing Digital Bites!</p>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div>
      {/* Hidden receipt content for reference */}
      <div ref={receiptRef} style={{ display: 'none' }} />

      {/* Download / Print Button */}
      <button
        onClick={printReceipt}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#c9a962] hover:bg-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#c9a962]/20"
      >
        <Printer className="w-4 h-4" />
        Download / Print Receipt
      </button>

      {/* Receipt Preview */}
      <div className="mt-4 bg-white text-black rounded-xl p-5 font-mono text-xs border border-[#c9a962]/20">
        <div className="text-center mb-3">
          <p className="text-lg font-bold">Digital Bites</p>
          <p className="text-[10px] tracking-widest text-gray-500 uppercase">Seven Star Dining</p>
        </div>
        <div className="border-t border-dashed border-gray-300 my-3" />

        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Order Reference</p>
        <p className="text-xl font-bold text-center tracking-widest my-1">{orderReference}</p>

        <div className="border-t border-dashed border-gray-300 my-3" />
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Time</span><span>{timeStr}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-semibold">{customerInfo.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{customerInfo.phone}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Type</span>
            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold">{orderTypeLabel}</span>
          </div>
          {pickupTime && (
            <div className="flex justify-between">
              <span className="text-gray-500">{orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
              <span>{pickupTime}</span>
            </div>
          )}
          {deliveryAddress && (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 shrink-0">Address</span>
              <span className="text-right">{deliveryAddress}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Items</p>
        <div className="space-y-1">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span>{item.name} x{item.quantity}</span>
              <span>KES {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL DUE</span>
          <span>KES {total.toLocaleString()}</span>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />
        <p className="text-[10px] text-gray-400 text-center">Present this receipt at the cashier to complete payment.</p>
        <p className="text-[10px] text-gray-400 text-center mt-1">Thank you for choosing Digital Bites!</p>
      </div>
    </div>
  );
}
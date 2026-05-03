import React from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function OrderReceipt({ orderReference, customerInfo, cart, total, orderType, pickupTime, deliveryAddress }) {
  const orderTypeLabel = { dine_in: 'Dine In', takeaway: 'Takeaway', delivery: 'Delivery' }[orderType] || orderType;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  const downloadPDF = () => {
    // Pre-calculate total height needed
    let estimatedHeight = 8;
    estimatedHeight += 10; // header
    estimatedHeight += 20; // reference
    estimatedHeight += 10 * 5; // 5 detail rows
    if (pickupTime) estimatedHeight += 10;
    if (deliveryAddress) estimatedHeight += 10;
    estimatedHeight += 10; // dividers
    estimatedHeight += 8 + cart.length * 9; // items
    estimatedHeight += 20; // total + footer
    estimatedHeight += 20; // padding

    const W = 80;
    const doc = new jsPDF({ unit: 'mm', format: [W, Math.max(estimatedHeight, 150)], orientation: 'portrait' });
    let y = 8;

    const center = (text, size = 10, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('courier', bold ? 'bold' : 'normal');
      doc.setTextColor(0);
      doc.text(text, W / 2, y, { align: 'center' });
      y += size * 0.5 + 1;
    };

    const row = (left, right, size = 8) => {
      doc.setFontSize(size);
      doc.setFont('courier', 'normal');
      doc.setTextColor(0);
      doc.text(left, 6, y);
      doc.text(right, W - 6, y, { align: 'right' });
      y += size * 0.5 + 2;
    };

    const divider = () => {
      y += 1;
      doc.setDrawColor(180);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(6, y, W - 6, y);
      y += 4;
    };

    // Header
    center('Digital Bites', 14, true);
    center('SEVEN STAR DINING', 7);
    divider();

    // Reference
    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.setTextColor(120);
    doc.text('ORDER REFERENCE', W / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 5;
    center(orderReference, 12, true);
    divider();

    // Details
    row('Date', dateStr);
    row('Time', timeStr);
    row('Customer', customerInfo.name);
    row('Phone', customerInfo.phone || '-');
    row('Order Type', orderTypeLabel);
    if (pickupTime) row(orderType === 'delivery' ? 'Delivery Time' : 'Pickup Time', pickupTime);
    if (deliveryAddress) row('Address', deliveryAddress.substring(0, 28));
    divider();

    // Items header
    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.setTextColor(120);
    doc.text('ITEMS ORDERED', 6, y);
    doc.setTextColor(0);
    y += 5;

    cart.forEach(item => {
      row(`${item.name} x${item.quantity}`, `KES ${(item.price * item.quantity).toLocaleString()}`);
    });

    divider();

    // Total
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.setTextColor(0);
    doc.text('TOTAL DUE', 6, y);
    doc.text(`KES ${total.toLocaleString()}`, W - 6, y, { align: 'right' });
    y += 8;

    divider();

    // Footer
    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.setTextColor(100);
    doc.text('Present this receipt at the cashier to complete payment.', W / 2, y, { align: 'center' });
    y += 5;
    doc.text('Thank you for choosing Digital Bites!', W / 2, y, { align: 'center' });

    doc.save(`receipt-${orderReference}.pdf`);
  };

  return (
    <div>
      {/* Download / Print Button */}
      <button
        onClick={downloadPDF}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#c9a962] hover:bg-[#e4d5a7] text-[#0a0a0a] font-inter font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#c9a962]/20"
      >
        <Download className="w-4 h-4" />
        Download Receipt (PDF)
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
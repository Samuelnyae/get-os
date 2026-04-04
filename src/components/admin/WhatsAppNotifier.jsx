import React from 'react';

// Formats a phone number to international format for WhatsApp (strips +, spaces, dashes)
const formatWhatsAppNumber = (phone = '') => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  // Kenya: convert 07xx -> 2547xx
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    cleaned = '254' + cleaned.slice(1);
  }
  return cleaned;
};

export const buildOrderMessage = (order, status) => {
  const typeLabel = order.order_type === 'takeaway' ? 'Takeaway' : order.order_type === 'delivery' ? 'Delivery' : 'Dine-in';
  const messages = {
    confirmed: `✅ *Hermanas Bites* — Order Confirmed!\n\nHi ${order.customer_name}, your ${typeLabel} order *${order.order_reference}* has been confirmed!\n\n🍽️ Items:\n${order.items?.map(i => `  • ${i.name} x${i.quantity}`).join('\n')}\n\n💰 Total: KES ${order.total_amount?.toLocaleString()}${order.pickup_time ? `\n⏰ ${order.order_type === 'delivery' ? 'Delivery' : 'Pickup'} at: ${order.pickup_time}` : ''}\n\nTrack your order at our website. Thank you! 🙏`,
    preparing: `👨‍🍳 *Hermanas Bites* — Being Prepared!\n\nHi ${order.customer_name}, your order *${order.order_reference}* is now being prepared by our kitchen team.\n\nWe'll notify you when it's ready! ⏳`,
    ready: `🔔 *Hermanas Bites* — Order Ready!\n\nHi ${order.customer_name}, your order *${order.order_reference}* is READY!\n\n${order.order_type === 'dine_in' ? '🪑 Our staff will bring it to your table shortly.' : order.order_type === 'delivery' ? '🚗 Your delivery is on the way!' : '🛍️ Please come to the counter to collect your order.'}\n\nThank you for choosing Hermanas Bites! 🌟`,
    out_for_delivery: `🚗 *Hermanas Bites* — On the Way!\n\nHi ${order.customer_name}, your order *${order.order_reference}* is out for delivery!\n\nExpect it shortly at: ${order.delivery_address || 'your address'}.\n\nEnjoy your meal! 🍽️`,
    new: `🔔 *New Order Alert!*\n\nOrder: *${order.order_reference}*\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nType: ${typeLabel}${order.pickup_time ? `\nTime: ${order.pickup_time}` : ''}\nTotal: KES ${order.total_amount?.toLocaleString()}\n\nItems:\n${order.items?.map(i => `  • ${i.name} x${i.quantity}`).join('\n')}\n\nPlease process this order promptly.`,
  };
  return encodeURIComponent(messages[status] || messages.confirmed);
};

export default function WhatsAppNotifier({ order, status = 'confirmed', label, size = 'sm', staffPhone = null }) {
  const phone = staffPhone || order?.customer_phone;
  const number = formatWhatsAppNumber(phone || '');
  if (!number) return null;

  const message = buildOrderMessage(order, status);
  const url = `https://wa.me/${number}?text=${message}`;

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2 text-sm';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white font-inter font-medium transition-colors`}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      {label || 'WhatsApp'}
    </a>
  );
}
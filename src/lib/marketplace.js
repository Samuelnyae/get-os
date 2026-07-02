export const CATEGORIES = ['food', 'beverage', 'cleaning', 'furniture', 'linen', 'maintenance', 'other'];
export const CAT_LABELS = {
  food: 'Food & Produce',
  beverage: 'Beverages',
  cleaning: 'Cleaning',
  furniture: 'Furniture',
  linen: 'Linen & Laundry',
  maintenance: 'Maintenance',
  other: 'Other',
};
export const CAT_EMOJI = { food: '🥩', beverage: '🍷', cleaning: '🧼', furniture: '🪑', linen: '🧺', maintenance: '🔧', other: '📦' };
export const PLATFORM_COMMISSION_RATE = 10;
export const CART_KEY = 'marketplace_cart';

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('marketplace_cart_updated'));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.product_id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      product_id: product.id,
      supplier_id: product.supplier_id,
      supplier_name: product.supplier_name,
      product_name: product.product_name,
      unit: product.unit,
      unit_price: product.unit_price,
      tier_pricing: product.tier_pricing || [],
      min_order_qty: product.min_order_qty || 1,
      quantity,
      image_url: product.image_url || '',
    });
  }
  saveCart(cart);
}

export function getEffectivePrice(item) {
  if (item.tier_pricing?.length) {
    const sorted = [...item.tier_pricing].sort((a, b) => b.min_qty - a.min_qty);
    const tier = sorted.find(t => item.quantity >= t.min_qty);
    if (tier) return tier.unit_price;
  }
  return item.unit_price;
}

export function computeVendorSplits(items, commissionRate = PLATFORM_COMMISSION_RATE) {
  const byVendor = {};
  items.forEach(item => {
    const price = getEffectivePrice(item);
    const lineTotal = price * item.quantity;
    if (!byVendor[item.supplier_id]) {
      byVendor[item.supplier_id] = { supplier_id: item.supplier_id, supplier_name: item.supplier_name, item_count: 0, subtotal: 0 };
    }
    byVendor[item.supplier_id].item_count += 1;
    byVendor[item.supplier_id].subtotal += lineTotal;
  });
  return Object.values(byVendor).map(v => {
    const rate = commissionRate;
    const commissionAmount = (v.subtotal * rate) / 100;
    return { ...v, commission_rate: rate, commission_amount: commissionAmount, net_payout: v.subtotal - commissionAmount };
  });
}

export function formatKSh(n) {
  return 'KSh ' + Number(n || 0).toLocaleString();
}
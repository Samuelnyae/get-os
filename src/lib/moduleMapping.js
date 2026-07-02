// Maps onboarding module IDs to AdminSidebar tab IDs.
// The onboarding flow saves these on the Organization entity's `enabled_modules` array.
// Items not in the user's enabled_modules are hidden from the sidebar (except core items always shown).

export const MODULE_TO_TABS = {
  pos: ['orders', 'menu', 'kds', 'custom', 'tables', 'reconciliation'],
  hotel_management: ['hotel', 'event-bookings', 'amenity-bookings'],
  reservations: ['reservations'],
  inventory: ['inventory-tracking', 'stock', 'supply-chain', 'vendor-performance', 'driver'],
  kitchen_display: ['kds'],
  crm: ['guest-exp', 'feedback', 'feedback-insights', 'marketing-crm'],
  hr: ['hr', 'staff'],
  analytics: ['analytics', 'revenue-forecast', 'demand-heatmap', 'menu-profitability', 'clv', 'competitor', 'sustainability'],
};

export const AI_MODULE_TO_TABS = {
  ai_inventory: ['inventory', 'reorder-agent'],
  ai_forecast: ['revenue-forecast', 'demand-heatmap'],
  ai_marketing: ['marketing'],
  ai_feedback: ['feedbackai'],
  ai_pricing: ['menu-profitability'],
  ai_shift_manager: ['shift-manager'],
};

// Tabs that are always available regardless of module selection
export const ALWAYS_VISIBLE_TABS = ['dashboard', 'notifications', 'export', 'integrations'];

// Returns the set of sidebar tab IDs the user should see, given their enabled modules
export function getAllowedTabs(enabledModules = [], aiModules = []) {
  const tabs = new Set(ALWAYS_VISIBLE_TABS);
  for (const mod of enabledModules) {
    (MODULE_TO_TABS[mod] || []).forEach(t => tabs.add(t));
  }
  for (const mod of aiModules) {
    (AI_MODULE_TO_TABS[mod] || []).forEach(t => tabs.add(t));
  }
  return tabs;
}
export const BUSINESS_TYPES = [
  { value: 'hotel', label: 'Hotel', icon: '🏨', modules: ['hotel_management', 'reservations', 'inventory', 'crm', 'hr', 'analytics'] },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽', modules: ['pos', 'kitchen_display', 'inventory', 'crm', 'analytics'] },
  { value: 'cafe', label: 'Café', icon: '☕', modules: ['pos', 'inventory', 'crm'] },
  { value: 'lodge', label: 'Lodge', icon: '🏕', modules: ['hotel_management', 'reservations', 'inventory', 'crm', 'analytics'] },
  { value: 'resort', label: 'Resort', icon: '🏖', modules: ['hotel_management', 'reservations', 'inventory', 'crm', 'hr', 'analytics', 'pos', 'kitchen_display'] },
  { value: 'bar', label: 'Bar', icon: '🍸', modules: ['pos', 'inventory', 'crm'] },
  { value: 'bakery', label: 'Bakery', icon: '🍞', modules: ['pos', 'inventory'] },
  { value: 'event_venue', label: 'Event Venue', icon: '🎉', modules: ['reservations', 'crm', 'pos'] },
  { value: 'other', label: 'Other Hospitality', icon: '🏢', modules: ['pos', 'crm'] },
];

export const ALL_MODULES = [
  { value: 'pos', label: 'POS', desc: 'Point of sale & ordering', icon: '💳' },
  { value: 'hotel_management', label: 'Hotel Management', desc: 'Rooms, check-in/out, housekeeping', icon: '🏨' },
  { value: 'reservations', label: 'Reservations', desc: 'Table & room bookings', icon: '📅' },
  { value: 'inventory', label: 'Inventory', desc: 'Stock tracking & alerts', icon: '📦' },
  { value: 'kitchen_display', label: 'Kitchen Display', desc: 'Order management for kitchen', icon: '👨‍🍳' },
  { value: 'crm', label: 'CRM', desc: 'Guest profiles & loyalty', icon: '👥' },
  { value: 'hr', label: 'HR', desc: 'Staff, shifts, attendance', icon: '👔' },
  { value: 'analytics', label: 'Analytics', desc: 'Business intelligence', icon: '📊' },
];

export const AI_MODULES = [
  { value: 'ai_inventory', label: 'AI Inventory', desc: 'Smart stock forecasting', icon: '🤖' },
  { value: 'ai_forecast', label: 'AI Forecast', desc: 'Revenue & demand predictions', icon: '📈' },
  { value: 'ai_marketing', label: 'AI Marketing', desc: 'Automated campaigns', icon: '📣' },
  { value: 'ai_feedback', label: 'AI Feedback', desc: 'Sentiment analysis', icon: '💬' },
  { value: 'ai_pricing', label: 'AI Pricing', desc: 'Dynamic pricing optimization', icon: '💲' },
  { value: 'ai_shift_manager', label: 'AI Shift Manager', desc: 'Smart staff scheduling', icon: '⏰' },
];

export const PLANS = [
  { value: 'starter', label: 'Starter', price: '$29/mo', desc: '1 branch, core operations', branches: 1, features: ['POS', 'Inventory', 'Basic Analytics'] },
  { value: 'professional', label: 'Professional', price: '$99/mo', desc: '10 branches, AI + integrations', branches: 10, features: ['Everything in Starter', 'AI Tools', 'Multi-branch', 'Integrations'] },
  { value: 'enterprise', label: 'Enterprise', price: '$249/mo', desc: 'Unlimited, white-label, SLA', branches: 50, features: ['Everything in Pro', 'White-label', 'Dedicated support', 'Custom SLA'] },
];

export const STAFF_ROLES = [
  { value: 'manager', label: 'Manager', icon: '👔' },
  { value: 'cashier', label: 'Cashier', icon: '💰' },
  { value: 'receptionist', label: 'Receptionist', icon: '🛎' },
  { value: 'chef', label: 'Chef', icon: '👨‍🍳' },
  { value: 'accountant', label: 'Accountant', icon: '📊' },
];

export const IMPORT_TYPES = [
  { value: 'products', label: 'Products', icon: '📦' },
  { value: 'rooms', label: 'Rooms', icon: '🚪' },
  { value: 'guests', label: 'Guests', icon: '👥' },
  { value: 'staff', label: 'Staff', icon: '👤' },
  { value: 'inventory', label: 'Inventory', icon: '📊' },
];

export const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Nigeria', 'Ghana', 'South Africa', 'Rwanda', 'Ethiopia', 'Egypt', 'Morocco', 'United States', 'United Kingdom', 'UAE', 'India', 'Other'];

export const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'TZS', 'UGX', 'NGN', 'GHS', 'ZAR', 'RWF', 'ETB', 'EGP', 'MAD', 'AED', 'INR'];

export const TIMEZONES = ['Africa/Nairobi', 'Africa/Kampala', 'Africa/Dar_es_Salaam', 'Africa/Lagos', 'Africa/Accra', 'Africa/Johannesburg', 'Africa/Kigali', 'Africa/Addis_Ababa', 'Africa/Cairo', 'Europe/London', 'Europe/Paris', 'America/New_York', 'Asia/Dubai', 'Asia/Kolkata'];

export const ONBOARDING_STEPS = [
  { num: 1, label: 'Welcome' },
  { num: 2, label: 'Business Type' },
  { num: 3, label: 'Information' },
  { num: 4, label: 'Branches' },
  { num: 5, label: 'Plan' },
  { num: 6, label: 'Team' },
  { num: 7, label: 'Modules' },
  { num: 8, label: 'Import' },
  { num: 9, label: 'AI' },
  { num: 10, label: 'Done' },
];
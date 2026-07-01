export const BUSINESS_TYPES = [
  { value: 'hotel', label: 'Hotel', icon: 'Hotel', modules: ['hotel_management', 'reservations', 'inventory', 'crm', 'hr', 'analytics'] },
  { value: 'restaurant', label: 'Restaurant', icon: 'UtensilsCrossed', modules: ['pos', 'kitchen_display', 'inventory', 'crm', 'analytics'] },
  { value: 'cafe', label: 'Café', icon: 'Coffee', modules: ['pos', 'inventory', 'crm'] },
  { value: 'lodge', label: 'Lodge', icon: 'Tent', modules: ['hotel_management', 'reservations', 'inventory', 'crm', 'analytics'] },
  { value: 'resort', label: 'Resort', icon: 'Umbrella', modules: ['hotel_management', 'reservations', 'inventory', 'crm', 'hr', 'analytics', 'pos', 'kitchen_display'] },
  { value: 'bar', label: 'Bar', icon: 'Wine', modules: ['pos', 'inventory', 'crm'] },
  { value: 'bakery', label: 'Bakery', icon: 'Croissant', modules: ['pos', 'inventory'] },
  { value: 'event_venue', label: 'Event Venue', icon: 'PartyPopper', modules: ['reservations', 'crm', 'pos'] },
  { value: 'other', label: 'Other Hospitality', icon: 'Building2', modules: ['pos', 'crm'] },
];

export const ALL_MODULES = [
  { value: 'pos', label: 'POS', desc: 'Point of sale & ordering', icon: 'CreditCard' },
  { value: 'hotel_management', label: 'Hotel Management', desc: 'Rooms, check-in/out, housekeeping', icon: 'Hotel' },
  { value: 'reservations', label: 'Reservations', desc: 'Table & room bookings', icon: 'CalendarCheck' },
  { value: 'inventory', label: 'Inventory', desc: 'Stock tracking & alerts', icon: 'Package' },
  { value: 'kitchen_display', label: 'Kitchen Display', desc: 'Order management for kitchen', icon: 'ChefHat' },
  { value: 'crm', label: 'CRM', desc: 'Guest profiles & loyalty', icon: 'Users' },
  { value: 'hr', label: 'HR', desc: 'Staff, shifts, attendance', icon: 'Briefcase' },
  { value: 'analytics', label: 'Analytics', desc: 'Business intelligence', icon: 'BarChart3' },
];

export const AI_MODULES = [
  { value: 'ai_inventory', label: 'AI Inventory', desc: 'Smart stock forecasting', icon: 'Bot' },
  { value: 'ai_forecast', label: 'AI Forecast', desc: 'Revenue & demand predictions', icon: 'TrendingUp' },
  { value: 'ai_marketing', label: 'AI Marketing', desc: 'Automated campaigns', icon: 'Megaphone' },
  { value: 'ai_feedback', label: 'AI Feedback', desc: 'Sentiment analysis', icon: 'MessageSquare' },
  { value: 'ai_pricing', label: 'AI Pricing', desc: 'Dynamic pricing optimization', icon: 'DollarSign' },
  { value: 'ai_shift_manager', label: 'AI Shift Manager', desc: 'Smart staff scheduling', icon: 'Clock' },
];

export const PLANS = [
  { value: 'starter', label: 'Starter', price: '$29/mo', desc: '1 branch, core operations', branches: 1, features: ['POS', 'Inventory', 'Basic Analytics'] },
  { value: 'professional', label: 'Professional', price: '$99/mo', desc: '10 branches, AI + integrations', branches: 10, features: ['Everything in Starter', 'AI Tools', 'Multi-branch', 'Integrations'] },
  { value: 'enterprise', label: 'Enterprise', price: '$249/mo', desc: 'Unlimited, white-label, SLA', branches: 50, features: ['Everything in Pro', 'White-label', 'Dedicated support', 'Custom SLA'] },
];

export const STAFF_ROLES = [
  { value: 'manager', label: 'Manager', icon: 'Briefcase' },
  { value: 'cashier', label: 'Cashier', icon: 'DollarSign' },
  { value: 'receptionist', label: 'Receptionist', icon: 'Bell' },
  { value: 'chef', label: 'Chef', icon: 'ChefHat' },
  { value: 'accountant', label: 'Accountant', icon: 'Calculator' },
];

export const IMPORT_TYPES = [
  { value: 'products', label: 'Products', icon: 'Package' },
  { value: 'rooms', label: 'Rooms', icon: 'DoorOpen' },
  { value: 'guests', label: 'Guests', icon: 'Users' },
  { value: 'staff', label: 'Staff', icon: 'User' },
  { value: 'inventory', label: 'Inventory', icon: 'BarChart3' },
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
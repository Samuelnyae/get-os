import React, { useState } from 'react';
import { Globe, BedDouble, Star, Heart, Phone, Wifi, Clock, QrCode, CalendarDays, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const TRANSLATIONS = {
  en: {
    name: 'English', flag: '🇬🇧',
    welcome: 'Welcome to Digital Bites',
    tagline: 'Your luxury stay, at your fingertips',
    roomService: 'Room Service', roomServiceDesc: 'Order food & drinks to your room',
    concierge: 'Concierge', conciergeDesc: 'Local tips, transport & bookings',
    spa: 'Spa & Wellness', spaDesc: 'Book treatments & relaxation',
    events: 'Event Bookings', eventsDesc: 'Weddings, conferences & more',
    amenities: 'Spa & Amenities', amenitiesDesc: 'Pool, gym, sauna & massage',
    wifi: 'WiFi', wifiCode: 'Password: DigitalBites2026',
    emergency: 'Emergency: Dial 0', reception: 'Reception: Ext. 100',
    checkout: 'Checkout: 11:00 AM',
    hotelFacilities: 'Hotel Facilities',
    pool: '🏊 Pool (6am–10pm)', gym: '🏋️ Gym (24 hours)',
    restaurant: '🍽 Restaurant (7am–11pm)', bar: '🍸 Bar (12pm–1am)',
    bookNow: 'Book Now',
  },
  sw: {
    name: 'Kiswahili', flag: '🇰🇪',
    welcome: 'Karibu Digital Bites', tagline: 'Likizo yako ya kifahari, mikononi mwako',
    roomService: 'Huduma ya Chumba', roomServiceDesc: 'Agiza chakula na vinywaji',
    concierge: 'Msaidizi', conciergeDesc: 'Vidokezo, usafiri na uhifadhi',
    spa: 'Spa na Ustawi', spaDesc: 'Hifadhi matibabu na kupumzika',
    events: 'Matukio', eventsDesc: 'Harusi, mikutano na zaidi',
    amenities: 'Huduma za Spa', amenitiesDesc: 'Bwawa, gym, sauna na massage',
    wifi: 'WiFi', wifiCode: 'Nywila: DigitalBites2026',
    emergency: 'Dharura: Piga 0', reception: 'Mapokezi: Ext. 100',
    checkout: 'Kutoka: 11:00 AM',
    hotelFacilities: 'Huduma za Hoteli',
    pool: '🏊 Bwawa (6am–10pm)', gym: '🏋️ Gym (Masaa 24)',
    restaurant: '🍽 Mkahawa (7am–11pm)', bar: '🍸 Baa (12pm–1am)',
    bookNow: 'Hifadhi Sasa',
  },
  fr: {
    name: 'Français', flag: '🇫🇷',
    welcome: 'Bienvenue à Digital Bites', tagline: 'Votre séjour de luxe, à portée de main',
    roomService: 'Service en Chambre', roomServiceDesc: 'Commandez repas et boissons',
    concierge: 'Conciergerie', conciergeDesc: 'Conseils locaux, transport et réservations',
    spa: 'Spa & Bien-être', spaDesc: 'Réservez soins et relaxation',
    events: 'Événements', eventsDesc: 'Mariages, conférences et plus',
    amenities: 'Spa & Loisirs', amenitiesDesc: 'Piscine, gym, sauna et massage',
    wifi: 'WiFi', wifiCode: 'Mot de passe: DigitalBites2026',
    emergency: 'Urgence: Composez le 0', reception: 'Réception: Ext. 100',
    checkout: 'Départ: 11h00',
    hotelFacilities: 'Équipements',
    pool: '🏊 Piscine (6h–22h)', gym: '🏋️ Gym (24h/24)',
    restaurant: '🍽 Restaurant (7h–23h)', bar: '🍸 Bar (12h–1h)',
    bookNow: 'Réserver',
  },
  de: {
    name: 'Deutsch', flag: '🇩🇪',
    welcome: 'Willkommen bei Digital Bites', tagline: 'Ihr Luxusaufenthalt auf Knopfdruck',
    roomService: 'Zimmerservice', roomServiceDesc: 'Speisen und Getränke bestellen',
    concierge: 'Concierge', conciergeDesc: 'Lokale Tipps, Transport und Buchungen',
    spa: 'Spa & Wellness', spaDesc: 'Behandlungen und Entspannung buchen',
    events: 'Veranstaltungen', eventsDesc: 'Hochzeiten, Konferenzen und mehr',
    amenities: 'Spa & Freizeit', amenitiesDesc: 'Pool, Gym, Sauna und Massage',
    wifi: 'WLAN', wifiCode: 'Passwort: DigitalBites2026',
    emergency: 'Notfall: Wählen Sie 0', reception: 'Rezeption: Durchwahl 100',
    checkout: 'Abreise: 11:00 Uhr',
    hotelFacilities: 'Hoteleinrichtungen',
    pool: '🏊 Pool (6–22 Uhr)', gym: '🏋️ Gym (24 Stunden)',
    restaurant: '🍽 Restaurant (7–23 Uhr)', bar: '🍸 Bar (12–1 Uhr)',
    bookNow: 'Jetzt buchen',
  },
  zh: {
    name: '中文', flag: '🇨🇳',
    welcome: '欢迎来到 Digital Bites', tagline: '您的豪华住宿，触手可及',
    roomService: '客房服务', roomServiceDesc: '订购食物和饮品',
    concierge: '礼宾服务', conciergeDesc: '本地建议、交通和预订',
    spa: '水疗与健康', spaDesc: '预订护理和放松服务',
    events: '活动预订', eventsDesc: '婚礼、会议等',
    amenities: '水疗与设施', amenitiesDesc: '游泳池、健身房、桑拿和按摩',
    wifi: 'WiFi', wifiCode: '密码: DigitalBites2026',
    emergency: '紧急: 拨打 0', reception: '前台: 分机 100',
    checkout: '退房时间: 上午 11:00',
    hotelFacilities: '酒店设施',
    pool: '🏊 泳池 (早6点–晚10点)', gym: '🏋️ 健身房 (24小时)',
    restaurant: '🍽 餐厅 (早7点–晚11点)', bar: '🍸 酒吧 (中午–凌晨1点)',
    bookNow: '立即预订',
  },
  ar: {
    name: 'العربية', flag: '🇦🇪',
    welcome: 'مرحباً بكم في Digital Bites', tagline: 'إقامتكم الفاخرة في متناول يدك',
    roomService: 'خدمة الغرف', roomServiceDesc: 'اطلب الطعام والمشروبات',
    concierge: 'خدمة الكونسيرج', conciergeDesc: 'نصائح محلية، نقل وحجوزات',
    spa: 'المنتجع الصحي', spaDesc: 'احجز علاجات وجلسات استرخاء',
    events: 'حجز الفعاليات', eventsDesc: 'حفلات الزفاف والمؤتمرات والمزيد',
    amenities: 'المنتجع والمرافق', amenitiesDesc: 'مسبح، صالة رياضية، ساونا ومساج',
    wifi: 'واي فاي', wifiCode: 'كلمة المرور: DigitalBites2026',
    emergency: 'طوارئ: اتصل بـ 0', reception: 'الاستقبال: تحويلة 100',
    checkout: 'المغادرة: 11:00 صباحاً',
    hotelFacilities: 'مرافق الفندق',
    pool: '🏊 المسبح (6ص–10م)', gym: '🏋️ الصالة الرياضية (24 ساعة)',
    restaurant: '🍽 المطعم (7ص–11م)', bar: '🍸 البار (12ظ–1ص)',
    bookNow: 'احجز الآن',
  },
};

export default function GuestPortalPage() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .gold-gradient { background: linear-gradient(135deg,#c9a962 0%,#e4d5a7 50%,#c9a962 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Language Switcher */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {Object.entries(TRANSLATIONS).map(([code, data]) => (
            <button key={code} onClick={() => setLang(code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${lang === code ? 'border-[#c9a962]/60 bg-[#c9a962]/15 text-[#c9a962]' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
              <span>{data.flag}</span>{data.name}
            </button>
          ))}
        </div>

        {/* Portal Card */}
        <div className="bg-gradient-to-br from-[#1a1410] to-[#1a1a1a] border border-[#c9a962]/20 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#c9a962]/20 to-transparent p-8 border-b border-[#c9a962]/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a962] to-[#e4d5a7] flex items-center justify-center">
                <span className="text-black font-bold">DB</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-2xl font-playfair">{t.welcome}</h1>
                <p className="text-[#c9a962]/70 text-sm">{t.tagline}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                [Wifi, t.wifi, t.wifiCode],
                [Phone, t.reception, ''],
                [Clock, t.checkout, ''],
                [Phone, t.emergency, ''],
              ].map(([Icon, label, sub], i) => (
                <div key={i} className="bg-[#111] rounded-xl p-3 border border-white/5">
                  <Icon className="w-4 h-4 text-[#c9a962] mb-2" />
                  <div className="text-white text-xs font-medium">{label}</div>
                  {sub && <div className="text-white/40 text-[10px] mt-0.5">{sub}</div>}
                </div>
              ))}
            </div>

            {/* Bookable Services */}
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-3">Services</div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { ServiceIcon: BedDouble, label: t.roomService, desc: t.roomServiceDesc, link: '/Order' },
                  { ServiceIcon: CalendarDays, label: t.events, desc: t.eventsDesc, link: '/Events' },
                  { ServiceIcon: Sparkles, label: t.amenities, desc: t.amenitiesDesc, link: '/SpaAmenities' },
                  { ServiceIcon: Star, label: t.concierge, desc: t.conciergeDesc, link: null },
                ].map(({ ServiceIcon, label, desc, link }) => (
                  <div key={label} className="bg-[#111] rounded-2xl p-4 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#c9a962]/10 flex items-center justify-center group-hover:bg-[#c9a962]/20 transition-all">
                          <ServiceIcon className="w-4 h-4 text-[#c9a962]" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{label}</div>
                          <div className="text-white/40 text-xs">{desc}</div>
                        </div>
                      </div>
                      {link && (
                        <Link to={link} className="text-xs px-3 py-1.5 rounded-lg bg-[#c9a962]/15 text-[#c9a962] border border-[#c9a962]/20 hover:bg-[#c9a962]/25 transition-all whitespace-nowrap">
                          {t.bookNow} →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Facilities */}
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-3">{t.hotelFacilities}</div>
              <div className="grid grid-cols-2 gap-2">
                {[t.pool, t.gym, t.restaurant, t.bar].map((item, i) => (
                  <div key={i} className="bg-[#111] rounded-xl px-3 py-2 text-xs text-white/60 border border-white/5">{item}</div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div className="bg-[#c9a962]/5 border border-[#c9a962]/10 rounded-xl p-4 flex items-center gap-3">
              <QrCode className="w-5 h-5 text-[#c9a962] shrink-0" />
              <div className="text-white/50 text-xs">Scan the QR code in your room to access this portal. Available in {Object.keys(TRANSLATIONS).length} languages.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
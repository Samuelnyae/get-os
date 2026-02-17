import { useEffect } from 'react';

export default function SEOHead({ 
  title, 
  description, 
  keywords,
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
  type = 'website'
}) {
  useEffect(() => {
    // Set document title
    document.title = title ? `${title} | Hermanas Bites` : 'Hermanas Bites - Seven Star Luxury Dining';
    
    // Set or update meta tags
    const metaTags = {
      'description': description || 'Experience the pinnacle of culinary excellence at Hermanas Bites. Seven-star luxury dining with exquisite cuisine, impeccable service, and unforgettable ambiance.',
      'keywords': keywords || 'luxury restaurant, fine dining, seven star dining, gourmet food, restaurant menu, online ordering, table reservation',
      'og:title': title || 'Hermanas Bites - Seven Star Luxury Dining',
      'og:description': description || 'Experience the pinnacle of culinary excellence at Hermanas Bites.',
      'og:image': image,
      'og:type': type,
      'og:site_name': 'Hermanas Bites',
      'twitter:card': 'summary_large_image',
      'twitter:title': title || 'Hermanas Bites - Seven Star Luxury Dining',
      'twitter:description': description || 'Experience the pinnacle of culinary excellence at Hermanas Bites.',
      'twitter:image': image,
    };

    Object.entries(metaTags).forEach(([property, content]) => {
      const isOg = property.startsWith('og:');
      const isTwitter = property.startsWith('twitter:');
      const attr = isOg || isTwitter ? 'property' : 'name';
      
      let meta = document.querySelector(`meta[${attr}="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    // Add JSON-LD structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": "Hermanas Bites",
      "description": "Seven Star Luxury Dining Experience",
      "image": image,
      "servesCuisine": ["International", "Fine Dining", "Gourmet"],
      "priceRange": "$$$$",
      "acceptsReservations": "True",
      "menu": window.location.origin + "/menu",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "City",
        "addressCountry": "KE"
      }
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, image, type]);

  return null;
}
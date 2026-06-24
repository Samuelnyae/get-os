import { useEffect } from 'react';

export default function SEOHead({ 
  title, 
  description, 
  keywords,
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
  type = 'website'
}) {
  useEffect(() => {
    // Enhanced title with brand name
    document.title = title 
      ? `${title} | Get OS` 
      : 'Get OS | Seven Star Luxury Restaurant & Fine Dining Experience';
    
    // Enhanced default description
    const finalDescription = description || 'Get OS - Premier seven-star luxury restaurant. Experience world-class gourmet cuisine, AI-powered personalized service, elegant ambiance, online ordering, table reservations, and custom menu creations. Order now for delivery or dine-in.';
    
    // Enhanced keywords
    const finalKeywords = keywords || 'Get OS, get os, get os restaurant, luxury restaurant, seven star dining, fine dining, gourmet food, best restaurant, restaurant near me, food delivery, online food order, table reservations, custom food, AI restaurant, elegant dining, premium restaurant';
    
    // Set or update meta tags
    const metaTags = {
      'description': finalDescription,
      'keywords': finalKeywords,
      'author': 'Get OS',
      'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      'googlebot': 'index, follow',
      'bingbot': 'index, follow',
      'og:title': title || 'Get OS - Seven Star Luxury Restaurant',
      'og:description': finalDescription,
      'og:image': image,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:type': type,
      'og:site_name': 'Get OS',
      'og:locale': 'en_US',
      'twitter:card': 'summary_large_image',
      'twitter:site': '@GetOS',
      'twitter:title': title || 'Get OS - Seven Star Luxury Restaurant',
      'twitter:description': finalDescription,
      'twitter:image': image,
      'twitter:image:alt': 'Get OS - Luxury Dining',
    };

    // Apply meta tags
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

    // Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = window.location.href;

    // Add JSON-LD structured data for better search indexing
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": "Get OS",
      "alternateName": "Get OS Restaurant",
      "description": finalDescription,
      "url": window.location.origin,
      "image": [image],
      "logo": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200",
      "servesCuisine": ["International", "Fine Dining", "Gourmet", "Fusion"],
      "priceRange": "$$$$",
      "acceptsReservations": "True",
      "hasMenu": window.location.origin + "/menu",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "City",
        "addressCountry": "KE"
      },
      "telephone": "+254-XXX-XXXX",
      "potentialAction": [
        {
          "@type": "OrderAction",
          "target": window.location.origin + "/order"
        },
        {
          "@type": "ReserveAction",
          "target": window.location.origin + "/reservations"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "287",
        "bestRating": "5",
        "worstRating": "1"
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
// Input sanitization and validation utilities

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
};

export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  // Remove all non-digit characters except + at start
  return phone.replace(/[^\d+]/g, '').slice(0, 20);
};

export const validateOrderData = (data) => {
  const errors = [];
  
  if (!data.customer_name || data.customer_name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!sanitizeEmail(data.customer_email)) {
    errors.push('Invalid email address');
  }
  
  if (!data.customer_phone || data.customer_phone.length < 10) {
    errors.push('Invalid phone number');
  }
  
  if (!data.items || data.items.length === 0) {
    errors.push('Cart is empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting for client-side (prevents spam)
class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  canMakeRequest(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
}

export const orderRateLimiter = new RateLimiter(3, 60000); // 3 orders per minute
export const searchRateLimiter = new RateLimiter(30, 60000); // 30 searches per minute
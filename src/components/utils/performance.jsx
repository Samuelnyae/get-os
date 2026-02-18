import { useEffect, useRef, useCallback } from 'react';

// Debounce hook for search inputs
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Throttle function for scroll/resize events
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer hook for lazy loading
export const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = React.useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, { threshold: 0.1, ...options });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isInView];
};

// Image lazy loading component
export const LazyImage = ({ src, alt, className, ...props }) => {
  const [imageSrc, setImageSrc] = React.useState(null);
  const [ref, isInView] = useInView();

  useEffect(() => {
    if (isInView && src) {
      setImageSrc(src);
    }
  }, [isInView, src]);

  return (
    <div ref={ref}>
      {imageSrc ? (
        <img src={imageSrc} alt={alt} className={className} loading="lazy" {...props} />
      ) : (
        <div className={`${className} bg-gray-800 animate-pulse`} />
      )}
    </div>
  );
};

// React import
import React from 'react';
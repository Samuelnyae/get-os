import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if ('Notification' in window && permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  const sendNotification = (title, options = {}) => {
    // Show toast notification (always visible in-app)
    toast(title, {
      description: options.body,
      duration: 5000,
      ...options.toastOptions,
    });

    // Send browser notification if permission granted and page not focused
    if ('Notification' in window && permission === 'granted' && document.hidden) {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'hermanas-bites',
        requireInteraction: options.requireInteraction || false,
        ...options,
      });

      if (options.onClick) {
        notification.onclick = options.onClick;
      }

      // Auto close after duration
      setTimeout(() => notification.close(), options.duration || 5000);
    }
  };

  return { sendNotification, permission };
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
    }
    return permission;
  }
  return Notification.permission;
};
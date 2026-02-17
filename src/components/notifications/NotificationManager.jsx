import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Do Not Disturb Settings
const DND_KEY = 'hermanas_dnd_settings';

export const getDNDSettings = () => {
  const stored = localStorage.getItem(DND_KEY);
  return stored ? JSON.parse(stored) : {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  };
};

export const setDNDSettings = (settings) => {
  localStorage.setItem(DND_KEY, JSON.stringify(settings));
};

export const isDNDActive = () => {
  const settings = getDNDSettings();
  if (!settings.enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = settings.startTime.split(':').map(Number);
  const [endHour, endMin] = settings.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight DND (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime < endMinutes;
  }
  
  return currentTime >= startMinutes && currentTime < endMinutes;
};

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [dndSettings, setDndSettingsState] = useState(getDNDSettings());

  useEffect(() => {
    if ('Notification' in window && permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  const sendNotification = (title, options = {}) => {
    const isHighPriority = options.priority === 'urgent' || options.priority === 'high';
    const dndActive = isDNDActive();
    
    // Suppress non-urgent notifications during DND
    if (dndActive && !isHighPriority && !options.ignoreDND) {
      console.log('[DND] Notification suppressed:', title);
      return;
    }

    // Enhanced toast with priority styling
    const toastOptions = {
      description: options.body,
      duration: isHighPriority ? 10000 : 5000,
      ...options.toastOptions,
    };

    if (isHighPriority) {
      toast.error(title, {
        ...toastOptions,
        className: 'border-2 border-red-500 bg-red-950',
      });
    } else {
      toast(title, toastOptions);
    }

    // Send browser notification if permission granted and page not focused
    if ('Notification' in window && permission === 'granted' && document.hidden) {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'hermanas-bites',
        requireInteraction: isHighPriority || options.requireInteraction || false,
        silent: !isHighPriority,
        ...options,
      });

      // Play sound for high priority
      if (isHighPriority) {
        playNotificationSound();
      }

      if (options.onClick) {
        notification.onclick = options.onClick;
      }

      // Auto close after duration (longer for high priority)
      setTimeout(() => notification.close(), isHighPriority ? 15000 : 5000);
    }
  };

  const updateDNDSettings = (newSettings) => {
    setDNDSettings(newSettings);
    setDndSettingsState(newSettings);
    toast.success(newSettings.enabled ? 'Do Not Disturb enabled' : 'Do Not Disturb disabled');
  };

  return { sendNotification, permission, dndSettings, updateDNDSettings, isDNDActive: isDNDActive() };
};

// Play notification sound for urgent alerts
const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4ktjyzHksBSR3x/DdkEAKFF6...'); // Truncated for brevity
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (err) {}
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
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Bell, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import LuxuryButton from '../common/LuxuryButton';
import { getDNDSettings, setDNDSettings, isDNDActive } from '../notifications/NotificationManager';
import { toast } from 'sonner';

export default function DNDSettings() {
  const [settings, setSettings] = useState(getDNDSettings());
  const [isActive, setIsActive] = useState(isDNDActive());

  const handleSave = () => {
    setDNDSettings(settings);
    setIsActive(isDNDActive());
    toast.success('Do Not Disturb settings saved');
  };

  const handleToggle = (enabled) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    setDNDSettings(newSettings);
    setIsActive(enabled && isDNDActive());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-2xl text-white flex items-center gap-3">
            <Moon className="w-6 h-6 text-[#c9a962]" />
            Do Not Disturb
          </h3>
          <p className="font-inter text-sm text-white/60 mt-1">
            Suppress non-urgent notifications during off-hours
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-inter text-sm text-white/70">
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30"
        >
          <div className="flex items-center gap-2 text-blue-300">
            <Moon className="w-5 h-5" />
            <span className="font-inter text-sm font-medium">
              Do Not Disturb is currently active
            </span>
          </div>
          <p className="font-inter text-xs text-blue-200/70 mt-1 ml-7">
            Only urgent notifications will be shown
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
        <div className="space-y-2">
          <label className="font-inter text-sm text-[#c9a962] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Start Time
          </label>
          <Input
            type="time"
            value={settings.startTime}
            onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
            className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
          />
          <p className="font-inter text-xs text-white/40">
            Notifications will be suppressed starting at this time
          </p>
        </div>

        <div className="space-y-2">
          <label className="font-inter text-sm text-[#c9a962] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            End Time
          </label>
          <Input
            type="time"
            value={settings.endTime}
            onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
            className="bg-[#0a0a0a] border-[#c9a962]/20 text-white"
          />
          <p className="font-inter text-xs text-white/40">
            Normal notifications will resume at this time
          </p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#c9a962]/10">
        <div className="flex items-start gap-3 mb-4">
          <Bell className="w-5 h-5 text-[#c9a962] mt-1" />
          <div>
            <h4 className="font-inter text-sm font-medium text-white mb-1">
              Priority Notifications
            </h4>
            <p className="font-inter text-xs text-white/60">
              The following notifications will always be shown, even during DND:
            </p>
          </div>
        </div>
        
        <ul className="space-y-2 ml-8">
          <li className="font-inter text-xs text-white/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
            New orders (pending assignment)
          </li>
          <li className="font-inter text-xs text-white/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
            Orders with no staff assigned (urgent)
          </li>
          <li className="font-inter text-xs text-white/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
            Payment status changes
          </li>
        </ul>
      </div>

      <LuxuryButton onClick={handleSave} className="w-full">
        Save Settings
      </LuxuryButton>
    </div>
  );
}
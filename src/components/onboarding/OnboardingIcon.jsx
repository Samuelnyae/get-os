import React from 'react';
import {
  Hotel, UtensilsCrossed, Coffee, Tent, Umbrella, Wine, Croissant, PartyPopper, Building2,
  CreditCard, CalendarCheck, Package, ChefHat, Users, Briefcase, BarChart3,
  Bot, TrendingUp, Megaphone, MessageSquare, DollarSign, Clock,
  Bell, Calculator, DoorOpen, User, AlertTriangle, Check
} from 'lucide-react';

const ICON_MAP = {
  Hotel, UtensilsCrossed, Coffee, Tent, Umbrella, Wine, Croissant, PartyPopper, Building2,
  CreditCard, CalendarCheck, Package, ChefHat, Users, Briefcase, BarChart3,
  Bot, TrendingUp, Megaphone, MessageSquare, DollarSign, Clock,
  Bell, Calculator, DoorOpen, User, AlertTriangle, Check
};

export default function OnboardingIcon({ name, className }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
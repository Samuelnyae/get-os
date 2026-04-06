import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { languageNames, languageFlags } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { lang, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#c9a962]/30 hover:bg-[#c9a962]/10 transition-all text-[#c9a962] text-xs font-inter">
        <Globe className="w-3.5 h-3.5" />
        <span>{languageFlags[lang]}</span>
        <span className="hidden sm:inline">{languageNames[lang]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#1a1a1a] border-[#c9a962]/20">
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code)}
            className={`font-inter text-sm cursor-pointer ${lang === code ? 'text-[#c9a962]' : 'text-white/80 hover:text-[#c9a962]'}`}
          >
            {languageFlags[code]} {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
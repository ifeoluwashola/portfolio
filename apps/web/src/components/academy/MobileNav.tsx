"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Home", href: "/academy" },
    { name: "Labs", href: "/academy/break-it-labs" },
    { name: "Discussion Forum", href: "/academy/discussion-forum" },
    { name: "Alumni", href: "/academy/alumni" },
    { name: "Resources", href: "/academy/materials" },
  ];

  return (
    <div className="md:hidden">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted-foreground hover:text-yellow-400 transition-colors rounded-lg hover:bg-yellow-500/10 flex items-center justify-center"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Dropdown Overlay Menu */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 z-40 py-6 px-6 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-top duration-200">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/5 transition-all font-mono tracking-widest uppercase py-3 px-4 rounded-xl border border-transparent hover:border-yellow-500/10"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

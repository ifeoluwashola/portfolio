"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Cpu, Menu, X } from "lucide-react";

export function KybernNexusNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#eab308] rounded flex items-center justify-center">
                <Cpu className="text-[#0f172a] w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Kybern <span className="text-[#eab308]">Nexus</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-[#eab308] transition-colors">Home</Link>
            <Link href="/#ecosystem" className="text-sm font-medium text-slate-300 hover:text-[#eab308] transition-colors">Services & Products</Link>
            <Link href="/#about" className="text-sm font-medium text-slate-300 hover:text-[#eab308] transition-colors">About Us</Link>
            <Link href="/blog" className="text-sm font-medium text-slate-300 hover:text-[#eab308] transition-colors">Blog</Link>
            <Link href="/#contact" className="text-sm font-medium text-slate-300 hover:text-[#eab308] transition-colors">Contact</Link>
            <Link href="/consulting" className="bg-[#eab308] hover:bg-yellow-400 text-[#0f172a] px-5 py-2.5 rounded-md text-sm font-bold transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)]">
              Consult With Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-[#eab308]">Home</Link>
            <Link href="/#ecosystem" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-[#eab308]">Services & Products</Link>
            <Link href="/#about" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-[#eab308]">About Us</Link>
            <Link href="/blog" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-[#eab308]">Blog</Link>
            <Link href="/#contact" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-[#eab308]">Contact</Link>
            <Link href="/consulting" className="block px-3 py-2 text-base font-bold text-[#eab308]">Consult With Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

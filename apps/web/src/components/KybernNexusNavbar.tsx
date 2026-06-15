"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Cpu, Menu, X } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";

export function KybernNexusNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-kn-bg/80 backdrop-blur-md border-b border-kn-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-kn-accent rounded flex items-center justify-center">
                <Cpu className="text-kn-bg w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-kn-heading">
                Kybern <span className="text-kn-accent">Nexus</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/consulting" className="text-sm font-medium text-kn-body hover:text-kn-accent transition-colors">Consulting</Link>
            <Link href="/academy" className="text-sm font-medium text-kn-body hover:text-kn-accent transition-colors">Academy</Link>
            <Link href="/pricing" className="text-sm font-medium text-kn-body hover:text-kn-accent transition-colors">Pricing</Link>
            <Link href="/about" className="text-sm font-medium text-kn-body hover:text-kn-accent transition-colors">About</Link>
            <Link href="/blog" className="text-sm font-medium text-kn-body hover:text-kn-accent transition-colors">Blog</Link>
            <ModeToggle />
            <Link href="/consulting#contact" className="bg-kn-accent hover:brightness-110 text-kn-bg px-5 py-2.5 rounded-md text-sm font-bold transition-all shadow-[0_0_15px_var(--kn-accent-glow)] hover:shadow-[0_0_25px_var(--kn-accent-glow)]">
              Work With Us →
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ModeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-kn-body hover:text-kn-heading">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-kn-bg border-b border-kn-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/consulting" className="block px-3 py-2 text-base font-medium text-kn-body hover:text-kn-accent">Services</Link>
            <Link href="/academy" className="block px-3 py-2 text-base font-medium text-kn-body hover:text-kn-accent">Academy</Link>
            <Link href="/pricing" className="block px-3 py-2 text-base font-medium text-kn-body hover:text-kn-accent">Pricing</Link>
            <Link href="/about" className="block px-3 py-2 text-base font-medium text-kn-body hover:text-kn-accent">About</Link>
            <Link href="/blog" className="block px-3 py-2 text-base font-medium text-kn-body hover:text-kn-accent">Blog</Link>
            <Link href="/consulting#contact" className="block px-3 py-2 text-base font-bold text-kn-accent">Work With Us →</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

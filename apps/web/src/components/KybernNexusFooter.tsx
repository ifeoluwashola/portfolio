import React from "react";
import Link from "next/link";
import { Cpu, Mail } from "lucide-react";

export function KybernNexusFooter() {
  return (
    <footer className="bg-[#0b1120] border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#eab308] rounded flex items-center justify-center">
                <Cpu className="text-[#0f172a] w-5 h-5" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">
                Kybern <span className="text-[#eab308]">Nexus</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm">
              The central hub for technological innovation, enterprise consulting, and world-class engineering education.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Directory</h4>
            <ul className="space-y-3">
              <li><Link href="/consulting" className="text-slate-400 hover:text-[#eab308] transition-colors">Software Consultancy</Link></li>
              <li><Link href="/academy" className="text-slate-400 hover:text-[#eab308] transition-colors">Kybern Academy</Link></li>
              <li><Link href="/#about" className="text-slate-400 hover:text-[#eab308] transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hello@kybernnexus.com" className="text-slate-400 hover:text-[#eab308] transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" /> hello@kybernnexus.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Kybern Nexus Ltd. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, PlusCircle, LayoutDashboard, Key, Menu, X, Layers } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'API Keys',
      href: '/keys',
      icon: Key,
      active: pathname === '/keys',
    },
    {
      name: 'Create Connector',
      href: '/connectors/new',
      icon: PlusCircle,
      active: pathname === '/connectors/new',
    },
  ];

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-400">
          <Cpu className="w-6 h-6 text-blue-400" />
          <span>AI API Hub</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 sticky top-[57px] z-40">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  link.active
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Sidebar (Dark Navy) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white min-h-screen sticky top-0 flex-shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-white">
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="block leading-tight font-extrabold tracking-tight">AI API Hub</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-normal">
                Universal Gateway
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Navigation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  link.active
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${link.active ? 'text-white' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}

          <div className="pt-6 px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Core Features
          </div>
          <div className="px-3 py-2 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Multi-Provider Adapters</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Google Gemini &amp; Groq/OpenAI compatible models with automated JSON schema validation.
            </p>
          </div>
        </nav>

        {/* Footer Status */}
        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Gateway Online
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">v0.1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

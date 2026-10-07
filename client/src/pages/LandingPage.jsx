import React, { useState } from 'react';
import {
  Radio,
  Mail,
  MessageSquare,
  FolderOpen,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Keyboard,
  Layers,
  FileText
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const LandingPage = ({ onNavigate, onQuickLogin }) => {
  const [activePreviewTab, setActivePreviewTab] = useState('inbox');

  const previewTabs = [
    { id: 'inbox', label: 'Email Management', icon: Mail },
    { id: 'chat', label: 'Channels & Chat', icon: MessageSquare },
    { id: 'files', label: 'Shared Files', icon: FolderOpen },
    { id: 'contacts', label: 'People Directory', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      {/* ─────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg leading-none">
                Relay
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Comm Suite
              </span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300" aria-label="Landing Navigation">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Workspace Tour
            </a>
            <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              About Platform
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Toggle in Header */}
            <ThemeToggle />

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Frontend Prototype & Client Suite Demo</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            One calm workspace for your team’s{' '}
            <span className="text-indigo-600 dark:text-indigo-400">email and chat</span>.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Relay brings email inboxes, direct conversations, channel threads, and shared files into an uncluttered interface designed for focus and productivity.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>Get started with Relay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-5 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200 dark:border-slate-800 shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Log in to demo
            </button>
            {onQuickLogin && (
              <button
                type="button"
                onClick={onQuickLogin}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Log in instantly using the demo account"
              >
                1-Click Demo Access
              </button>
            )}
          </div>

          {/* Disclaimer Banner */}
          <div className="mt-6 max-w-xl mx-auto p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Client-Side Demo Mode:</strong> The interface runs on typed local mock state with browser persistence. No server account or external sign-in required.
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE PRODUCT PREVIEW CARD
      ─────────────────────────────────────────────────────────────── */}
      <section id="preview" className="pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Preview Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-2">
                  relay-workspace.internal
                </span>
              </div>

              {/* Module Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                {previewTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activePreviewTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePreviewTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Content Windows */}
            <div className="p-6 sm:p-10 bg-slate-50/40 dark:bg-slate-950/40">
              {activePreviewTab === 'inbox' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Q4 Product Roadmap & Architecture Sync
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Sarah Jenkins • 10:42 AM</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    "Hey team, attaching the high-level roadmap for Q4. Primary objectives include finalizing the Relay core communication framework, implementing responsive keyboard shortcuts, and ensuring draft persistence..."
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      Product
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Architecture
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto">
                      Auto-saved locally with full keyboard shortcuts (j / k / s / u)
                    </span>
                  </div>
                </div>
              )}

              {activePreviewTab === 'chat' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">#frontend-core</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">• 12 members</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200">
                      <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Marcus Vance</span>
                      "Hey Alex, do we have the responsive drawer and notification center integrated?"
                    </div>
                    <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 ml-6">
                      <span className="font-semibold text-indigo-950 dark:text-white block mb-0.5">Alex Rivera (You)</span>
                      "Yes, fully verified with optimistic sending, status checkmarks, and presence!"
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'files' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Shared Assets & Deliverables
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Sort by Name, Date, or Size</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">relay-v2-architecture-spec.pdf</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500">1.8 MB • Shared in #frontend-core</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">design-system-tokens.json</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500">42 KB • Shared by Elena Rostova</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'contacts' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Teammates & Departments
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Engineering • Design • Product</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        ER
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Elena Rostova</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Principal UX Designer</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        DC
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">David Chen</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Full Stack Engineer</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Action Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                <span>Launch the live demo workspace to test all interactive features</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. CORE CAPABILITIES (FEATURES)
      ─────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Built for focus, designed for clarity
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Every detail in Relay is crafted to reduce context-switching and provide a calm, high-efficiency communication hub.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Module</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Three-pane reader, local draft auto-saving, dynamic tag filters, and fast keyboard navigation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chat & Channels</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Project channels and 1:1 direct messaging with presence status, sender grouping, and message delivery checkmarks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">File Directory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sortable file manager with drag-and-drop dropzone, preview drawer, and links back to origin threads.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">People & Contacts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Searchable directory with department grouping, profile drawers, and client-validated teammate invitations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CTA BANNER
      ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-indigo-600 text-white shadow-xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to explore Relay?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Experience the unified email and chat suite built with React, Vite, and Tailwind CSS.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="px-6 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-xs"
              >
                Create Demo Account
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors border border-indigo-400/40"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. FOOTER
      ─────────────────────────────────────────────────────────────── */}
      <footer id="about" className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Relay Platform</span>
            <span>• Client Prototype</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <ThemeToggle />
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Log in
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

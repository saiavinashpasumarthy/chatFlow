import React, { useState } from 'react';
import {
  Radio,
  Mail,
  MessageSquare,
  FolderOpen,
  Users,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const LandingPage = ({ onNavigate }) => {
  const [activePreviewTab, setActivePreviewTab] = useState('inbox');

  const previewTabs = [
    { id: 'inbox', label: 'Email Management', icon: Mail },
    { id: 'chat', label: 'Channels & Chat', icon: MessageSquare },
    { id: 'files', label: 'Shared Files', icon: FolderOpen },
    { id: 'contacts', label: 'People Directory', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-150">

      {/* NAVIGATION BAR */}
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
                Communication Suite
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav
            className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300"
            aria-label="Landing Navigation"
          >
            <a
              href="#features"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Features
            </a>

            <a
              href="#preview"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Workspace Tour
            </a>

            <a
              href="#about"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              About Platform
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
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

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Unified Communication Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            One calm workspace for your team’s{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              email and chat
            </span>.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Relay brings email inboxes, direct conversations, channel
            threads, notifications, and shared files into one focused
            workspace designed for productive communication.
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
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PRODUCT PREVIEW */}
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
                  Relay-workspace
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

            {/* Preview Content */}
            <div className="p-6 sm:p-10 bg-slate-50/40 dark:bg-slate-950/40">

              {/* EMAIL */}
              {activePreviewTab === 'inbox' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs min-h-[220px] flex flex-col items-center justify-center text-center">

                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <Mail className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Your inbox
                  </h3>

                  <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your emails will appear here after you connect and use
                    the email workspace.
                  </p>
                </div>
              )}

              {/* CHAT */}
              {activePreviewTab === 'chat' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs min-h-[220px] flex flex-col items-center justify-center text-center">

                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Team conversations
                  </h3>

                  <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Create conversations, join channels, and communicate
                    with your team in real time.
                  </p>
                </div>
              )}

              {/* FILES */}
              {activePreviewTab === 'files' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs min-h-[220px] flex flex-col items-center justify-center text-center">

                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <FolderOpen className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Shared files
                  </h3>

                  <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload and share files with your team while keeping
                    communication and collaboration in one place.
                  </p>
                </div>
              )}

              {/* CONTACTS */}
              {activePreviewTab === 'contacts' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs min-h-[220px] flex flex-col items-center justify-center text-center">

                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    People directory
                  </h3>

                  <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Find your teammates and access their communication
                    profiles from one centralized directory.
                  </p>
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                <span>Get started with Relay</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Built for focus, designed for clarity
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Relay brings the tools your team needs for communication,
              collaboration, and file sharing into one workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Feature 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <Mail className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Email
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Manage email communication through a focused workspace with
                sending, inbox access, and message organization.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <MessageSquare className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chat & Channels
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Communicate through real-time conversations, direct
                messaging, and team channels.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <FolderOpen className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                File Sharing
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload, store, and share project files alongside your team
                communication.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                <Users className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                People & Contacts
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Find teammates and manage communication profiles from one
                centralized directory.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <div className="p-8 sm:p-12 rounded-3xl bg-indigo-600 text-white shadow-xl space-y-4">

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to get started with Relay?
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Bring your team’s email, chat, notifications, and file sharing
              into one unified communication workspace.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">

              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="px-6 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-xs"
              >
                Create Account
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

      {/* FOOTER */}
      <footer
        id="about"
        className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />

            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Relay
            </span>

            <span>• Communication Platform</span>
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
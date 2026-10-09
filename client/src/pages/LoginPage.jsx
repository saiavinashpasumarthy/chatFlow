import React, { useState } from 'react';
import {
  Radio,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  MessageSquare,
  Users,
  FolderOpen,
  Video,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export const LoginPage = ({ onNavigate, onLogin, onGoogleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetMessage('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onLogin({
        email: trimmedEmail,
        password
      });
    } catch (error) {
      console.error('Login error:', error);
      if (
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/invalid-login-credentials'
      ) {
        setErrorMessage('Invalid email or password.');
      } else if (error?.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email.');
      } else if (error?.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password.');
      } else if (error?.code === 'auth/too-many-requests') {
        setErrorMessage('Too many login attempts. Please try again later.');
      } else {
        setErrorMessage(error?.message || 'Unable to log in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    setResetMessage('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address first.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    try {
      setIsResettingPassword(true);
      if (auth) {
        await sendPasswordResetEmail(auth, trimmedEmail);
      }
      setResetMessage('Password reset link sent! Please check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      if (error?.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email.');
      } else if (error?.code === 'auth/invalid-email') {
        setErrorMessage('Please provide a valid email address.');
      } else if (error?.code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please try again later.');
      } else {
        setResetMessage('If an account exists for this email, a reset link has been sent.');
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setResetMessage('');

    try {
      setIsGoogleSubmitting(true);
      if (onGoogleLogin) {
        await onGoogleLogin();
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in was cancelled.');
      } else if (error?.code === 'auth/popup-blocked') {
        setErrorMessage('Google sign-in popup was blocked. Please allow popups and try again.');
      } else if (error?.code === 'auth/account-exists-with-different-credential') {
        setErrorMessage('An account already exists with this email using a different sign-in method.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized for Google sign-in in Firebase.');
      } else {
        setErrorMessage(error?.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150">

      {/* ─────────────────────────────────────────────────────────────
          LEFT SIDE: POLISHED PRODUCT OVERVIEW
          Supports both Light Mode (clean soft slate/indigo) & Dark Mode (deep navy/slate)
      ─────────────────────────────────────────────────────────────── */}
      <div className="lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-slate-100/90 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/70 border-r border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-8 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden transition-colors duration-150">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Relay
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Unified Suite for Effective Comms
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Core Product Proposition */}
        <div className="relative z-10 my-8 lg:my-auto max-w-xl">
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            One workspace for email, chat, contacts, files, and meet.
          </h1>
          <p className="mt-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Relay replaces scattered tabs with a single high-performance canvas, bringing your conversations, messages, team directory, shared assets, and video calls into clear alignment.
          </p>

          {/* 5 Feature Overview Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Email */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Mail className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Email Threads
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Multi-folder inbox, starred threads, draft persistence, and keyboard shortcuts.
              </p>
            </div>

            {/* 2. Chat */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Real-time Chat
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Dedicated team channels, direct 1:1 messages, formatting tools, and instant delivery.
              </p>
            </div>

            {/* 3. Contacts */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-sky-300 dark:hover:border-sky-500/50 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Team Directory
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Department filters, searchable colleague profiles, and live status presence.
              </p>
            </div>

            {/* 4. Files */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Shared Files
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Drag-and-drop storage, context-linked assets, and instant preview drawers.
              </p>
            </div>

            {/* 5. Meet */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-sm transition-all sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Video className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Relay Meet
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ml-auto">
                  Audio & Video
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Interactive video rooms, screen-sharing, meeting codes, and instant team huddles.
              </p>
            </div>
          </div>
        </div>

        {/* Security / Quality Statement at Bottom of Left Panel */}
        <div className="relative z-10 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Enterprise Security & Real-Time Sync
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            Relay Platform
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT SIDE: PROFESSIONAL LOGIN FORM & GOOGLE AUTH
      ─────────────────────────────────────────────────────────────── */}
      <div className="lg:w-1/2 xl:w-7/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">

        {/* Top Header Row with Theme Switcher */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <div className="flex lg:hidden items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Relay</span>
          </div>
          <div className="hidden lg:block">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Secure Workspace Access
            </span>
          </div>

          {/* Accessible Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto">
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Log in to Relay
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Welcome back! Enter your details or continue with Google to access your workspace.
            </p>
          </div>

          {/* Success / Password Reset Message Alert */}
          {resetMessage && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-150"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{resetMessage}</span>
            </div>
          )}

          {/* Validation Error Message Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Address */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting || isGoogleSubmitting || isResettingPassword}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 focus-visible:outline-none focus-visible:underline disabled:opacity-50 transition-colors"
                >
                  {isResettingPassword ? 'Sending link...' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-2xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Email/Password Login Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Log In to Relay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="bg-slate-50 dark:bg-slate-950 px-3 text-slate-400 dark:text-slate-500">
                OR
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
              />
              <path
                fill="#34A853"
                d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.5Z"
              />
              <path
                fill="#FBBC05"
                d="M6.54 13.58A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.09.31-1.58V7.89H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.04 4.11l3.25-2.53Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.39c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.71 5.39l3.25 2.53C7.31 8.11 9.46 6.39 12 6.39Z"
              />
            </svg>

            <span>
              {isGoogleSubmitting
                ? 'Signing in with Google...'
                : 'Continue with Google'}
            </span>
          </button>

          {/* Link to Sign-Up Page */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              Sign up
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
            Relay Unified Communication Platform • Encrypted & Secure
          </div>
        </div>
      </div>
    </div>
  );
};

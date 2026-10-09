import React, { useState } from 'react';
import {
  Radio,
  Mail,
  Lock,
  User,
  Building,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const SignUpPage = ({ onNavigate, onSignup }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please provide a valid email address (e.g. name@relay.dev).');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSignup({
        name: trimmedName,
        email: trimmedEmail,
        password,
        department
      });
    } catch (error) {
      setErrorMessage(error.message || 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150">

      {/* Top Navigation Row: Back to Login link & Theme Switcher */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>

        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md mb-3">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create your Relay account
        </h1>

        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Set up your workspace profile to start collaborating.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">

          {/* Validation Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. jordan.hayes@relay.dev"
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="signup-dept"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Department
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  id="signup-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all cursor-pointer"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Advisory">Advisory</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Minimum 6 characters
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link to Login */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              Sign in
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

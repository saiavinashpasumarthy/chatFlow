import React, { useState } from 'react';
import {
  Radio,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

import { ThemeToggle } from '../components/common/ThemeToggle';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export const LoginPage = ({ onNavigate, onLogin, onGoogleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

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
        password,
      });
    } catch (error) {
      console.error('Login error:', error);

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-login-credentials'
      ) {
        setErrorMessage('Invalid email or password.');
      } else if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many login attempts. Please try again later.');
      } else {
        setErrorMessage('Unable to log in. Please try again.');
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

    await sendPasswordResetEmail(auth, trimmedEmail);

    setResetMessage(
      'Password reset link sent! Please check your email.'
    );
  } catch (error) {
    console.error('Password reset error:', error);

    if (error.code === 'auth/user-not-found') {
      setErrorMessage('No account found with this email.');
    } else if (error.code === 'auth/invalid-email') {
      setErrorMessage('Please provide a valid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      setErrorMessage(
        'Too many requests. Please try again later.'
      );
    } else {
      setErrorMessage(
        'Unable to send password reset email. Please try again.'
      );
    }
  } finally {
    setIsResettingPassword(false);
  }
};
  const handleGoogleLogin = async () => {
    setErrorMessage('');

    try {
      setIsGoogleSubmitting(true);

      await onGoogleLogin();
    } catch (error) {
      console.error('Google login error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in was cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('Google sign-in popup was blocked. Please allow popups and try again.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setErrorMessage(
          'An account already exists with this email using a different sign-in method.'
        );
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'This domain is not authorized for Google sign-in in Firebase.'
        );
      } else {
        setErrorMessage('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150">

      {/* Return to Landing link & Theme Switcher */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </button>

        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md mb-3">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Log in to Relay
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Sign in to access your email and chat workspace.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>

                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email address"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:border-transparent transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-2">
  <button
    type="button"
    onClick={handleForgotPassword}
    disabled={
      isSubmitting ||
      isGoogleSubmitting ||
      isResettingPassword
    }
    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:underline disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isResettingPassword
      ? 'Sending reset link...'
      : 'Forgot password?'}
  </button>
</div>
            </div>

            {/* Email/Password Login */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isSubmitting || isGoogleSubmitting
                  ? 'opacity-75 cursor-not-allowed'
                  : ''
              }`}
            >
              <span>
                {isSubmitting ? 'Signing In...' : 'Log In to Relay'}
              </span>

              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>

            <div className="relative flex justify-center text-[10px]">
              <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                OR
              </span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isGoogleSubmitting}
            className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isSubmitting || isGoogleSubmitting
                ? 'opacity-75 cursor-not-allowed'
                : ''
            }`}
          >
            <svg
              className="w-4 h-4"
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

          {/* Sign Up Link */}
          <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}

            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Sign up
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

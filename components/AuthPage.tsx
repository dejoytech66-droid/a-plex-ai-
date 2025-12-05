import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Bot, Mail, Lock, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEmailInUseError, setIsEmailInUseError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailInUseError(false);
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setError('Email not verified. Please check your inbox and verify your email.');
        }
      } else {
        // Registration Flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        // Important: Sign them out immediately so they don't get into the app automatically
        await signOut(auth);
        setVerificationSent(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      
      let msg = 'An authentication error occurred.';
      const errorCode = err.code;
      // Normalize error message to lower case for easier matching
      const errorMessage = (err.message || '').toLowerCase();

      if (
        errorCode === 'auth/email-already-in-use' || 
        errorMessage.includes('email-already-in-use')
      ) {
        msg = 'This email is already registered.';
        setIsEmailInUseError(true);
      } else if (
        errorCode === 'auth/invalid-credential' || 
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/invalid-email' ||
        errorMessage.includes('invalid-credential') ||
        errorMessage.includes('wrong-password') ||
        errorMessage.includes('user-not-found')
      ) {
        // Consolidated error message for security and user experience
        msg = 'Password or email incorrect';
      } else if (errorCode === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (errorCode === 'auth/operation-not-allowed') {
        msg = 'Email/Password login is not enabled in Firebase Console. Please enable it in the Authentication section.';
      } else if (errorCode === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again later.';
      } else {
        // Fallback: use the raw message but try to keep it clean
        msg = err.message || msg;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verification Screen
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verify your email</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            We have sent you a verification email to <span className="font-semibold text-gray-900 dark:text-white">{email}</span>. Please verify it and log in.
          </p>
          <button
            onClick={() => {
              setVerificationSent(false);
              setIsLogin(true);
              setError(null);
            }}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3">
            <Bot className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to A-Plex AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isLogin ? 'Sign in to continue your conversation' : 'Create an account to get started'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="flex flex-col gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 animate-pulse-fast">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {isEmailInUseError && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError(null);
                      setIsEmailInUseError(false);
                    }}
                    className="flex items-center gap-1 mt-1 text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300 hover:underline"
                  >
                    Log in now <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setIsEmailInUseError(false);
                }}
                className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 focus:outline-none transition-colors"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
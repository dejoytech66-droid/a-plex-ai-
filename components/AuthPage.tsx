import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from '../services/firebase';
import { auth } from '../services/firebase';
import { Bot, Mail, Lock, Loader2, AlertCircle, CheckCircle, ArrowRight, X, Shield, FileText } from 'lucide-react';

const POLICY_TEXT = `
A-PLEX POLICY RULES
===========================

1. Safety & Legal
• Do NOT generate illegal, harmful, violent, or hateful content.
• Do NOT allow abuse, bullying, harassment, or threats.
• Do NOT allow explicit, sexual, or NSFW content.
• Do NOT help with hacking, scamming, or cheating.
• Warn the user politely if they try to break rules.

2. User Content Rules
• Users must follow A-Plex community guidelines.
• No copyrighted content unless user owns it.
• No sharing personal data of other people.
• If content is harmful, tell the user it violates A-Plex rules.

3. Privacy & Protection
• NEVER store personal data without permission.
• NEVER ask for extra sensitive information.
• Do NOT reveal private data or identities.
• Respect user privacy according to the A-Plex Privacy Policy.

4. Age Restriction
• A-Plex requires users to be 13+.
• If someone says they are under 13, tell them they cannot use the app.

5. AI Behavior Restrictions
• AI must NOT pretend to be human.
• AI must NOT give medical, legal, or financial advice.
• AI may give general guidance but always include a safety disclaimer.

6. Data Usage
• AI may use user input only to answer the question.
• AI cannot store, track, or remember personal information permanently.
• AI must follow all A-Plex privacy and data protection rules.

7. Tone & Communication
• Always be polite, friendly, and respectful.
• Encourage safe and positive interactions.
• If a user is upset, respond calmly and supportively.

===========================
      A-PLEX AUTO-RESPONSE
===========================
If the user tries to break a rule:
→ Politely warn them
→ Offer a safe alternative
→ Follow A-Plex Terms & Privacy policies
`;

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEmailInUseError, setIsEmailInUseError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

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
          return;
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
      let msg = 'An authentication error occurred.';
      const errorCode = err.code;
      const errorMessage = (err.message || '').toLowerCase();

      // Filter known operational errors from console to prevent confusion
      const isKnownError = 
        errorCode === 'auth/invalid-credential' || 
        errorCode === 'auth/invalid-login-credentials' ||
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/email-already-in-use' ||
        errorCode === 'auth/weak-password' ||
        errorCode === 'auth/operation-not-allowed';

      // Only log unexpected system errors
      if (!isKnownError) {
          console.error("Auth error:", err);
      }
      
      if (
        errorCode === 'auth/email-already-in-use' || 
        errorMessage.includes('email-already-in-use')
      ) {
        msg = 'This email is already registered.';
        setIsEmailInUseError(true);
      } else if (
        errorCode === 'auth/invalid-credential' || 
        errorCode === 'auth/invalid-login-credentials' || 
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200 relative">
      
      {/* Policy Modal */}
      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                 <Shield className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">A-Plex Policy Rules</h2>
              </div>
              <button 
                onClick={() => setShowPolicy(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        {POLICY_TEXT}
                    </pre>
                </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end">
                <button
                    onClick={() => setShowPolicy(false)}
                    className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
                >
                    I Understand
                </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Policy Link */}
          <div className="mt-4 text-center">
             <button 
                type="button"
                onClick={() => setShowPolicy(true)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-center gap-1 mx-auto"
             >
                <FileText className="w-3 h-3" />
                By continuing, you agree to A-Plex Policy Rules
             </button>
          </div>

          <div className="mt-6 text-center pt-6 border-t border-gray-100 dark:border-gray-700">
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
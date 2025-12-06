// Replaced actual Firebase SDK with a local mock to resolve import errors
// and allow the application to run without external configuration.

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface UserCredential {
  user: User;
  operationType?: string;
  providerId?: string;
}

class MockAuthService {
  currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    const stored = localStorage.getItem('aplex_mock_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }
}

export const auth = new MockAuthService();

export const onAuthStateChanged = (authInstance: any, callback: (user: User | null) => void) => {
  return authInstance.onAuthStateChanged(callback);
};

export const signOut = async (authInstance: any) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  authInstance.currentUser = null;
  localStorage.removeItem('aplex_mock_user');
  authInstance.notify();
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, password: string): Promise<UserCredential> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation
  if (!email.includes('@')) throw { code: 'auth/invalid-email', message: 'Invalid email' };
  if (password.length < 6) throw { code: 'auth/wrong-password', message: 'Password must be 6+ chars' };

  const user: User = {
    uid: 'mock-user-' + Date.now(),
    email,
    displayName: email.split('@')[0],
    emailVerified: true // Auto-verify for demo convenience
  };
  
  authInstance.currentUser = user;
  localStorage.setItem('aplex_mock_user', JSON.stringify(user));
  authInstance.notify();
  
  return { user };
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, password: string): Promise<UserCredential> => {
  // Same implementation as sign in for mock
  return signInWithEmailAndPassword(authInstance, email, password);
};

export const sendEmailVerification = async (user: User) => {
  console.log(`[Mock] Verification email sent to ${user.email}`);
};

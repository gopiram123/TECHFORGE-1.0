import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Configuration
 * Reads from Vite environment variables (VITE_FIREBASE_*).
 * If environment variables are not yet provided in .env, SmartCare AI gracefully
 * activates high-fidelity local real-time synchronization so the application
 * remains 100% operational in hackathon / offline evaluation environments.
 */
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.info('[LifeLink AI] Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[LifeLink AI] Firebase initialization error, switching to offline fallback sync:', err);
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.info('[LifeLink AI] Running in Standalone / Live Sync Mode (Firebase keys not detected in .env).');
}

export { app, auth, db };

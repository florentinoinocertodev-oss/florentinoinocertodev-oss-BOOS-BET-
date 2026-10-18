import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

// Public Web App configuration for BOOS BET (Project ID: boos-bet-91fa1)
// Non-sensitive public client keys as per official Firebase security architecture.
// All secrets (private keys, service accounts, PSP webhooks) remain strictly server-side.
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase singleton
export const firebaseApp: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firestoreDb: Firestore = getFirestore(
  firebaseApp,
  firebaseConfigData.firestoreDatabaseId || '(default)'
);
export const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);
export const recaptchaSiteKey: string = firebaseConfigData.recaptchaSiteKey || '';

export default firebaseApp;

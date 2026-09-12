import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

export function handleFirebaseError(error: any, operation: string) {
  console.error(`Firebase Error [${operation}]:`, error);
  if (error.code === 'permission-denied') {
    return 'Insufficient permissions. Please ensure you are logged in as an authorized admin.';
  }
  if (error.code === 'unavailable') {
    return 'Database is currently unavailable. Please check your internet connection.';
  }
  if (error.code === 'storage/retry-limit-exceeded') {
    return 'Upload timed out. Please check your connection and ensure Storage is enabled in the Firebase Console.';
  }
  return error.message || `An error occurred during ${operation}.`;
}

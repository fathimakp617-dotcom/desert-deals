// Lazy-loaded Firebase wrapper – Firebase SDK is only fetched when phone auth is actually needed.

let firebasePromise: Promise<typeof import("firebase/app")> | null = null;
let authPromise: Promise<typeof import("firebase/auth")> | null = null;

const getFirebaseApp = async () => {
  if (!firebasePromise) {
    firebasePromise = import("firebase/app");
  }
  return firebasePromise;
};

const getFirebaseAuth = async () => {
  if (!authPromise) {
    authPromise = import("firebase/auth");
  }
  return authPromise;
};

// Firebase configuration - these are public keys safe to store in code
const firebaseConfig = {
  apiKey: "AIzaSyBhknyGiZjrVFLL8Dq8b5k9upIeV4QvUYs",
  authDomain: "raynadamperfumes.firebaseapp.com",
  projectId: "raynadamperfumes",
  storageBucket: "raynadamperfumes.firebasestorage.app",
  messagingSenderId: "995326292656",
  appId: "1:995326292656:web:d755979159331b3918c175",
  measurementId: "G-JW7BMQ4TZ6"
};

let appInstance: any = null;
let authInstance: any = null;

const ensureInitialized = async () => {
  if (!appInstance) {
    const { initializeApp } = await getFirebaseApp();
    appInstance = initializeApp(firebaseConfig);
  }
  if (!authInstance) {
    const { getAuth } = await getFirebaseAuth();
    authInstance = getAuth(appInstance);
  }
  return { app: appInstance, auth: authInstance };
};

/**
 * Get the Firebase Auth instance (lazy-initialized)
 */
export const getFirebaseAuthInstance = async () => {
  const { auth } = await ensureInitialized();
  return auth;
};

/**
 * Initialize invisible reCAPTCHA verifier
 */
export const initRecaptcha = async (buttonId: string) => {
  const { RecaptchaVerifier } = await getFirebaseAuth();
  const auth = await getFirebaseAuthInstance();
  const verifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {},
  });
  return verifier;
};

// Store confirmation result for OTP verification
let confirmationResult: any = null;

/**
 * Send OTP to phone number using Firebase Phone Auth
 */
export const sendPhoneOtp = async (
  phoneNumber: string,
  recaptchaVerifier: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { signInWithPhoneNumber } = await getFirebaseAuth();
    const auth = await getFirebaseAuthInstance();
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return { success: true };
  } catch (error: any) {
    console.error("Firebase Phone Auth Error:", error);
    if (error.code === 'auth/invalid-phone-number') {
      return { success: false, error: 'Invalid phone number format' };
    }
    if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }
    if (error.code === 'auth/quota-exceeded') {
      return { success: false, error: 'SMS quota exceeded. Please try again later.' };
    }
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
};

/**
 * Verify the OTP code entered by user
 */
export const verifyPhoneOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
  if (!confirmationResult) {
    return { success: false, error: 'No OTP was sent. Please request a new code.' };
  }
  try {
    await confirmationResult.confirm(otp);
    confirmationResult = null;
    return { success: true };
  } catch (error: any) {
    console.error("Firebase OTP Verification Error:", error);
    if (error.code === 'auth/invalid-verification-code') {
      return { success: false, error: 'Invalid verification code' };
    }
    if (error.code === 'auth/code-expired') {
      return { success: false, error: 'Code has expired. Please request a new one.' };
    }
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

/**
 * Sign out from Firebase
 */
export const signOutFirebase = async (): Promise<void> => {
  try {
    const auth = await getFirebaseAuthInstance();
    await auth.signOut();
  } catch (error) {
    console.error("Firebase signout error:", error);
  }
};

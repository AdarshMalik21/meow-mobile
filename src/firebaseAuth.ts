import {
  getAuth,
  signInWithPhoneNumber,
  signOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';

let pendingConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

function authInstance() {
  return getAuth();
}

export function formatIndianPhone(digits10: string): string {
  return `+91${digits10.replace(/\D/g, '').slice(-10)}`;
}

export function mapFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : String(err ?? '');

  console.warn('[Firebase Auth]', code || 'no-code', message);

  switch (code) {
    case 'auth/invalid-verification-code':
      return 'Wrong code. Try again.';
    case 'auth/code-expired':
      return 'Code expired. Send OTP again.';
    case 'auth/too-many-requests':
      return 'Too many tries. Wait a minute and try again.';
    case 'auth/invalid-phone-number':
      return 'This phone number looks wrong.';
    case 'auth/quota-exceeded':
      return 'SMS limit reached. Try again later.';
    case 'auth/network-request-failed':
      return "Couldn't connect. Check your internet.";
    case 'auth/billing-not':
      return 'Firebase SMS needs billing enabled, or use a Firebase test phone number (+919090909090 / OTP 123456).';
    case 'auth/missing-client-identifier':
      return 'App setup incomplete. Add SHA keys in Firebase and rebuild.';
    case 'auth/app-not-authorized':
      return 'App not authorized. Add SHA-1 in Firebase Project Settings.';
    case 'auth/captcha-check-failed':
      return 'Phone check failed. Use your Firebase test number.';
    case 'auth/internal-error':
      return 'Firebase error. Check Phone Auth is ON and use a test number.';
    case 'auth/operation-not-allowed':
      return 'Phone login is off in Firebase. Turn on Phone sign-in.';
    case 'auth/session-expired':
      return 'Session expired. Send OTP again.';
    default:
      if (code) {
        return `Could not send OTP (${code}). Check Firebase test number + SHA keys.`;
      }
      return 'Could not verify phone. Try again.';
  }
}

export async function sendOtp(phone10: string) {
  const phone = formatIndianPhone(phone10);
  const confirmation = await signInWithPhoneNumber(authInstance(), phone);
  pendingConfirmation = confirmation;
  return confirmation;
}

export function getPendingConfirmation() {
  return pendingConfirmation;
}

export function clearPendingConfirmation() {
  pendingConfirmation = null;
}

export async function confirmOtp(code: string): Promise<string> {
  const confirmation = pendingConfirmation;
  if (!confirmation) {
    throw new Error('NO_CONFIRMATION');
  }

  const credential = await confirmation.confirm(code.trim());
  if (!credential?.user) {
    throw new Error('CONFIRM_FAILED');
  }

  const idToken = await credential.user.getIdToken();
  clearPendingConfirmation();
  return idToken;
}

export async function signOutFirebase() {
  clearPendingConfirmation();
  try {
    await signOut(authInstance());
  } catch {
    // ignore
  }
}

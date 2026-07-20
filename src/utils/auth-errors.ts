/**
 * Spendly Authentication Error Mapper
 * Translates raw Firebase Auth error codes/messages into user-friendly notifications.
 */
export function mapAuthError(error: any): string {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  // Handle case where error is passed as an object containing a code, message, or is a raw string
  const errorCode = typeof error === 'string' 
    ? error 
    : (error.code || error.message || '');

  const normalized = errorCode.toLowerCase();

  if (normalized.includes('invalid-credential') || normalized.includes('invalid-email')) {
    return 'Incorrect email or password.';
  }
  if (normalized.includes('user-not-found')) {
    return 'No account found with this email. Please sign up first.';
  }
  if (normalized.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (normalized.includes('wrong-password')) {
    return 'The password you entered is incorrect.';
  }
  if (normalized.includes('too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (normalized.includes('network-request-failed')) {
    return 'Network connection issue. Please check your network and try again.';
  }
  if (normalized.includes('user-disabled')) {
    return 'This account has been disabled. Please contact support.';
  }
  if (normalized.includes('weak-password')) {
    return 'Password must be at least 8 characters long.';
  }

  return 'Something went wrong. Please try again.';
}

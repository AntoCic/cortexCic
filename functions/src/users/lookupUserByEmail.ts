import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const lookupUserByEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in');
  }

  const { email } = request.data as { email?: string };
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'email is required');
  }

  try {
    const record = await admin.auth().getUserByEmail(email);
    return { uid: record.uid, email: record.email, displayName: record.displayName ?? null };
  } catch {
    throw new HttpsError('not-found', 'No user found with that email');
  }
});

import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { mapAuthError } from '@/utils/auth-errors';

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
}

// React Hook to subscribe to authentication state, matching the Better Auth react signature.
function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let name = fbUser.displayName || '';
        let image = fbUser.photoURL || null;

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.name) name = data.name;
            if (data.image) image = data.image;
          } else {
            // Seed User Document if missing
            await setDoc(
              userDocRef,
              {
                userId: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Spendly User',
                email: fbUser.email || '',
                image: fbUser.photoURL || null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              { merge: true }
            );
          }
        } catch (error) {
          console.error('Error fetching/creating Firestore user details:', error);
        }

        setSession({
          user: {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: name || fbUser.email?.split('@')[0] || 'Spendly User',
            image: image,
          },
        });
      } else {
        setSession(null);
      }
      setIsPending(false);
    });

    return () => unsubscribe();
  }, []);

  return { data: session, isPending };
}

export const authClient = {
  useSession,
  
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return { data: { user: credential.user }, error: null };
      } catch (error: any) {
        return { data: null, error: { message: mapAuthError(error) } };
      }
    },
    google: async () => {
      try {
        const credential = await signInWithPopup(auth, googleProvider);
        const fbUser = credential.user;

        // Ensure user is seeded in Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(
          userDocRef,
          {
            userId: fbUser.uid,
            name: fbUser.displayName || 'Spendly User',
            email: fbUser.email || '',
            image: fbUser.photoURL || null,
            updatedAt: new Date(),
          },
          { merge: true }
        );

        return { data: { user: fbUser }, error: null };
      } catch (error: any) {
        return { data: null, error: { message: mapAuthError(error) } };
      }
    },
  },

  signUp: {
    email: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = credential.user;

        // Update display name inside firebase auth profile
        await updateProfile(fbUser, { displayName: name });

        // Seed user profile inside Cloud Firestore users collection
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(userDocRef, {
          userId: fbUser.uid,
          name,
          email,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { data: { user: fbUser }, error: null };
      } catch (error: any) {
        return { data: null, error: { message: mapAuthError(error) } };
      }
    },
  },

  signOut: async () => {
    try {
      await fbSignOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign out failed.' } };
    }
  },

  changePassword: async ({
    currentPassword,
    newPassword,
  }: {
    currentPassword?: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User session not found.');
      }

      // Re-authenticate user before executing password updates
      if (currentPassword && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
      }

      await updatePassword(currentUser, newPassword);
      return { error: null };
    } catch (error: any) {
      return { error: { message: mapAuthError(error) } };
    }
  },

  reauthenticate: async (password: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User session not found.');
      }
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      return { error: null };
    } catch (error: any) {
      return { error: { message: mapAuthError(error) } };
    }
  },
};

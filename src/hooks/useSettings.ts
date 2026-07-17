import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, db } from '@/firebase/config';
import { updateProfile } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { useToastStore } from '@/stores/toast.store';

export function useSettings() {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['settings', userId],
    queryFn: async () => {
      if (!userId) return null;

      const docRef = doc(db, 'settings', userId);
      const snap = await getDoc(docRef);

      let theme = 'light';
      let currency = 'INR';
      let userName = auth.currentUser?.displayName || 'Spendly User';
      let userAvatar = auth.currentUser?.photoURL || null;

      if (snap.exists()) {
        const data = snap.data();
        if (data.theme) theme = data.theme;
        if (data.currency) currency = data.currency;
        if (data.preferences_user_name) userName = data.preferences_user_name;
        if (data.preferences_user_avatar) userAvatar = data.preferences_user_avatar;
      }

      return {
        theme,
        currency,
        userName,
        userAvatar,
        email: auth.currentUser?.email || '',
      };
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (name: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Unauthorized');

      // Update Firebase Auth details
      await updateProfile(currentUser, { displayName: name });

      // Save to Settings collection
      const docRef = doc(db, 'settings', currentUser.uid);
      await setDoc(
        docRef,
        {
          preferences_user_name: name,
          updatedAt: Timestamp.fromDate(new Date()),
        },
        { merge: true }
      );

      return { success: true };
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
      addToast('Profile updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update profile info', 'danger');
    },
  });
}

export function useSaveAppearance() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: { theme: 'light' | 'dark' | 'system'; currency: string }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      const docRef = doc(db, 'settings', userId);
      await setDoc(
        docRef,
        {
          theme: data.theme,
          currency: data.currency,
          updatedAt: Timestamp.fromDate(new Date()),
        },
        { merge: true }
      );
      return { success: true };
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
      addToast('Preferences saved successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update preferences', 'danger');
    },
  });
}

export function useTruncateExpenses() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      // Query and delete all user expenses
      const q = query(collection(db, 'expenses'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      return { success: true };
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', userId] });
      addToast('All expenses deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete expenses', 'danger');
    },
  });
}

export function useTruncateBudgets() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      // Query and delete all user budgets
      const q = query(collection(db, 'budgets'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      return { success: true };
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['budget', userId] });
      queryClient.invalidateQueries({ queryKey: ['budgetHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      addToast('All budgets deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete budgets', 'danger');
    },
  });
}

export function useTruncateCategories() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      // Batch delete custom categories (isSystem === false) and ALL expenses
      const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('userId', '==', userId),
        where('isSystem', '==', false)
      );

      const [expensesSnap, categoriesSnap] = await Promise.all([
        getDocs(expensesQuery),
        getDocs(categoriesQuery),
      ]);

      const batch = writeBatch(db);
      expensesSnap.forEach((d) => batch.delete(d.ref));
      categoriesSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      return { success: true };
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      addToast('Custom categories deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete custom categories', 'danger');
    },
  });
}

export function useResetDatabase() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      // Batch delete all user data
      const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
      const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', userId));
      const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', userId));

      const [expensesSnap, budgetsSnap, categoriesSnap] = await Promise.all([
        getDocs(expensesQuery),
        getDocs(budgetsQuery),
        getDocs(categoriesQuery),
      ]);

      const batch = writeBatch(db);
      expensesSnap.forEach((d) => batch.delete(d.ref));
      budgetsSnap.forEach((d) => batch.delete(d.ref));
      categoriesSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      return { success: true };
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['budget', userId] });
      queryClient.invalidateQueries({ queryKey: ['budgetHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', userId] });
      addToast('Database reset successfully. System defaults restored.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to reset database', 'danger');
    },
  });
}

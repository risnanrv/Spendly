'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { mapDocToExpense } from '@/database/repositories/ExpenseRepository';
import { mapDocToCategory } from '@/database/repositories/CategoryRepository';

export function FirebaseSyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsubExpenses: () => void = () => {};
    let unsubCategories: () => void = () => {};
    let unsubBudgets: () => void = () => {};
    let unsubSettings: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clear out previous subscriptions
      unsubExpenses();
      unsubCategories();
      unsubBudgets();
      unsubSettings();

      if (user) {
        const uid = user.uid;

        // 1. Listen to Categories changes
        const qCats = query(collection(db, 'categories'), where('userId', '==', uid));
        unsubCategories = onSnapshot(qCats, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((docSnap) => {
            const cat = mapDocToCategory(docSnap);
            if (!cat.deletedAt) {
              list.push(cat);
            }
          });
          queryClient.setQueryData(['categories', uid], list);
        });

        // 2. Listen to Expenses changes
        const qExpenses = query(collection(db, 'expenses'), where('userId', '==', uid));
        unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((docSnap) => {
            const exp = mapDocToExpense(docSnap);
            if (!exp.deletedAt) {
              list.push(exp);
            }
          });
          
          queryClient.setQueryData(['expenses', uid], list);
          // Invalidate filtered queries so they compute filters fresh
          queryClient.invalidateQueries({ queryKey: ['expenses', uid] });
          queryClient.invalidateQueries({ queryKey: ['dashboard', uid] });
          queryClient.invalidateQueries({ queryKey: ['reports', uid] });
        });

        // 3. Listen to Budgets changes
        const qBudgets = query(collection(db, 'budgets'), where('userId', '==', uid));
        unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
          queryClient.invalidateQueries({ queryKey: ['budget', uid] });
          queryClient.invalidateQueries({ queryKey: ['budgetHistory', uid] });
          queryClient.invalidateQueries({ queryKey: ['dashboard', uid] });
        });

        // 4. Listen to Settings doc
        const settingsDocRef = doc(db, 'settings', uid);
        unsubSettings = onSnapshot(settingsDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            queryClient.setQueryData(['settings', uid], {
              theme: data.theme || 'light',
              currency: data.currency || 'INR',
              userName: data.preferences_user_name || user.displayName || 'Spendly User',
              userAvatar: data.preferences_user_avatar || user.photoURL || null,
              email: user.email || '',
            });
          }
        });
      } else {
        // Clear query cache on sign out
        queryClient.clear();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubExpenses();
      unsubCategories();
      unsubBudgets();
      unsubSettings();
    };
  }, [queryClient]);

  return <>{children}</>;
}

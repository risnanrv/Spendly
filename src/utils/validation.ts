import { z } from 'zod';

// ─── Common Zod Schemas ───────────────────────────────────────────────────
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .trim();

export const amountSchema = z
  .number()
  .positive('Amount must be greater than zero')
  .max(9_999_999, 'Amount is too large');

export const noteSchema = z
  .string()
  .max(250, 'Note is too long')
  .optional();

export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

// ─── Form-Specific Schemas ────────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const expenseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(80, 'Title cannot exceed 80 characters')
    .trim(),
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive('Amount must be greater than zero').max(9999999, 'Amount is too large')
  ),
  categoryId: z.string().uuid('Please select a valid category'),
  dateStr: z.string().min(1, 'Date is required'),
  note: z
    .string()
    .max(500, 'Note description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(30, 'Name cannot exceed 30 characters')
    .trim(),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
});

export const budgetSchema = z.object({
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive('Amount must be greater than zero')
  ),
});

export const profileSchema = z.object({
  name: nameSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// ─── Inferred Types ───────────────────────────────────────────────────────
export type EmailInput = z.infer<typeof emailSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type NameInput = z.infer<typeof nameSchema>;
export type AmountInput = z.infer<typeof amountSchema>;
export type NoteInput = z.infer<typeof noteSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Custom lightweight zod resolver for react-hook-form
 */
export const zodResolver = <T extends z.ZodTypeAny>(schema: T) => {
  return async (values: any) => {
    try {
      const parsedValues = schema.parse(values);
      return {
        values: parsedValues,
        errors: {},
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          values: {},
          errors: error.issues.reduce((acc: any, current: any) => {
            const key = current.path[0];
            acc[key] = {
              type: current.code,
              message: current.message,
            };
            return acc;
          }, {}),
        };
      }
      return {
        values: {},
        errors: {
          root: {
            message: 'Validation failed',
          },
        },
      };
    }
  };
};

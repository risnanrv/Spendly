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

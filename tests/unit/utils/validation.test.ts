import {
  emailSchema,
  passwordSchema,
  amountSchema,
  zodResolver,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  noteSchema,
  nameSchema,
} from '@/utils/validation';

describe('validation schema utilities', () => {
  describe('emailSchema', () => {
    it('accepts correctly formatted email addresses', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
      expect(emailSchema.safeParse('admin@company.org').success).toBe(true);
    });

    it('rejects malformed email addresses', () => {
      expect(emailSchema.safeParse('invalid-email').success).toBe(false);
      expect(emailSchema.safeParse('@missing-user.com').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('accepts passwords of at least 8 characters', () => {
      expect(passwordSchema.safeParse('12345678').success).toBe(true);
      expect(passwordSchema.safeParse('longPassword123!').success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      expect(passwordSchema.safeParse('short').success).toBe(false);
      expect(passwordSchema.safeParse('1234567').success).toBe(false);
    });
  });

  describe('amountSchema', () => {
    it('accepts positive numeric amounts', () => {
      expect(amountSchema.safeParse(100).success).toBe(true);
      expect(amountSchema.safeParse(0.5).success).toBe(true);
    });

    it('rejects zero and negative amounts', () => {
      expect(amountSchema.safeParse(0).success).toBe(false);
      expect(amountSchema.safeParse(-5).success).toBe(false);
    });
  });

  describe('nameSchema', () => {
    it('accepts valid non-empty names', () => {
      expect(nameSchema.safeParse('John Doe').success).toBe(true);
    });

    it('rejects empty names', () => {
      expect(nameSchema.safeParse('').success).toBe(false);
    });
  });

  describe('noteSchema', () => {
    it('accepts short optional notes', () => {
      expect(noteSchema.safeParse('A quick note').success).toBe(true);
      expect(noteSchema.safeParse(undefined).success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('validates a complete valid login payload', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'securePassword',
      });
      expect(result.success).toBe(true);
    });

    it('invalidates payload with missing email field', () => {
      const result = loginSchema.safeParse({ password: 'securePassword' });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates a complete valid registration payload', () => {
      const result = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password1234',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('resetPasswordSchema', () => {
    it('validates when passwords match', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'Password1234',
        confirmPassword: 'Password1234',
      });
      expect(result.success).toBe(true);
    });

    it('rejects when passwords do not match', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'Password1234',
        confirmPassword: 'OtherPassword',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('zodResolver', () => {
    it('resolves valid values returning parsed result and empty error object', async () => {
      const resolver = zodResolver(loginSchema);
      const res = await resolver({ email: 'test@email.com', password: 'securePassword123' });
      expect((res.values as any).email).toBe('test@email.com');
      expect(res.errors).toEqual({});
    });

    it('resolves invalid values returning empty values and mapped field errors', async () => {
      const resolver = zodResolver(loginSchema);
      const res = await resolver({ email: 'bad-email', password: '1' });
      expect(res.values).toEqual({});
      expect((res.errors as any).email).toBeDefined();
      expect((res.errors as any).password).toBeDefined();
    });
  });
});

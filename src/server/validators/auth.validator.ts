import * as v from 'valibot';

export const EmailSchema = v.pipe(
  v.string(),
  v.nonEmpty('Email is required'),
  v.maxLength(64, 'Email must be 64 characters or fewer'),
  v.email('Invalid email format')
);

export const UsernameSchema = v.pipe(
  v.string(),
  v.nonEmpty('Username is required'),
  v.minLength(3, 'Username must be 3-20 characters, alphanumeric with underscores/hyphens'),
  v.maxLength(20, 'Username must be 3-20 characters, alphanumeric with underscores/hyphens'),
  v.regex(/^[a-zA-Z0-9_-]+$/, 'Username must be 3-20 characters, alphanumeric with underscores/hyphens')
);

export const PasswordSchema = v.pipe(
  v.string(),
  v.nonEmpty('Password is required'),
  v.minLength(8, 'Password must be at least 8 characters')
);

export const RegisterSchema = v.pipe(
  v.object({
    email: EmailSchema,
    username: UsernameSchema,
    password: PasswordSchema,
    confirmPassword: v.pipe(v.string(), v.nonEmpty('Please confirm your password')),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'Passwords do not match'
    ),
    ['confirmPassword']
  )
);

export const LoginSchema = v.object({
  email: EmailSchema,
  password: v.pipe(v.string(), v.nonEmpty('Password is required')),
});

export type RegisterInput = v.InferOutput<typeof RegisterSchema>;
export type LoginInput = v.InferOutput<typeof LoginSchema>;

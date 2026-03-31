export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}

export function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(username);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateRegisterInput(data: {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!data.username) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else if (!validateUsername(data.username)) {
    errors.push({
      field: 'username',
      message: 'Username must be 3-100 characters, alphanumeric with underscores/hyphens',
    });
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (!validatePassword(data.password)) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  if (!data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
  } else if (data.password && data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLoginInput(data: {
  email?: string;
  password?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

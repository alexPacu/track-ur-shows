import { UserRepository } from '@/server/repositories/user.repo';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { validateRegisterInput, validateLoginInput } from '@/server/validators/auth.validator';

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
  };
  token: string;
}

export class UserService {
  static async register(
    email: string,
    username: string,
    password: string
  ): Promise<AuthResponse> {
    const validation = validateRegisterInput({ email, username, password, confirmPassword: password }); // validation
    if (!validation.valid) {
      throw new Error(validation.errors.map((e) => e.message).join(', '));
    }

    const existingEmail = await UserRepository.findByEmail(email);  // checking for existing email
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    const existingUsername = await UserRepository.findByUsername(username); // checking for existing username
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    const passwordHash = await hashPassword(password);  // hashing password

    const user = await UserRepository.create(email, username, passwordHash);  // creating user in database

    const token = generateToken(user.id, user.email);  // generating JWT token

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const validation = validateLoginInput({ email, password });
    if (!validation.valid) {
      throw new Error(validation.errors.map((e) => e.message).join(', '));
    }

    const user = await UserRepository.findByEmail(email);  // finding user by email
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user.id, user.email);  // JWT

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    };
  }

  static async getProfile(userId: number) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      profile_picture_url: user.profile_picture_url,
      bio: user.bio,
      created_at: user.created_at,
    };
  }
}

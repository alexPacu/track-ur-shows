import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { UserService } from '@/server/services/user.service';
import { extractUserFromRequest } from '@/server/middlewares/auth.middleware';
import { RegisterSchema, LoginSchema } from '@/server/validators/auth.validator';

export class UserController {
  static async register(req: NextRequest) {
    try {
      const parsed = v.safeParse(RegisterSchema, await req.json());
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
      }
      const { email, username, password } = parsed.output;

      const result = await UserService.register(email, username, password);

      const response = NextResponse.json(
        { success: true, user: result.user },
        { status: 201 }
      );

      response.cookies.set('auth-token', result.token, {  // http-only cookie
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,     // 7 days in seconds
        path: '/',
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';

      if (message.includes('already')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }

      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  static async login(req: NextRequest) {
    try {
      const parsed = v.safeParse(LoginSchema, await req.json());
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.issues[0].message }, { status: 400 });
      }
      const { email, password } = parsed.output;

      const result = await UserService.login(email, password);

      const response = NextResponse.json(
        { success: true, user: result.user },
        { status: 200 }
      );

      // cookie
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return NextResponse.json({ error: message }, { status: 401 });
    }
  }

  static async logout(_req: NextRequest) {
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set('auth-token', '', {    // clear cookie
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  }

  static async getProfile(req: NextRequest) {
    try {
      const user = extractUserFromRequest(req);

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const profile = await UserService.getProfile(user.userId);
      return NextResponse.json({ success: true, user: profile }, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get profile';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}

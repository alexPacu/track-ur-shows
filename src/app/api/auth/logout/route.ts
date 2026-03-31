import { NextRequest } from 'next/server';
import { UserController } from '@/server/controllers/user.controller';

export async function POST(req: NextRequest) {
  return UserController.logout(req);
}

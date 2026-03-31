import { NextRequest, NextResponse } from 'next/server';

export class MovieController {
  static async searchMovies(_req: NextRequest) {
    return NextResponse.json({ message: 'Not implemented yet' }, { status: 501 });
  }

  static async getMovieDetails(_req: NextRequest) {
    return NextResponse.json({ message: 'Not implemented yet' }, { status: 501 });
  }
}

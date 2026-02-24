import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const session = req.cookies.get('admin_session');
  const { pathname } = req.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin') && session?.value !== '1') {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/';
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login page
  if (pathname === '/' && session?.value === '1') {
    const adminUrl = req.nextUrl.clone();
    adminUrl.pathname = '/admin';
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*'],
};

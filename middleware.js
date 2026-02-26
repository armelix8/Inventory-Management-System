import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const token = await getToken({ req, secret });
  const isLoggedIn = !!token;

  if (isAuthPage && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return Response.redirect(url);
  }
  if (!isAuthPage && !isLoggedIn && pathname !== '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return Response.redirect(url);
  }
  return Response.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Handle root path '/'
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/chat', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth-pages/sign-in', request.url));
    }
  }

  // Protect chat routes
  if (pathname.startsWith('/chat') && !user) {
    return NextResponse.redirect(new URL('/auth-pages/sign-in', request.url));
  }

  // Prevent authenticated users from accessing auth pages
  if (pathname.startsWith('/auth-pages') && user) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/chat/:path*', '/auth-pages/:path*'],
};

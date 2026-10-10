'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';

// "/login/" ve "/login" ayni sayilsin (next.config trailingSlash)
function normalizePath(p: string | null): string {
  if (!p) return '/';
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = Cookies.get('admin_token');
    // trailingSlash acikken usePathname "/login/" doner; sondaki "/" normalize edilir
    const isLoginPage = normalizePath(pathname) === '/login';

    if (!token && !isLoginPage) {
      router.push('/login');
      return;
    }

    if (!token && isLoginPage) {
      queueMicrotask(() => {
        if (!cancelled) setAuthorized(true);
      });
      return;
    }

    queueMicrotask(() => {
      if (!cancelled) setAuthorized(false);
    });
    api.get('/auth/admin/me')
      .then(() => {
        if (cancelled) return;
        if (isLoginPage) {
          router.push('/dashboard');
          return;
        }
        setAuthorized(true);
      })
      .catch(() => {
        if (cancelled) return;
        Cookies.remove('admin_token');
        if (isLoginPage) {
          setAuthorized(true);
          return;
        }
        router.push('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // Show nothing while checking auth to prevent flashing
  if (!authorized) return null;

  return <>{children}</>;
}

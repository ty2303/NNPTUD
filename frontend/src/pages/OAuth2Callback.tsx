import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export const Component = OAuth2Callback;

function OAuth2Callback() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    // Fetch user profile using the new tokens
    apiClient
      .get(ENDPOINTS.USERS.ME, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        const u = res.data?.data;
        const user: AuthUser = {
          id: u._id ?? u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
          hasPassword: u.hasPassword,
        };
        login(accessToken, refreshToken, user);
        useCartStore.getState().mergeOnLogin();
        useWishlistStore.getState().fetch();
        navigate(user.role === 'ADMIN' ? '/admin' : '/', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=google_failed', { replace: true });
      });
  }, [login, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-text-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm">Đang hoàn tất đăng nhập...</p>
      </div>
    </div>
  );
}

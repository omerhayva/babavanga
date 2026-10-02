import type { Metadata } from 'next';
import { isAdminRequest } from '@/lib/auth/session';
import AdminLogin from '@/components/admin/AdminLogin';

export const metadata: Metadata = {
  title: 'Yönetim Paneli',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminRequest()) {
    return <AdminLogin />;
  }
  return <>{children}</>;
}

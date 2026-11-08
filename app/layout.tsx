import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Học Từ Vựng Tiếng Anh',
  description: 'App học từ vựng tiếng Anh — thêm, sửa, xóa và quản lý danh sách từ vựng.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

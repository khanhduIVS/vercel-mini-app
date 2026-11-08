import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ứng dụng học từ vựng',
  description: 'Học từ vựng tiếng Anh vui vẻ và hiệu quả — thêm, sửa, xóa, và ôn tập với spaced repetition.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

# 📖 Học Từ Vựng Tiếng Anh

App đơn giản học từ vựng tiếng Anh, deploy lên Vercel, có insert/update/delete vào database (Vercel Postgres).

## Tính năng

- Thêm từ vựng mới (từ tiếng Anh + nghĩa tiếng Việt + ví dụ)
- Sửa từ vựng
- Xóa từ vựng
- Giao diện tiếng Việt, responsive

## Tech Stack

- **Next.js 14** (App Router) — framework
- **@neondatabase/serverless** — database (Neon Postgres, qua Vercel Marketplace)
- **Tailwind CSS** — styling
- **TypeScript**

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000

> Cần kết nối database. Xem phần **Thiết lập database** bên dưới.

## Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **New Project** → chọn repo
3. Vercel tự nhận diện Next.js, không cần config thêm
4. **Thiết lập database** (xem bên dưới)
5. Click **Deploy**

## Thiết lập database (Neon Postgres)

### Trên Vercel (production)

1. Vào Dashboard → Project → tab **Storage**
2. Click **Create** → chọn **Neon Postgres** (từ Vercel Marketplace) → đặt tên → **Create**
3. Vercel tự động inject biến môi trường `DATABASE_URL`
4. Redeploy để áp dụng

> Bảng `vocab` tự động được tạo khi có request đầu tiên (xem `lib/db.ts`).

### Trên local

1. Tạo database Neon trên Vercel (như trên)
2. Vào tab Storage → chọn database → click **.env.local** → copy
3. Tạo file `.env.local` ở thư mục gốc, paste vào
4. Chạy `npm run dev`

## Cấu trúc thư mục

```
├── app/
│   ├── api/vocab/
│   │   ├── route.ts          # GET (list) + POST (create)
│   │   └── [id]/route.ts      # PUT (update) + DELETE
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # UI chính
├── lib/db.ts                  # khởi tạo bảng
├── package.json
└── ...
```

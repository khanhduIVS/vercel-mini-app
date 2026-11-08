# 📖 Học Từ Vựng Tiếng Anh

App đơn giản học từ vựng tiếng Anh, deploy lên Vercel, có insert/update/delete vào database (Neon Postgres).

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

---

## Yêu cầu môi trường

Trước khi bắt đầu, đảm bảo máy đã cài:

| Công cụ | Phiên bản tối thiểu | Cách kiểm tra | Tải về |
|---------|---------------------|---------------|--------|
| **Node.js** | 18.17+ | `node -v` | https://nodejs.org |
| **npm** | 9+ (cùng bản với Node) | `npm -v` | đi kèm Node.js |
| **Git** | bất kỳ | `git --version` | https://git-scm.com |
| **Tài khoản GitHub** | — | — | https://github.com |
| **Tài khoản Vercel** | — | — | https://vercel.com/signup (đăng nhập bằng GitHub cho tiện) |

> Khuyến nghị dùng Node.js 20 LTS.

---

## Bước 1: Khởi tạo project

Nếu chưa có project, có 2 cách:

### Cách A: Clone từ Git (nếu code đã push lên GitHub)

```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
npm install
```

### Cách B: Tạo mới từ template

```bash
# Tạo thư mục project
mkdir english-vocab-app
cd english-vocab-app

# Khởi tạo Git
git init

# Copy các file từ project này vào, sau đó:
npm install
```

---

## Bước 2: Chạy local (không cần database)

```bash
npm run dev
```

Mở http://localhost:3000

> Lúc này app sẽ chạy nhưng các thao tác thêm/sửa/xóa sẽ báo lỗi vì chưa kết nối database. Tiếp tục bước 3 để thiết lập database.

---

## Bước 3: Thiết lập database (Neon Postgres)

### 3.1. Tạo database trên Vercel

1. Đăng nhập [vercel.com](https://vercel.com) (dùng GitHub login cho tiện)
2. Vào **Dashboard** → chọn project (hoặc tạo project mới)
3. Chuyển sang tab **Storage**
4. Click **Create Database** → chọn **Neon Postgres** (từ Vercel Marketplace)
5. Đặt tên database → **Create**
6. Vercel tự động inject biến môi trường `DATABASE_URL` vào project

### 3.2. Lấy connection string cho local

1. Vào tab **Storage** → chọn database vừa tạo
2. Click nút **.env.local** (hoặc **Copy snippet**)
3. Tạo file `.env.local` ở thư mục gốc project:

```bash
# Windows PowerShell
New-Item -ItemType File -Path .env.local
```

4. Paste nội dung đã copy vào file `.env.local`. Kết quả tương tự:

```
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
```

5. Khởi động lại dev server:

```bash
npm run dev
```

> Lúc này các thao tác thêm/sửa/xóa sẽ hoạt động. Bảng `vocab` tự động được tạo khi có request đầu tiên (xem `lib/db.ts`).

---

## Bước 4: Deploy lên Vercel

### 4.1. Push code lên GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

> Đảm bảo file `.env.local` KHÔNG bị push (đã có trong `.gitignore`).

### 4.2. Deploy trên Vercel

1. Vào [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Chọn repo vừa push
3. Vercel tự nhận diện là project Next.js → không cần đổi gì ở phần Settings
4. Nếu đã tạo database ở Bước 3, biến `DATABASE_URL` đã được inject tự động
5. Click **Deploy** → đợi 1-2 phút

### 4.3. Kiểm tra

Sau khi deploy xong, Vercel cấp URL dạng `https://<project>.vercel.app`. Mở lên và thử:

- Thêm một từ vựng mới
- Sửa từ vựng
- Xóa từ vựng

> Nếu gặp lỗi kết nối database sau khi deploy, kiểm tra lại: Dashboard → Project → tab **Storage** → đảm bảo database đã được connect với project này.

---

## Các lệnh hữu ích

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev server (http://localhost:3000) |
| `npm run build` | Build production (kiểm tra lỗi) |
| `npm run start` | Chạy production build local |

---

## Cấu trúc thư mục

```
├── app/
│   ├── api/vocab/
│   │   ├── route.ts           # GET (list tất cả) + POST (thêm mới)
│   │   └── [id]/route.ts      # PUT (sửa) + DELETE (xóa)
│   ├── globals.css            # Tailwind CSS
│   ├── layout.tsx             # layout root
│   └── page.tsx               # UI chính
├── lib/
│   └── db.ts                  # kết nối Neon Postgres + tự tạo bảng
├── .env.local.example         # template biến môi trường
├── .gitignore
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/vocab` | Lấy danh sách tất cả từ vựng |
| `POST` | `/api/vocab` | Thêm từ vựng mới (body: `{ word, meaning, example }`) |
| `PUT` | `/api/vocab/:id` | Sửa từ vựng (body: `{ word, meaning, example }`) |
| `DELETE` | `/api/vocab/:id` | Xóa từ vựng |

---

## Xử lý lỗi thường gặp

**App báo "Không thể tải danh sách từ vựng"**
- Kiểm tra file `.env.local` có tồn tại và chứa `DATABASE_URL` đúng
- Khởi động lại `npm run dev`
- Đảm bảo database Neon đang hoạt động (vào Vercel Dashboard → Storage kiểm tra)

**Build lỗi trên Vercel**
- Kiểm tra Node.js version tương thích (18.17+)
- Chạy `npm run build` local trước để bắt lỗi

**Deploy xong nhưng không thêm/sửa/xóa được**
- Vào Vercel Dashboard → Project → tab **Settings** → **Environment Variables** → kiểm tra `DATABASE_URL` đã có
- Nếu thiếu, vào tab **Storage** → kết nối lại database với project
- Redeploy sau khi fix

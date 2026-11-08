# 📖 Ứng dụng học từ vựng

App học từ vựng tiếng Anh, deploy lên Vercel, có insert/update/delete vào database (Neon Postgres). Port từ Google Apps Script web app sang Next.js.

## Tính năng

- 👤 Chọn / tạo người học
- 📊 Dashboard: thống kê từ đã học, cần ôn, tỷ lệ đúng, tiến độ, phân bố box
- 🎯 Học từ vựng: thẻ từ với phiên âm, loại từ, hình ảnh, phát âm (TTS), đếm ngược 30s
- 📥 Import từ vựng: upload file CSV hoặc dán text
- 📚 Quản lý từ vựng: tìm kiếm, lọc theo chủ đề, phân trang, sửa, xóa
- ⚡ Tìm ảnh từ Unsplash cho từng từ
- 🔄 Spaced repetition: 3 box (24h → 72h → 168h)

## Tech Stack

- **Next.js 14** (App Router) — framework
- **@neondatabase/serverless** — database (Neon Postgres, qua Vercel Marketplace)
- **Tailwind CSS** + custom CSS — styling
- **TypeScript**

---

## Yêu cầu môi trường

Trước khi bắt đầu, đảm bảo máy đã cài:

| Công cụ | Phiên bản tối thiểu | Cách kiểm tra | Tải về |
|---------|---------------------|---------------|--------|
| **Node.js** | 18.17+ | `node -v` | https://nodejs.org |
| **npm** | 9+ | `npm -v` | đi kèm Node.js |
| **Git** | bất kỳ | `git --version` | https://git-scm.com |
| **Tài khoản GitHub** | — | — | https://github.com |
| **Tài khoản Vercel** | — | — | https://vercel.com/signup |

> Khuyến nghị dùng Node.js 20 LTS.

---

## Bước 1: Khởi tạo project

### Cách A: Clone từ Git

```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
npm install
```

### Cách B: Tạo mới

```bash
mkdir english-vocab-app
cd english-vocab-app
git init
# Copy các file vào thư mục, sau đó:
npm install
```

---

## Bước 2: Chạy local (không cần database)

```bash
npm run dev
```

Mở http://localhost:3000

> App sẽ chạy nhưng các thao tác thêm/sửa/xóa sẽ báo lỗi vì chưa kết nối database. Tiếp tục bước 3.

---

## Bước 3: Thiết lập database (Neon Postgres)

### 3.1. Tạo database trên Vercel

1. Đăng nhập [vercel.com](https://vercel.com)
2. Vào **Dashboard** → chọn project → tab **Storage**
3. Click **Create Database** → chọn **Neon Postgres** → đặt tên → **Create**
4. Vercel tự động inject biến môi trường `DATABASE_URL`

### 3.2. Lấy connection string cho local

1. Vào tab **Storage** → chọn database → click **.env.local**
2. Tạo file `.env.local` ở thư mục gốc, paste vào
3. (Tùy chọn) Thêm `UNSPLASH_ACCESS_KEY` để dùng tính năng tìm ảnh (lấy tại https://unsplash.com/developers)
4. Khởi động lại `npm run dev`

> Bảng `vocab` và `user_progress` tự động tạo khi có request đầu tiên. 20 từ vựng mẫu tự động seed.

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

### 4.2. Deploy

1. Vào [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Chọn repo → Vercel tự nhận diện Next.js
3. (Tùy chọn) Vào **Settings** → **Environment Variables** → thêm `UNSPLASH_ACCESS_KEY`
4. Click **Deploy**

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
│   ├── api/
│   │   ├── users/route.ts          # GET (list) + POST (create user)
│   │   ├── stats/route.ts          # GET user stats
│   │   ├── topics/route.ts         # GET all topics
│   │   ├── vocab/
│   │   │   ├── route.ts            # GET (list) + POST (create word)
│   │   │   ├── [id]/route.ts        # GET + PUT (update) + DELETE
│   │   │   └── import/route.ts     # POST (CSV bulk import)
│   │   ├── learn/
│   │   │   ├── route.ts            # GET word list for session
│   │   │   └── submit/route.ts     # POST answer (spaced repetition)
│   │   └── unsplash/route.ts       # GET search images
│   ├── globals.css                # Tailwind + custom CSS
│   ├── layout.tsx
│   └── page.tsx                    # SPA UI (3 views + overlays)
├── lib/
│   ├── db.ts                       # Neon connection, schema, seed
│   └── types.ts                    # shared TypeScript types
├── .env.local.example
├── package.json
└── ...
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/users` | Danh sách người dùng |
| `POST` | `/api/users` | Tạo / chọn người dùng (body: `{ name }`) |
| `GET` | `/api/stats?user=` | Thống kê học tập |
| `GET` | `/api/topics` | Tất cả chủ đề |
| `GET` | `/api/vocab?search=&topic=&page=1&pageSize=20` | Danh sách từ vựng (quản lý) |
| `POST` | `/api/vocab` | Thêm từ mới (body: `{ englishWord, ipa, wordType, vietnameseMeaning, topic, imageUrl }`) |
| `GET` | `/api/vocab/:id` | Chi tiết 1 từ |
| `PUT` | `/api/vocab/:id` | Sửa từ (body: `{ ipa, wordType, vietnameseMeaning, topic, imageUrl }`) |
| `DELETE` | `/api/vocab/:id` | Xóa từ |
| `POST` | `/api/vocab/import` | Import CSV (body: `{ csv }`) |
| `GET` | `/api/learn?user=&count=5&topic=` | Lấy danh sách từ ngẫu nhiên để học |
| `POST` | `/api/learn/submit` | Ghi nhận đáp án (body: `{ userName, wordId, isKnown }`) |
| `GET` | `/api/unsplash?word=` | Tìm ảnh từ Unsplash |

---

## Database Schema

```sql
-- Kho từ vựng
CREATE TABLE vocab (
  id              SERIAL PRIMARY KEY,
  word_id         UUID UNIQUE DEFAULT gen_random_uuid(),
  english_word    VARCHAR(255) NOT NULL,
  ipa             TEXT DEFAULT '',
  word_type       VARCHAR(20) DEFAULT '',
  vietnamese_meaning TEXT NOT NULL,
  topic           VARCHAR(100) DEFAULT '',
  image_url       TEXT DEFAULT '',
  created_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tiến trình học của từng người dùng
CREATE TABLE user_progress (
  id           SERIAL PRIMARY KEY,
  user_name    VARCHAR(50) NOT NULL,
  word_id      UUID,
  box_level    INTEGER DEFAULT 1,      -- 1=mới, 2=quen, 3=đã thuộc
  next_review  TIMESTAMP,               -- khi nào cần ôn lại
  wrong_count  INTEGER DEFAULT 0
);
```

> 20 từ vựng mẫu tự động được seed khi database trống.

---

## Xử lý lỗi thường gặp

**App báo lỗi kết nối database**
- Kiểm tra file `.env.local` có `DATABASE_URL` đúng
- Khởi động lại `npm run dev`
- Đảm bảo database Neon đang hoạt động

**Tính năng tìm ảnh không hoạt động**
- Thêm `UNSPLASH_ACCESS_KEY` vào `.env.local` (lấy tại https://unsplash.com/developers)
- Vào Vercel Dashboard → Settings → Environment Variables → thêm key

**Build lỗi trên Vercel**
- Kiểm tra Node.js version (18.17+)
- Chạy `npm run build` local trước

# Đồ Án Môn Ngôn Ngữ Phát Triển Ứng Dụng

> Ứng dụng thương mại điện tử bán điện thoại di động — Full-stack TypeScript

---

## Thông Tin Nhóm

| Họ và Tên | MSSV | Vai Trò |
|-----------|------|---------|
|           |      | Leader  |
|           |      | Backend |
|           |      | Backend |
|           |      | Frontend|

- **Lớp:**
- **Giảng viên hướng dẫn:**
- **Học kỳ:**

---

## Tech Stack

| Thành Phần | Công Nghệ |
|-----------|-----------|
| Frontend  | React 19 + TypeScript + Vite 7 + Tailwind CSS 4 |
| Backend   | Node.js + Express + TypeScript |
| Database  | MongoDB (Mongoose ODM) |
| Auth      | JWT + Google OAuth2 + Passport.js |
| Storage   | Cloudinary |
| Realtime  | Socket.IO |
| Email     | Nodemailer (Gmail SMTP) |

---

## 13 Models

| # | Model | Mô tả |
|---|-------|-------|
| 1 | **User** | Tài khoản người dùng, có role USER/ADMIN |
| 2 | **Product** | Sản phẩm điện thoại (kèm ProductVariant) |
| 3 | **Category** | Danh mục sản phẩm |
| 4 | **Order** | Đơn hàng (kèm OrderItem) |
| 5 | **Cart** | Giỏ hàng (kèm CartItem) |
| 6 | **Review** | Đánh giá sản phẩm |
| 7 | **ReviewAspectAnalysis** | Phân tích cảm xúc đánh giá |
| 8 | **Wishlist** | Danh sách yêu thích |
| 9 | **Voucher** | Mã giảm giá |
| 10 | **ChatConversation** | Hội thoại chat (kèm ChatMessage) |
| 11 | **ImportJob** | Theo dõi import sản phẩm hàng loạt |
| 12 | **Notification** | Thông báo người dùng |
| 13 | **Address** | Địa chỉ giao hàng đã lưu |

---

## Cấu Trúc Dự Án

```
NNPTUD/
├── frontend/                  # React 19 + TypeScript + Vite
│   └── src/
│       ├── api/               # Axios HTTP client services
│       ├── components/        # UI components (admin, home, layout, ui)
│       ├── hooks/             # Custom React hooks
│       ├── pages/             # Route pages
│       │   └── admin/         # Admin dashboard pages
│       ├── router/            # Route configuration & guards
│       ├── store/             # Zustand state management
│       ├── types/             # TypeScript type definitions
│       └── utils/             # Utility functions
│
└── backend/                   # Node.js + Express + TypeScript
    └── src/
        ├── config/            # DB, Cloudinary, env config
        ├── models/            # 13 Mongoose models
        ├── controllers/       # Request handlers (CRUD)
        ├── routes/            # Express routers
        ├── middlewares/       # Auth, Role, Upload middleware
        ├── services/          # JWT, Cloudinary, Email services
        └── types/             # TypeScript type definitions
```

---

## API Endpoints

### Auth
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/auth/register` | Public | Đăng ký |
| POST | `/api/auth/login` | Public | Đăng nhập |
| POST | `/api/auth/forgot-password` | Public | Quên mật khẩu |
| POST | `/api/auth/reset-password` | Public | Đặt lại mật khẩu |
| GET  | `/api/auth/google` | Public | Google OAuth2 |

### Products, Categories, Cart, Orders, Reviews, Wishlist, Vouchers, Notifications, Addresses
> Xem chi tiết trong từng file `src/routes/*.routes.ts`

---

## Phân Công Backend (theo thành viên)

| Thành Viên | Module |
|-----------|--------|
| TV 1 | `auth.controller` + `user.controller` |
| TV 2 | `product.controller` + `category.controller` + `upload.controller` |
| TV 3 | `order.controller` + `voucher.controller` |
| TV 4 | `cart.controller` + `wishlist.controller` + `review.controller` |
| TV 5 | `notification.controller` + `address.controller` + `chat` |

---

## Cài Đặt & Chạy

### Backend
```bash
cd backend
cp .env.example .env     # điền thông tin vào .env
npm install
npm run dev              # http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

---

## Biến Môi Trường Backend (.env)

```env
PORT=8080
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
CLIENT_URL=http://localhost:5173
```

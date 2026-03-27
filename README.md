# Đồ Án Môn Ngôn Ngữ Phát Triển Ứng Dụng

> Ứng dụng thương mại điện tử bán điện thoại di động — Full-stack TypeScript

![Frontend CI](https://github.com/ty2303/NNPTUD/actions/workflows/frontend-ci.yml/badge.svg)
![Backend CI](https://github.com/ty2303/NNPTUD/actions/workflows/backend-ci.yml/badge.svg)
![AI Code Review](https://github.com/ty2303/NNPTUD/actions/workflows/ai-review.yml/badge.svg)

---

## Thông Tin Nhóm

| Họ và Tên | MSSV | Vai Trò |
|-----------|------|---------|
|           |      | Leader / TV1 |
|           |      | TV2 |
|           |      | TV3 |
|           |      | TV4 |
|           |      | TV5 |

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
| CI/CD     | GitHub Actions |

---

## Phân Công Nhiệm Vụ Backend

### TV1 — Auth & User (13 functions + Services nền tảng)
> **Làm trước tiên** — middleware auth là nền tảng cho cả nhóm

| File | Functions |
|------|-----------|
| `src/controllers/auth.controller.ts` | `register`, `login`, `forgotPassword`, `resetPassword`, `googleCallback` |
| `src/controllers/user.controller.ts` | `getMe`, `updateMe`, `changePassword`, `setupPassword`, `getAllUsers`, `getUserById`, `toggleBan`, `updateRole` |
| `src/services/jwt.service.ts` | `generateToken`, `verifyToken` |
| `src/services/email.service.ts` | `sendPasswordResetEmail`, `sendOrderConfirmationEmail` |
| `src/middlewares/auth.middleware.ts` | `authenticate` |
| `src/middlewares/role.middleware.ts` | `requireRole`, `requireAdmin`, `requireUser` |
| `src/app.ts` | Google OAuth2 Passport Strategy |

**Models liên quan:** `User`

---

### TV2 — Product, Category & Upload (12 functions)

| File | Functions |
|------|-----------|
| `src/controllers/product.controller.ts` | `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct` |
| `src/controllers/category.controller.ts` | `getCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory` |
| `src/controllers/upload.controller.ts` | `uploadImage`, `uploadImages` |
| `src/services/cloudinary.service.ts` | `uploadToCloudinary`, `deleteFromCloudinary` |
| `src/middlewares/upload.middleware.ts` | `fileFilter`, multer config |

**Models liên quan:** `Product`, `Category`, `ImportJob`

---

### TV3 — Order & Voucher (10 functions)

| File | Functions |
|------|-----------|
| `src/controllers/order.controller.ts` | `createOrder`, `getMyOrders`, `getAllOrders`, `updateOrderStatus`, `cancelOrder` |
| `src/controllers/voucher.controller.ts` | `getAllVouchers`, `validateVoucher`, `createVoucher`, `updateVoucher`, `deleteVoucher` |

**Models liên quan:** `Order`, `Voucher`

---

### TV4 — Cart, Wishlist & Review (14 functions)

| File | Functions |
|------|-----------|
| `src/controllers/cart.controller.ts` | `getCart`, `addItem`, `updateItem`, `removeItem`, `syncCart`, `clearCart` |
| `src/controllers/wishlist.controller.ts` | `getWishlist`, `toggleWishlist`, `clearWishlist` |
| `src/controllers/review.controller.ts` | `getReviews`, `createReview`, `updateReview`, `deleteReview`, `uploadReviewImage` |

**Models liên quan:** `Cart`, `Wishlist`, `Review`, `ReviewAspectAnalysis`

---

### TV5 — Notification, Address & Chat (8 functions + Socket.IO)

| File | Functions |
|------|-----------|
| `src/controllers/notification.controller.ts` | `getNotifications`, `markAsRead`, `markAllAsRead`, `deleteNotification` |
| `src/controllers/address.controller.ts` | `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress` |
| `src/app.ts` | Socket.IO connection handler |

**Models liên quan:** `Notification`, `Address`, `ChatConversation`

---

## Tổng Quan Hệ Thống

### 13 Models

| # | Model | Mô tả |
|---|-------|-------|
| 1 | `User` | Tài khoản người dùng (role: USER/ADMIN) |
| 2 | `Product` | Sản phẩm điện thoại (kèm ProductVariant) |
| 3 | `Category` | Danh mục sản phẩm |
| 4 | `Order` | Đơn hàng (kèm OrderItem) |
| 5 | `Cart` | Giỏ hàng (kèm CartItem) |
| 6 | `Review` | Đánh giá sản phẩm |
| 7 | `ReviewAspectAnalysis` | Phân tích cảm xúc đánh giá |
| 8 | `Wishlist` | Danh sách yêu thích |
| 9 | `Voucher` | Mã giảm giá |
| 10 | `ChatConversation` | Hội thoại chat (kèm ChatMessage) |
| 11 | `ImportJob` | Theo dõi import sản phẩm hàng loạt |
| 12 | `Notification` | Thông báo người dùng |
| 13 | `Address` | Địa chỉ giao hàng đã lưu |

### 57 API Functions tổng

| TV | Module | Số hàm |
|----|--------|--------|
| TV1 | Auth + User + Services/Middleware | 13 + services |
| TV2 | Product + Category + Upload | 12 + services |
| TV3 | Order + Voucher | 10 |
| TV4 | Cart + Wishlist + Review | 14 |
| TV5 | Notification + Address + Chat | 8 + Socket.IO |

---

## Cấu Trúc Dự Án

```
NNPTUD/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml     # CI tự động khi push/PR lên main, dev
│       └── backend-ci.yml      # CI tự động khi push/PR lên main, dev
│
├── frontend/                   # React 19 + TypeScript + Vite (KHÔNG SỬA)
│   └── src/
│       ├── api/                # Axios client & endpoints
│       ├── components/         # UI components
│       ├── pages/              # Route pages
│       ├── store/              # Zustand state
│       └── types/              # TypeScript types
│
└── backend/                    # Node.js + Express + TypeScript
    └── src/
        ├── config/             # DB, Cloudinary, env
        ├── models/             # 13 Mongoose models (KHÔNG SỬA)
        ├── controllers/        # ← NHÓM CODE Ở ĐÂY
        ├── routes/             # Express routers (KHÔNG SỬA)
        ├── middlewares/        # Auth, Role, Upload
        ├── services/           # JWT, Cloudinary, Email
        └── types/              # TypeScript types (KHÔNG SỬA)
```

---

## Quy Trình Git Làm Việc Nhóm

### Nhánh chính
| Nhánh | Mục đích |
|-------|---------|
| `main` | Production — chỉ merge khi hoàn chỉnh tính năng lớn |
| `dev` | Development — nhóm làm việc chính trên nhánh này |

### Workflow cho từng thành viên

```bash
# 1. Clone repo (lần đầu)
git clone https://github.com/ty2303/NNPTUD.git
cd NNPTUD

# 2. Chuyển sang nhánh dev
git checkout dev

# 3. Tạo nhánh riêng từ dev cho từng tính năng
git checkout -b feature/tv1-auth       # TV1
git checkout -b feature/tv2-product    # TV2
git checkout -b feature/tv3-order      # TV3
git checkout -b feature/tv4-cart       # TV4
git checkout -b feature/tv5-notify     # TV5

# 4. Code xong → commit và push
git add .
git commit -m "feat: implement auth controller"
git push origin feature/tv1-auth

# 5. Tạo Pull Request: feature/tvX-xxx → dev
# 6. Khi tính năng lớn hoàn chỉnh → merge dev → main
```

### Quy tắc commit message
```
feat:     thêm tính năng mới
fix:      sửa bug
refactor: cải thiện code
docs:     cập nhật tài liệu
```

---

## Cài Đặt & Chạy Local

### Yêu cầu
- Node.js 18+
- MongoDB Atlas account

### Backend
```bash
cd backend
cp .env.example .env       # điền thông tin vào .env
npm install
npm run dev                # http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

### Biến môi trường Backend (`.env`)
```env
PORT=8080
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
CLIENT_URL=http://localhost:5173
```

---

## CI/CD

GitHub Actions tự động chạy khi push lên `dev` hoặc tạo PR vào `main`:

- **Frontend CI**: Format check → Lint → Typecheck → Test → Build
- **Backend CI**: Typecheck → Build

<div align="center">

# 🚿 AutoWash Pro

**Motorbike Wash Management System — Hệ Thống Quản Lý Tiệm Rửa Xe Máy**

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![EF Core](https://img.shields.io/badge/EF%20Core-9.0-512BD4?logo=dotnet)](https://learn.microsoft.com/en-us/ef/core/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-CC2927?logo=microsoftsqlserver)](https://www.microsoft.com/en-us/sql-server)
[![JWT](https://img.shields.io/badge/Auth-JWT%20Bearer-000000?logo=jsonwebtokens)](https://jwt.io/)
[![Swagger](https://img.shields.io/badge/Docs-Swagger%20UI-85EA2D?logo=swagger)](https://swagger.io/)

</div>

---

<div align="center">

[🇬🇧 English](#-english) &nbsp;|&nbsp; [🇻🇳 Tiếng Việt](#-tiếng-việt)

</div>

---

## 🇬🇧 English

### Overview

AutoWash Pro is a backend REST API for small-to-medium motorbike wash businesses in Vietnam. It handles advance bookings with real-time capacity enforcement, a walk-in counter flow, a 4-tier loyalty program with automatic point expiry and tier reviews, and an admin dashboard for configuration and reporting.

### ✨ Features

| Area | Capabilities |
|------|-------------|
| **Authentication** | Customer registration/login · Staff & Admin login · JWT Bearer with role-based access |
| **Service Catalogue** | Public service & pricing listings · Admin CRUD for services and per-vehicle-type pricing |
| **Booking Engine** | Advance bookings (Member: 7d, Silver: 10d, Gold: 12d, Platinum: 14d window) · Walk-in counter flow · Real-time slot availability · Serializable-transaction capacity check (max 4 per 30-min slot) · Customer cancellation |
| **Checkout & Loyalty** | Booking completion with promo discount resolution · Append-only points ledger · Automatic earn/redeem · Points worth 100 VND each |
| **Loyalty Tiers** | Member → Silver → Gold → Platinum · Monthly 30-day rolling review of visits & spend · Auto-upgrade/downgrade with notification |
| **Points Expiry** | Points expire 12 months from earning · Monthly job expires them and notifies customers · 30-day advance near-expiry warning |
| **Admin Panel** | Tier config · Promotion CRUD · Customer search & tier override · Dashboard reports (volume, revenue, utilisation, tier distribution) |
| **Background Jobs** | Hosted service runs on the 1st of each month · Restart-safe (persists last-run month to DB) |

### 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | ASP.NET Core 9 Web API |
| ORM | Entity Framework Core 9 (Code-First) |
| Database | Microsoft SQL Server |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) |
| Password hashing | BCrypt.Net-Next |
| API docs | Swashbuckle / Swagger UI with Bearer token support |
| Background jobs | `IHostedService` / `BackgroundService` |

### 📋 Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9)
- SQL Server 2019+ (or SQL Server Express / LocalDB)
- `dotnet-ef` CLI tool

```bash
dotnet tool install --global dotnet-ef
```

### 🚀 Getting Started

#### 1. Clone the repository

```bash
git clone <repository-url>
cd AutoWashPro
```

#### 2. Configure settings

Edit `AutoWashPro.API/appsettings.json` (or use environment variables / `appsettings.local.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=AutoWashPro;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "SecretKey": "<your-secret-key-min-32-chars>"
  },
  "SeedSettings": {
    "DefaultAdminEmail": "admin@example.com",
    "DefaultAdminPassword": "YourStrongPassword123!"
  }
}
```

> **Important:** Never commit real secrets. Use environment variables or `appsettings.local.json` (already in `.gitignore`) for production values.

#### 3. Apply database migrations

```bash
cd AutoWashPro.API
dotnet ef database update
```

#### 4. Run the API

```bash
dotnet run
```

Swagger UI is available at: `https://localhost:{port}/swagger`

### 🗂 Project Structure

```
AutoWashPro.API/
├── Controllers/          # HTTP endpoint handlers
│   └── Admin/            # Admin-only endpoints
├── Services/             # Business logic layer
│   └── Interfaces/       # Service contracts
├── DTOs/                 # Request/response data shapes
│   ├── Auth/
│   ├── Booking/
│   ├── Checkout/
│   ├── Customer/
│   ├── Service/
│   └── Admin/
├── Data/
│   ├── Entities/         # EF Core entity classes + enums
│   └── Migrations/       # EF Core migration history
├── Jobs/                 # Background hosted services
├── Middleware/           # Exception handling, request logging
├── Common/               # Result<T>, AppConstants, extensions
└── appsettings.json      # Application configuration
```

### 📡 API Reference

All endpoints are documented interactively in Swagger UI. Quick overview:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/customer/register` | Public | Register new customer |
| `POST` | `/api/auth/customer/login` | Public | Customer login → JWT |
| `POST` | `/api/auth/system/login` | Public | Staff/Admin login → JWT |
| `GET` | `/api/services` | Public | List active services |
| `GET` | `/api/bookings/availability` | Customer | Available slots for a date |
| `POST` | `/api/bookings` | Customer | Create advance booking |
| `DELETE` | `/api/bookings/{id}` | Customer | Cancel booking |
| `GET` | `/api/customers/me/loyalty` | Customer | Points balance + tier + ledger |
| `POST` | `/api/admin/bookings/walk-in` | Staff/Admin | Create walk-in booking |
| `POST` | `/api/admin/bookings/{id}/complete` | Staff/Admin | Complete booking + award points |
| `GET` | `/api/admin/bookings/queue` | Staff/Admin | Today's queue sorted by slot & tier |
| `GET` | `/api/admin/reports/summary` | Admin | Dashboard metrics |

### 🔒 Roles & Policies

| Role | Policy | Access |
|------|--------|--------|
| `Customer` | `CustomerOnly` | Self-service booking, profile, loyalty |
| `Staff` | `StaffOrAdmin` | Walk-ins, checkout, queue view |
| `Admin` | `AdminOnly` + `StaffOrAdmin` | Everything above + tier/promo config + reports |

### ⚙️ Key Configuration Values

| Key | Default | Description |
|-----|---------|-------------|
| `BookingSettings:SlotDurationMinutes` | `30` | Length of each booking slot |
| `BookingSettings:MaxCapacityPerSlot` | `4` | Max concurrent bookings per slot |
| `BookingSettings:PointValueInVND` | `100` | 1 loyalty point = 100 VND discount |
| `JwtSettings:ExpiryMinutes` | `1440` | JWT token lifetime (24 hours) |

---

## 🇻🇳 Tiếng Việt

### Tổng Quan

AutoWash Pro là REST API backend dành cho các tiệm rửa xe máy vừa và nhỏ tại Việt Nam. Hệ thống xử lý đặt lịch trước với kiểm tra sức chứa thực thời gian, luồng khách vãng lai, chương trình khách hàng thân thiết 4 bậc với tự động hết hạn điểm và xét duyệt bậc hàng tháng, cùng bảng điều khiển quản trị để cấu hình và báo cáo.

### ✨ Tính Năng

| Khu vực | Chức năng |
|---------|-----------|
| **Xác thực** | Đăng ký/đăng nhập khách hàng · Đăng nhập nhân viên & quản trị · JWT Bearer với phân quyền theo vai trò |
| **Danh Mục Dịch Vụ** | Danh sách dịch vụ & giá công khai · Quản trị CRUD dịch vụ và giá theo loại phương tiện |
| **Đặt Lịch** | Đặt trước (Member: 7 ngày, Silver: 10 ngày, Gold: 12 ngày, Platinum: 14 ngày) · Luồng khách vãng lai · Kiểm tra slot trống thực thời gian · Kiểm tra sức chứa bằng giao dịch Serializable (tối đa 4 xe/30 phút) · Huỷ lịch |
| **Thanh Toán & Tích Điểm** | Hoàn tất đặt lịch với giải quyết chiết khấu khuyến mãi · Sổ cái điểm chỉ ghi thêm · Tự động tích/đổi điểm · 1 điểm = 100 VND |
| **Bậc Thành Viên** | Member → Silver → Gold → Platinum · Xét duyệt 30 ngày cuộn hàng tháng theo lượt rửa & chi tiêu · Tự động nâng/hạ bậc kèm thông báo |
| **Hết Hạn Điểm** | Điểm hết hạn sau 12 tháng từ ngày tích · Job hàng tháng tự hết hạn và thông báo khách · Cảnh báo trước 30 ngày |
| **Quản Trị** | Cấu hình bậc thành viên · CRUD khuyến mãi · Tìm kiếm & điều chỉnh bậc khách hàng · Báo cáo dashboard (lượt, doanh thu, tỷ lệ slot, phân bố bậc) |
| **Job Nền** | Dịch vụ hosted chạy vào ngày 1 hàng tháng · An toàn khi restart (lưu tháng chạy cuối vào DB) |

### 🛠 Công Nghệ

| Tầng | Công nghệ |
|------|-----------|
| Runtime | ASP.NET Core 9 Web API |
| ORM | Entity Framework Core 9 (Code-First) |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Xác thực | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) |
| Mã hoá mật khẩu | BCrypt.Net-Next |
| Tài liệu API | Swashbuckle / Swagger UI hỗ trợ Bearer token |
| Job nền | `IHostedService` / `BackgroundService` |

### 📋 Yêu Cầu Hệ Thống

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9)
- SQL Server 2019+ (hoặc SQL Server Express / LocalDB)
- Công cụ CLI `dotnet-ef`

```bash
dotnet tool install --global dotnet-ef
```

### 🚀 Hướng Dẫn Cài Đặt

#### 1. Clone repository

```bash
git clone <repository-url>
cd AutoWashPro
```

#### 2. Cấu hình

Chỉnh sửa `AutoWashPro.API/appsettings.json` (hoặc dùng biến môi trường / `appsettings.local.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=AutoWashPro;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "SecretKey": "<khóa-bí-mật-tối-thiểu-32-ký-tự>"
  },
  "SeedSettings": {
    "DefaultAdminEmail": "admin@example.com",
    "DefaultAdminPassword": "MatKhauManh123!"
  }
}
```

> **Quan trọng:** Không commit thông tin bí mật vào git. Dùng biến môi trường hoặc `appsettings.local.json` (đã có trong `.gitignore`) cho môi trường thực tế.

#### 3. Áp dụng migration cơ sở dữ liệu

```bash
cd AutoWashPro.API
dotnet ef database update
```

#### 4. Chạy API

```bash
dotnet run
```

Swagger UI có tại: `https://localhost:{port}/swagger`

### 🗂 Cấu Trúc Dự Án

```
AutoWashPro.API/
├── Controllers/          # Xử lý HTTP endpoint
│   └── Admin/            # Endpoint chỉ dành cho Admin
├── Services/             # Tầng logic nghiệp vụ
│   └── Interfaces/       # Giao diện service
├── DTOs/                 # Cấu trúc dữ liệu request/response
│   ├── Auth/
│   ├── Booking/
│   ├── Checkout/
│   ├── Customer/
│   ├── Service/
│   └── Admin/
├── Data/
│   ├── Entities/         # Entity EF Core + enum
│   └── Migrations/       # Lịch sử migration EF Core
├── Jobs/                 # Background hosted service
├── Middleware/           # Xử lý lỗi, ghi log request
├── Common/               # Result<T>, AppConstants, extension
└── appsettings.json      # Cấu hình ứng dụng
```

### 📡 Tham Khảo API

Toàn bộ endpoint được tài liệu hoá tương tác tại Swagger UI. Tổng quan nhanh:

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `POST` | `/api/auth/customer/register` | Công khai | Đăng ký khách hàng mới |
| `POST` | `/api/auth/customer/login` | Công khai | Đăng nhập khách hàng → JWT |
| `POST` | `/api/auth/system/login` | Công khai | Đăng nhập nhân viên/Admin → JWT |
| `GET` | `/api/services` | Công khai | Danh sách dịch vụ đang hoạt động |
| `GET` | `/api/bookings/availability` | Khách hàng | Slot trống theo ngày |
| `POST` | `/api/bookings` | Khách hàng | Đặt lịch trước |
| `DELETE` | `/api/bookings/{id}` | Khách hàng | Huỷ lịch |
| `GET` | `/api/customers/me/loyalty` | Khách hàng | Số dư điểm + bậc + lịch sử sổ cái |
| `POST` | `/api/admin/bookings/walk-in` | Nhân viên/Admin | Tạo lịch vãng lai |
| `POST` | `/api/admin/bookings/{id}/complete` | Nhân viên/Admin | Hoàn tất + tặng điểm |
| `GET` | `/api/admin/bookings/queue` | Nhân viên/Admin | Hàng đợi hôm nay theo slot & bậc |
| `GET` | `/api/admin/reports/summary` | Admin | Số liệu dashboard |

### 🔒 Vai Trò & Phân Quyền

| Vai trò | Policy | Quyền truy cập |
|---------|--------|---------------|
| `Customer` | `CustomerOnly` | Đặt lịch tự phục vụ, hồ sơ, tích điểm |
| `Staff` | `StaffOrAdmin` | Vãng lai, thanh toán, xem hàng đợi |
| `Admin` | `AdminOnly` + `StaffOrAdmin` | Tất cả ở trên + cấu hình bậc/khuyến mãi + báo cáo |

### ⚙️ Các Giá Trị Cấu Hình Quan Trọng

| Key | Mặc định | Mô tả |
|-----|----------|-------|
| `BookingSettings:SlotDurationMinutes` | `30` | Thời lượng mỗi slot đặt lịch |
| `BookingSettings:MaxCapacityPerSlot` | `4` | Tối đa xe đồng thời mỗi slot |
| `BookingSettings:PointValueInVND` | `100` | 1 điểm tích = 100 VND giảm giá |
| `JwtSettings:ExpiryMinutes` | `1440` | Thời hạn token JWT (24 giờ) |

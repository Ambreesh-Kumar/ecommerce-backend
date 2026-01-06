# 🛒 E-Commerce Backend API
A **production-grade E-Commerce Backend** built using **Node.js, Express, and MongoDB**, implementing secure authentication, product & order management, cart workflows, and **Razorpay payment integration** with idempotent verification.

## 🌐 API Base URL
```
https://your-deployed-backend-url.com
```
All endpoints are prefixed with /api.

## ❓ Why This Project?
This project is designed to showcase real-world backend engineering practices used in scalable e-commerce platforms:
* Secure authentication with refresh tokens
* Admin-controlled product & category management
* Cart → Order → Payment lifecycle
* Robust **payment verification & failure handling**
* Clean architecture with maintainable code structure

## ✨ Key Highlights
* JWT Access & Refresh Token authentication
* Role-based authorization (User / Admin)
* **Razorpay payment integration**
* **Idempotent payment verification**
* **MongoDB transactions** for critical flows
* Multer + Cloudinary media uploads
* Centralized error handling
* Clean, modular architecture

## 🧩 Architecture Overview
```
Client (Frontend / Browser / Postman)
        ↓
Express Routes
        ↓
Controllers
        ↓
Service Logic + Validation
        ↓
MongoDB (Mongoose ODM)
        ↓
Cloudinary (Media) / Razorpay (Payments)
```

## 🛠️ Tech Stack
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB + Mongoose
* **Auth**: JWT (Access & Refresh Tokens)
* **Uploads**: Multer + Cloudinary
* **Payments**: Razorpay
* **Views**: EJS (Checkout page)
* **Security**: Role-based middleware, token validation

## 🧩 Core Modules Overview

### 👤 Authentication & User Management
#### Features
* User registration & login
* JWT-based access & refresh token flow
* Secure logout
* Role support (User / Admin)
* Avatar upload via Cloudinary

#### Auth APIs
| Method | Endpoint                | Description          | Auth |
| ------ | ----------------------- | -------------------- | ---- |
| POST   | /api/auth/register      | Register new user    | No   |
| POST   | /api/auth/login         | Login & issue tokens | No   |
| GET    | /api/auth/refresh_token | Refresh access token | No   |
| POST   | /api/auth/logout        | Logout user          | Yes  |

### 🏷️ Category Management
#### Features
* Admin-controlled category creation
* Soft delete & hard delete support
* Public category listing
* Used for product classification

#### Category APIs
##### Public APIs
| Method | Endpoint        | Description         | Auth |
| ------ | --------------- | ------------------- | ---- |
| GET    | /api/categories | List all categories | No   |
##### Admin APIs
| Method | Endpoint            | Description          | Auth  |
| ------ | ------------------- | -------------------- | ----- |
| POST   | /api/categories     | Create category      | Admin |
| PUT    | /api/categories/:id | Update category      | Admin |
| PATCH  | /api/categories/:id | Soft delete category | Admin |
| DELETE | /api/categories/:id | Hard delete category | Admin |

### 📦 Product Management
#### Features
* Product creation with multiple images
* Cloudinary image storage
* Slug-based product access
* Soft delete & restore support
* Admin-only write access

#### Product APIs
##### Public APIs
| Method | Endpoint                | Description               | Auth |
| ------ | ----------------------- | ------------------------- | ---- |
| GET    | /api/products           | List all products         | No   |
| GET    | /api/products/:idOrSlug | Get product by ID or slug | No   |
##### Admin APIs
| Method | Endpoint                         | Description         | Auth  |
| ------ | -------------------------------- | ------------------- | ----- |
| POST   | /api/products                    | Create product      | Admin |
| PUT    | /api/products/:productId         | Update product      | Admin |
| PATCH  | /api/products/:productId         | Soft delete product | Admin |
| PATCH  | /api/products/:productId/restore | Restore product     | Admin |
| DELETE | /api/products/:productId/hard    | Hard delete product | Admin |

### 🛒 Cart Management
#### Features
* Per-user cart
* Add, update, remove items
* Quantity validation
* Clear cart functionality

#### Cart APIs (User Only)
| Method | Endpoint         | Description           | Auth |
| ------ | ---------------- | --------------------- | ---- |
| GET    | /api/cart        | Get my cart           | Yes  |
| POST   | /api/cart/add    | Add item to cart      | Yes  |
| PATCH  | /api/cart/update | Update item quantity  | Yes  |
| PATCH  | /api/cart/remove | Remove item from cart | Yes  |
| DELETE | /api/cart/clear  | Clear entire cart     | Yes  |

### 📦 Order Management
#### Features
* Order creation from cart
* Order cancellation (user)
* Admin order status updates
* MongoDB transactions for consistency

#### Order APIs
##### User APIs
| Method | Endpoint                    | Description            | Auth |
| ------ | --------------------------- | ---------------------- | ---- |
| POST   | /api/orders/create          | Create order from cart | Yes  |
| GET    | /api/orders/my              | Get my orders          | Yes  |
| GET    | /api/orders/:orderId        | Get order details      | Yes  |
| PATCH  | /api/orders/:orderId/cancel | Cancel my order        | Yes  |
##### Admin APIs
| Method | Endpoint                   | Description         | Auth  |
| ------ | -------------------------- | ------------------- | ----- |
| GET    | /api/orders                | List all orders     | Admin |
| GET    | /api/orders/admin/:orderId | Get order by ID     | Admin |
| PATCH  | /api/orders/admin/:orderId | Update order status | Admin |

### 💳 Payment & Delivery System
#### Delivery Options Supported
* ✅ Cash on Delivery (COD)
* ✅ Online Payment (Razorpay)


### 💳 Razorpay Payment Flow
#### Features
* Secure checkout page (EJS)
* Payment verification with signature validation
* **Idempotent verification** to prevent double payments
* Order & payment status synchronization

#### Checkout Flow
1. User opens: `GET /api/payments/checkout/:orderId?token=<ACCESS_TOKEN>`
2. Checkout page loads with **Pay Now** button
3. Razorpay modal opens only on button click
4. On success → `/api/payments/verify`
5. Payment & Order status updated atomically

##### Payment APIs
| Method | Endpoint                        | Description             | Auth |
| ------ | ------------------------------- | ----------------------- | ---- |
| GET    | /api/payments/checkout/:orderId | Open checkout page      | Yes  |
| POST   | /api/payments/verify            | Verify Razorpay payment | Yes  |

### 🧪 Razorpay Test Card Details
| Card Number         | Expiry     | CVV |
| ------------------- | ---------- | --- |
| 5267 3181 8797 5449 | Any future | 123 |

### 🖼️ Media Upload System
* Multer for file handling
* Cloudinary for image storage
* User avatars & product images supported
* Optimized CDN delivery

### 🗄️ Database Design (MongoDB)
#### Collections Used:
* User
* Category
* Product
* Cart
* Order
* Payment

Designed with references & transactions for data integrity.

### 🔐 Security & Best Practices
* JWT authentication with refresh tokens
* Role-based route protection
* Centralized error handling
* **MongoDB transactions**
* **Idempotent payment verification**
* **No secrets exposed in codebase**

### 📊 Project Status
* Backend: ✅ Completed
* Payments: ✅ Integrated
* COD Support: ✅ Enabled
* Production Ready: ✅ Yes

### 👨‍💻 Developer
**Ambreesh Kumar**  
Backend Developer | **Node.js** | **Express.js** | **MongoDB** | **REST APIs**  
Focused on building **scalable, real-world backend systems**  

- **GitHub**: https://github.com/Ambreesh-Kumar 
- **LinkedIn**: [https://www.linkedin.com/in/ambreesh-kumar](https://www.linkedin.com/in/ambreesh-kumar?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app)
- **Email**: kumarambreesh70@gmail.com

## License & Usage
© 2025 Ambreesh Kumar. All rights reserved.

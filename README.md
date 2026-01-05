Kids Meal Subscription Platform - Backend API
A robust REST API for managing kids' meal subscriptions in schools. Built with Node.js, Express.js, and MongoDB, this backend provides comprehensive endpoints for authentication, subscription management, delivery tracking, and QR-based verification.

📋 Table of Contents

Features
Tech Stack
System Architecture
Getting Started
Environment Variables
API Documentation
Core Logic
Deployment
Testing
Security
Contributing

<!-- =------------------------------------------ -->

✨ Features
Core Functionality

🔐 JWT Authentication: Secure user authentication and authorization
👥 Role-Based Access Control: Separate permissions for Parents and Admins
👶 Child Profile Management: Complete CRUD operations for children
📅 Subscription System: Weekly/Monthly plans with multiple meal types
🚚 Delivery Management: Track and manage daily meal deliveries
🎫 QR Code System: Generate and verify unique QR codes for each child
📊 Analytics: statistics and reports

Business Logic

Automatic meal calculation based on active subscriptions
Subscription status management (Active, Paused, Cancelled)
No-refund policy enforcement
Delivery verification with QR codes
Weekly menu management

<!-- --------------------------- -->

🛠️ Tech Stack

Runtime: Node.js (v18+)
Framework: Express.js
Database: MongoDB with Mongoose ODM
Authentication: JWT (jsonwebtoken)
Password Hashing: bcryptjs
Validation: express-validator
QR Code: qrcode
Logging: morgan
Environment: dotenv
CORS: cors
Deployment: Render

<!-- ---------------------------------------- -->

🏗️ System Architecture
┌─────────────────────────────────────────────────────────────┐
│ CLIENT LAYER │
│ (Next.js Frontend - Parent Portal & Admin Panel) │
└─────────────────────────────────────────────────────────────┘
↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│ API GATEWAY LAYER │
│ - CORS Handling │
│ - Error Handling Middleware │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION LAYER │
│ - JWT Token Verification │
│ - Role-Based Access Control (Parent/Admin) │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Auth │ │ Subscription │ │ Delivery │ │
│ │ Controller │ │ Controller │ │ Controller │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Child │ │ Menu │ │ Payment │ │ Dashboard
│ │ Controller │ │ Controller │ │ Controller │ │ Controller
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ DATA ACCESS LAYER │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ User │ │ Subscription │ │ Delivery │ │
│ │ Model │ │ Model │ │ Model │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Child │ │ Menu │ │ Payment │ │
│ │ Model │ │ Model │ │ Model │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ DATABASE LAYER (MongoDB) │
│ Collections: users, child_profiles, subscriptions, deliveries, │
│ menus, payments │
└─────────────────────────────────────────────────────────────┘

<!-- ------------------------------------------ -->

🚀 Getting Started
Prerequisites

Node.js (v18 or higher)
MongoDB (v5.0 or higher)
npm

Installation

Clone the repository

bash git clone https://github.com/firoz-akhter/kids-meal-zikrabyte-backend.git
cd kids-meal-zikrabyte-backend

Install dependencies

bash npm install

Set up environment variables

bash cp .env.example .env
Edit .env with your configuration (see Environment Variables)

Create admin user

bash node src/scripts/seed.js

Start the server

bash # Development
npm run dev

# Production

npm start

Verify installation

base url http://localhost:3000/
Response:
json {
"status": "OK",
"message": "Welcome to backend",
}
bash curl http://localhost:3000/api/health
Response:
json {
"status": "OK",
"message": "Server is running",
"timestamp": "2026-01-05T10:30:00.000Z"
}

<!-- ------------------------------ -->

🔐 Environment Variables
Create a .env file in the root directory:

# Server Configuration

NODE_ENV=development
PORT=3000

# Database

MONGODB_URI=mongodb+srv://sakib:sakib321@cluster0.ibwmxn8.mongodb.net/kidsmeals?retryWrites=true&w=majority

# Admin Initial Setup (for first run only)

ADMIN_EMAIL=admin@kidsmeals.com
ADMIN_MOBILE=9999999999
ADMIN_PASSWORD=Admin@123

# Frontend URL (for CORS)

CLIENT_URL=http://localhost:3001

<!-- ---------------------------------------------------------------- -->

📚 API Documentation
Base URL
Development: http://localhost:3000/api
Production: https://kids-meal-zikrabyte-backend.onrender.com/
Authentication
All protected routes require JWT token in header:
Authorization: Bearer <your_jwt_token>

🔑 Authentication Endpoints
Register User
httpPOST /api/auth/register
Content-Type: application/json

Login
httpPOST /api/auth/login
Content-Type: application/json

Get Current User
httpGET /api/auth/me
Authorization: Bearer <token>
Logout
httpPOST /api/auth/logout
Authorization: Bearer <token>

👶 Child Management Endpoints
Get All Children (Parent)
httpGET /api/children
Authorization: Bearer <token>  
Add Child
httpPOST /api/children
Authorization: Bearer <token>
Content-Type: application/json

Update Child
httpPUT /api/children/:id
Authorization: Bearer <token>
Content-Type: application/json
Delete Child
httpDELETE /api/children/:id
Authorization: Bearer <token>

📅 Subscription Endpoints
Get User Subscriptions
httpGET /api/subscriptions
Authorization: Bearer <token>
Create Subscription
httpPOST /api/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

Pause Subscription
httpPUT /api/subscriptions/:id/pause
Authorization: Bearer <token>
Content-Type: application/json

Resume Subscription
httpPUT /api/subscriptions/:id/resume
Authorization: Bearer <token>
Cancel Subscription
httpPUT /api/subscriptions/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

🚚 Delivery Endpoints
Get Today's Meals (Parent)
httpGET /api/deliveries/today
Authorization: Bearer <token>

Get Child Delivery History
httpGET /api/deliveries/child/:childId?page=1&limit=10&status=delivered
Authorization: Bearer <token>
Get Upcoming Meals
httpGET /api/deliveries/child/:childId/upcoming
Authorization: Bearer <token>

👨‍💼 Admin Endpoints
Get All Subscriptions
httpGET /api/subscriptions/admin/all?page=1&limit=10&status=active
Authorization: Bearer <admin_token>
Pause Subscription (Admin)
httpPUT /api/subscriptions/:id/pauseByAdmin
Authorization: Bearer <admin_token>
Content-Type: application/json

Resume Subscription (Admin)
httpPUT /api/subscriptions/:id/resumeByAdmin
Authorization: Bearer <admin_token>
Get Today's Deliveries
httpGET /api/deliveries/admin/today?status=pending&search=aarav
Authorization: Bearer <admin_token>
Mark Delivery as Delivered
httpPUT /api/deliveries/:id/delivered
Authorization: Bearer <admin_token>
Content-Type: application/json

{
"comment": "Delivered at 12:30 PM",
"qrScanned": true
}
Mark Delivery as Missed
httpPUT /api/deliveries/:id/missed
Authorization: Bearer <admin_token>
Content-Type: application/json

{
"reason": "Child was absent today"
}
Verify QR and Deliver
httpPOST /api/deliveries/verify-and-deliver
Authorization: Bearer <admin_token>
Content-Type: application/json

{
"qrCodeData": "CHILD-AARAV-123456",
"mealType": "lunch",
"comment": "Delivered successfully"
}
Response: 200 OK
json{
"success": true,
"message": "Delivery verified and marked as delivered",
"data": {
"delivery": { ... }
}
}
Get Delivery Statistics
httpGET /api/deliveries/admin/stats?date=2026-01-05
Authorization: Bearer <admin_token>
Response: 200 OK

Create Deliveries for Date
httpPOST /api/deliveries/admin/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
"date": "2026-01-06"
}

<!-- ----------------------------------------------------- -->

🧮 Core Logic

1. Daily Meal Calculation
   The system automatically calculates how many meals are required each day.

2. Status flow(subscription)
   ┌──────────┐
   │ Active │ ←──────────────┐
   └────┬─────┘ │
   │ │
   │ pause() │ resume()
   ↓ │
   ┌──────────┐ │
   │ Paused │ ───────────────┘
   └────┬─────┘
   │
   │ cancel()
   ↓
   ┌───────────┐
   │ Cancelled │
   └───────────┘

Auto-check on daily basis:
If endDate < today → Status = Expired

<!-- --------------------------------------------- -->

🌐 Deployment
Deploy to Render
curl https://kids-meal-zikrabyte-backend.onrender.com/api/health

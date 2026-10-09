# VELANTECH 🚜🌾

> Location-Based Agricultural Equipment Rental, Logistics & Farmer Operations Platform

VELANTECH is an enterprise-grade full-stack web application designed to empower small and marginal farmers by enabling instant local rental access to tractors, harvesters, drone sprayers, rotavators, and specialized farm machinery.

---

## 🌟 Key Features

- **Multi-Role Ecosystem**:
  - **Admin**: Full platform oversight, machinery yard management, provider verification, revenue tracking, report export.
  - **Farmer**: Equipment discovery, distance search (5-100 km), date reservation, Razorpay online payments and tax invoices.
  - **Equipment Provider**: Machinery listing management, booking request approvals, rental wallet earnings.
  - **Delivery Operator**: Flatbed equipment transit dispatch and farm delivery status tracking.

- **GeoSpatial Search (OpenStreetMap & Leaflet)**:
  - GeoJSON 2dsphere index compatibility with Haversine distance calculations.
  - Dynamic radius filtering (5 km, 10 km, 20 km, 30 km, 50 km, 100 km).

- **Marketplace payment and payouts**:
  - Server-calculated payment orders, verified payment records, configurable platform commission, and provider payout release after rental completion.
  - Demo mode uses an isolated mock adapter; a live gateway must be configured with its server-side signature and webhook verification.

- **Gemini AI Agronomist & Machinery Advisor**:
  - AI recommendations tailored to farmland size, target crop, and soil prep requirements.

- **Multilingual Support (i18n)**:
  - 10 Indian Languages: English, Tamil, Hindi, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Bengali.

- **Knowledge Center**:
  - Government scheme portal (PM-KUSUM 60% Solar Pump Subsidies, SMAM Custom Hiring Center Grants).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons, Leaflet Maps.
- **Backend**: Node.js, Express, Google GenAI SDK (`@google/genai`), REST APIs.
- **Database**: MySQL 8 persistence with local JSON fallback for development.
- **State Management**: React Hooks & Axios API Service pattern.

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```env
GEMINI_API_KEY="your_gemini_api_key"
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="3306"
MYSQL_DATABASE="agriequip_connect"
MYSQL_USER="root"
MYSQL_PASSWORD="your_mysql_password"
JWT_SECRET="super_secret_jwt_key"
RAZORPAY_KEY_ID="rzp_test_key"
PAYMENT_GATEWAY="mock"
PAYMENT_GATEWAY_SECRET=""
PLATFORM_COMMISSION_PERCENT="10"
PAYOUT_RELEASE="rental_completed"
```

Create the database before starting the server. Either run the included schema in
MySQL Workbench (or the MySQL CLI), or use Docker Compose:

```bash
mysql -u root -p < database/schema.sql
```

The server connects at startup and stores accounts, equipment, and bookings in
MySQL. It imports the existing `data/*.json` records only when the corresponding
database table is empty, which makes it safe to migrate a local development setup.

### Payments and payouts

Bookings begin as `Pending` and are only confirmed after the backend verifies the gateway result. The backend, rather than the browser, calculates rental, commission, and provider amount. Completing a verified rental creates an eligible payout; an administrator can then use the clearly labelled demo/manual payout action.

For production, set `PAYMENT_GATEWAY` to the selected provider, keep its secret in `PAYMENT_GATEWAY_SECRET`, and replace the mock adapter in `server.ts` with that provider's order, refund, connected-account, and signed-webhook APIs. Never add gateway secrets or payment credentials to frontend code.

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### AI farming advisor

The AI advisor uses Gemini when `GEMINI_API_KEY` is set in `.env`. Create an API
key in Google AI Studio, add it to `.env`, and restart the server. The key stays
on the server and is never sent to the browser. Without a key, the UI labels its
answers as local guidance rather than presenting them as AI-generated advice.

## Production capacity

The API uses a pooled MySQL connection. The AI endpoint has per-IP rate limiting,
bounded concurrency, a short-lived response cache, and a request queue, so a
burst of AI questions cannot block marketplace, booking, or authentication
traffic. Tune `MYSQL_CONNECTION_LIMIT` and the `AI_*` settings in `.env` to match
your MySQL capacity and Gemini quota.

For thousands of simultaneous users, run multiple application instances behind a
load balancer, use managed MySQL, and move cache/rate-limit state to Redis. The
project includes `/healthz` and `/readyz` endpoints for orchestration. Load-test
your deployed environment before selecting replica counts; a single development
server cannot guarantee a fixed request rate.

---

## 🐳 Docker Deployment

To run using Docker Compose:
```bash
docker-compose up --build
```

Docker Compose creates the database and runs
[`database/schema.sql`](database/schema.sql) automatically on its first start. The
MySQL data is retained in the `mysql-data` Docker volume. For a local MySQL server,
run the schema once before starting the app.
# velantech

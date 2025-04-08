# FX Trading App Backend

This is a backend service for an FX Trading Application built with NestJS, TypeORM, and PostgreSQL. The application allows users to register, verify email, fund their wallet, and trade currencies.

## Features

- User registration with email verification via OTP
- Secure authentication with JWT
- Multi-currency wallet management
- Real-time FX rates through external API integration (with fallback)
- Currency conversion and trading
- Transaction history tracking
- Comprehensive error handling
- **Role-based access control** with admin dashboard
- **Redis caching** for improved performance
- **Transaction idempotency** for preventing duplicate transactions
- **Transaction verification** for added security

## Tech Stack

- **Backend Framework**: NestJS
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Authentication**: JWT, Passport
- **Email Service**: Nodemailer
- **API Integration**: Axios
- **Caching**: Redis via cache-manager
- **Queue Management**: Bull (for transaction processing)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Redis
- npm or yarn

## Installation

```bash
# Clone the repository
git clone https://github.com/ijiwole/fx-trading-app.git

# Navigate to the project directory
cd fx-trading-app

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory and configure the following environment variables:

```env
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=fx_trading

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# Email
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=user@example.com
MAIL_PASS=your_password
MAIL_FROM=noreply@fxtrading.com

# FX API
FX_API_BASE_URL=https://v6.api.exchangerate-api.com/v6
FX_API_KEY=your_api_key
FX_CACHE_TTL=300

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600
REDIS_MAX_ITEMS=1000

# Admin
ADMIN_SECRET_KEY=admin-secret-key
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

### Authentication Endpoints

#### Register User

```
POST /auth/register
```

Request Body:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

#### Verify Email

```
POST /auth/verify
```

Request Body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Login

```
POST /auth/login
```

Request Body:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

#### Create Admin User

```
POST /admin/create
```

Request Body:

```json
{
  "email": "admin@example.com",
  "password": "SecureAdminPassword123",
  "secretKey": "admin-secret-key-change-in-production"
}
```

### Wallet Endpoints

#### Get User Wallets

```
GET /wallet
```

#### Fund Wallet

```
POST /wallet/fund
```

Request Headers:

```
idempotency-key: unique-key-to-prevent-duplicates (optional)
```

Request Body:

```json
{
  "currency": "NGN",
  "amount": 1000
}
```

#### Convert Currency

```
POST /wallet/convert
```

Request Headers:

```
idempotency-key: unique-key-to-prevent-duplicates (optional)
```

Request Body:

```json
{
  "sourceCurrency": "NGN",
  "targetCurrency": "USD",
  "amount": 1000
}
```

#### Trade Currency

```
POST /wallet/trade
```

Request Headers:

```
idempotency-key: unique-key-to-prevent-duplicates (optional)
```

Request Body:

```json
{
  "sourceCurrency": "NGN",
  "targetCurrency": "USD",
  "amount": 1000
}
```

### FX Rates Endpoints

#### Get All Rates

```
GET /fx/rates
```

#### Get Specific Rate

```
GET /fx/rates/:from/:to
```

### Admin Endpoints

#### Get All Users (Admin Only)

```
GET /admin/users
```

#### Get All Transactions (Admin Only)

```
GET /admin/transactions
```

#### Get Dashboard Data (Admin Only)

```
GET /admin/dashboard
```

#### Refresh FX Rates Cache (Admin Only)

```
POST /admin/fx/refresh-rates
```

### Transaction Endpoints

#### Get Transactions

```
GET /transactions
```

Query Parameters:

- `limit`: Maximum number of transactions to return (default: 10)
- `offset`: Number of transactions to skip (default: 0)
- `type`: Filter by transaction type (FUNDING, CONVERSION, TRADE)

#### Get Transaction by ID

```
GET /transactions/:id
```

## Key Architectural Decisions

1. **Database Structure**: Separate entities for Users, Wallets, and Transactions, with proper relationships.
2. **Currency Handling**: Multi-currency wallet support with decimal precision for accurate financial calculations.
3. **Transaction Processing**: Database transactions to ensure atomic operations for currency conversions and trades.
4. **Error Handling**: Comprehensive error handling for API failures, insufficient balances, and other edge cases.
5. **Caching Strategy**: Redis-based caching for FX rates to reduce API calls and improve performance.
6. **Security**: JWT-based authentication, password hashing, and email verification.
7. **Idempotency**: Transaction idempotency to prevent duplicate transactions and ensure safe retries.
8. **Role-Based Access**: Admin privileges for system management and reporting.


## License

This project is licensed under the MIT License.

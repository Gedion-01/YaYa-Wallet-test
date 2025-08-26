# YaYa Wallet Webhook Service

A Node.js TypeScript webhook endpoint for YaYa Wallet integration that receives and processes transaction notifications in real-time.

## Problem Statement

YaYa Wallet uses webhooks to notify partner systems when transactions are made to their accounts. This service implements a secure, scalable webhook endpoint that:

- Receives webhook notifications from YaYa Wallet
- Verifies webhook authenticity using signature verification
- Prevents replay attacks using timestamp validation
- Processes transactions asynchronously
- Returns quick 2xx responses as required by YaYa Wallet

## Solution Architecture

### Key Features

1. **Security-First Design**
   - HMAC SHA256 signature verification
   - IP address whitelisting
   - Timestamp-based replay attack prevention
   - Rate limiting and CORS protection

2. **Production-Ready Infrastructure**
   - TypeScript for type safety
   - Comprehensive error handling
   - Structured logging with Winston
   - Health check endpoints
   - Graceful shutdown handling

3. **Scalable Processing**
   - Asynchronous webhook processing
   - Quick 2xx response (as required by YaYa Wallet)
   - Extensible business logic

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with production middleware
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston with structured logging
- **Code Quality**: ESLint, Prettier

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Gedion-01/YaYa-Wallet-test.git
   cd yaya-wallet-webhook
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Webhook Security (REQUIRED)
WEBHOOK_SECRET=our_webhook_secret_key_here
WEBHOOK_TIMESTAMP_TOLERANCE=300000

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://yayawallet.com,https://api.yayawallet.com

# Trusted IPs (YaYa Wallet IP addresses)
TRUSTED_IPS=192.168.1.1,10.0.0.1
```

### Important Security Notes

1. **WEBHOOK_SECRET**: Must match the secret configured in YaYa Wallet dashboard
2. **TRUSTED_IPS**: Should contain actual YaYa Wallet IP addresses in production
3. **HTTPS**: Use HTTPS in production (webhook URLs must be HTTPS)

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

The test suite covers:

- ✅ Webhook signature verification
- ✅ IP address validation
- ✅ Timestamp validation (replay attack prevention)
- ✅ Payload validation
- ✅ Error handling
- ✅ Integration tests

### Manual Testing

1. **Health Check**

   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Test Webhook (Development Only)**

   ```bash
   curl http://localhost:3000/api/v1/test
   ```

3. **Webhook Endpoint**
   ```bash
   # Generate test signature
   curl -X POST http://localhost:3000/api/v1/webhook \
     -H "Content-Type: application/json" \
     -H "YAYA-SIGNATURE: <generated_signature>" \
     -H "X-Forwarded-For: 127.0.0.1" \
     -d '{
       "id": "1dd2854e-3a79-4548-ae36-97e4a18ebf81",
       "amount": 100,
       "currency": "ETB",
       "created_at_time": 1673381836,
       "timestamp": 1701272333,
       "cause": "Testing",
       "full_name": "Abebe Kebede",
       "account_name": "abebekebede1",
       "invoice_url": "https://yayawallet.com/en/invoice/xxxx"
     }'
   ```

## Security Implementation

### Signature Verification

The service implements YaYa Wallet's signature verification algorithm:

1. **Create signed_payload**: Concatenate all payload values in order
2. **Generate HMAC**: SHA256 hash with your secret key
3. **Compare signatures**: Verify against YAYA-SIGNATURE header

### Replay Attack Prevention

- Validates timestamp against current time
- Configurable tolerance (default: 5 minutes)
- Rejects old webhooks automatically

### IP Address Validation

- Whitelist of trusted YaYa Wallet IP addresses
- Rejects requests from untrusted sources
- Configurable via TRUSTED_IPS environment variable

## API Endpoints

### POST /api/v1/webhook

Main webhook endpoint that receives transaction notifications.

**Headers Required:**

- `YAYA-SIGNATURE`: HMAC SHA256 signature
- `Content-Type: application/json`
- `X-Forwarded-For`: The client IP address. This header must be set to a value listed in your `TRUSTED_IPS` environment variable for the request to be accepted. If not set, or if the value is not trusted, the request will be rejected as "Untrusted IP address".

**Note:**  
When testing locally or behind a proxy, always set `X-Forwarded-For` to a trusted IP (e.g., `127.0.0.1`).

**Response:**

```json
{
  "success": true,
  "message": "Webhook received successfully",
  "transactionId": "1dd2854e-3a79-4548-ae36-97e4a18ebf81"
}
```

### GET /api/v1/health

Health check endpoint for monitoring.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "yaya-webhook",
  "version": "1.0.0"
}
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
```

## Problem-Solving Approach

### 1. Requirements Analysis

- Studied YaYa Wallet webhook documentation thoroughly
- Identified key security requirements (signature verification, replay prevention)
- Understood the need for quick 2xx responses

### 2. Architecture Design

- Chose Node.js + TypeScript for type safety and maintainability
- Separated concerns: verification, processing, routing

### 3. Security Implementation

- Implemented exact signature verification algorithm from YaYa Wallet guide
- Added IP whitelisting for additional security
- Implemented timestamp validation to prevent replay attacks
- Added comprehensive input validation

### 4. Production Readiness

- Added comprehensive error handling and logging
- Implemented health checks and monitoring endpoints
- Added rate limiting and security headers
- Added graceful shutdown handling

## Assumptions Made

1. **YaYa Wallet IP Addresses**: In production, you'll need to configure actual YaYa Wallet IP addresses in `TRUSTED_IPS`

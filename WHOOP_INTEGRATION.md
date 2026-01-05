# WHOOP API Integration Guide

This document explains how to integrate the WHOOP API into the p360 project.

## Overview

p360 does not interpret or provide advice based on WHOOP data. WHOOP's recovery score, coach recommendations, and behavioral advice are not exposed in the UI. WHOOP data is used solely as input for calculating personal baseline comparison patterns.

## Implemented Features

### 1. Data Adapter Layer (`src/whoopAdapter.ts`)

Converts WHOOP API raw responses to the internal standard schema (`DailyMetrics`).

**Key Features:**
- `WhoopRecoveryResponse` → HRV extraction
- `WhoopSleepResponse` → Sleep duration (hours) extraction
- `WhoopWorkoutResponse` → Load/Strain extraction
- `toDailyMetrics()`: Converts all data to `DailyMetrics[]` format

**Usage Example:**
```typescript
import { WhoopAdapter } from './whoopAdapter';

// Call from server-side only (requires access token)
const metrics = await WhoopAdapter.fetchAndConvert(
  accessToken,
  '2024-01-01',
  '2024-01-14'
);
```

### 2. OAuth Server-Side Implementation (`server/whoop-oauth.ts`)

Handles WHOOP OAuth 2.0 authentication on the server side.

**Key Functions:**
- `getWhoopAuthUrl()`: Generates OAuth authorization URL
- `exchangeCodeForToken()`: Exchanges authorization code for access token
- `refreshAccessToken()`: Refreshes access token using refresh token
- `getValidAccessToken()`: Gets valid access token (auto-refresh)

**Important:** Never store access tokens and refresh tokens on the frontend.

### 3. Null Value Handling

All fields in `DailyMetrics` (`hrv`, `sleep`, `load`) allow `null` values. This handles cases where WHOOP data is unavailable.

- `baselineCalculator.ts`: Filters null values and calculates baseline using only valid values
- `decisionEngine.ts`: Excludes metrics with null values from comparison
- `App.tsx`: Displays "No data" when value is null

## Setup Instructions

### 1. Register WHOOP Developer Account

1. Create an account at https://developer.whoop.com
2. Register a new application
3. Obtain Client ID and Client Secret
4. Set Redirect URI (e.g., `https://your-domain.com/api/whoop/callback`)

### 2. Environment Variables

Set the following environment variables on your server:

```env
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret
WHOOP_REDIRECT_URI=https://your-domain.com/api/whoop/callback
```

### 3. Choose Server-Side Implementation

The current project is a Vite-based frontend-only application. To implement OAuth, choose one of the following:

#### Option A: Migrate to Next.js

Use Next.js API Routes to handle OAuth.

```typescript
// pages/api/whoop/auth.ts
import { getWhoopAuthUrl } from '../../../server/whoop-oauth';

export default function handler(req, res) {
  const authUrl = getWhoopAuthUrl();
  res.redirect(authUrl);
}
```

```typescript
// pages/api/whoop/callback.ts
import { exchangeCodeForToken } from '../../../server/whoop-oauth';

export default async function handler(req, res) {
  const { code } = req.query;
  const tokens = await exchangeCodeForToken(code);
  // Store tokens in database
  res.redirect('/dashboard');
}
```

#### Option B: Separate Express Server

Run an Express server separately from the current Vite app.

```bash
npm install express cors dotenv
```

```typescript
// server/index.ts
import express from 'express';
import { getWhoopAuthUrl, exchangeCodeForToken } from './whoop-oauth';

const app = express();

app.get('/api/whoop/auth', (req, res) => {
  const authUrl = getWhoopAuthUrl();
  res.redirect(authUrl);
});

app.get('/api/whoop/callback', async (req, res) => {
  const { code } = req.query;
  const tokens = await exchangeCodeForToken(code as string);
  // Token storage logic
  res.redirect('http://localhost:5173/dashboard');
});

app.listen(3001);
```

#### Option C: Serverless Functions (Vercel, Netlify, etc.)

Deploy serverless functions to handle OAuth.

## OAuth Flow

1. User clicks "Connect WHOOP" button
2. Frontend calls `/api/whoop/auth`
3. Server redirects to WHOOP authorization URL
4. User approves permissions on WHOOP
5. WHOOP redirects to `/api/whoop/callback?code=...`
6. Server exchanges code for access token
7. Store tokens in database (linked to user session)
8. Use stored tokens for subsequent data queries

## Data Retrieval

Query WHOOP data from server-side API Route:

```typescript
// pages/api/whoop/data.ts
import { getValidAccessToken } from '../../../server/whoop-oauth';
import { WhoopAdapter } from '../../../src/whoopAdapter';

export default async function handler(req, res) {
  // Get token from user session
  const tokenStorage = await getTokensFromDatabase(req.session.userId);
  const accessToken = await getValidAccessToken(tokenStorage);
  
  const { startDate, endDate } = req.query;
  const metrics = await WhoopAdapter.fetchAndConvert(
    accessToken,
    startDate as string,
    endDate as string
  );
  
  res.json({ metrics });
}
```

Frontend usage:

```typescript
const response = await fetch('/api/whoop/data?startDate=2024-01-01&endDate=2024-01-14');
const { metrics } = await response.json();
// metrics is DailyMetrics[] format
```

## Token Storage

Tokens should be stored in the database with the following information:

- `access_token`: Used for API calls
- `refresh_token`: Used for token refresh
- `expires_at`: Token expiration time (Unix timestamp)
- `user_id`: User identifier

Example schema (PostgreSQL):

```sql
CREATE TABLE whoop_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

1. **Never store tokens on frontend**: Access tokens and refresh tokens must be managed server-side only
2. **Use HTTPS**: Always use HTTPS in production environments
3. **Token encryption**: Consider encrypting tokens when storing in database
4. **Protect environment variables**: Client secret should only be managed via environment variables, never hardcode in code

## WHOOP API Endpoints

WHOOP API endpoints used in the current implementation:

- `GET /v1/recovery`: Recovery data (includes HRV)
- `GET /v1/activity/sleep`: Sleep data
- `GET /v1/activity/workout`: Workout data (Strain/Load)

For more details, refer to the [WHOOP API documentation](https://developer.whoop.com/api).

## Next Steps

1. Choose and set up server-side implementation
2. Create database schema
3. Test OAuth flow
4. Add WHOOP connection UI to frontend
5. Implement data retrieval and display logic

# WHOOP OAuth Server-Side Implementation

This directory contains code for handling WHOOP OAuth 2.0 authentication on the server side.

## Important Notes

- **Never store tokens on the frontend**
- Access tokens and refresh tokens must be managed server-side only
- This code should only run in server environments (Next.js API Routes, serverless functions, Express servers, etc.)

## Environment Variables

Set the following environment variables on your server:

```env
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret
WHOOP_REDIRECT_URI=https://your-domain.com/api/whoop/callback
```

## Implementation Options

### Option 1: Next.js API Routes

Migrate the project to Next.js or add Next.js API Routes:

1. `pages/api/whoop/auth.ts` - OAuth initiation endpoint
2. `pages/api/whoop/callback.ts` - OAuth callback handler
3. `pages/api/whoop/data.ts` - WHOOP data retrieval

### Option 2: Serverless Functions (Vercel, Netlify, etc.)

Deploy as serverless functions:

1. `api/whoop/auth.ts` - OAuth initiation
2. `api/whoop/callback.ts` - OAuth callback
3. `api/whoop/data.ts` - Data retrieval

### Option 3: Separate Express Server

Run an Express server separately from the current Vite project:

```bash
npm install express cors dotenv
```

Run the server on a separate port (e.g., 3001), and the frontend calls this server's API.

## OAuth Flow

1. User clicks "Connect WHOOP" button
2. Frontend calls `/api/whoop/auth`
3. Server redirects to WHOOP authorization URL
4. User approves permissions on WHOOP
5. WHOOP redirects to `/api/whoop/callback?code=...`
6. Server exchanges code for access token
7. Store tokens in database (linked to user session)
8. Use stored tokens for subsequent data queries

## Token Storage

Tokens should be stored in the database with the following information:

- `access_token`: Used for API calls
- `refresh_token`: Used for token refresh
- `expires_at`: Token expiration time (Unix timestamp)
- `user_id`: User identifier (linked to session/user ID)

## Database Schema Example

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

## Usage Example

To fetch WHOOP data from the frontend:

```typescript
// Frontend code
const response = await fetch('/api/whoop/data?startDate=2024-01-01&endDate=2024-01-14');
const { metrics } = await response.json();
// metrics is DailyMetrics[] format
```

The server internally uses `WhoopAdapter.fetchAndConvert()` to transform the data.

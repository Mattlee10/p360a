/**
 * WHOOP OAuth 2.0 Server-Side Implementation
 * 
 * IMPORTANT: This file should run on a server (Next.js API Route, serverless function, or Express server)
 * NEVER expose access tokens or refresh tokens to the frontend.
 */

export type WhoopTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export type WhoopTokenStorage = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  user_id?: string;
};

/**
 * WHOOP OAuth Configuration
 * Set these as environment variables on your server
 */
const WHOOP_CONFIG = {
  clientId: process.env.WHOOP_CLIENT_ID!,
  clientSecret: process.env.WHOOP_CLIENT_SECRET!,
  redirectUri: process.env.WHOOP_REDIRECT_URI!,
  authUrl: 'https://api.prod.whoop.com/oauth/authorize',
  tokenUrl: 'https://api.prod.whoop.com/oauth/token',
};

/**
 * Generate WHOOP OAuth authorization URL
 * Redirect user to this URL to start OAuth flow
 */
export function getWhoopAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: WHOOP_CONFIG.clientId,
    redirect_uri: WHOOP_CONFIG.redirectUri,
    response_type: 'code',
    scope: 'read:recovery read:sleep read:workout', // Only request necessary scopes
    ...(state && { state }),
  });

  return `${WHOOP_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * Call this from your server-side API route after user authorizes
 * 
 * @param code - Authorization code from WHOOP callback
 * @returns Token response with access_token and refresh_token
 */
export async function exchangeCodeForToken(code: string): Promise<WhoopTokenResponse> {
  const response = await fetch(WHOOP_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: WHOOP_CONFIG.clientId,
      client_secret: WHOOP_CONFIG.clientSecret,
      redirect_uri: WHOOP_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 * Call this when access token expires
 * 
 * @param refreshToken - Refresh token stored securely on server
 * @returns New token response
 */
export async function refreshAccessToken(refreshToken: string): Promise<WhoopTokenResponse> {
  const response = await fetch(WHOOP_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: WHOOP_CONFIG.clientId,
      client_secret: WHOOP_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Get valid access token (refresh if needed)
 * This is a helper that checks expiration and refreshes automatically
 * 
 * @param tokenStorage - Current token storage from your database
 * @returns Valid access token
 */
export async function getValidAccessToken(
  tokenStorage: WhoopTokenStorage
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // Check if token is expired (with 5 minute buffer)
  if (tokenStorage.expires_at - now < 300) {
    // Token expired or about to expire, refresh it
    const newTokens = await refreshAccessToken(tokenStorage.refresh_token);
    
    // Update token storage in your database
    // This is a placeholder - implement your actual storage update logic
    const updatedStorage: WhoopTokenStorage = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: now + newTokens.expires_in,
      user_id: tokenStorage.user_id,
    };
    
    // TODO: Save updatedStorage to your database
    // await saveTokensToDatabase(updatedStorage);
    
    return newTokens.access_token;
  }
  
  return tokenStorage.access_token;
}

/**
 * Example: Next.js API Route handler for OAuth callback
 * 
 * Place this in: pages/api/whoop/callback.ts (or app/api/whoop/callback/route.ts for App Router)
 * 
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const { code, state } = req.query;
 *   
 *   if (!code) {
 *     return res.status(400).json({ error: 'Missing authorization code' });
 *   }
 *   
 *   try {
 *     const tokens = await exchangeCodeForToken(code as string);
 *     
 *     // Store tokens securely in your database (associated with user session)
 *     const tokenStorage: WhoopTokenStorage = {
 *       access_token: tokens.access_token,
 *       refresh_token: tokens.refresh_token,
 *       expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
 *       user_id: req.session.userId, // or however you identify users
 *     };
 *     
 *     // await saveTokensToDatabase(tokenStorage);
 *     
 *     // Redirect to your app
 *     res.redirect('/dashboard');
 *   } catch (error) {
 *     console.error('OAuth error:', error);
 *     res.status(500).json({ error: 'Failed to complete OAuth flow' });
 *   }
 * }
 */

/**
 * Example: API Route to fetch WHOOP data
 * 
 * Place this in: pages/api/whoop/data.ts (or app/api/whoop/data/route.ts)
 * 
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   // Get user's token from database
 *   const tokenStorage = await getTokensFromDatabase(req.session.userId);
 *   
 *   if (!tokenStorage) {
 *     return res.status(401).json({ error: 'Not authenticated with WHOOP' });
 *   }
 *   
 *   try {
 *     const accessToken = await getValidAccessToken(tokenStorage);
 *     const { startDate, endDate } = req.query;
 *     
 *     // Use WhoopAdapter to fetch and convert data
 *     const metrics = await WhoopAdapter.fetchAndConvert(
 *       accessToken,
 *       startDate as string,
 *       endDate as string
 *     );
 *     
 *     res.json({ metrics });
 *   } catch (error) {
 *     console.error('Failed to fetch WHOOP data:', error);
 *     res.status(500).json({ error: 'Failed to fetch data' });
 *   }
 * }
 */


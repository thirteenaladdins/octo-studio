#!/usr/bin/env node

const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const TOKENS_PATH = path.join(process.cwd(), ".twitter-oauth2.json");

function readTokens() {
  try {
    const raw = fs.readFileSync(TOKENS_PATH, "utf8");
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

function getOAuth2Client() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const callback =
    process.env.TWITTER_REDIRECT_URL ||
    "http://localhost:3001/api/twitter/oauth2/callback";
  if (!clientId || !clientSecret) return null;
  return new TwitterApi({ clientId, clientSecret });
}

// Step 1: generate the auth link (Confidential OAuth2 without PKCE)
async function getAuthLink() {
  const client = getOAuth2Client();
  if (!client)
    throw new Error(
      "OAuth2 client not configured (missing TWITTER_CLIENT_ID/SECRET)"
    );

  const redirectUri =
    process.env.TWITTER_REDIRECT_URL ||
    "http://localhost:3001/api/twitter/oauth2/callback";

  const scope = [
    "tweet.read",
    "tweet.write",
    "media.write",
    "users.read",
    "offline.access",
  ].join(" ");

  const state = `state_${Math.random().toString(36).slice(2, 10)}`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  const url = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

  // persist state temporarily (no PKCE for confidential clients)
  writeTokens({ pending: { state } });
  return { url, state };
}

// Step 2: handle callback and store tokens (Confidential exchange without PKCE)
async function handleCallback(code, stateParam) {
  const baseClient = getOAuth2Client();
  if (!baseClient) throw new Error("OAuth2 client not configured");
  const saved = readTokens();
  if (!saved?.pending) throw new Error("Missing pending state");
  const { state } = saved.pending;
  if (state !== stateParam) throw new Error("Invalid OAuth2 state");

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const redirectUri =
    process.env.TWITTER_REDIRECT_URL ||
    "http://localhost:3001/api/twitter/oauth2/callback";

  const authB64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("client_id", clientId);

  // Try twitter.com then x.com as a fallback
  const tokenEndpoints = [
    "https://api.twitter.com/2/oauth2/token",
    "https://api.x.com/2/oauth2/token",
  ];

  let respData = null;
  for (const endpoint of tokenEndpoints) {
    try {
      const resp = await axios.post(endpoint, body.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authB64}`,
        },
        timeout: 15000,
        validateStatus: () => true,
      });
      if (resp?.data?.access_token) {
        respData = resp.data;
        break;
      }
    } catch (_) {
      // try next endpoint
    }
  }

  if (!respData?.access_token) {
    throw new Error("Failed to exchange authorization code for tokens");
  }

  const accessToken = respData.access_token;
  const refreshToken = respData.refresh_token;
  const expiresIn = respData.expires_in || 0;
  const scope = respData.scope || "";

  const tokens = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Number(expiresIn) * 1000,
    scope,
  };
  writeTokens({ tokens });
  return tokens;
}

// Get a read-write client using stored tokens
async function getRWClientFromTokens() {
  const base = getOAuth2Client();
  if (!base) return null;
  const saved = readTokens();
  if (!saved?.tokens) return null;

  const { accessToken, refreshToken } = saved.tokens;
  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    accessToken,
    refreshToken,
  });

  // Avoid local refresh by default; CI handles rotation.
  const allowLocalRefresh =
    String(process.env.OAUTH2_ALLOW_LOCAL_REFRESH || "").toLowerCase() ===
    "true";

  if (!allowLocalRefresh) {
    return client.readWrite;
  }

  try {
    const {
      client: refreshedClient,
      accessToken: at,
      refreshToken: rt,
      expiresIn,
    } = await client.refreshOAuth2Token(refreshToken);
    writeTokens({
      tokens: {
        accessToken: at,
        refreshToken: rt,
        expiresAt: Date.now() + expiresIn * 1000,
      },
    });
    return refreshedClient.readWrite;
  } catch (_) {
    return client.readWrite;
  }
}

module.exports = {
  getAuthLink,
  handleCallback,
  getRWClientFromTokens,
  readTokens,
};

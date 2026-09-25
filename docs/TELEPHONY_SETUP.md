# Telephony Integration Setup

This guide explains how to connect Livelihood Mitra to a real phone number using Exotel and Sarvam AI.

## Architecture

```
Caller -> Exotel Virtual Number -> Sarvam Voice Agent API -> Livelihood Mitra Webhook
```

## Steps

### 1. Configure Sarvam API
1. Create an account on the [Sarvam AI Dashboard](https://dashboard.sarvam.ai).
2. Generate an API Key.
3. Add it to your `.env` file as `SARVAM_API_KEY`.

### 2. Configure Exotel
1. Purchase a virtual number from Exotel.
2. In the Exotel App Bazaar, create a simple flow that forwards incoming calls to the Sarvam telephony endpoint.
3. Configure your `EXOTEL_SID` and `EXOTEL_TOKEN` in `.env`.

### 3. Setup Webhook (Local Development)
1. Use ngrok to expose your local Next.js app: `ngrok http 3000`
2. Add the ngrok URL to `.env` as `NEXT_PUBLIC_APP_URL`.
3. Provide this URL to the Sarvam Agent configuration for webhook call state updates (so the Judge Dashboard can receive real-time profile updates).

### 4. Switch Voice Mode
In `.env`, change `VOICE_MODE` from `browser` to `telephony`. The app will now listen for webhook events at `/api/webhooks/voice` instead of using the browser microphone.

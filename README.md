# Livelihood Mitra

Livelihood Mitra is a multilingual, voice-first livelihood decision-support assistant that converses naturally with a beneficiary, automatically builds their profile from speech, identifies their skills and aspirations, maps them toward NSQF/RPL pathways, calculates skill gaps, discovers local opportunities, and creates a personalized livelihood roadmap.

## Project Architecture

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Map Integration**: react-leaflet with OpenStreetMap
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Telephony / Voice Integration**: Web Speech API & Mock Adapters for Sarvam / Exotel.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy the `.env.example` file to `.env` and fill in your keys:

```bash
cp .env.example .env
```

## Demo Mode / Judge Mode

Navigate to `/judge` to access the Judge Dashboard. Here you can start a web or simulated phone call, speak to the assistant naturally, and watch the system's live intelligence extract profile information, detect skills, calculate gaps, and recommend local opportunities in real-time.

## Key Screens
- `/` - Landing Page
- `/voice` - Primary Conversational Interface
- `/judge` - Real-time Intelligence Dashboard
- `/profile` - Beneficiary Profile
- `/skills` - Detected Skills & Official Mappings
- `/recommendations` - Search & Map Results
- `/roadmap` - Personalized Action Plan
- `/sessions` - Call History
- `/notifications` - System Updates

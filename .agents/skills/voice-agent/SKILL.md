# Voice Agent Skill

## Goal
Build a reliable multilingual voice interaction layer for phone and web.

## Required flow
Caller → telephony provider → voice runtime → ASR → conversation controller → backend tools → TTS → caller.

## Provider strategy
Prefer a provider abstraction. A current practical route is Sarvam Voice Agents with Exotel or Twilio telephony. Keep Bhashini available as an alternate speech/language adapter.

## Rules
- Inbound calling is the default demo pattern.
- Ask one question at a time.
- Persist partial profile state after every answer.
- Detect empty/low-confidence input and ask for retry.
- Provide text/demo fallback on the web.
- Do not store raw audio by default unless explicitly needed and consented.
- Secrets stay server-side.
- If provider is unavailable, fail over to local demo conversation.

## Test cases
Silence, background noise, mixed language, language switch, interruption where supported, provider timeout, malformed transcript, repeated answer, corrected answer.

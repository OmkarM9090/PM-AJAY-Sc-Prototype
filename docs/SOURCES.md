# Sources & Evidence Register

## Problem statement
- SIH PS 26097 source file: `file_00000000240c8211998a987b111adc2d`.
- The PS explicitly calls for a multilingual, voice-based virtual livelihood assistant for SC beneficiaries and mentions IVR phone calls, WhatsApp voice notes and lightweight mobile/kiosk delivery. fileciteturn16file3L1-L4

## Team research / architecture
- Technical Approach: `file_000000003bcc82118de97575d052b057`.
- Tech Stack & System Architecture: `file_00000000720481fd892126b77c456881`.
- The architecture documents define Voice → ASR → NLU/profile → NSQF/RPL → skill gap → local data → rules → matching → roadmap, plus UI, data, security and fallback considerations. fileciteturn16file0L52-L62

## Existing government ecosystem
- SIA: official PIB, 21 Jul 2025. `https://www.pib.gov.in/PressReleasePage.aspx?PRID=2146573`.
- SIDH: official PIB, 2026 update. `https://www.pib.gov.in/PressReleasePage.aspx?PRID=2291094`.
- NCS: `https://www.ncs.gov.in/`.
- PM-AJAY: `https://pmajay.dosje.gov.in/` and Department of Social Justice & Empowerment scheme pages.

## Current PM-AJAY rule reference
The 2022 PM-AJAY guideline states that under comprehensive livelihood projects, financial assistance toward loans for asset acquisition/creation can be up to Rs. 50,000 or 50% of asset cost, whichever is less, per beneficiary/household. The prototype must use a versioned policy reference and should not copy the older Rs. 10,000 figure appearing in earlier team drafts. `https://pmajay.dosje.gov.in/Writereaddata/Guidelines_PM-Ajay_February2022.pdf`

## Indian-language voice tooling
- Sarvam Voice Agents / phone integration: `https://docs.sarvam.ai/conversations/introduction`
- Sarvam + Exotel voice agent guide: `https://docs.sarvam.ai/api/integration/build-voice-agent-with-exotel`
- Sarvam + Twilio voice/WhatsApp guide: `https://docs.sarvam.ai/api/integration/build-voice-agent-with-twilio`
- Bhashini: `https://bhashini.gov.in/`

## NSQF / occupational data
- NSDC/occupational standards and QP/NOS sources: `https://nsdcindia.org/`
- NCVET: `https://ncvet.gov.in/`

## Location / open data
- India Post / OGD pincode resources can be used where permitted; retain provenance and update date in the local data registry.

## Data-use discipline
Every imported record should store:
`source`, `source_url`, `retrieved_at`, `version`, `verified_status`.

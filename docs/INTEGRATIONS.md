# External Integrations Plan

| Integration | Role | Primary path | Fallback |
|---|---|---|---|
| Telephony | Real inbound calls | Exotel | Twilio-compatible path |
| Voice agent | STT + reasoning + TTS orchestration | Sarvam Voice Agents | Custom Pipecat + speech APIs |
| Indian language speech | STT/TTS/translation | Sarvam speech stack / Bhashini adapter | Local/browser demo voice |
| QP/NOS | Occupation/competency reference | NCVET/NSDC sourced data | Curated local dataset |
| Jobs | Opportunity layer | NCS data where permitted | Curated demo jobs |
| Location | Distance relevance | Verified pincode/location data | Curated local coordinates |
| PM-AJAY | Scheme reference | Current official guidelines | Versioned local policy snapshot |

## Secrets
All provider credentials belong in backend environment variables or secret management. Never ship them to the browser.

## Real vs simulated
- **Real:** phone call path when telephony/voice credentials are configured; speech service if connected.
- **Curated:** official reference data copied/imported into the application with provenance.
- **Synthetic:** beneficiary profiles, demo jobs and demo analytics where real data is unavailable or inappropriate.
- **Never claim:** synthetic data is live government data.

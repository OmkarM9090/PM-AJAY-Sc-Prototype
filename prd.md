# PRD — Livelihood Mitra
## SIH PS 26097 | PPT Submission & Demonstration Prototype

### 1. Product
**Livelihood Mitra** is a multilingual, voice-first livelihood decision-support system for SC beneficiaries under the GIA component of PM-AJAY.

It should understand a beneficiary's education, current livelihood, family/traditional occupation, existing or informal skills, interests, aspirations, location, mobility/practical constraints and preference for wage employment or self-employment, then guide them toward an explainable livelihood pathway.

### 2. Problem
The PS highlights low digital literacy, language barriers, limited awareness of modern trades, difficulty with text-heavy systems, mismatch between beneficiary aspirations/capabilities and training, and weak linkage between skilling and actual local livelihood opportunities.

### 3. Core value
**Do not ask the beneficiary to search the ecosystem first. Understand the person first, then guide them through the ecosystem.**

Core journey:
`Voice → Profile → Informal Skill Discovery → NSQF/RPL → Skill Gap → Local Opportunities → Constraints/Eligibility → Training/Job/Self-Employment → Relevant Government Support → Livelihood Roadmap`

### 4. Existing ecosystem
- **SIA:** conversational access to skilling/employment services through WhatsApp; personalized courses, nearby training centres, skills-aligned jobs and other assistance.
- **SIDH:** unified skilling DPI covering training, assessment, certification, employment and entrepreneurship, interoperable with government platforms.
- **NCS:** jobs, internships, skill courses, career centres and career services.
- **PM-AJAY:** SC-focused scheme; GIA can include comprehensive livelihood projects with skilling and support related to livelihood asset creation.

Livelihood Mitra must **not pretend these systems do not exist** and must not claim to replace them.

### 5. Differentiating product layer
The proposed layer is a **beneficiary-centric livelihood decision and orchestration layer** that:
1. obtains a natural spoken story instead of a long form;
2. extracts informal skills and constraints;
3. maps existing experience to relevant NSQF/RPL pathways;
4. identifies skill gaps;
5. applies user constraints before ranking opportunities;
6. connects training with job/self-employment pathways;
7. explains why a pathway was recommended;
8. can aggregate anonymized demand signals for future block/village planning.

### 6. Channels
**Primary user access:** real inbound phone/IVR voice agent.

**Secondary:** responsive web/mobile web and WhatsApp voice.

**Web dashboard purpose:** beneficiary experience plus a judge-facing live view of transcript, extracted profile, mapping, recommendations and roadmap.

### 7. Primary beneficiary journey
1. Call / open web.
2. Choose language: Marathi / Hindi / English.
3. Hear simple consent explanation and agree.
4. AI asks one question at a time.
5. User answers naturally by voice.
6. System transcribes and extracts structured fields.
7. Missing/uncertain fields trigger targeted clarification.
8. User confirms the profile.
9. Informal skills are shown.
10. Skills are mapped to relevant NSQF/RPL records.
11. Skill gaps are explained.
12. Training/jobs/self-employment options are filtered and ranked.
13. "Why this?" explains the recommendation.
14. Roadmap is generated.
15. User can listen, save or share the result.

### 8. Functional requirements
- Real inbound phone conversation where telephony credentials are configured.
- Browser voice interaction for web demo.
- Marathi, Hindi and English UI/voice flow.
- Text fallback on every voice step.
- Persistent session state.
- Profile edit and confirmation.
- Data-driven recommendations; different profiles produce different results.
- NSQF/RPL mapping view.
- Skill-gap view.
- Local opportunity view.
- Explainable recommendations.
- Personalized roadmap.
- Save/download/share result.
- Minimal admin/insight dashboard using anonymized demo data.
- Judge/Demo Mode with a preloaded beneficiary scenario.

### 9. Non-functional requirements
- Mobile-first and desktop-ready.
- White, calm, trustworthy visual system.
- Large text and large touch targets.
- Accessible contrast and keyboard support.
- No raw errors, stack traces or API keys exposed.
- Safe fallback if any external voice provider is unavailable.
- No false claims of government ownership/approval/live integration.

### 10. Acceptance criteria
A judge can complete a full demo without developer intervention:
`Start → language → consent → speak → transcript → profile → skills → NSQF/RPL → gap → opportunities → why this → roadmap → save/share`.

A second profile with a different goal/constraint must visibly produce different recommendations.

Changing language must change the user-facing language across the journey, not only the first screen.

### 11. Out of scope for first demonstrable release
- Full government MIS integration.
- Real beneficiary registry access.
- Automatic subsidy approval.
- Production-scale IVR infrastructure beyond the configured demo telephony path.
- Large custom model training.

### 12. Demo beneficiary
> “Maine 10th tak padha hai. Mujhe farming aur pump repair aata hai. Main zyada door travel nahi kar sakta. Mujhe khud ka kaam karna hai.”

Expected output should be driven by structured demo data, not by a fixed slideshow.

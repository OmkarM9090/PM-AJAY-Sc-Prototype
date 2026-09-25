# DESIGN — Livelihood Mitra
## UI/UX System

### Brand feel
Human + trustworthy + Indian public service + modern.

### Visual system
- Primary background: white.
- Primary accent: blue/indigo.
- Text: high-contrast charcoal.
- Surfaces: very light neutral/blue.
- Borders: subtle.
- Shadows: soft and sparse.
- Corners: medium rounded, not playful.
- Typography: large, highly readable, bilingual-friendly.

### Avoid
Dark theme, neon, heavy gradients, excessive glass, excessive 3D, crowded cards, tiny controls, long paragraphs, dense forms.

### Animation
Only meaningful feedback:
- microphone pulse/waveform;
- processing state;
- progress;
- subtle card hover;
- page transition;
- roadmap state;
- success confirmation.

### Core UX rule
**One question. One action. One clear next step.**

### Language
Prototype: Marathi, Hindi, English.

Language switching must update all user-facing strings, questions, voice prompts, explanations, roadmap and errors.

### Beneficiary navigation
Do not expose a complex dashboard during the main journey.

### Essential screens
1. Welcome
2. Language
3. Consent
4. Voice Interview
5. Profile Confirmation
6. Skill Discovery
7. NSQF/RPL Mapping
8. Skill Gap
9. Local Opportunities
10. Recommendations
11. Why This Match
12. Livelihood Roadmap
13. Save/Share
14. How It Works
15. Judge/Admin Insights

### Welcome
Headline: **“Apne hunar se apna agla kadam dhoondhiye.”**
Support: **“Apni bhasha mein bas bolkar shuru karein.”**
Primary CTA: **“Baat karke shuru karein”**.

### Interview screen
Large mic. Spoken question. Transcript. Listening state. Retry. Record again. Text fallback. Progress.

Do not expose raw model information.

### Profile screen
Use simple labels:
- Aapki padhai
- Aap kya kaam karte hain
- Aapko kya aata hai
- Aap kya karna chahte hain
- Aap kitni door ja sakte hain

### Skill screen
Title: **“Aapke hunar”**.
Prompt: **“Kya humne koi hunar miss kiya?”**

### Recommendation screen
Three large paths:
**Seekhein | Kaam Paayein | Apna Kaam Shuru Karein**

Each recommendation should show:
- why it matches;
- local relevance where data exists;
- duration where data exists;
- skill gap addressed;
- verified status metadata.

### Explainability
Use simple reasons, e.g.:
“Ye option aapke pump-repair experience aur khud ka kaam shuru karne ki preference se match karta hai.”

### Roadmap
Visual vertical timeline. Current stage highlighted. Next action always visible.

### Government references
Show a small "Government information" or "Source" label only when a claim is backed by a verified source. Avoid fake endorsement.

### Mobile
Thumb-friendly bottom action area. Avoid tiny links. Never require horizontal scrolling.

### Accessibility
- keyboard focus;
- semantic controls;
- large tap targets;
- readable text;
- clear labels;
- contrast;
- colour is never the only status signal.

### Judge-mode UI
A clean split layout is acceptable:
- left: call / conversation;
- right: live extracted profile, skills, matching and roadmap.

Use Judge Mode as a presentation tool, clearly labelled, never as a fake government-admin login.

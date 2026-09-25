# Multilingual Skill

## Languages
Marathi (`mr-IN`), Hindi (`hi-IN`), English (`en-IN`).

## Rules
- Centralize translations.
- Never hardcode UI strings inside feature components.
- Language selection persists for the session.
- Voice prompts and UI text must use the selected language.
- Handle common code-mixed phrasing without requiring script purity.
- Provide a clear fallback when a provider lacks a particular language/dialect.
- Keep technical QP/NSQF names unchanged when they are official identifiers; explain them in simple local-language text.

## QA
Test every primary screen in all three languages and ensure no clipping, untranslated strings or broken layouts.

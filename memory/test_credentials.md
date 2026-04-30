# Test Credentials — SurakshitPath सुरक्षित पथ

## Pre-seeded Test Session (admin)
- **localStorage key**: `spath_session_token`
- **Session token value**: `test_session_demo_001`
- **User ID**: `user_testdemo001`
- **Email**: `demo@aegis.test`
- **Name**: `Demo User`
- **Is Admin**: `true`
- **Expiry**: 30+ days from 2026-04-30

## Backend URL
`https://safepath-nav-1.preview.emergentagent.com`

## Usage
- **Backend curl**: `Authorization: Bearer test_session_demo_001`
- **Browser / Playwright**: navigate to app origin, then
  `await page.evaluate("localStorage.setItem('spath_session_token', 'test_session_demo_001')")`
  before navigating to `/app`.

## Notes
- Twilio SMS is in **SIMULATION** mode (no real SMS sent — returns `simulated=true`).
- LLM (GPT-5.2 risk analysis, Gemini 3 Flash chat) is live via Emergent Universal LLM Key.
- 12+ incidents seeded in Bengaluru via `/api/dev/seed-incidents`.

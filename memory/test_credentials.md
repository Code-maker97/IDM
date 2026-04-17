# Test Credentials for Safe-Route Navigation System

## Test Session (Pre-seeded in DB)
- **Session Token**: `test_session_demo_001`
- **User ID**: `user_testdemo001`
- **Email**: `demo@aegis.test`
- **Is Admin**: `true`

## Backend URL
- **Production URL**: `https://fe3650be-85f8-4985-868c-b4576b76396a.preview.emergentagent.com`

## Usage
- **Backend API**: Use `Authorization: Bearer test_session_demo_001` header
- **Browser/Frontend**: Set cookie `session_token=test_session_demo_001`

## Notes
- Twilio SMS is in SIMULATION mode (no real SMS sent)
- LLM calls are live via Emergent LLM key
- 12 incidents seeded in Bangalore area

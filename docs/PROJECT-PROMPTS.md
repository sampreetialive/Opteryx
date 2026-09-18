# ScamShield — Project Prompt Library

This file records the product/design/build prompts and requirements discussed for ScamShield so the project has a persistent source of truth.

## 1. Core product prompt

> Build ScamShield as an AI-powered scam detection and safety assistant. The product should let a user submit suspicious messages, links, screenshots, emails, job offers, payment requests and similar content. Analyze the content, explain why it may be suspicious, provide a risk level/score, identify warning signals, and give the user clear next steps.

## 2. AWS architecture prompt

> Build the ScamShield backend using AWS. Use an API layer and serverless services so the application can scale without managing servers. Target architecture: frontend → API Gateway → Lambda → Amazon Bedrock for AI reasoning; Amazon Textract for screenshot/OCR analysis; DynamoDB for users, scans, scam indicators, community reports and history; S3 for uploaded files; CloudWatch for logging/monitoring; Cognito for authentication when accounts are introduced.

## 3. UI/UX prompt

> Make the UI minimalistic, aesthetic, professional, useful and visually polished. Support both light and dark modes. Use the color palette pink, yellow, green, blue, red, black and white without making the interface visually noisy. Use strong typography, clean spacing, cards, subtle gradients, micro-interactions and responsive layouts. The experience should feel like a modern cybersecurity product rather than a basic school project.

## 4. Landing page prompt

> Design a catchy, professional landing page that is more visually engaging than a simple form. Clearly communicate the value proposition, show how ScamShield works, provide a prominent scanner CTA, demonstrate explainable AI results, show scam intelligence/community signals, provide emergency help, explain plans, and include educational content.

## 5. Scanner prompt

> Give users multiple ways to check something suspicious:
> - Paste a message
> - Analyze a URL/link
> - Upload a screenshot/image
> - Support examples so a new user can immediately try the product
>
> The scanner should return:
> - Risk score
> - Risk level
> - Confidence
> - Scam category
> - Detected warning signals
> - Explanation
> - Safe action plan
> - Community/report context
>
> The UI should never present an AI assessment as absolute proof.

## 6. Explainable AI prompt

> Do not only tell the user “scam” or “safe”. Explain the evidence. Highlight patterns such as urgency, impersonation, suspicious URLs, requests for OTP/password/CVV, payment pressure, fake KYC/account verification, prize claims, job-fee requests and other relevant scam signals. Convert the analysis into understandable language for a normal user.

## 7. Scam history / intelligence prompt

> Add scam intelligence showing the history of an indicator. Show how many community reports have been filed, when it was first reported, how report volume changed over time, and what categories people reported it for. Include similar/related scam reports when available. Clearly label community reports as user-submitted signals rather than definitive proof.

## 8. Community reporting prompt

> Allow users to report suspicious messages, links, phone numbers, emails and other scam indicators. Store reports in DynamoDB and aggregate them by normalized indicator. Prevent duplicate/spam reports where possible. Show useful aggregate counts to other users while protecting personal information.

## 9. Emergency help prompt

> Add a highly visible “Already been scammed?” emergency section. Provide practical immediate steps:
> 1. Stop communicating with the scammer.
> 2. Contact the bank/payment provider using official contact information.
> 3. Preserve screenshots, transaction IDs, URLs, phone numbers and chat history.
> 4. Report the incident through the appropriate official cybercrime channel.
>
> For India, include the official Cyber Crime Helpline 1930 and the National Cyber Crime Reporting Portal. Do not encourage users to call numbers supplied by scammers.

## 10. Paid plans prompt

> Add monthly and yearly paid plans with clear benefits. Keep a useful free tier. Paid features can include higher scan limits, advanced URL intelligence, historical report trends, similar scam reports, saved reports, full scan history, detailed explanations, priority analysis and advanced recovery guidance. Keep pricing and usage limits configurable until a payment provider is connected.

## 11. Reliability / trust prompt

> Add features that make ScamShield more reliable:
> - Explainable evidence instead of opaque verdicts
> - Confidence indicator
> - Community report count with timestamps
> - Source/provenance for intelligence where available
> - Clear distinction between AI assessment and verified evidence
> - Official emergency/reporting links
> - Independent verification reminders
> - Secure handling of uploaded screenshots
> - Privacy-conscious storage
> - Rate limiting and abuse protection
> - Monitoring and error logging
> - Graceful fallback when AI services are unavailable

## 12. User history prompt

> Maintain a personal scan history for authenticated users. Each entry should contain the date/time, input type, risk level, score, category and a safe summary. Let users open previous reports. Do not unnecessarily retain sensitive raw content; make retention configurable and privacy-conscious.

## 13. Screenshot/OCR prompt

> Let users upload screenshots of suspicious messages. Store uploads securely in S3, use Amazon Textract to extract text, then send only the required extracted content/signals into the analysis pipeline. Avoid exposing uploaded private content unnecessarily.

## 14. AI agent prompt

> Build ScamShield as an AI agent rather than only a static classifier. The agent should orchestrate analysis steps: understand the input, extract indicators, inspect URLs/reputation data when available, compare against known scam patterns, incorporate community signals, generate an explainable risk assessment, and produce a practical action plan. Keep deterministic safety rules around sensitive actions and never let the AI claim certainty it does not have.

## 15. Security/privacy prompt

> Treat scam reports and uploaded evidence as potentially sensitive. Minimize collected data, encrypt stored data, use least-privilege IAM, keep S3 objects private, validate file types and sizes, sanitize user input, rate-limit APIs, avoid exposing personal information in community reports, and log security-relevant events without unnecessarily logging raw sensitive content.

## 16. GitHub/deployment prompt

> Keep the ScamShield frontend deployable from GitHub. Ensure HTML, CSS and JavaScript paths work correctly on GitHub Pages/static hosting. Avoid assumptions about server-side functionality in static hosting. Separate frontend configuration from AWS secrets and never commit AWS credentials, API keys, payment secrets or other sensitive values.

## 17. Current product structure

### Public pages/sections
- Landing / hero
- Scanner
- Explainable report
- Scam intelligence
- Community history
- Emergency help
- Pricing
- Learn / scam education
- Footer

### Core future backend entities
- User
- Scan
- ScamIndicator
- CommunityReport
- ReportEvent
- Subscription
- SavedReport
- Audit/SecurityEvent

### Target AWS services
- Amazon API Gateway
- AWS Lambda
- Amazon Bedrock
- Amazon Textract
- Amazon DynamoDB
- Amazon S3
- Amazon Cognito
- Amazon CloudWatch
- AWS IAM
- AWS WAF / throttling where appropriate

## 18. Development principle

> Build in phases. Keep the frontend usable while backend services are being connected. Never fake production intelligence as real data. Demo/sample data must be visibly identified as demo data. Replace each demo integration with an AWS-backed implementation before production launch.

## 19. Phase roadmap

### Phase 1 — Product/UI
- Premium landing page
- Light/dark mode
- Responsive scanner
- Report UI
- Scam intelligence UI
- Emergency help
- Pricing UI
- Education section

### Phase 2 — AWS foundation
- AWS account/project setup
- IAM roles
- API Gateway
- Lambda
- DynamoDB
- S3
- CloudWatch
- Environment configuration

### Phase 3 — AI agent
- Bedrock integration
- Prompt/guardrail design
- Structured analysis output
- Explainable reasoning
- Action-plan generation

### Phase 4 — Intelligence
- URL analysis
- Scam indicator normalization
- Community reports
- Historical report counts
- Similar scam detection

### Phase 5 — Accounts/history
- Cognito authentication
- Personal scan history
- Saved reports
- Privacy/retention controls

### Phase 6 — Payments
- Subscription provider
- Monthly/yearly plans
- Entitlements
- Usage limits
- Billing management

### Phase 7 — Production hardening
- Security review
- Abuse prevention
- Monitoring
- Error handling
- Load testing
- Accessibility
- Privacy review
- Production deployment

## Important product safety rule

ScamShield should help users make informed decisions, not pretend to be an infallible authority. A high-risk result is a warning signal. A low-risk result is not a guarantee of safety. Users should independently verify important financial, account-security and identity-related requests.

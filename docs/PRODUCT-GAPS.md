# ScamShield — Prototype gaps & reliability roadmap

This document turns the current prototype into a practical implementation checklist.

## Already represented in the prototype

- Message, URL and screenshot scan modes
- Explainable risk score and warning signals
- Safe action plan
- Community-report concept
- Scam/report history concept
- Emergency guidance for India
- Free / Pro Monthly / Pro Yearly plan concepts
- Light and dark themes
- Responsive landing page
- ScamShield brand icon

## Highest-priority gaps to close

### 1. Real AI backend
Replace the demo/local heuristic path with a production model service. The response should be structured JSON with:
- risk score + risk level
- confidence with a clear definition
- scam category
- evidence/signals
- explanation
- safe action plan
- model/version metadata

### 2. Real URL reputation
For a URL scan, inspect the URL without automatically opening dangerous destinations. Add:
- domain age / registration signals where legally and technically available
- lookalike-domain detection
- redirect-chain analysis
- HTTPS/TLS observations
- known malicious/phishing reputation sources
- URL normalization and punycode/homograph detection

Never tell a user that a URL is safe solely because it uses HTTPS.

### 3. Screenshot OCR + multimodal analysis
Extract visible text and UI clues from screenshots, then combine OCR output with multimodal analysis. Preserve the original screenshot only when the user has consented and retention policy permits it.

### 4. Community reports that are actually trustworthy
The current counts are prototype/demo data. Production should store:
- indicator hash / normalized URL / phone or sender identifier where appropriate
- report timestamp
- scam category
- evidence quality
- duplicate reports
- confidence / moderation state
- source provenance

Show “user reports” separately from verified authority information.

### 5. Abuse resistance
Add rate limits, bot protection, duplicate-report controls, moderation and anomaly detection so attackers cannot inflate a report count.

### 6. Privacy
Do not store passwords, OTPs, PINs, CVVs or unnecessary personal data. Add:
- automatic sensitive-data redaction
- configurable retention
- delete-my-data controls
- privacy notice
- clear explanation of what leaves the browser

### 7. Account and history
For signed-in users:
- scan history
- saved reports
- export/delete history
- device/session management
- optional anonymous scanning

### 8. Recovery workflow
If the user says “I already paid” or “I shared my OTP,” switch from detection to incident response:
1. stop communicating with the scammer
2. contact the bank/payment provider through official channels
3. secure the affected account
4. preserve evidence
5. report through the appropriate official authority
6. monitor transactions/accounts

The UI should adapt to the user's incident type.

### 9. False-positive / false-negative feedback
After a scan, let users report:
- “This looks wrong”
- “I know this is legitimate”
- “I was scammed”
- “This warning helped”

Use this feedback for evaluation and moderation, not as an automatic truth label.

### 10. Reliability & observability
Add backend health checks, structured logs, error tracking, latency metrics, model failure fallback, and clear degraded-mode messaging.

## High-value UX additions

- “Why am I seeing this?” expandable evidence
- Copy/share a redacted safety report
- One-click “verify sender” checklist
- QR-code scanning
- Email-header analysis
- Phone-number reputation lookup where legally appropriate
- multilingual explanations
- accessibility / larger text mode
- keyboard navigation
- low-bandwidth mode
- guided mode for elderly or first-time users
- scam education cards
- “What should I do right now?” emergency mode
- report an indicator without exposing the user's private message

## Important product rule

Community report counts must never be presented as proof that a person, phone number, domain or organization is fraudulent. Display provenance, date, category and uncertainty.

## Suggested implementation order

1. Real backend + structured AI response
2. URL intelligence
3. OCR / screenshot analysis
4. Persistent scan history
5. Community report database + moderation
6. Privacy/redaction controls
7. Incident-response flows
8. Authentication and paid plans
9. Monitoring, rate limiting and abuse prevention
10. Accessibility, localization and polish

# First Commit Submission Pack

## Project

**ScamShield — explainable scam detection for messages, links and screenshots**

Repository: https://github.com/sampreetialive/Opteryx

Live app: https://sampreetialive.github.io/Opteryx/

## 1. Problem

Scam messages increasingly use urgency, account threats, suspicious links and requests for sensitive information. ScamShield gives a user a quick, explainable assessment instead of only returning a vague "safe" or "unsafe" label.

The app accepts suspicious messages, links and screenshots. It produces a risk score, risk category, confidence, warning signals and safer next actions.

## 2. What was built

The production web app uses:

- GitHub Pages for the frontend
- Supabase Edge Functions for the backend
- Groq for AI analysis
- Optional Supabase persistence for scan history
- Multimodal screenshot analysis

The hackathon AWS Build It layer is additive:

- AWS **Strands Agents SDK** runs locally
- The Strands agent consumes a ScamShield scan report
- A custom `validate_scan_report` tool checks the report structure and consistency
- A custom `generate_safety_checklist` tool turns the findings into concrete safety actions
- The agent creates a second-pass investigation brief with evidence, uncertainty and next actions

This means the existing production architecture was preserved while an AWS open-source agent workflow was added for deeper reasoning and verification.

## 3. Where AWS fits

The AWS component is in:

`aws/strands-agent/`

The main files are:

- `src/agent.ts` — Strands agent and model configuration
- `src/tools.ts` — custom validation and safety tools
- `example-scan.json` — reproducible local input
- `package.json` — Strands/OpenAI-compatible model dependencies

The local demo uses the Groq OpenAI-compatible endpoint through the Strands OpenAI model integration. No AWS account or cloud deployment is required for the Build It track.

## 4. Reproducible demo

From `aws/strands-agent`:

```bash
npm install
npm run check
npm run demo
```

A successful run invokes:

```text
validate_scan_report
generate_safety_checklist
Investigation Brief
```

The example report contains a structured high-risk Bank/KYC case. The generated brief reports the score, evidence, uncertainty and safe next actions.

## 5. Demo video script — keep under 3 minutes

### 0:00–0:20 — The problem

Say:

> "ScamShield helps people assess suspicious messages, links and screenshots. Instead of only saying scam or not scam, it explains the warning signals and gives safer next steps."

Show the ScamShield landing page.

### 0:20–1:05 — Live product

Paste an example such as:

```text
URGENT: Your bank account will be blocked today.
Verify your account immediately using this link.
```

Run the scan.

Show the resulting risk level, warning signals, explanation and recommended actions.

Then show a screenshot analysis only if it works reliably during recording.

### 1:05–1:35 — Architecture

Show a simple diagram or the README:

```text
Browser
  ↓
GitHub Pages
  ↓
Supabase Edge Function
  ↓
Groq

AWS Build It layer:
ScamShield report
  ↓
Strands Agent
  ├─ validate_scan_report
  ├─ generate_safety_checklist
  └─ investigation brief
```

Say:

> "For the AWS Build It track, I added an actual Strands Agents SDK layer locally. It does not replace the working product backend. It takes a ScamShield report, validates it, creates a safety checklist, and produces a second-pass investigation brief."

### 1:35–2:20 — Show the AWS run

Open a terminal in `aws/strands-agent` and run:

```text
npm.cmd run demo
```

Show:

```text
✓ Tool completed
✓ Tool completed
=== SCAMSHIELD AWS STRANDS INVESTIGATION ===
```

Scroll to the generated investigation brief.

Say:

> "The important AWS piece is running here: Strands is orchestrating the analysis and calling custom tools before producing the final investigation brief."

### 2:20–2:45 — Learning and impact

Say:

> "I learned how to add an agentic verification layer without rewriting a working application. The result is a practical scam-awareness tool that separates the initial scan from a second-pass review."

### 2:45–2:55 — Close

Say:

> "The goal is simple: help people pause, verify and avoid giving scammers the information they are trying to collect."

Stop before 3:00.

## 6. Short writeup for the submission form

### Problem

Scam messages can create urgency, threaten account access and ask users to click links or share sensitive information. ScamShield gives users an explainable first-pass assessment for messages, links and screenshots.

### Solution

ScamShield analyzes suspicious content and returns a risk score, category, confidence, warning signals and safe next actions. Screenshot analysis adds a multimodal path for suspicious visual content.

### AWS

For the AWS Build It track, I added a local **Strands Agents SDK** workflow. The agent takes an existing ScamShield report and uses custom tools to validate the report, generate a safety checklist, and produce a second-pass investigation brief. This keeps the production application stable while adding an AWS open-source agent layer.

### Learning

I learned how to introduce an agentic workflow as a separate verification layer, how to define custom tools around structured safety data, and how to keep secrets out of the frontend and repository.

### AI / coding tools used

- ChatGPT for architecture review, debugging, implementation assistance and documentation
- Groq for model inference
- Strands Agents SDK for the local agent workflow

## 7. Submission checklist

Before submitting:

- [ ] Repository is public
- [ ] GitHub repository link is correct
- [ ] Live app link opens
- [ ] Demo video is on YouTube and is under 3 minutes
- [ ] YouTube video is public or unlisted
- [ ] Test the YouTube link in a signed-out/private browser window
- [ ] Video visibly shows the AWS Strands workflow
- [ ] Writeup explains the problem, build and AWS role
- [ ] No API keys are present in the repository
- [ ] Any third-party code/assets used have appropriate credit/licence
- [ ] WeMakeDevs account is registered
- [ ] AWS Builder Center profile is created and student verification is complete/pending

## 8. Important eligibility check

First Commit's rules say the project must start after the hackathon opens, and an older project does not become eligible just by being rewritten. The GitHub repository `sampreetialive/Opteryx` was created on **September 18, 2026**, after First Commit opened on **September 17, 2026**. That repository history is consistent with the event window, but only submit if the substantive project work also began after the hackathon opened.

First Commit runs **September 17–20, 2026**. The official submission form states that deadlines are strict and that judges evaluate the submitted repository, video and writeup.

## 9. Useful official links

- First Commit: https://www.wemakedevs.org/aws/first-commit
- Rules: https://www.wemakedevs.org/aws/first-commit/rules
- Submission: https://www.wemakedevs.org/aws/first-commit/submit

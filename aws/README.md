# ScamShield AWS Phase 2

Deploys API Gateway HTTP API -> Lambda -> Amazon Bedrock, with DynamoDB scan history.

1. Sign in to AWS and open CloudShell in your chosen Region.
2. Make sure the Bedrock model in the template is available in that Region.
3. From the repo root run:

aws cloudformation deploy --template-file aws/template.yaml --stack-name scamshield-phase2 --capabilities CAPABILITY_NAMED_IAM

4. Get the API URL:

aws cloudformation describe-stacks --stack-name scamshield-phase2 --query "Stacks[0].Outputs[?OutputKey=='ApiBaseUrl'].OutputValue" --output text

5. Send that API URL to ChatGPT so it can be placed in app.js.

Do not put AWS access keys or secret keys in GitHub or chat.
The first version analyzes the supplied URL string but does not fetch arbitrary URLs from Lambda, avoiding an SSRF proxy.
# ScamShield AWS backend

This folder is the AWS-native backend for ScamShield.

Architecture: Browser -> API Gateway HTTP API -> Lambda.

Endpoints:
- POST /analyze: Amazon Bedrock Converse analysis, optional public URL inspection, optional S3 screenshot input, DynamoDB persistence.
- GET /history: recent scan history from DynamoDB.
- POST /upload: short-lived presigned S3 upload URL for screenshots.

AWS services: API Gateway, Lambda, Amazon Bedrock, DynamoDB, S3.

Default model: amazon.nova-lite-v1:0. Amazon Nova Lite supports the Converse API and image input. Choose another compatible model by changing BEDROCK_MODEL_ID if needed.

Deployment:
1. Configure AWS credentials and install AWS SAM CLI.
2. From this backend directory run: npm install
3. Run: sam build
4. Run: sam deploy --guided
5. Copy the ApiUrl CloudFormation output into the frontend API-base setting.

Security notes: AWS credentials never go to the browser; screenshots stay in private S3; upload URLs expire after five minutes; screenshots expire after one day; the backend rejects common local/private URL targets; AI output is presented as a warning signal rather than proof of fraud.
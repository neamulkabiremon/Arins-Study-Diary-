#!/usr/bin/env bash
# Deploy Arin's Study Diary API to AWS Lambda (pay-per-request).
# Usage: from repo root:  npm run backend:deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/backend"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# Parse .env without bash expanding $ in passwords
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  key="$(echo "$key" | xargs)"
  if [[ "$val" =~ ^\".*\"$ ]]; then
    val="${val:1:${#val}-2}"
  elif [[ "$val" =~ ^\'.*\'$ ]]; then
    val="${val:1:${#val}-2}"
  fi
  export "$key=$val"
done < "$ENV_FILE"

: "${MONGODB_URI:?Set MONGODB_URI in .env}"
: "${APP_JWT_SECRET:?Set APP_JWT_SECRET in .env}"
: "${ARIN_EMAIL:?Set ARIN_EMAIL in .env}"
: "${ARIN_PASSWORD:?Set ARIN_PASSWORD in .env}"
: "${EMON_EMAIL:?Set EMON_EMAIL in .env}"
: "${EMON_PASSWORD:?Set EMON_PASSWORD in .env}"

REGION="${AWS_REGION:-us-east-1}"
STACK="${STACK_NAME:-arins-study-diary-api}"
MODEL="${BEDROCK_MODEL_ID:-us.anthropic.claude-sonnet-4-6}"
# * until Vercel URL is known; redeploy with real origin later if desired
ORIGIN="${ALLOWED_ORIGIN_DEPLOY:-*}"
DB_NAME="${MONGODB_DB_NAME:-arins_study_diary}"

cd "$BACKEND"
npm install
npm run build

echo "Deploying stack=$STACK region=$REGION ..."
sam deploy \
  --template-file template.yaml \
  --stack-name "$STACK" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "MongoDbUri=${MONGODB_URI}" \
    "MongoDbName=${DB_NAME}" \
    "AppJwtSecret=${APP_JWT_SECRET}" \
    "ArinEmail=${ARIN_EMAIL}" \
    "ArinPassword=${ARIN_PASSWORD}" \
    "EmonEmail=${EMON_EMAIL}" \
    "EmonPassword=${EMON_PASSWORD}" \
    "BedrockModelId=${MODEL}" \
    "AllowedOrigin=${ORIGIN}" \
    "SmtpHost=${SMTP_HOST:-}" \
    "SmtpPort=${SMTP_PORT:-587}" \
    "SmtpUser=${SMTP_USER:-}" \
    "SmtpPass=${SMTP_PASS:-}" \
    "SmtpFrom=${SMTP_FROM_EMAIL:-diary@neamulkabiremon.com}" \
    "ReminderCronSecret=${REMINDER_CRON_SECRET:-}"

echo ""
echo "API URL:"
aws cloudformation describe-stacks \
  --stack-name "$STACK" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text

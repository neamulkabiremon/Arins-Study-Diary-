#!/usr/bin/env bash
# Quick Bedrock smoke test (no photo). Confirms model access in this account/region.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
MODEL="${BEDROCK_MODEL_ID:-us.anthropic.claude-sonnet-4-6}"

echo "Testing Bedrock InvokeModel in $REGION model=$MODEL ..."
aws bedrock-runtime invoke-model \
  --region "$REGION" \
  --model-id "$MODEL" \
  --content-type application/json \
  --accept application/json \
  --body "$(python3 - <<'PY'
import json, base64
# tiny 1x1 png
png = base64.b64decode(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)
b64 = base64.b64encode(png).decode()
payload = {
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 64,
  "messages": [{
    "role": "user",
    "content": [
      {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}},
      {"type": "text", "text": "Reply with JSON only: {\"ok\": true}"}
    ]
  }]
}
print(json.dumps(payload))
PY
)" \
  /tmp/bedrock-out.json

echo "Response saved to /tmp/bedrock-out.json"
python3 - <<'PY'
import json
print(json.load(open("/tmp/bedrock-out.json")))
PY

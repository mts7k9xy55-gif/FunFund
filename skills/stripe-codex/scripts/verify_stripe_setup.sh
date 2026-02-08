#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
ENV_FILE="${ROOT_DIR}/.env.local"

required_files=(
  "src/app/api/stripe/checkout/route.ts"
  "src/app/api/stripe/webhook/route.ts"
  "convex/stripe.ts"
)

required_vars=(
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "STRIPE_PRICE_ID"
  "NEXT_PUBLIC_SITE_URL"
  "NEXT_PUBLIC_CONVEX_URL"
)

missing=0

echo "[check] files"
for file in "${required_files[@]}"; do
  if [[ -f "${ROOT_DIR}/${file}" ]]; then
    echo "  OK   ${file}"
  else
    echo "  MISS ${file}"
    missing=1
  fi
done

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[warn] ${ENV_FILE} not found"
  exit 1
fi

echo "[check] env vars in ${ENV_FILE}"
for key in "${required_vars[@]}"; do
  line="$(grep -E "^${key}=" "${ENV_FILE}" || true)"
  value="${line#*=}"
  if [[ -z "${line}" || -z "${value}" || "${value}" == *"..." ]]; then
    echo "  MISS ${key}"
    missing=1
  else
    echo "  OK   ${key}"
  fi
done

if [[ ${missing} -eq 0 ]]; then
  echo "[result] Stripe setup looks ready."
  exit 0
fi

echo "[result] Stripe setup has gaps."
exit 1


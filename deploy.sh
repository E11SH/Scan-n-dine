#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  ScannDine – Full Deploy Script
#  Reads SMTP credentials from .env automatically.
#  Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────
set -e

SUPABASE_PROJECT_REF="hcvcpdcdmvmezqvfeolk"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Load .env ─────────────────────────────────────────────
[[ ! -f .env ]] && error ".env file not found."
export $(grep -v '^#' .env | grep -v '^$' | xargs)

[[ -z "$SMTP_HOST" ]]       && error "SMTP_HOST missing from .env"
[[ -z "$SMTP_USER" ]]       && error "SMTP_USER missing from .env"
[[ -z "$SMTP_PASS" ]]       && error "SMTP_PASS missing from .env"
[[ -z "$RECIPIENT_EMAIL" ]] && error "RECIPIENT_EMAIL missing from .env"

# ── Step 1: Patch script.js with real project ref ────────
info "Patching script.js with Supabase project ref..."
sed -i "s|YOUR_PROJECT_REF|${SUPABASE_PROJECT_REF}|g" script.js
info "script.js updated."

# ── Step 2: Login to Supabase ─────────────────────────────
info "Logging in to Supabase (browser will open)..."
~/bin/supabase.exe login

# ── Step 3: Link project ──────────────────────────────────
info "Linking to Supabase project ${SUPABASE_PROJECT_REF}..."
~/bin/supabase.exe link --project-ref "$SUPABASE_PROJECT_REF"

# ── Step 4: Run DB migration ──────────────────────────────
info "Pushing database migration..."
~/bin/supabase.exe db push --project-ref "$SUPABASE_PROJECT_REF"

# ── Step 5: Set Edge Function secrets ────────────────────
info "Setting Edge Function secrets..."
~/bin/supabase.exe secrets set \
  SMTP_HOST="$SMTP_HOST" \
  SMTP_PORT="${SMTP_PORT:-465}" \
  SMTP_SECURE="${SMTP_SECURE:-true}" \
  SMTP_USER="$SMTP_USER" \
  SMTP_PASS="$SMTP_PASS" \
  RECIPIENT_EMAIL="$RECIPIENT_EMAIL" \
  --project-ref "$SUPABASE_PROJECT_REF"
info "Secrets set."

# ── Step 6: Deploy Edge Function ─────────────────────────
info "Deploying contact Edge Function..."
~/bin/supabase.exe functions deploy contact --project-ref "$SUPABASE_PROJECT_REF"
info "Edge Function deployed."

# ── Step 7: Commit & push changes ───────────────────────
info "Committing and pushing changes..."
git add -A
git commit -m "chore: update Edge Function to Gmail SMTP and patch project ref" || true
git push origin main

# ── Step 8: Deploy frontend to Vercel ────────────────────
info "Deploying frontend to Vercel (browser may open for login)..."
vercel --prod

info ""
info "════════════════════════════════════════════"
info " ScannDine is LIVE!"
info " Edge Function: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/contact"
info " Frontend:      check the Vercel URL above"
info "════════════════════════════════════════════"

#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  ScannDine – Full Deploy Script
#  Run this once after filling in your credentials below.
#  Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────
set -e

# ── FILL THESE IN ────────────────────────────────────────
SUPABASE_PROJECT_REF=""        # e.g. abcdefghijklmnop (Settings → General → Reference ID)
RESEND_API_KEY=""              # e.g. re_xxxxxxxxxxxx   (resend.com → API Keys)
RECIPIENT_EMAIL=""             # e.g. you@yourdomain.com
SENDER_EMAIL=""                # e.g. noreply@yourdomain.com (must be verified in Resend)
# ─────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Validate inputs ───────────────────────────────────────
[[ -z "$SUPABASE_PROJECT_REF" ]] && error "Set SUPABASE_PROJECT_REF in deploy.sh before running."
[[ -z "$RESEND_API_KEY" ]]       && error "Set RESEND_API_KEY in deploy.sh before running."
[[ -z "$RECIPIENT_EMAIL" ]]      && error "Set RECIPIENT_EMAIL in deploy.sh before running."
[[ -z "$SENDER_EMAIL" ]]         && error "Set SENDER_EMAIL in deploy.sh before running."

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
  RESEND_API_KEY="$RESEND_API_KEY" \
  RECIPIENT_EMAIL="$RECIPIENT_EMAIL" \
  SENDER_EMAIL="$SENDER_EMAIL" \
  --project-ref "$SUPABASE_PROJECT_REF"
info "Secrets set."

# ── Step 6: Deploy Edge Function ─────────────────────────
info "Deploying contact Edge Function..."
~/bin/supabase.exe functions deploy contact --project-ref "$SUPABASE_PROJECT_REF"
info "Edge Function deployed."

# ── Step 7: Commit changes ───────────────────────────────
info "Committing changes..."
git add -A
git commit -m "chore: wire up Supabase Edge Function and Vercel deploy config"

# ── Step 8: Deploy frontend to Vercel ────────────────────
info "Deploying frontend to Vercel (browser may open for login)..."
vercel --prod

info ""
info "════════════════════════════════════════════"
info " ScannDine is LIVE!"
info " Edge Function: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/contact"
info " Frontend:      check the Vercel URL above"
info "════════════════════════════════════════════"

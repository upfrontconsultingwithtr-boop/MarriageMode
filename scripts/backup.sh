#!/usr/bin/env bash
# Nightly free backup: dumps Marriage Mode's own data, locks it with a passphrase (AES-256),
# and writes backup/marriage-mode-<date>.sql.gz.gpg. Needs DB_URL and BACKUP_PASSPHRASE.
# Restore (into a Supabase project): gpg -d FILE | gunzip | psql "<database url>"  (tested: 0 errors)
set -euo pipefail
: "${DB_URL:?}" "${BACKUP_PASSPHRASE:?}"
PG_DUMP=${PG_DUMP:-pg_dump}
out="backup/marriage-mode-$(date -u +%F).sql.gz.gpg"; mkdir -p backup
{
  "$PG_DUMP" "$DB_URL" --no-owner --no-privileges --schema=app --schema=ops --schema=private
  "$PG_DUMP" "$DB_URL" --no-owner --no-privileges --data-only --table=auth.users --table=auth.identities
} | gzip -9 | gpg --batch --yes --pinentry-mode loopback --symmetric --cipher-algo AES256 \
      --passphrase-fd 3 -o "$out" 3<<<"$BACKUP_PASSPHRASE"
echo "saved $out ($(du -h "$out" | cut -f1))"

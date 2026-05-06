#!/usr/bin/env bash
# Creates the three GitHub teams referenced in .github/CODEOWNERS and grants
# each team read access to this repository.
#
# Prerequisites:
#   - GitHub CLI installed: https://cli.github.com/
#   - Authenticated as an org owner:  gh auth login
#   - Run from the repo root, or set ORG / REPO below manually.
#
# Usage:
#   bash .github/setup-teams.sh
#   bash .github/setup-teams.sh my-org my-org/my-repo   # override org and repo
#
# What this script does:
#   1. Creates three org-level teams (idempotent — safe to re-run):
#        mobile-team   → owns artifacts/mobile/
#        backend-team  → owns artifacts/api-server/
#        infra-team    → owns lib/  and  .github/
#   2. Grants each team "pull" (read) access to the repository so that
#      GitHub can resolve the @org/team slugs used in CODEOWNERS.
#
# Slug note:
#   GitHub derives the team slug from the name field.  To guarantee that
#   the slug matches exactly what CODEOWNERS references, this script sets
#   `name` to the slug string itself (e.g. "mobile-team").  Description
#   carries the human-readable label.
#
# After running this script:
#   - Add engineers to the correct team(s) at:
#       https://github.com/orgs/<org>/teams
#   - Membership alone is sufficient — no CODEOWNERS edit needed.

set -euo pipefail

# ── Resolve org and repo ───────────────────────────────────────────────────────
if [[ $# -ge 2 ]]; then
  ORG="$1"
  REPO="$2"
elif [[ $# -eq 1 ]]; then
  ORG="$1"
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
else
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
  ORG="${REPO%%/*}"
fi

# ── Team definitions ───────────────────────────────────────────────────────────
# Each entry: "slug|description"
# The `name` field sent to the API is set to the slug string so that the
# auto-generated GitHub slug matches exactly what CODEOWNERS references.
TEAMS=(
  "mobile-team|Reviewers for the Expo / React Native mobile app (artifacts/mobile/)"
  "backend-team|Reviewers for the Express API server (artifacts/api-server/)"
  "infra-team|Reviewers for shared libraries (lib/) and GitHub config (.github/)"
)

# ── Confirmation prompt ────────────────────────────────────────────────────────
echo ""
echo "This script will create (or update) the following teams in org '${ORG}'"
echo "and grant each team read access to '${REPO}':"
echo ""
echo "  • mobile-team   — owns artifacts/mobile/"
echo "  • backend-team  — owns artifacts/api-server/"
echo "  • infra-team    — owns lib/  and  .github/"
echo ""
echo "Existing teams with the same slug are left intact (members are not changed)."
echo ""

if [[ -t 0 ]]; then
  read -r -p "Continue? [y/N] " CONFIRM
  case "${CONFIRM}" in
    [yY][eE][sS]|[yY]) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

# ── Create teams and grant repo access ────────────────────────────────────────
for entry in "${TEAMS[@]}"; do
  IFS="|" read -r slug description <<< "${entry}"

  echo ""
  echo "── ${slug} ──────────────────────────────────────────────────────────────"

  # Check whether the team already exists.
  # --jq filters the JSON body so no extra parser is needed.
  # 2>/dev/null silences the 404 error message; || true prevents set -e from
  # aborting when the team is absent (gh exits non-zero on 4xx responses).
  existing=$(gh api "orgs/${ORG}/teams/${slug}" --jq '.slug' 2>/dev/null || true)

  if [[ "${existing}" == "${slug}" ]]; then
    echo "  Team already exists — skipping creation."
  else
    echo "  Creating team..."
    # `name` is set to the slug string so GitHub derives the correct slug.
    # The `slug` field is not accepted by the create API and is omitted.
    gh api \
      "orgs/${ORG}/teams" \
      --method POST \
      --header "Accept: application/vnd.github+json" \
      --field name="${slug}" \
      --field description="${description}" \
      --field privacy="closed" \
      --silent
    echo "  Created."
  fi

  # Grant (or refresh) read access to the repo — idempotent
  echo "  Granting read access to ${REPO}..."
  gh api \
    "orgs/${ORG}/teams/${slug}/repos/${REPO}" \
    --method PUT \
    --header "Accept: application/vnd.github+json" \
    --field permission="pull" \
    --silent
  echo "  Access granted."
done

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "Done.  All three teams are now configured in '${ORG}'."
echo ""
echo "Next steps:"
echo "  1. Add engineers to the right team(s):"
echo "       https://github.com/orgs/${ORG}/teams"
echo ""
echo "  2. Each team is already wired into .github/CODEOWNERS:"
echo "       mobile-team   → artifacts/mobile/"
echo "       backend-team  → artifacts/api-server/"
echo "       infra-team    → lib/  and  .github/"
echo ""
echo "  3. New members automatically become code reviewers for"
echo "     the paths their team owns — no further config needed."
echo ""

#!/usr/bin/env bash
# Configures GitHub branch protection on `main` so that all three CI jobs
# must pass (or be skipped) before a pull request can be merged.
#
# Prerequisites:
#   - GitHub CLI installed: https://cli.github.com/
#   - Authenticated:  gh auth login
#   - Run from the repo root, or set REPO below manually.
#
# Usage:
#   bash .github/protect-main.sh
#   bash .github/protect-main.sh owner/repo   # override repo slug
#
# WARNING: The GitHub branch-protection API uses a full PUT (replace), not a
# PATCH (merge).  This means the payload below will OVERWRITE the entire
# protection ruleset for the branch — including any existing required-reviewer
# or push-restriction rules you have already set up in the GitHub UI.
#
# If you already have pull-request review requirements or push restrictions
# configured, either:
#   a) Re-apply them manually in Settings → Branches after running this script,
#   b) Edit the payload below to include those fields before running, or
#   c) Make the changes directly in the GitHub UI instead of using this script.

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
BRANCH="main"

# ── Confirmation prompt ────────────────────────────────────────────────────────
echo ""
echo "This script will REPLACE all branch protection rules on '${BRANCH}'"
echo "in repo '${REPO}' with the settings below:"
echo ""
echo "  Required status checks (CI must pass before merge):"
echo "    • CI / Gate  (job: gate — always runs; passes when the three"
echo "                  path-filtered jobs all passed or were skipped)"
echo ""
echo "  required_pull_request_reviews :"
echo "    • required_approving_review_count : 1"
echo "    • dismiss_stale_reviews           : true  (new commits reset approvals)"
echo "    • require_code_owner_reviews      : false (enable if CODEOWNERS is set up)"
echo "  restrictions                  : null  (no push restrictions)"
echo "  enforce_admins                : true  (admins are also subject to protection rules)"
echo ""
echo "  All existing protection rules (including any PR review and push-restriction"
echo "  settings) will be REPLACED with the values above."
echo ""

if [[ -t 0 ]]; then
  read -r -p "Continue? [y/N] " CONFIRM
  case "${CONFIRM}" in
    [yY][eE][sS]|[yY]) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

# ── Apply protection rules ─────────────────────────────────────────────────────
# Required status check contexts must match EXACTLY what GitHub Actions reports.
# Format: "<Workflow name> / <Job name>"  (name: field in ci.yml, not the job id)
#
# Job ID        name: in ci.yml          GitHub check context
# -----------   ----------------------   --------------------------------
# gate          Gate                     CI / Gate
#
# The gate job always runs and succeeds only when test-mobile, test-api,
# and typecheck all passed or were skipped.  Requiring a single always-present
# check avoids the fragility of path-filtered jobs being absent on doc-only PRs.

echo "Applying branch protection to ${REPO}:${BRANCH} ..."

gh api \
  "repos/${REPO}/branches/${BRANCH}/protection" \
  --method PUT \
  --header "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI / Gate"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null
}
JSON

echo ""
echo "Done. Branch protection is now active on '${BRANCH}'."
echo ""
echo "The 'CI / Gate' check always runs on every PR.  It passes when the three"
echo "path-filtered jobs (test-mobile, test-api, typecheck) all passed or were"
echo "skipped, and fails if any of them failed or were cancelled."
echo ""
echo "At least 1 approving review is now required before merging."
echo "Stale approvals are dismissed automatically when new commits are pushed."
echo ""
echo "To require review from code owners, add a CODEOWNERS file and set"
echo "require_code_owner_reviews to true in the script payload."

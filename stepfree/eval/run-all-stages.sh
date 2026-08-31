#!/usr/bin/env bash
# Run the full experiment ladder: baseline → v1 → v2 → v3 → v4 → final,
# measuring each stage immediately after it completes.
#
#   bash stepfree/eval/run-all-stages.sh [concurrency]
#
# Requires: fixtures verified (node stepfree/eval/run-eval.mjs verify-fixtures)
set -uo pipefail
cd "$(dirname "$0")/../.."

CONC="${1:-2}"
STAGES=(baseline v1 v2 v3 v4 final)

for stage in "${STAGES[@]}"; do
  echo
  echo "════════════════════════════════════════════════════════"
  echo "  STAGE: $stage  ($(date -u +%H:%M:%SZ))"
  echo "════════════════════════════════════════════════════════"
  node stepfree/eval/run-eval.mjs run --stage "$stage" --concurrency "$CONC" || echo "stage $stage had failures"
  node stepfree/eval/run-eval.mjs measure --stage "$stage" || echo "measure $stage failed"
done

node stepfree/eval/run-eval.mjs tables
echo "ALL STAGES COMPLETE $(date -u +%H:%M:%SZ)"

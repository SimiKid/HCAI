#!/usr/bin/env bash
# Regenerates the "Where we applied it" part of docs/hcai-study-guide.md
# from the @hcai tags in the code. Hand-written parts of the guide are kept.
#
# Tag format, in any comment syntax:
#   // @hcai AMR-11 Card says "because you liked 3 ramen places"
#   <!-- @hcai NOR-03 Swipe right moves the card right, like = right -->
#
# Usage: scripts/study-guide.sh   (run from anywhere in the repo)
set -euo pipefail
cd "$(dirname "$0")/.."

CATALOG=.claude/skills/hcai-principles/principles.md
GUIDE=docs/hcai-study-guide.md
BEGIN='<!-- BEGIN GENERATED: do not edit by hand, run scripts/study-guide.sh -->'
END='<!-- END GENERATED -->'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

grep -rnE '@hcai [A-Z]+-[0-9]+' . \
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.claude \
  --exclude-dir=dist --exclude-dir=build --exclude-dir=.next --exclude-dir=.venv \
  --exclude=hcai-study-guide.md --exclude=study-guide.sh \
  > "$tmp/tags" || true

awk -v errfile="$tmp/unknown" '
  # Pass 1: the catalogue. "## Source" headings, "### ID Name" entries.
  FNR == NR {
    if ($0 ~ /^## /) { src = substr($0, 4) }
    if ($0 ~ /^### [A-Z]+-[0-9]+ /) {
      id = $2
      name = substr($0, length("### " id " ") + 1)
      order[++n] = id; names[id] = name; source[id] = src
    }
    next
  }
  # Pass 2: the tags, as "./path:line:content".
  {
    path = $0; sub(/:.*/, "", path); sub(/^\.\//, "", path)
    rest = substr($0, length("./" path ":") + 1)
    line = rest; sub(/:.*/, "", line)
    content = substr(rest, length(line ":") + 1)
    tag = substr(content, index(content, "@hcai ") + 6)
    id = tag; sub(/ .*/, "", id)
    how = substr(tag, length(id) + 1)
    # Cut at an inline comment closer, e.g. "*/}</div>" or "--></button>".
    if ((i = index(how, "*/")) > 0) how = substr(how, 1, i - 1)
    if ((i = index(how, "-->")) > 0) how = substr(how, 1, i - 1)
    sub(/^[ \t]+/, "", how); sub(/[ \t]+$/, "", how)
    if (!(id in names)) { print path ":" line " unknown id " id > errfile; next }
    uses[id] = uses[id] "- `" path ":" line "` " how "\n"
    count[id]++; total++
  }
  END {
    applied = 0
    for (i = 1; i <= n; i++) if (count[order[i]]) applied++
    printf "%d of %d principles applied, %d tags in the code.\n\n", applied, n, total
    last = ""
    for (i = 1; i <= n; i++) {
      id = order[i]
      if (!count[id]) continue
      if (source[id] != last) { printf "### %s\n\n", source[id]; last = source[id] }
      printf "#### %s %s\n\n%s\n", id, names[id], uses[id]
    }
    printf "### Not applied yet\n\n"
    for (i = 1; i <= n; i++) {
      id = order[i]
      if (!count[id]) printf "- %s %s\n", id, names[id]
    }
  }
' "$CATALOG" "$tmp/tags" > "$tmp/generated"

if [ -s "$tmp/unknown" ]; then
  echo "Unknown principle ids (fix the tag or add the id to $CATALOG):" >&2
  cat "$tmp/unknown" >&2
  exit 1
fi

if ! grep -qF "$BEGIN" "$GUIDE" 2>/dev/null; then
  echo "$GUIDE is missing the generated-section markers." >&2
  exit 1
fi

awk -v begin="$BEGIN" -v end="$END" -v gen="$tmp/generated" '
  $0 == begin { print; print ""; while ((getline l < gen) > 0) print l; skip = 1; next }
  $0 == end   { print ""; skip = 0 }
  !skip
' "$GUIDE" > "$tmp/guide"
cp "$tmp/guide" "$GUIDE"

echo "Updated $GUIDE"

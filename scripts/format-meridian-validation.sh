#!/usr/bin/env bash
set -euo pipefail

mapfile -t generated < <(find src/game/world-generation -type f -name '*.ts' | sort)
tests=(
  src/test/city-generation.test.ts
  src/test/architecture-generation.test.ts
  src/test/representation-generation.test.ts
  src/test/building-interaction.test.ts
  src/test/urban-generation.test.ts
  src/test/block-streaming-physics.test.ts
)

npx prettier --write "${generated[@]}" "${tests[@]}"

for file in "${generated[@]}" "${tests[@]}"; do
  printf 'FORMATFILE_BEGIN %s\n' "$file"
  base64 -w0 "$file" | fold -w 4000
  printf '\nFORMATFILE_END %s\n' "$file"
done

# Intentionally fail so this formatter transport can never become a deployable artifact.
exit 1

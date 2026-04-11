#!/bin/bash
OUT="lexicon-deep.html"

cat > "$OUT" << 'HTMLHEAD'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LEXICON DEEP</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1714; }
canvas {
  display: block;
  margin: 0 auto;
  image-rendering: pixelated;
}
</style>
</head>
<body>
<canvas id="game"></canvas>
HTMLHEAD

# Append each module as a script block
for mod in dictionary constants board pathfinder challenges particles audio renderer settings input game; do
  echo "<script>" >> "$OUT"
  cat "modules/${mod}.js" >> "$OUT"
  echo "" >> "$OUT"
  echo "</script>" >> "$OUT"
done

echo "</body></html>" >> "$OUT"

echo "Assembled: $(wc -c < "$OUT") bytes, $(wc -l < "$OUT") lines"

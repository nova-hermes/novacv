#!/bin/bash
# Copy client build output to public/ so Vercel serves them as static files
if [ -d "dist/client" ]; then
  mkdir -p public/client-assets
  cp -r dist/client/assets public/client-assets/
  cp dist/client/*.png public/client-assets/ 2>/dev/null || true
  cp dist/client/*.ico public/client-assets/ 2>/dev/null || true
  cp dist/client/*.svg public/client-assets/ 2>/dev/null || true
  echo "Copied client assets to public/client-assets/"
fi

#!/bin/zsh
# Start de spellenserver (als die nog niet draait) en open een gratis Cloudflare-tunnel,
# zodat een vriend op een ander netwerk mee kan spelen. Ctrl+C sluit de tunnel.
cd "$(dirname "$0")"
CF="$HOME/.local/bin/cloudflared"
if ! lsof -iTCP:4000 -sTCP:LISTEN -t >/dev/null; then
  nohup node server.js >> server.log 2>&1 &
  sleep 1
  echo "Server gestart op poort 4000"
fi
echo "Tunnel openen..."
"$CF" tunnel --url http://localhost:4000 2>&1 | while IFS= read -r line; do
  if [[ "$line" == *trycloudflare.com* ]]; then
    url=$(echo "$line" | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com')
    [[ -z "$url" ]] && continue
    echo; echo "  Stuur deze link naar je vriend:"; echo "  $url"; echo
    echo "$url" | pbcopy && echo "  (link staat op je klembord)"; echo
  fi
done

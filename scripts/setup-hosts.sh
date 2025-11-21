#!/bin/bash

# Setup script to add subdomain entries to /etc/hosts

HOSTS_FILE="/etc/hosts"
ENTRIES=(
  "127.0.0.1 www.localhost"
  "127.0.0.1 web.localhost"
  "127.0.0.1 admin.localhost"
)

echo "Setting up subdomain routing in /etc/hosts..."

for ENTRY in "${ENTRIES[@]}"; do
  SUBDOMAIN=$(echo "$ENTRY" | awk '{print $2}')
  if grep -q "$SUBDOMAIN" "$HOSTS_FILE" 2>/dev/null; then
    echo "✓ $SUBDOMAIN already configured"
  else
    echo "Adding $SUBDOMAIN to /etc/hosts..."
    echo "$ENTRY" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "✓ Added $SUBDOMAIN to /etc/hosts"
  fi
done

echo ""
echo "You can now access:"
echo "  - Web app: http://localhost:3000"
echo "  - Web app: http://www.localhost:3000"
echo "  - Web app: http://web.localhost:3000"
echo "  - Admin app: http://admin.localhost:3001"


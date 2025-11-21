#!/bin/bash

# Setup script to add admin.localhost to /etc/hosts

HOSTS_FILE="/etc/hosts"
ENTRY="127.0.0.1 admin.localhost"

if grep -q "admin.localhost" "$HOSTS_FILE" 2>/dev/null; then
  echo "✓ admin.localhost already configured in /etc/hosts"
else
  echo "Adding admin.localhost to /etc/hosts..."
  echo "$ENTRY" | sudo tee -a "$HOSTS_FILE" > /dev/null
  echo "✓ Added admin.localhost to /etc/hosts"
fi

echo ""
echo "You can now access:"
echo "  - Web app: http://localhost:3000"
echo "  - Admin app: http://admin.localhost:3001"


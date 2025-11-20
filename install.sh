#!/bin/bash

APP_NAME="quicksilver"
INSTALL_DIR="$HOME/.quicksilver"
COMPOSE_URL="http://raw.githubusercontent.com/gfwx/quicksilver/release/docker-compose.yml"

echo "Installing $APP_NAME..."

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download latest compose file
curl -sSL "$COMPOSE_URL" -o docker-compose.yml

# Pull latest images
docker compose pull

# Start the app for the first time
docker compose up -d

# Install watchtower for auto-updates
docker rm -f watchtower >/dev/null 2>&1
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  --cleanup

# Create launcher script
cat <<EOF | sudo tee /usr/local/bin/$APP_NAME >/dev/null
#!/bin/bash
cd "$INSTALL_DIR"

# Pull updates if available (manual/app triggered update)
echo "Checking for updates..."
docker compose pull >/dev/null 2>&1

echo "Starting $APP_NAME..."
docker compose up -d

# Attach logs until user exits
trap "echo Stopping containers...; docker compose down" EXIT
docker compose logs -f
EOF

sudo chmod +x /usr/local/bin/$APP_NAME

# Create uninstall command
cat <<EOF | sudo tee /usr/local/bin/$APP_NAME-uninstall >/dev/null
#!/bin/bash
echo "Stopping and removing all containers..."
docker compose -f "$INSTALL_DIR/docker-compose.yml" down --volumes

echo "Removing watchtower..."
docker rm -f watchtower >/dev/null 2>&1

echo "Removing installation directory..."
rm -rf "$INSTALL_DIR"

echo "Removing launcher commands..."
sudo rm -f /usr/local/bin/$APP_NAME
sudo rm -f /usr/local/bin/$APP_NAME-uninstall

echo "$APP_NAME has been completely uninstalled."
EOF

sudo chmod +x /usr/local/bin/$APP_NAME-uninstall

echo "$APP_NAME installed successfully."
echo "Run with:  $APP_NAME"
echo "Uninstall with:  $APP_NAME-uninstall"

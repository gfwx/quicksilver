#!/bin/bash

APP_NAME="quicksilver"
INSTALL_DIR="$HOME/.quicksilver"
COMPOSE_URL="http://raw.githubusercontent.com/gfwx/quicksilver/release/docker-compose.yml"

# Progress bar function
show_progress() {
    local duration=${1}
    local prefix=${2:-"Progress"}

    already_done() { for ((done=0; done<$elapsed; done++)); do printf "▓"; done }
    remaining() { for ((remain=$elapsed; remain<$duration; remain++)); do printf " "; done }
    percentage() { printf "| %s%%" $(( (($elapsed)*100)/($duration)*100/100 )); }
    clean_line() { printf "\r"; }

    for (( elapsed=1; elapsed<=$duration; elapsed++ )); do
        already_done; remaining; percentage
        sleep 0.1
    done
    clean_line
}

# Monitor docker pull progress
monitor_pull() {
    echo "$1"
    local temp_file=$(mktemp)

    # Run docker compose pull in background and capture output
    docker compose pull > "$temp_file" 2>&1 &
    local pull_pid=$!

    # Show animated progress while pulling
    local spin='-\|/'
    local i=0
    while kill -0 $pull_pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r  ${spin:$i:1} Downloading images... "
        sleep .1
    done

    wait $pull_pid
    local exit_code=$?

    printf "\r  ✓ Download complete     \n"
    rm -f "$temp_file"
    return $exit_code
}

echo "Installing $APP_NAME..."

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download latest compose file
echo "Downloading configuration..."
curl -sSL "$COMPOSE_URL" -o docker-compose.yml
echo "  ✓ Configuration downloaded"

# Pull latest images
monitor_pull "Pulling latest images..."

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

# Monitor docker pull progress
monitor_pull() {
    echo "$1"
    local temp_file=$(mktemp)

    # Run docker compose pull in background and capture output
    docker compose pull > "$temp_file" 2>&1 &
    local pull_pid=$!

    # Show animated progress while pulling
    local spin='-\|/'
    local i=0
    while kill -0 $pull_pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r  ${spin:$i:1} Checking for updates... "
        sleep .1
    done

    wait $pull_pid
    local exit_code=$?

    # Check if images were updated
    if grep -q "Downloaded newer image" "$temp_file" 2>/dev/null; then
        printf "\r  ✓ Updates downloaded    \n"
    else
        printf "\r  ✓ Already up to date    \n"
    fi

    rm -f "$temp_file"
    return $exit_code
}

# Pull updates if available (manual/app triggered update)
monitor_pull "Checking for updates..."

echo "Starting \$APP_NAME..."
docker compose up -d

# Attach logs until user exits
trap "echo Stopping containers...; docker compose down" EXIT
docker compose logs -f
EOF

sudo chmod +x /usr/local/bin/$APP_NAME

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

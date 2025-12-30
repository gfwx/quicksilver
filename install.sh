#!/bin/bash

APP_NAME="quicksilver"
INSTALL_DIR="$HOME/.quicksilver"
COMPOSE_URL="http://raw.githubusercontent.com/gfwx/quicksilver/release/docker-compose.yml"

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

# Check if containers already exist
if docker compose ps -q 2>/dev/null | grep -q .; then
    echo "Existing containers detected"
    echo "Updating containers..."
    docker compose up -d
else
    # Pull latest images only for fresh install
    monitor_pull "Pulling latest images..."

    # Start the app for the first time
    docker compose up -d
fi

# Create or update launcher script
echo "Installing launcher command..."
cat <<'EOF' | sudo tee /usr/local/bin/$APP_NAME >/dev/null
#!/bin/bash
INSTALL_DIR="$HOME/.quicksilver"
APP_NAME="quicksilver"

cd "$INSTALL_DIR"

# Monitor docker pull progress
monitor_pull() {
    echo "$1"
    local temp_file=$(mktemp)

    docker compose pull > "$temp_file" 2>&1 &
    local pull_pid=$!

    local spin='-\|/'
    local i=0
    while kill -0 $pull_pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r  ${spin:$i:1} Pulling images... "
        sleep .1
    done

    wait $pull_pid
    local exit_code=$?

    if grep -q "Downloaded newer image" "$temp_file" 2>/dev/null; then
        printf "\r  ✓ Updates downloaded    \n"
    else
        printf "\r  ✓ Already up to date    \n"
    fi

    rm -f "$temp_file"
    return $exit_code
}

show_help() {
    cat << HELP
Usage: $APP_NAME [COMMAND]

Commands:
  start       Start the application and follow logs (default)
  update      Pull latest updates from Docker Hub
  uninstall   Uninstall the application
  help        Show this help message

Examples:
  $APP_NAME              # Start the app
  $APP_NAME start        # Start the app
  $APP_NAME update       # Update to latest version
  $APP_NAME uninstall    # Remove the app
HELP
}

do_start() {
    echo "Starting $APP_NAME..."
    docker compose up -d

    echo "Attaching to logs (Ctrl+C to exit)..."
    trap "echo; echo 'Stopping containers...'; docker compose down" EXIT
    docker compose logs -f
}

do_update() {
    monitor_pull "Checking for updates..."
    echo "Restarting containers..."
    docker compose up -d
    echo "✓ Update complete"
}

do_uninstall() {
    echo "WARNING: This will remove $APP_NAME and all its data."
    read -p "Are you sure you want to uninstall? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        echo "Uninstall cancelled."
        exit 0
    fi

    echo "Stopping and removing containers..."
    docker compose down --volumes

    echo "Removing installation directory..."
    rm -rf "$INSTALL_DIR"

    echo "Removing launcher command..."
    sudo rm -f /usr/local/bin/$APP_NAME

    echo "$APP_NAME has been uninstalled."
}

# Parse command
case "${1:-start}" in
    start)
        do_start
        ;;
    update)
        do_update
        ;;
    uninstall)
        do_uninstall
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$APP_NAME help' for usage information."
        exit 1
        ;;
esac
EOF

sudo chmod +x /usr/local/bin/$APP_NAME
echo "  ✓ Launcher command installed"

echo "$APP_NAME installed successfully."
echo ""
echo "Usage:"
echo "  $APP_NAME          # Start the app"
echo "  $APP_NAME update   # Update to latest version"
echo "  $APP_NAME uninstall # Remove the app"
echo "  $APP_NAME help     # Show help"

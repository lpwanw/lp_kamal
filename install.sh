#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

REPO="lpwanw/lp_kamal"
INSTALL_DIR="$HOME/.local/bin"

echo -e "${GREEN}Installing lp_kamal...${NC}"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
    darwin)
        case "$ARCH" in
            arm64) BINARY="lp_kamal-darwin-arm64" ;;
            x86_64) BINARY="lp_kamal-darwin-x64" ;;
            *) echo -e "${RED}Unsupported architecture: $ARCH${NC}"; exit 1 ;;
        esac
        ;;
    linux)
        case "$ARCH" in
            x86_64) BINARY="lp_kamal-linux-x64" ;;
            *) echo -e "${RED}Unsupported architecture: $ARCH${NC}"; exit 1 ;;
        esac
        ;;
    *)
        echo -e "${RED}Unsupported OS: $OS${NC}"
        exit 1
        ;;
esac

# Get latest release URL
echo -e "${GREEN}Fetching latest release...${NC}"
LATEST_URL=$(curl -sL "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url.*$BINARY" | cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
    echo -e "${RED}Could not find release for $BINARY${NC}"
    echo -e "${YELLOW}Falling back to build from source...${NC}"

    # Check for Bun
    if ! command -v bun &> /dev/null; then
        echo -e "${YELLOW}Bun not found. Installing Bun first...${NC}"
        curl -fsSL https://bun.sh/install | bash
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
    fi

    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    git clone --depth 1 https://github.com/$REPO.git
    cd lp_kamal
    bun install
    bun build src/index.ts --compile --outfile=lp_kamal
    mkdir -p "$INSTALL_DIR"
    mv lp_kamal "$INSTALL_DIR/"
    cd /
    rm -rf "$TEMP_DIR"
else
    # Download pre-built binary
    echo -e "${GREEN}Downloading $BINARY...${NC}"
    mkdir -p "$INSTALL_DIR"
    curl -sL "$LATEST_URL" -o "$INSTALL_DIR/lp_kamal"
    chmod +x "$INSTALL_DIR/lp_kamal"
fi

echo -e "${GREEN}✓ lp_kamal installed successfully!${NC}"
echo ""

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "${YELLOW}Add this to your shell profile (.bashrc, .zshrc, etc.):${NC}"
    echo ""
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Then restart your terminal or run: source ~/.zshrc"
    echo ""
fi

echo "Usage:"
echo "  lp_kamal --init    # Setup projects"
echo "  lp_kamal           # Deploy"
echo ""

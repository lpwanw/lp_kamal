#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

INSTALL_DIR="$HOME/.local/bin"

echo -e "${GREEN}Installing lp_kamal...${NC}"

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun not found. Installing Bun first...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# Create install directory
mkdir -p "$INSTALL_DIR"

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo -e "${GREEN}Cloning repository...${NC}"
git clone --depth 1 https://github.com/lpwanw/lp_kamal.git
cd lp_kamal

echo -e "${GREEN}Installing dependencies...${NC}"
bun install

echo -e "${GREEN}Building executable...${NC}"
bun build src/index.ts --compile --outfile=lp_kamal

echo -e "${GREEN}Installing to $INSTALL_DIR...${NC}"
mv lp_kamal "$INSTALL_DIR/"

# Cleanup
cd /
rm -rf "$TEMP_DIR"

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

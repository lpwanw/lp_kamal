#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing lp_kamal...${NC}"

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun not found. Installing Bun first...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

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

echo -e "${GREEN}Installing to /usr/local/bin...${NC}"
sudo mv lp_kamal /usr/local/bin/

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✓ lp_kamal installed successfully!${NC}"
echo ""
echo "Usage:"
echo "  lp_kamal --init    # Setup branches"
echo "  lp_kamal           # Deploy"
echo ""

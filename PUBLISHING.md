# Publishing lp_kamal

Guide to push to GitHub and distribute to other computers.

## Push to GitHub

### 1. Create GitHub Repository

```bash
# Create repo on GitHub (via web or gh cli)
gh repo create lp_kamal --public --description "Interactive Kamal deployment CLI"
```

### 2. Initial Push

```bash
# Add all files
git add .

# Commit
git commit -m "feat: initial release of lp_kamal cli"

# Add remote (replace with your username)
git remote add origin https://github.com/YOUR_USERNAME/lp_kamal.git

# Push
git push -u origin main
```

### 3. Create Release

```bash
# Tag version
git tag v0.1.0
git push origin v0.1.0

# Create GitHub release
gh release create v0.1.0 --title "v0.1.0" --notes "Initial release"
```

## Distribution Options

### Option 1: Install Script (Recommended)

Users can install with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/lp_kamal/main/install.sh | bash
```

### Option 2: Pre-built Binaries

Build for multiple platforms and attach to GitHub release:

```bash
# macOS ARM64 (Apple Silicon)
bun build src/index.ts --compile --outfile=lp_kamal-darwin-arm64

# macOS x64 (Intel)
bun build src/index.ts --compile --target=bun-darwin-x64 --outfile=lp_kamal-darwin-x64

# Linux x64
bun build src/index.ts --compile --target=bun-linux-x64 --outfile=lp_kamal-linux-x64

# Linux ARM64
bun build src/index.ts --compile --target=bun-linux-arm64 --outfile=lp_kamal-linux-arm64
```

Upload to release:

```bash
gh release upload v0.1.0 lp_kamal-darwin-arm64 lp_kamal-darwin-x64 lp_kamal-linux-x64 lp_kamal-linux-arm64
```

Users download and install:

```bash
# macOS ARM64
curl -L https://github.com/YOUR_USERNAME/lp_kamal/releases/latest/download/lp_kamal-darwin-arm64 -o lp_kamal
chmod +x lp_kamal
sudo mv lp_kamal /usr/local/bin/
```

### Option 3: Clone and Build

```bash
git clone https://github.com/YOUR_USERNAME/lp_kamal.git
cd lp_kamal
bun install
bun run build:exe
sudo mv lp_kamal /usr/local/bin/
```

## Update README

After pushing, update the install URLs in README.md:

```bash
# Replace YOUR_USERNAME with actual username
sed -i '' 's/lpwanw/YOUR_USERNAME/g' README.md
sed -i '' 's/lpwanw/YOUR_USERNAME/g' install.sh
```

## Versioning

Follow semantic versioning:

- `v0.1.0` - Initial release
- `v0.1.1` - Bug fixes
- `v0.2.0` - New features
- `v1.0.0` - Stable release

## Checklist Before Release

- [ ] Update version in `package.json`
- [ ] Update version in `src/cli.ts`
- [ ] Test `bun run build:exe`
- [ ] Test executable works
- [ ] Commit and push
- [ ] Create git tag
- [ ] Create GitHub release
- [ ] (Optional) Build and upload binaries

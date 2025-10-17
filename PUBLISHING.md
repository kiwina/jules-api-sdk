# Publishing Guide

## 🚀 Quick Start (Recommended)

Publish to **both npm and GitHub Packages** locally:

```bash
# One-time setup
npm login
export GITHUB_TOKEN=ghp_your_token_here  # From: https://github.com/settings/tokens

# Every release (builds locally, publishes to both)
bun run publish:manual
```

✅ Done! The script handles: clean → build → test → publish (npm + GitHub) → tag

---

## Prerequisites

1. **npm account**: https://www.npmjs.com/signup
2. **GitHub token** (for GitHub Packages):
   - Create at: https://github.com/settings/tokens
   - Permission needed: `write:packages`
   - Export: `export GITHUB_TOKEN=ghp_your_token`

---

## Publishing Workflow

### Every Release:

```bash
# 1. Update CHANGELOG.md with changes
# 2. Commit your changes
git add .
git commit -m "feat: add new feature"
git push origin main

# 3. Publish to both registries
bun run publish:manual
```

The script automatically:
- Checks npm authentication
- Cleans and builds
- Runs all tests
- Publishes to npm (with provenance)
- Publishes to GitHub Packages
- Creates and pushes git tag

**Uses 0 GitHub Actions minutes** - everything runs locally!

---

## Manual Steps (if needed)

<details>
<summary>Click to expand manual publishing steps</summary>

### 1. Update version
```bash
# Edit package.json manually, or:
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

### 2. Build and test
```bash
bun run clean
bun run build
bun run test:run
```

### 3. Publish to npm
```bash
npm publish --provenance --access public
```

### 4. Publish to GitHub Packages
```bash
npm config set registry https://npm.pkg.github.com/
npm config set //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
npm publish
npm config set registry https://registry.npmjs.org/
npm config delete //npm.pkg.github.com/:_authToken
```

### 5. Tag and push
```bash
VERSION=$(node -p "require('./package.json').version")
git tag "v$VERSION"
git push origin "v$VERSION"
```

</details>

---

## Why Both Registries?

| Aspect | npm | GitHub Packages |
|--------|-----|-----------------|
| **Discoverability** | ✅ Public search | ❌ Need repo link |
| **Installation** | ✅ No auth | ⚠️ Requires auth |
| **Best for** | Public packages | Private/org use |

---

## Version Strategy

**Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

- `1.0.0` - Initial release
- `1.0.1` - Bug fixes
- `1.1.0` - New features (backwards compatible)
- `2.0.0` - Breaking changes

---

## Installation (for users)

```bash
# From npm (most common, no auth)
npm install @kiwina/jules-api-sdk

# From GitHub Packages (requires GitHub auth)
npm install @kiwina/jules-api-sdk --registry=https://npm.pkg.github.com
```

---

## Troubleshooting

```bash
# Not logged into npm?
npm login

# Missing GITHUB_TOKEN?
export GITHUB_TOKEN=ghp_your_token

# Tests failing?
bun run test:run

# Build errors?
bun run clean && bun run build
```

---

## GitHub Actions (Optional)

A workflow exists at `.github/workflows/publish.yml` for automated publishing, but since you prefer building locally, you can ignore or delete it.

If you want to use it: `git tag v1.0.0 && git push origin v1.0.0`

---

**Support:** https://github.com/kiwina/jules-api-sdk/issues

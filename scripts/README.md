# Publishing Scripts

## publish-manual.sh

Manual publishing script that publishes to both npm and GitHub Packages locally, without using GitHub Actions minutes.

### Usage

```bash
# Setup (first time only)
npm login
export GITHUB_TOKEN=your_github_token  # Optional

# Run the script
bun run publish:manual
# or directly:
./scripts/publish-manual.sh
```

### What it does

1. ✅ Checks npm authentication
2. 🧹 Cleans and builds the package
3. 🧪 Runs tests
4. 📤 Publishes to npm with provenance
5. 📤 Publishes to GitHub Packages (if GITHUB_TOKEN is set)
6. 🏷️ Creates and pushes git tag

### Environment Variables

- `GITHUB_TOKEN` (optional): Personal access token for publishing to GitHub Packages
  - Get one at: https://github.com/settings/tokens
  - Needs `write:packages` permission

### Benefits

- ⚡ Uses 0 GitHub Actions minutes
- 🎯 Full control over the publish process
- 🔍 See all output in real-time
- ❌ No waiting for CI/CD pipeline

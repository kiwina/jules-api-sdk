# Publishing Guide

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **npm login**: Run `npm login` to authenticate (Bun uses npm registry)
3. **Build passing**: All tests must pass
4. **Version bump**: Update version in `package.json`

## Pre-publish Checklist

- [ ] All tests passing (`bun run test --run`)
- [ ] Build successful (`bun run build`)
- [ ] README.md is up-to-date
- [ ] CHANGELOG.md updated with changes
- [ ] Version bumped in `package.json`
- [ ] Git committed and tagged

## Publishing Steps

### 1. Clean and Build

```bash
bun run clean
bun run build
```

### 2. Run Tests

```bash
bun run test:run
```

### 3. Verify Package Contents

```bash
bun pm pack --dry-run
```

This shows what will be included in the published package.

### 4. Version Bump

When Jules API docs are updated, check the "Last updated" timestamp and update `package.json`:

```bash
# API docs show: "Last updated 2025-10-15 UTC"
# Update package.json version to: "2025.10.15"

# For SDK patches (no API change):
# version: "2025.10.2-patch.1"
# version: "2025.10.2-patch.2"
```

Manual edit in `package.json` or use npm:

```bash
npm version 2025.10.15 --no-git-tag-version
```

### 5. Publish to npm

```bash
# For stable releases (recommended)
bun publish

# For beta releases (testing new API version)
bun publish --tag beta

# Alternative: use npm publish (also works)
npm publish
```

### 6. Push to Git

```bash
git push origin main --tags
```

## Version Guidelines

This SDK uses **CalVer (Calendar Versioning)** based on the Jules API documentation timestamp:

- **Format**: `YYYY.MM.DD` (e.g., `2025.10.2` for API updated 2025-10-02)
- **Rationale**: Google only provides "Last updated" timestamp, no semantic versions
- **Updates**: When Google updates the API docs, bump the SDK version to match

### Version Strategy

```bash
# When Jules API docs are updated to 2025-10-15:
# Update version in package.json to: 2025.10.15

# For patch releases (SDK fixes, no API changes):
# Add patch suffix: 2025.10.2-patch.1, 2025.10.2-patch.2, etc.
```

### Examples

- `2025.10.2` - Based on API docs updated 2025-10-02
- `2025.10.2-patch.1` - Bug fix, API unchanged
- `2025.11.5` - Based on API docs updated 2025-11-05
- `2025.11.5-beta.1` - Beta release for new API version

## Current Status

**Version**: 2025.10.2  
**API Docs Date**: 2025-10-02 UTC  
**Status**: ✅ Ready for release  
**Quality**: A+ (100%)

The SDK is production-ready with:
- Complete API coverage (9/9 endpoints)
- Full type safety (discriminated unions)
- Runtime validation (Zod schemas)
- Comprehensive tests (21/21 passing)
- Production features (retry, timeout, logging)

## First Release Commands

```bash
# Verify everything works
bun run clean
bun run build
bun run test:run

# Version is already set to 2025.10.2 in package.json

# Publish stable release
bun publish

# Push to git
git add package.json
git commit -m "Release v2025.10.2"
git tag v2025.10.2
git push origin main --tags
```

## Future Updates

When Google updates the Jules API docs:

```bash
# 1. Check API docs for new "Last updated" date
#    Example: "Last updated 2025-11-15 UTC"
#    Visit: https://developers.google.com/jules/api

# 2. Review changes in API documentation
#    - Check for new endpoints or parameters
#    - Review any breaking changes
#    - Note deprecated features

# 3. Update SDK code if needed
#    - Update src/client.ts and src/schemas/ as needed
#    - Add/update tests in test/
#    - Update README.md and examples

# 4. Update version in package.json
#    "version": "2025.11.15"

# 5. Update README.md with new date
#    **SDK Version:** 2025.11.15 (based on Jules API last updated 2025-11-15 UTC)

# 6. Update CHANGELOG.md
#    Add new version section with changes

# 7. Run tests and publish
bun run clean && bun run build && bun run test:run
bun publish

# 8. Tag and push
git add .
git commit -m "Release v2025.11.15 - API updated"
git tag v2025.11.15
git push origin main --tags
```

## Automated Publishing (CI/CD)

Add to `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - run: bun run test:run
      - uses: JS-DevTools/npm-publish@v2
        with:
          token: ${{ secrets.NPM_TOKEN }}
```

## Post-publish Verification

```bash
# Install from npm with Bun
bun add @kiwina/jules-api-sdk

# Or with npm
npm install @kiwina/jules-api-sdk

# Verify it works
node -e "const {JulesClient} = require('@kiwina/jules-api-sdk'); console.log('✅ Package works!')"

# Or with Bun
bun -e "import {JulesClient} from '@kiwina/jules-api-sdk'; console.log('✅ Package works!')"
```

## Troubleshooting

### Package already exists
- Bump version in `package.json`
- Ensure you have publish rights to `@kiwina` scope

### Tests failing
- Run `bun run test:run` locally
- Fix failing tests before publishing

### Build errors
- Run `bun run clean && bun run build`
- Check TypeScript errors in output

## Support

For issues, create a GitHub issue at:
https://github.com/kiwina/jules-api-sdk/issues

# Contributing to stellar-agent-registry

Thank you for your interest in contributing! This project is built for the Stellar ecosystem and welcomes contributions of all kinds.

## Getting started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/stellar-agent-registry`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feat/your-feature`

## Development workflow

```bash
# Run tests (watch mode)
npm run test:watch --workspace=packages/sdk

# Type check all packages
npm run typecheck

# Build everything
npm run build
```

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add batch lookup support
fix(react): correct shimmer animation in AgentCard
docs: update quick-start example
test(sdk): add edge case for empty capabilities
```

## Pull requests

- Open an issue first for non-trivial changes
- Fill in the PR template completely
- Ensure CI passes before requesting review

## Code of conduct

Be kind and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

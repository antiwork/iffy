# Contributing to Iffy

Thanks for your interest in contributing! This document will help you get started.

## Environment

For detailed instructions on setting up your local development environment, please refer to the [README](README.md).

## Development

1. Create your feature branch

```bash
git checkout -b feature/your-feature
```

1. Run the development server

```bash
npm run dev
```

1. (Optionally) Run asynchronous jobs

```bash
npm run dev:inngest
```

1. Run API (unit) tests

```bash
npm run test
```

1. Run app (end-to-end) tests

```bash
npm run shortest
npm run shortest -- --no-cache # with arguments
```

## Testing Guidelines

- We use Vitest for our unit test suite
- We use Shortest for end-to-end tests
- Don't mock database queries in tests, rely on the seed data or inserting test data as part of the test

## Pull Request

1. Update documentation if you're changing behavior
1. Add or update tests for your changes
1. Make sure all tests pass
1. Request a review from maintainers
1. After reviews begin, avoid force-pushing to your branch
   - Force-pushing rewrites history and makes review threads hard to follow
   - Don't worry about messy commits - we squash everything when merging to main
1. The PR will be merged once you have the sign-off of at least one maintainer

## Style Guide

- Write in TypeScript
- Follow the existing code patterns
- Use clear, descriptive variable names

## Writing Bug Reports

A great bug report includes:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Writing commit messages

We use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

A commit message should be structured as follows:

```bash
type(scope): title

description
```

Where type can be:

- `feat`: new feature or enhancement
- `fix`: bug fixes
- `docs`: documentation-only changes
- `test`: test-only changes
- `refactor`: code improvements without behaviour changes
- `chore`: maintenance/anything else

Example:

```
feat(cli): Add mobile testing support
```

## Help

- Check existing discussions/issues/PRs before creating new ones
- Start a discussion for questions or ideas
- Open an [issue](https://github.com/anti-work/iffy/issues) for bugs or problems

## License

By contributing, you agree that your contributions will be licensed under the [Iffy Community License](LICENSE.md).

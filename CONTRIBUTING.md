# Contributing Guide

Thank you for considering contributing to the Sustainability IoT Monorepo! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sus.git
   cd sus
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/masaki-kasuga/sus.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   # or
   make install
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Keep your fork up to date

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Make your changes

```bash
# Create a feature branch
git checkout -b feature/amazing-feature

# Make changes
# ...

# Test your changes
make lint
make build
make ci
```

### 3. Commit your changes

Follow the [Commit Guidelines](#commit-guidelines):

```bash
git add .
git commit -m "feat: add amazing feature"
```

### 4. Push to your fork

```bash
git push origin feature/amazing-feature
```

### 5. Create a Pull Request

Go to the GitHub repository and create a Pull Request from your fork.

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Scope (Optional)

- **api**: Changes to the API
- **dashboard**: Changes to the Dashboard
- **devices**: Changes to IoT devices
- **docs**: Documentation changes
- **deps**: Dependency updates

### Examples

```bash
feat(api): add endpoint for sensor data aggregation

fix(dashboard): resolve chart rendering issue on mobile

docs: update installation instructions

chore(deps): update TypeScript to 5.3.3
```

## Pull Request Process

1. **Ensure your PR:**
   - Follows the coding standards
   - Passes all CI checks
   - Includes relevant tests (when applicable)
   - Updates documentation as needed

2. **PR Title:**
   - Follow the same format as commit messages
   - Example: `feat(api): add user authentication`

3. **PR Description:**
   - Describe what changes you made
   - Explain why you made these changes
   - Link to any related issues
   - Include screenshots for UI changes

4. **Review Process:**
   - A maintainer will review your PR
   - Address any feedback or requested changes
   - Once approved, your PR will be merged

### PR Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Lint passed (`make lint`)
- [ ] Build passed (`make build`)
- [ ] Tested locally
- [ ] Tested in Docker

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type when possible
- Use proper type annotations
- Follow ESLint rules

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line Length**: 100 characters max (recommended)

### File Structure

```
apps/
├── api/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── repository/      # Data access
│   │   ├── middlewares/     # Express middlewares
│   │   ├── routes/          # Route definitions
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── tests/               # Test files
└── dashboard/
    └── src/
        ├── components/      # React components
        ├── pages/           # Page components
        ├── hooks/           # Custom hooks
        ├── services/        # API services
        └── types/           # TypeScript types
```

### Naming Conventions

- **Files**: `camelCase.ts` or `PascalCase.tsx` (React components)
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` with `I` prefix (optional)
- **Types**: `PascalCase`

### Documentation

- Add JSDoc comments for public APIs
- Document complex logic
- Update README files when adding features
- Keep CHANGELOG up to date (handled by Release Please)

### Testing

- Write tests for new features
- Ensure tests pass before submitting PR
- Run `make ci` to verify all checks

## Questions?

If you have questions, please:
1. Check the [DEVELOPMENT.md](DEVELOPMENT.md) guide
2. Check existing issues on GitHub
3. Create a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

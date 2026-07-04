# Contributing to Spendly

Thank you for taking the time to contribute! 🎉  
We welcome bug reports, feature suggestions, documentation improvements, and pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [Development Setup](#development-setup)
- [Project Structure Overview](#project-structure-overview)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Commit Message Convention](#commit-message-convention)
- [Code Style — ESLint & Prettier](#code-style--eslint--prettier)
- [Running Tests](#running-tests)
- [Branch Naming Convention](#branch-naming-convention)

---

## Code of Conduct

This project follows a simple rule: **be kind, be constructive, be collaborative.**  
Please treat all contributors with respect in every interaction.

---

## How to Report a Bug

1. **Search existing issues** first — your bug may already be tracked.
2. If not, open a new issue and include:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs. actual behaviour
   - Your environment:
     - Spendly version / commit hash
     - OS (Windows / macOS / Linux)
     - Node.js & npm version (`node -v && npm -v`)
     - Device or emulator (model, Android API level)
     - Expo SDK version (`expo --version`)
   - Any relevant logs, screenshots, or screen recordings

Use the **Bug Report** issue template when available.

---

## How to Request a Feature

1. **Search existing issues** to avoid duplicates.
2. Open a new issue with:
   - A clear description of the feature and the problem it solves
   - Use cases and expected behaviour
   - Any design mockups or references (optional but appreciated)

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI — `npm install -g expo-cli`
- Android Studio with a configured AVD (Android Virtual Device)

### Steps

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/spendly.git
cd spendly

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start the development server
npx expo start

# 5. Press 'a' to launch on Android emulator
```

### Optional: Start the backend server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

The backend runs on `http://localhost:3000` by default.

---

## Project Structure Overview

```
src/
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── services/     # API calls and business logic
├── stores/       # Zustand state stores
├── database/     # Drizzle schema and migrations
├── sync/         # Offline sync engine
├── utils/        # Pure utility functions
└── theme/        # Design tokens
```

Keep new code in the appropriate directory. If you're unsure, open a discussion first.

---

## Submitting a Pull Request

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Make your changes, following the code style guidelines below.
3. Add or update tests to cover your changes.
4. Ensure all tests pass:
   ```bash
   npm test
   ```
5. Ensure linting passes:
   ```bash
   npx eslint .
   npx prettier --check .
   ```
6. **Commit** using the [Conventional Commits](#commit-message-convention) format.
7. **Push** your branch and open a Pull Request against `main`.

### PR Checklist

- [ ] Code follows the ESLint + Prettier style
- [ ] Tests added / updated for new functionality
- [ ] All existing tests pass (`npm test`)
- [ ] Self-review of the diff completed
- [ ] Descriptive PR title and summary provided
- [ ] Linked to a related issue (if applicable)

---

## Commit Message Convention

This project uses **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)**.

### Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When to use                                             |
|------------|---------------------------------------------------------|
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Formatting, missing semicolons — no logic change        |
| `refactor` | Code restructuring without feature or bug change        |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests                                |
| `chore`    | Build process, tooling, dependency updates              |
| `ci`       | CI/CD configuration changes                             |

### Examples

```
feat(transactions): add attachment support for expense entries

fix(sync): handle network timeout gracefully during background sync

docs(readme): update prerequisites for Node.js 20

test(budget): add unit tests for over-budget alert logic

chore(deps): bump drizzle-orm from 0.44.0 to 0.45.2
```

> **Breaking changes** must include `BREAKING CHANGE:` in the commit footer.

---

## Code Style — ESLint & Prettier

The project enforces consistent code style via **ESLint 10** and **Prettier 3**.

### Configuration files

| Tool     | Config file          |
|----------|----------------------|
| ESLint   | `eslint.config.js`   |
| Prettier | `.prettierrc`        |

### Running the linter

```bash
# Check for lint errors
npx eslint .

# Auto-fix fixable issues
npx eslint . --fix
```

### Running Prettier

```bash
# Check formatting
npx prettier --check .

# Auto-format all files
npx prettier --write .
```

> We recommend installing the **ESLint** and **Prettier** extensions in your editor and enabling **"Format on Save"** for the smoothest experience.

### Key rules

- TypeScript strict mode is **enabled** — avoid `any` types
- React Hooks rules are enforced via `eslint-plugin-react-hooks`
- Import ordering is enforced — group: built-ins → external packages → internal modules
- No unused variables or imports

---

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage report
npm test -- --coverage
```

### Writing tests

- Place unit tests in `tests/unit/`
- Mirror the source structure (e.g., `src/utils/currency.ts` → `tests/unit/utils/currency.test.ts`)
- Use `@testing-library/react-native` for component tests
- Use `@testing-library/react-hooks` for custom hook tests
- Mock `expo-sqlite` and network calls in unit tests — do not make real I/O in tests

---

## Branch Naming Convention

| Branch prefix | Purpose                          | Example                        |
|---------------|----------------------------------|--------------------------------|
| `feat/`       | New feature                      | `feat/budget-alerts`           |
| `fix/`        | Bug fix                          | `fix/sync-timeout`             |
| `docs/`       | Documentation updates            | `docs/contributing-guide`      |
| `refactor/`   | Code refactoring                 | `refactor/di-container`        |
| `test/`       | Test additions or updates        | `test/transaction-service`     |
| `chore/`      | Tooling, config, or deps         | `chore/bump-expo-57`           |

---

Thank you again for contributing to Spendly! 🚀  
If you have any questions, feel free to open a discussion or reach out via an issue.

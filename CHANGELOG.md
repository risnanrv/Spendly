# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- iOS platform support
- iCloud / Google Drive backup integration
- Multi-currency support with live exchange rates
- Recurring transaction scheduler
- Dark / light theme toggle

---

## [1.0.0] - 2026-07-03

### Added
- **Offline-first local database** powered by `expo-sqlite` and Drizzle ORM with full CRUD for transactions, categories, and budgets
- **Expense & income tracking** with category tagging, date picker, notes, and attachment support via Expo Document Picker and Image Picker
- **Interactive dashboard charts** (bar, line, pie) using React Native Gifted Charts showing daily, weekly, and monthly spending summaries
- **Budget management** — per-category monthly budget limits with progress indicators and over-budget alerts
- **Push notifications** via Expo Notifications for budget threshold warnings and daily spending reminders
- **PDF & CSV export** — generate and share financial reports using Expo Print and Expo Sharing
- **Background sync engine** in `src/sync/` that detects network availability via `@react-native-community/netinfo` and syncs with the optional Express + Prisma backend
- **Secure credential storage** using `expo-secure-store` for auth tokens and sensitive user preferences
- **File-based routing** via Expo Router with authenticated `(app)` and unauthenticated `(auth)` route groups
- **Global state management** with Zustand 5 stores and TanStack React Query 5 for server-state caching
- **Form validation** with React Hook Form 7 and Zod 4 schema validation across all input screens
- **NativeWind 4 styling** with a curated design system defined in `tailwind.config.js` and `src/theme/`
- **Dependency injection** container in `src/di/` for decoupled service instantiation
- **Unit test suite** with Jest 29, jest-expo preset, and @testing-library/react-native
- **ESLint 10 + Prettier 3** configuration for consistent code style across the project
- **TypeScript 6** strict mode configuration with path aliases via `tsconfig.json`
- **Inter font** integration via `@expo-google-fonts/inter` for polished typography
- **Haptic feedback** on key interactions using `expo-haptics`
- Initial `README.md`, `CONTRIBUTING.md`, and `CHANGELOG.md` project documentation

### Fixed
- N/A (initial release)

### Security
- Sensitive data (tokens, credentials) stored exclusively in Expo SecureStore — never in AsyncStorage or plain files
- `EXPO_PUBLIC_` environment variables validated at startup; application refuses to start if required variables are missing

---

[Unreleased]: https://github.com/your-username/spendly/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-username/spendly/releases/tag/v1.0.0

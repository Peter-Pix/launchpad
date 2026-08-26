# Contributor Guide

Thank you for considering contributing to Launchpad! This document outlines the process and standards for contributing to the project.

## How to Contribute

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/launchpad.git
   cd launchpad
   ```
3. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```
4. **Make your changes** following the coding standards below
5. **Test your changes** locally:
   ```bash
   npm run dev
   ```
6. **Commit your changes** using conventional commits (see below)
7. **Push to your fork** and open a Pull Request

## Development Setup

### Prerequisites
- Node.js ≥20 (LTS recommended)
- npm ≥10
- Git

### Installation
```bash
# Clone and install dependencies
git clone https://github.com/your-username/launchpad.git
cd launchpad
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:3005](http://localhost:3005).

## Coding Standards

### TypeScript
- We use Strict TypeScript (`tsconfig.json` has `"strict": true`)
- Always define types for function parameters and return values
- Use interfaces for object shapes, types for unions/primitives
- Prefer `const` over `let`, `let` over `var`

### React & Next.js
- Use functional components with hooks
- Follow Next.js 16 App Router conventions
- Keep components small and focused
- Use Tailwind CSS utility classes for styling (see `app/globals.css`)
- Client components must be marked with `"use client"` directive

### File Organization
```
launchpad/
├── app/                 # Next.js app router
│   ├── api/             # API route handlers
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main UI
├── lib/                 # Shared utilities
│   ├── discover.ts      # Application auto-discovery
│   ├── i18n.ts          # Internationalization (EN/CZ)
│   ├── log-level.ts     # Log level detection
│   └── root.ts          # Root path configuration
├── public/              # Static assets
└── styles/              # Global CSS (Tailwind base)
```

### Internationalization
- All user-facing strings go through the `t()` helper from `@/lib/i18n`
- Never hardcode UI strings in JSX
- Add new strings to both `en` and `cs` dictionaries in `i18n.ts`
- Use `useCallback` wrapping for the `t` function in components

### Styling
- Uses Tailwind CSS via PostCSS
- Utility-first approach: prefer utility classes over custom CSS
- Custom CSS goes in `app/globals.css` only when absolutely necessary
- Responsive design: use Tailwind's responsive prefixes (sm:, md:, lg:, xl:)

### API Routes
- All API routes are in `app/api/`
- Use Next.js 16 Route Handlers (export GET, POST, etc. functions)
- Validate all inputs (especially file paths)
- Return appropriate HTTP status codes
- Handle errors gracefully with try/catch

### State Management
- React state (`useState`, `useReducer`) for UI state
- `localStorage` for persistent user settings (path, language)
- Avoid global state unless absolutely necessary
- Derive state from props when possible

### Performance
- Keep component re-renders to a minimum
- Use `React.memo` for expensive components when appropriate
- Debounce expensive operations (search, filtering)
- Virtualize long lists if needed (not currently implemented)

## Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat:` — A new feature
- `fix:` — A bug fix
- `docs:` — Documentation only changes
- `style:` — Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor:` — A code change that neither fixes a bug nor adds a feature
- `perf:` — A code change that improves performance
- `test:` — Adding missing tests or correcting existing tests
- `chore:` — Changes to the build process or auxiliary tools and libraries

### Examples
- `feat: add language toggle to header`
- `fix: correct port conflict detection logic`
- `docs: update user guide with new settings explanation`
- `refactor: extract discoverApps function to lib/discover.ts`
- `perf: debounce search input to reduce API calls`
- `test: add unit tests for root path validation`

## Pull Request Process

1. **Update README.md** if needed with changes to functionality
2. **Ensure your code passes TypeScript checks**: `npm run build`
3. **Test your changes** manually in development mode
4. **Update documentation** in `/docs/` if your changes affect usage
5. **Keep changes focused** — one PR should address one issue/feature
6. **Write a clear PR description** explaining what and why
7. **Link to any related issues** using `fixes #issue` or `closes #issue`

## Code Review

- All PRs require at least one approval from a maintainer
- Review focuses on:
  - Correctness and completeness
  - Adherence to coding standards
  - Performance implications
  - Security considerations
  - Test coverage (when applicable)
  - Documentation quality

## Reporting Issues

When reporting bugs, please include:
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Launchpad version** (from footer or `package.json`)
- **Environment** (OS, Node.js version, browser)

## Getting Help

If you're stuck or have questions:
1. Check the existing documentation in `/docs/`
2. Look through existing issues and PRs
3. Ask in the GitHub Discussions tab
4. As a last resort, tag a maintainer in an issue

Thank you for contributing to Launchpad!

# Development Workflow

## Setting Up the Development Environment

### Prerequisites
- Node.js ≥20 (LTS version recommended)
- npm ≥10
- Git

### Installation
```bash
# Fork and clone the repository
git clone https://github.com/your-username/launchpad.git
cd launchpad

# Install dependencies
npm install

# Verify installation
npx tsc --noEmit  # Should show no errors
```

### Starting the Development Server
```bash
npm run dev
```

The application will be available at [http://localhost:3005](http://localhost:3005).

## Project Structure

```
launchpad/
├── app/                 # Next.js app router (React 19, TypeScript)
│   ├── api/             # API route handlers (Node.js backend)
│   │   ├── apps/        # Application management endpoints
│   │   │   ├── start/route.ts     # POST - start application
│   │   │   ├── kill/route.ts      # POST - stop application
│   │   │   ├── logs/              # Log management endpoints
│   │   │   │   ├── route.ts       # GET - get recent logs
│   │   │   │   ├── stream/route.ts # GET - SSE log stream
│   │   │   │   ├── clear/route.ts  # POST - clear logs
│   │   │   │   └── download/route.ts # GET - download logs
│   │   │   ├── workspace/         # Workspace management
│   │   │   │   └── route.ts       # GET/POST - workspace operations
│   │   │   ├── health/route.ts    # GET - health check
│   │   │   └── settings/route.ts  # GET/POST - settings management
│   │   └── apps/route.ts          # GET - list all applications
│   ├── layout.tsx       # Root layout (HTML structure)
│   └── page.tsx         # Main UI component
├── lib/                 # Shared utility functions (TypeScript)
│   ├── discover.ts      # Application auto-discovery logic
│   ├── i18n.ts          # Internationalization (EN/CZ)
│   ├── log-level.ts     # Log level detection
│   └── root.ts          # Root path configuration and validation
├── public/              # Static assets (favicon, icons, etc.)
├── styles/              # Global CSS (Tailwind base)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## Key Development Areas

### 1. Adding New Features
When adding a new feature:
1. **Backend API** (if needed):
   - Create new route in `app/api/[feature]/route.ts`
   - Implement handler functions (GET, POST, etc.)
   - Add validation and error handling
   - Export as Next.js Route Handler
2. **Frontend Integration**:
   - Use `fetch()` or SWR for data fetching
   - Update UI components in `app/page.tsx`
   - Add new state management with `useState`/`useReducer`
   - Consider performance implications (memoization, debouncing)
3. **Internationalization**:
   - Add new strings to `lib/i18n.ts` dictionaries
   - Use `t()` helper for all user-facing text
4. **Styling**:
   - Use Tailwind utility classes
   - Add custom CSS only to `app/globals.css` if absolutely necessary

### 2. Modifying Application Discovery
To change how applications are discovered:
- Modify `lib/discover.ts`:
  - Update `discoverApps()` function for different scanning logic
  - Modify `detectFramework()` for new framework detection
  - Adjust metadata extraction in `getAppInfo()`
- Update TypeScript interfaces if metadata structure changes
- Test with various project structures

### 3. Changing Process Management
To alter how applications are started/stopped:
- Modify API routes in `app/api/apps/start/` and `app/api/apps/kill/`
- Update `spawn()` parameters for different commands/arguments
- Change log tailing mechanism if needed
- Adjust health check logic in `app/api/apps/health/` or within start/stop routes
- Consider Windows compatibility if using shell-specific features

### 4. Updating Log Management
To change how logs are handled:
- Modify files in `app/api/apps/logs/`:
  - `route.ts`: Recent logs buffer
  - `stream/route.ts`: SSE log streaming
  - `clear/route.ts`: Log clearing
  - `download/route.ts`: Log download
- Update log level detection in `lib/log-level.ts` if needed
- Change buffering strategy (memory vs file-based)
- Adjust polling interval for log tailing

### 5. Internationalization Updates
To add new languages or modify translations:
- Edit `lib/i18n.ts`:
  - Add new language code to `Lang` type
  - Add new dictionary object
  - Update `translate()` function to handle new language
  - Update `detectLang()` if changing default or detection logic
- Update all components to use `t()` helper
- Add language selector UI if adding more than 2 languages

### 6. UI/UX Changes
For modifications to the user interface:
- Follow existing patterns in `app/page.tsx`
- Use Tailwind for responsive design
- Consider accessibility (aria-labels, keyboard navigation)
- Test on different screen sizes
- Keep components small and reusable
- Use React.memo for expensive components when appropriate

## Testing Your Changes

### Manual Testing
1. Start development server: `npm run dev`
2. Open [http://localhost:3005](http://localhost:3005)
3. Test the specific functionality you modified
4. Verify:
   - UI renders correctly
   - API endpoints return expected data
   - Error handling works as intended
   - No regressions in existing functionality
   - Internationalization works (if applicable)
   - Settings persist correctly

### TypeScript Checking
```bash
# Check for type errors
npx tsc --noEmit

# Or use the built-in script
npm run type-check
```

### Building for Production
```bash
# Create production build
npm run build

# Start production server
npm start
```

Then test at [http://localhost:3005](http://localhost:3005) to ensure:
- All pages render correctly
- API endpoints work in production mode
- No client-side hydration mismatches
- Performance is acceptable

## Common Development Tasks

### Adding a New Application Attribute
1. Update `AppInfo` interface in `lib/discover.ts`
2. Modify `getAppInfo()` to extract the new attribute
3. Update `discoverApps()` if the attribute affects filtering/sorting
4. Add display logic in `app/page.tsx` where needed
5. Add to TypeScript interfaces in API routes if exposed
6. Update i18n if the attribute needs labeling

### Changing the Default Projects Folder
1. Modify `DEFAULT_ROOT` in `lib/root.ts`
2. Update documentation in README and docs
3. Consider adding migration notes if changing from established default

### Adding a New Log Level
1. Update `LogLevel` type in `lib/log-level.ts`
2. Add detection patterns to appropriate array (`ERROR_PATTERNS`, etc.)
3. Update `levelClass()` CSS class mapping if needed
4. Add translation in `lib/i18n.ts`
5. Update log filter chips in `app/page.tsx`
6. Update log level display in log drawer header

### Modifying Keyboard Shortcuts
1. Add/remove event listeners in `app/page.tsx` useEffect
2. Update documentation in user guide
3. Consider accessibility implications
4. Test conflicts with browser shortcuts

## Performance Considerations

### Rendering Optimization
- Use `React.memo` for components that receive stable props
- Memoize expensive calculations with `useMemo`
- Debounce rapid-fire events (search inputs, window resize)
- Virtualize long lists if >100 items (consider `react-window` or similar)

### API Performance
- Cache expensive operations where appropriate
- Use efficient algorithms for filtering/sorting
- Consider pagination for large datasets
- Monitor memory usage in long-running processes

### Build Optimization
- Enable production optimizations: `npm run build`
- Analyze bundle size: `npx next build && npx next export`
- Remove unused dependencies with `npm prune`
- Keep TypeScript strict to catch issues early

## Troubleshooting Development Issues

### "Cannot find module" Errors
1. Run `npm install` to ensure dependencies are installed
2. Check for typos in import paths
3. Verify module exists in `node_modules/`
4. Try `npm ls <module-name>` to see installation status

### Port Already in Use
- Another process is using port 3005
- Change port: `PORT=3006 npm run dev`
- Or kill existing process: `lsof -ti:3005 | xargs kill -f`

### TypeScript Errors
1. Read the error message carefully - it's usually precise
2. Check type definitions in imported modules
3. Verify you're not mixing `undefined` with nullable types
4. Use `as` assertions sparingly and only when certain

### Hot Reload Not Working
1. Ensure you're editing files in the `launchpad/` directory
2. Check for syntax errors that prevent module loading
3. Try restarting the dev server: `Ctrl+C` then `npm run dev`
4. Check disk space and file permissions

### Build Failures
1. Run `npx tsc --noEmit` to isolate TypeScript issues
2. Check for missing exports in Route Handlers
3. Verify all components return valid JSX
4. Look for `undefined` values being used as objects/react children

## Contribution Checklist

Before submitting a pull request:
- [ ] Code follows TypeScript strict mode
- [ ] No `any` types unless absolutely necessary
- [ ] All user-facing strings use `t()` helper
- [ ] Components are small and focused
- [ ] Tailwind used for styling (minimal custom CSS)
- [ ] API routes validate all inputs
- [ ] Error handling is present and informative
- [ ] Commit message follows conventional commits format
- [ ] Documentation updated if user-facing behavior changed
- [ ] Tested manually in development mode
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in development mode
- [ ] Responsive design checked on multiple screen sizes
- [ ] Accessibility considerations reviewed (aria-labels, keyboard nav)

## Getting Help

If you encounter issues during development:
1. Check the existing documentation in `/docs/`
2. Look at similar implementations in the codebase
3. Search through closed issues for similar problems
4. Ask in GitHub Discussions
5. As a last resort, create a detailed issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant code snippets
   - Screenshots or error logs
   - Environment details (Node.js, OS, browser)

Happy coding! 🚀

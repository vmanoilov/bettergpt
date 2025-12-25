# Contributing to BetterGPT

Thank you for your interest in contributing to BetterGPT! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to professional standards of conduct. Be respectful, inclusive, and collaborative.

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Google Chrome browser (for development and testing)
- Basic knowledge of TypeScript and Chrome Extension APIs
- Familiarity with IndexedDB (via DexieJS)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vmanoilov/bettergpt.git
   cd bettergpt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist/` folder from the project

## Coding Standards

### TypeScript

- Use TypeScript for all source files
- Follow strict typing - avoid `any` unless absolutely necessary
- Use explicit return types for public methods
- Prefer `const` over `let` when variables don't change
- Use meaningful variable and function names

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors where possible
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is formatted correctly
npm run format:check
```

**Key style rules:**
- Use single quotes for strings
- Use 2 spaces for indentation
- Add semicolons at the end of statements
- Maximum line length: 100 characters
- Use trailing commas in multi-line objects/arrays
- Use arrow functions for callbacks

### File Organization

```
src/
├── background/       # Background service worker
├── content/         # Content scripts and UI
│   └── ui/          # UI components
├── data/            # Database layer (DexieJS)
├── integrations/    # External service integrations
│   └── chatgpt/     # ChatGPT-specific code
├── managers/        # Business logic managers
├── components/      # Reusable UI components
├── utils/           # Utility functions
└── test/            # Test files
```

### Naming Conventions

- **Files**: Use kebab-case (e.g., `conversation-manager.ts`)
- **Classes**: Use PascalCase (e.g., `ConversationManager`)
- **Functions/Methods**: Use camelCase (e.g., `getConversation`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_TOKEN_LIMIT`)
- **Interfaces/Types**: Use PascalCase (e.g., `Conversation`, `ExportOptions`)

## Making Changes

### Branch Naming

- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`
- Refactoring: `refactor/description`

### Commit Messages

Use clear, descriptive commit messages:

```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add conversation threading support

fix: resolve memory leak in DOM observer

docs: update installation instructions
```

### Code Review Checklist

Before submitting a pull request, ensure:

- [ ] Code follows the project's coding standards
- [ ] All tests pass (when test infrastructure is available)
- [ ] Code is properly formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] No sensitive data or credentials are included
- [ ] Build succeeds (`npm run build`)

## Pull Request Process

1. **Fork** the repository and create your branch from `main`

2. **Make your changes** following the coding standards

3. **Test your changes** thoroughly:
   - Load the extension in Chrome
   - Test affected features manually
   - Check browser console for errors

4. **Update documentation** if needed:
   - README.md for user-facing changes
   - DEVELOPMENT.md for developer-related changes
   - Inline code comments for complex logic

5. **Create a pull request** with:
   - Clear title describing the change
   - Detailed description of what and why
   - Screenshots for UI changes (if applicable)
   - Reference to related issues

6. **Address review feedback** promptly and professionally

7. **Keep your PR updated** with the main branch if needed

## Testing

### Manual Testing

Since automated tests are not yet configured, thorough manual testing is required:

1. **Build and load** the extension
2. **Test core features**:
   - Extension loads without errors
   - UI components render correctly
   - Database operations work
   - ChatGPT integration functions properly
3. **Check browser console** for errors or warnings
4. **Test on multiple pages** including ChatGPT and test-page.html
5. **Verify keyboard shortcuts** work as expected

### Test Scenarios

When testing changes, consider:
- **Happy path**: Normal, expected usage
- **Edge cases**: Boundary conditions, empty states
- **Error handling**: How does it handle failures?
- **Performance**: No memory leaks or slowdowns
- **Browser compatibility**: Works in Chrome, Edge, Firefox

## Documentation

### Code Comments

- Use JSDoc comments for public APIs
- Explain **why** not **what** (code should be self-explanatory)
- Document complex algorithms or business logic
- Add TODO comments for known issues

**Example:**
```typescript
/**
 * Estimates the token count for a conversation
 * Uses a simple heuristic: ~4 characters per token
 * 
 * @param conversation - The conversation to estimate
 * @returns Estimated token count
 */
function estimateTokens(conversation: Conversation): number {
  // Implementation
}
```

### README and Guides

- Keep README.md up to date with features
- Update DEVELOPMENT.md for developer changes
- Add to TESTING_GUIDE.md for test procedures
- Document breaking changes in commit messages

## Project Structure

### Key Technologies

- **TypeScript**: Primary language
- **esbuild**: Build tool for fast compilation
- **DexieJS**: IndexedDB wrapper for data storage
- **D3.js**: Graph visualizations
- **Chrome Extension API**: Manifest V3

### Architecture Principles

1. **Separation of Concerns**: Keep business logic separate from UI
2. **Modularity**: Small, focused modules with clear responsibilities
3. **Type Safety**: Use TypeScript types to prevent errors
4. **Privacy First**: All data stored locally, no external servers
5. **Performance**: Optimize for large datasets and smooth UI

## Getting Help

- Check existing documentation in the repository
- Review Phase summaries (PHASE*_SUMMARY.md) for context
- Look at similar existing code for patterns
- Ask questions in pull request comments

## Known Issues

### Critical Build Error

The `export-manager.ts` file has a persistent build error with esbuild/TypeScript template literals. A temporary stub implementation is in place. See PHASE6_FINAL_REPORT.md for details. If fixing this issue, refer to `export-manager.ts.broken` for the original implementation.

## License

By contributing to BetterGPT, you agree that your contributions will be licensed under the same license as the project (to be determined).

---

Thank you for contributing to BetterGPT! 🚀

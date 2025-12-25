# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ESLint configuration for code quality enforcement
- Prettier configuration for consistent code formatting
- EditorConfig for cross-editor consistency
- CONTRIBUTING.md with comprehensive contribution guidelines
- LICENSE file (ISC License)
- CHANGELOG.md for tracking project changes

### Changed
- Updated npm scripts to include linting and formatting commands
- Improved package.json with proper script definitions

### Fixed
- Critical build error in export-manager.ts (temporary stub implementation)
- Project now builds successfully with `npm run build`

### Known Issues
- Export functionality temporarily disabled due to build error in export-manager.ts
- Original implementation saved as export-manager.ts.broken pending fix

## [0.1.0] - 2024-12-25

### Phase 6 - Browser Integration (Documentation Complete)
- Comprehensive browser compatibility documentation
- Firefox-specific manifest configuration
- Store submission guides for Chrome Web Store, Firefox Add-ons, Microsoft Edge
- Privacy policy and support documentation
- Automated packaging scripts for multiple browsers

### Phase 5 - UI & UX Polish (Completed)
- Command Palette with fuzzy search (Cmd/Ctrl+K)
- Enhanced keyboard shortcuts with priority management
- Theme support (Light, Dark, System preference)
- Performance optimizations (virtual scrolling, caching, batching)
- Memoization and performance utilities

### Phase 4 - Export/Import System (Completed)
- Multiple export formats: JSON, Markdown, Text, HTML, PDF, DOCX
- Markdown templates: Standard, Obsidian-compatible, GitHub-flavored
- PDF templates: Minimal, Academic, Dark modes
- Import support for JSON, Markdown, ChatGPT exports, Plain text
- Custom template engine with Handlebars-style syntax
- Bulk export/import operations
- Thread preservation in exports

### Phase 3 - Conversation Threading & Context (Completed)
- Conversation linking (fork, continuation, reference)
- Interactive D3.js graph visualization
- Smart context management with auto-loading
- Token counting and usage visualization
- Multiple truncation strategies (Recent, Relevant, Balanced)
- Three-view UI (List, Graph, Context)

### Phase 2 - Core Features (Completed)
- ChatGPT API interception and monitoring
- DOM observation for real-time conversation capture
- Sidebar injection in ChatGPT interface
- Conversation management (archive, favorite, folders)
- IndexedDB storage with DexieJS
- Full-text search functionality
- Bulk operations support

### Phase 1 - Foundation (Completed)
- Basic Chrome extension structure (Manifest V3)
- Service worker setup
- Content script infrastructure
- UI component framework
- TypeScript with esbuild compilation
- Project structure and documentation

## [0.0.1] - Initial Development

### Added
- Initial project setup
- Basic documentation
- Development environment configuration

---

## Release Notes

### Version Numbering

- **Major (X.0.0)**: Breaking changes, major feature additions
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

### Roadmap

#### Future Enhancements
- Fix export-manager.ts build error and restore full export functionality
- Add automated testing infrastructure
- Cross-device sync (optional)
- Additional AI platform integrations
- Advanced customization options
- Browser extension store publication

[Unreleased]: https://github.com/vmanoilov/bettergpt/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vmanoilov/bettergpt/releases/tag/v0.1.0
[0.0.1]: https://github.com/vmanoilov/bettergpt/releases/tag/v0.0.1

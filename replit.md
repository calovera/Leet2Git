# Leet2Git Chrome Extension

## Overview

Leet2Git is a Chrome extension that automatically syncs accepted LeetCode solutions to GitHub repositories. The extension captures code submissions in real-time, processes them when accepted, and pushes them to a configured GitHub repository with proper folder organization and formatting. It features a React-based popup interface for managing settings and viewing statistics, plus a comprehensive background service worker that handles submission detection and GitHub API integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Chrome Extension Architecture
The system follows Chrome Manifest V3 architecture with a service worker-based background script, content scripts for LeetCode integration, and React-based UI components. The extension uses Chrome's storage.sync API for cross-device synchronization and webRequest API for intercepting LeetCode submissions.

### Frontend Components
- **Popup Interface**: React-based 320px popup with tabbed navigation showing statistics, pending solutions, and quick actions
- **Options Page**: Full-featured settings interface for GitHub authentication and repository configuration
- **Content Scripts**: Minimal footprint scripts that run on LeetCode pages for submission detection

### Background Service Architecture
The background script implements several key patterns:
- **Request Interception**: Uses webRequest API to capture LeetCode submission data before it reaches their servers
- **Temporal Code Storage**: Maps submission data to acceptance events using question IDs and timestamps
- **Batch Processing**: Queues accepted solutions and processes them asynchronously to GitHub

### Data Flow and Storage
Solutions follow this path: LeetCode submission → temporary storage → acceptance detection → pending queue → GitHub push. The system uses Chrome's sync storage for persistence across devices, storing user authentication, repository configuration, and solution statistics.

### GitHub Integration
Direct API integration using personal access tokens for authentication. Implements file upsert operations (create or update) with SHA-based conflict resolution. Supports multiple folder organization strategies (by topic, difficulty, or flat structure) and handles both public and private repositories.

### Authentication and Security
GitHub authentication uses personal access tokens stored securely in Chrome's encrypted storage. No external servers are involved - all data processing happens locally in the browser. The extension requests minimal permissions and follows privacy-first principles.

## External Dependencies

### Core Technologies
- **React 18**: UI framework for popup and options interfaces
- **TypeScript**: Primary development language with strict type checking
- **Vite**: Build system with Chrome extension plugin (@crxjs/vite-plugin)
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Chrome Extension APIs**: storage.sync, webRequest, tabs, activeTab, scripting

### Development Tools
- **Drizzle**: Database toolkit (configured but not actively used - may be added later)
- **ESBuild**: JavaScript bundler for server components
- **PostCSS**: CSS processing with Autoprefixer

### GitHub Integration
- **GitHub REST API v3**: Repository operations, file creation/updates, authentication
- **Personal Access Tokens**: Authentication mechanism for GitHub API access

### LeetCode Integration
- **GraphQL API**: Question metadata retrieval including topic tags and difficulty
- **Submission Endpoints**: POST request interception for code capture
- **DOM Monitoring**: MutationObserver patterns for acceptance detection fallbacks

### UI Components
- **Radix UI**: Headless component primitives for consistent interactions
- **Lucide React**: Icon system for UI elements
- **shadcn/ui**: Component system built on Radix primitives
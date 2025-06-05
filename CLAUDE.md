# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website and web tools collection for alexander-schneider.org. It consists of:
- A main landing page (index.html) with personal/professional information
- Multiple standalone web-based utility tools (calculator, converters, formatters)

## Architecture

- **Technology**: Plain HTML/CSS/JavaScript (no framework)
- **Styling**: Tailwind CSS via CDN
- **Deployment**: GitHub Pages (via CNAME file)
- **Structure**: Each tool is self-contained in a single HTML file with inline JavaScript

## Development Commands

This is a static website with no build process. Common tasks:

```bash
# Start local development server (if you have Python installed)
python -m http.server 8000
# or
python3 -m http.server 8000

# View the site locally
# Open http://localhost:8000 in your browser
```

## Key Patterns

1. **Tool Structure**: Each tool follows a similar pattern:
   - Single HTML file with embedded CSS/JS
   - Tailwind CSS for styling
   - Inline JavaScript for functionality
   - No external dependencies except CDN resources

2. **Naming Convention**: Tools use kebab-case filenames ending with `.html`

3. **No Build Process**: Changes to HTML files are immediately deployable

## Important Notes

- The site is deployed to alexander-schneider.org via GitHub Pages
- Changes pushed to the main branch are automatically deployed
- Custom fonts are stored in the `/fonts` directory
- Images are in the `/img` directory
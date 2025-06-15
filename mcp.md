# MCP Configuration Commands

This file contains the Claude MCP add commands for all currently available MCP servers.

## Current MCP Tools Available

Based on the MCP tools currently available in this Claude Code session, here are the add commands:

### Context7 Documentation
```bash
# Library documentation lookup
claude mcp add context7 "npx -y @upstash/context7-mcp" --scope user
```

### Firecrawl Web Tools
```bash
# Web scraping and crawling (requires FIRECRAWL_API_KEY)
claude mcp add firecrawl "npx -y firecrawl-mcp" --scope user --env FIRECRAWL_API_KEY=your_api_key_here
```

### Gmail Integration
```bash
# Gmail operations with auto-authentication
claude mcp add gmail "npx -y @gongrzhe/server-gmail-autoauth-mcp" --scope user
```

### NX MCP (Local HTTP Server)
```bash
# NX-specific MCP server (if running locally)
claude mcp add nx-mcp "http://localhost:9730/mcp" --scope user --transport http
```

### Bright Data Web Scraping
```bash
# Web scraping with Bright Data (requires multiple env vars - see .env.mcp)
claude mcp add brightdata "npx -y @brightdata/mcp" --scope user --env API_TOKEN=<from_.env.mcp> --env WEB_UNLOCKER_ZONE=<from_.env.mcp> --env BROWSER_AUTH=<from_.env.mcp>
```

## Available MCP Functions by Category

### IDE Integration (2 tools)
- `mcp__ide__getDiagnostics` - Get language diagnostics from VS Code
- `mcp__ide__executeCode` - Execute Python code in Jupyter kernel

### Context7 Documentation (2 tools)
- `mcp__context7__resolve-library-id` - Resolve package names to Context7 library IDs
- `mcp__context7__get-library-docs` - Fetch up-to-date library documentation

### Firecrawl Web Tools (9 tools)
- `mcp__firecrawl__firecrawl_scrape` - Scrape content from single URLs
- `mcp__firecrawl__firecrawl_map` - Map websites to discover URLs
- `mcp__firecrawl__firecrawl_crawl` - Start asynchronous crawl jobs
- `mcp__firecrawl__firecrawl_check_crawl_status` - Check crawl job status
- `mcp__firecrawl__firecrawl_search` - Search web with optional content extraction
- `mcp__firecrawl__firecrawl_extract` - Extract structured data using LLM
- `mcp__firecrawl__firecrawl_deep_research` - Conduct deep web research
- `mcp__firecrawl__firecrawl_generate_llmstxt` - Generate llms.txt files
- `mcp__firecrawl__firecrawl_batch_scrape` - Batch scrape multiple URLs (implied)

### Gmail Integration (14 tools)
- `mcp__gmail__send_email` - Send new emails
- `mcp__gmail__draft_email` - Draft emails
- `mcp__gmail__read_email` - Read specific emails
- `mcp__gmail__search_emails` - Search emails with Gmail syntax
- `mcp__gmail__modify_email` - Modify email labels
- `mcp__gmail__delete_email` - Delete emails
- `mcp__gmail__list_email_labels` - List all Gmail labels
- `mcp__gmail__batch_modify_emails` - Batch modify email labels
- `mcp__gmail__batch_delete_emails` - Batch delete emails
- `mcp__gmail__create_label` - Create new labels
- `mcp__gmail__update_label` - Update existing labels
- `mcp__gmail__delete_label` - Delete labels
- `mcp__gmail__get_or_create_label` - Get or create labels

## Notes

1. **Server Configuration**: These commands would configure MCP servers that provide the above functionality
2. **Authentication**: Some servers (like Gmail) may require additional authentication setup
3. **Dependencies**: Servers may have external dependencies (e.g., Firecrawl service, Gmail API access)
4. **Scope**: Use `--scope project` to add to `.mcp.json` in project root, or `--scope user` for user-wide configuration
5. **Environment Variables**: Sensitive API keys and tokens are stored in `.env.mcp` (git-crypted for security)

## Environment Variables Setup

Create and encrypt the `.env.mcp` file:
```bash
# 1. Initialize git-crypt (if not already done)
git-crypt init

# 2. Add .env.mcp to git-crypt (create .gitattributes if needed)
echo ".env.mcp filter=git-crypt diff=git-crypt" >> .gitattributes

# 3. The .env.mcp file contains:
# API_TOKEN=<bright_data_api_token>
# WEB_UNLOCKER_ZONE=<zone_name>
# BROWSER_AUTH=<browser_websocket_url>
```

## Example Usage

To add all servers to your project:
```bash
claude mcp add context7 "npx -y @upstash/context7-mcp" --scope project
claude mcp add firecrawl "npx -y firecrawl-mcp" --scope project --env FIRECRAWL_API_KEY=your_api_key_here
claude mcp add gmail "npx -y @gongrzhe/server-gmail-autoauth-mcp" --scope project
claude mcp add nx-mcp "http://localhost:9730/mcp" --scope project --transport http
claude mcp add brightdata "npx -y @brightdata/mcp" --scope project --env API_TOKEN=<from_.env.mcp> --env WEB_UNLOCKER_ZONE=<from_.env.mcp> --env BROWSER_AUTH=<from_.env.mcp>
```

This would create/update a `.mcp.json` file in your project root with these MCP server configurations.
# Organized AI

A TypeScript client for the Model Context Protocol (MCP) with support for managing multiple MCP servers, API keys, and tools.

## Features

- **Multiple MCP Server Support**: Connect to and manage multiple MCP servers
- **Settings Management**: Manage API keys, environment variables, and server settings
- **Predefined Servers**: Support for common MCP server types with their requirements
- **Session Management**: Maintain conversation sessions across different servers
- **Tool Integration**: Seamlessly use tools from any connected MCP server

## Installation

```bash
npm install organized-ai
```

Or if you're using yarn:

```bash
yarn add organized-ai
```

## Quick Start

```typescript
import { OrganizedAI } from 'organized-ai';

// Create an instance of Organized AI
const organizedAI = new OrganizedAI();

// Set necessary API keys
organizedAI.setApiKey('GITHUB_TOKEN', 'your-github-token');

// Enable a predefined server
organizedAI.enableServer('github-mcp');

// Use the client
async function main() {
  // Create a new session with the GitHub MCP server
  const session = organizedAI.createSession('github-mcp', 'GitHub Assistant');
  
  // Send a message
  const response = await organizedAI.sendMessage(session.id, 'List my repositories');
  console.log('Assistant:', response.content);
}

main().catch(console.error);
```

## Documentation

### Managing Servers

```typescript
// Get all predefined servers
const servers = organizedAI.getPredefinedServers();

// Enable a server
organizedAI.enableServer('github-mcp');

// Update server URL
organizedAI.updateServerSettings('github-mcp', { url: 'http://localhost:5002' });
```

### Managing API Keys

```typescript
// Set an API key
organizedAI.setApiKey('GITHUB_TOKEN', 'your-github-token');

// Get an API key
const token = organizedAI.getApiKey('GITHUB_TOKEN');
```

### Managing Sessions

```typescript
// Create a new session
const session = organizedAI.createSession('github-mcp', 'GitHub Assistant');

// Send a message
const response = await organizedAI.sendMessage(session.id, 'What can you do?');
```

### Using Tools

```typescript
// Call a tool directly
const result = await organizedAI.callTool('github-mcp', 'search_repositories', {
  query: 'language:typescript'
});
```

## CLI Usage

Organized AI also includes a CLI for managing settings:

```bash
npx organized-ai settings
```

## Development

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## License

MIT

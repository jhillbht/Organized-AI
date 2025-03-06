import { OrganizedAI } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Initializing Organized AI...');
    
    // Create an instance of Organized AI
    const organizedAI = new OrganizedAI();
    
    // Display available servers
    console.log('Available Servers:');
    const predefinedServers = organizedAI.getPredefinedServers();
    predefinedServers.forEach(server => {
      console.log(`- ${server.name} (${server.id})`);
      console.log(`  ${server.description}`);
      console.log(`  Default URL: ${server.defaultUrl}`);
      console.log(`  Required API Keys: ${server.requiredApiKeys.length ? server.requiredApiKeys.join(', ') : 'None'}`);
      console.log();
    });
    
    // Set API keys (usually would be from .env)
    if (process.env.GITHUB_TOKEN) {
      organizedAI.setApiKey('GITHUB_TOKEN', process.env.GITHUB_TOKEN);
      console.log('Set GitHub API token from environment');
    }
    
    if (process.env.TAVILY_API_KEY) {
      organizedAI.setApiKey('TAVILY_API_KEY', process.env.TAVILY_API_KEY);
      console.log('Set Tavily API key from environment');
    }
    
    // Enable a server (for this example, we'll use File System server as it doesn't require API keys)
    try {
      organizedAI.enableServer('filesystem-mcp');
      console.log('Enabled File System MCP server');
    } catch (error) {
      console.error('Failed to enable server:', error.message);
    }
    
    // Create a session
    const session = organizedAI.createSession('filesystem-mcp', 'File Explorer');
    console.log(`Created session: ${session.title} (${session.id})`);
    
    // Send a message
    console.log('\nSending message to assistant...');
    const response = await organizedAI.sendMessage(session.id, 'Hello! Can you help me explore my file system?');
    console.log('\nAssistant:', response.content);
    
    // Follow-up message
    console.log('\nSending follow-up message...');
    const followUp = await organizedAI.sendMessage(session.id, 'What commands can I use to navigate my files?');
    console.log('\nAssistant:', followUp.content);
    
    console.log('\nExample completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();

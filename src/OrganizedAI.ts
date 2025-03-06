import { OrganizedAIClient } from './client/OrganizedAIClient';
import { SettingsManager } from './settings/SettingsManager';
import { SessionManager } from './session/SessionManager';
import { Message, Tool } from './types';
import { ServerSettings, PredefinedServer, Session } from './types/settings';
import { createLogger, LogLevel } from './utils/logger';
import path from 'path';
import os from 'os';
import fs from 'fs';

export class OrganizedAI {
  private configDir: string;
  private settingsManager: SettingsManager;
  private sessionManager: SessionManager;
  private activeClients: Map<string, OrganizedAIClient> = new Map();
  private logger = createLogger('OrganizedAI', LogLevel.INFO);

  constructor(configDir?: string) {
    // Set up configuration directory
    this.configDir = configDir || path.join(os.homedir(), '.organized-ai');
    if (!fs.existsSync(this.configDir)) {
      this.logger.info(`Creating configuration directory: ${this.configDir}`);
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    
    // Initialize managers
    this.logger.info('Initializing settings manager');
    this.settingsManager = new SettingsManager(this.configDir);
    
    // Initialize session manager with reference to this app instance
    this.logger.info('Initializing session manager');
    this.sessionManager = new SessionManager(this.configDir, this);
  }

  // Settings Management
  getServerSettings(serverId: string): ServerSettings | null {
    return this.settingsManager.getServerSettings(serverId);
  }

  getAllServerSettings(): Record<string, ServerSettings> {
    return this.settingsManager.getAllServerSettings();
  }

  updateServerSettings(serverId: string, settings: Partial<ServerSettings>): void {
    this.logger.info(`Updating settings for server ${serverId}`);
    this.settingsManager.updateServerSettings(serverId, settings);
    
    // Refresh client if active
    if (this.activeClients.has(serverId)) {
      this.logger.debug(`Clearing cached client for server ${serverId}`);
      this.activeClients.delete(serverId);
    }
  }

  enableServer(serverId: string, enabled: boolean = true): void {
    try {
      this.logger.info(`${enabled ? 'Enabling' : 'Disabling'} server ${serverId}`);
      this.settingsManager.enableServer(serverId, enabled);
      
      // Clear client if disabling
      if (!enabled && this.activeClients.has(serverId)) {
        this.activeClients.delete(serverId);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to ${enabled ? 'enable' : 'disable'} server ${serverId}: ${err.message}`);
      throw error;
    }
  }

  getApiKey(keyName: string): string | null {
    return this.settingsManager.getApiKey(keyName);
  }

  getAllApiKeys(): Record<string, string> {
    return this.settingsManager.getAllApiKeys();
  }

  setApiKey(keyName: string, value: string): void {
    this.logger.info(`Setting API key ${keyName}`);
    this.settingsManager.setApiKey(keyName, value);
  }

  removeApiKey(keyName: string): void {
    this.logger.info(`Removing API key ${keyName}`);
    this.settingsManager.removeApiKey(keyName);
  }

  getEnvironmentVariable(name: string): string | null {
    return this.settingsManager.getEnvironmentVariable(name);
  }

  getAllEnvironmentVariables(): Record<string, string> {
    return this.settingsManager.getAllEnvironmentVariables();
  }

  setEnvironmentVariable(name: string, value: string): void {
    this.logger.info(`Setting environment variable ${name}`);
    this.settingsManager.setEnvironmentVariable(name, value);
  }

  removeEnvironmentVariable(name: string): void {
    this.logger.info(`Removing environment variable ${name}`);
    this.settingsManager.removeEnvironmentVariable(name);
  }

  // Client management
  getClient(serverId: string): OrganizedAIClient {
    if (!this.activeClients.has(serverId)) {
      const settings = this.settingsManager.getServerSettings(serverId);
      if (!settings) {
        this.logger.error(`Server with ID ${serverId} not found`);
        throw new Error(`Server with ID ${serverId} not found`);
      }
      
      if (!settings.enabled) {
        this.logger.error(`Server ${settings.name} is not enabled`);
        throw new Error(`Server ${settings.name} is not enabled`);
      }
      
      // Get API keys needed for this server
      const headers: Record<string, string> = {};
      if (settings.requiredApiKeys.length > 0) {
        settings.requiredApiKeys.forEach(keyName => {
          const keyValue = this.settingsManager.getApiKey(keyName);
          if (keyValue) {
            // Add as header or use differently based on server requirements
            headers[keyName] = keyValue;
          }
        });
      }
      
      this.logger.debug(`Creating new client for server ${serverId} (${settings.name})`);
      const client = new OrganizedAIClient({
        serverUrl: settings.url,
        headers
      });
      
      this.activeClients.set(serverId, client);
    }
    
    return this.activeClients.get(serverId)!;
  }

  // List available predefined servers
  getPredefinedServers(): PredefinedServer[] {
    return this.settingsManager.getPredefinedServers();
  }

  // Session management
  createSession(serverId: string, title?: string): Session {
    return this.sessionManager.createSession(serverId, title);
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessionManager.getSession(sessionId);
  }

  listSessions(): Session[] {
    return this.sessionManager.listSessions();
  }

  async sendMessage(sessionId: string, content: string): Promise<Message> {
    return await this.sessionManager.sendMessage(sessionId, content);
  }

  deleteSession(sessionId: string): boolean {
    return this.sessionManager.deleteSession(sessionId);
  }

  renameSession(sessionId: string, newTitle: string): boolean {
    return this.sessionManager.renameSession(sessionId, newTitle);
  }
  
  // Tool functionality
  async callTool(serverId: string, toolName: string, parameters: Record<string, any>) {
    this.logger.info(`Calling tool ${toolName} on server ${serverId}`);
    const client = this.getClient(serverId);
    
    // Create a context if needed
    if (!client.getCurrentContextId()) {
      this.logger.debug('Creating new context for tool call');
      await client.createContext({});
    }
    
    return await client.callTool({
      name: toolName,
      parameters
    });
  }
}

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  Settings, 
  ServerSettings, 
  PredefinedServer
} from '../types/settings';
import { createLogger, LogLevel } from '../utils/logger';

export class SettingsManager {
  private filePath: string;
  private settings: Settings;
  private logger = createLogger('SettingsManager', LogLevel.INFO);
  
  // Predefined MCP servers that we support
  private predefinedServers: PredefinedServer[] = [
    {
      id: 'filesystem-mcp',
      name: 'File System MCP',
      description: 'Access and manipulate local files',
      defaultUrl: 'http://localhost:5001',
      requiredApiKeys: []
    },
    {
      id: 'github-mcp',
      name: 'GitHub MCP',
      description: 'Access GitHub repositories and APIs',
      defaultUrl: 'http://localhost:5002',
      requiredApiKeys: ['GITHUB_TOKEN']
    },
    {
      id: 'google-mcp',
      name: 'Google Services MCP',
      description: 'Access Google services (Docs, Sheets, etc.)',
      defaultUrl: 'http://localhost:5003',
      requiredApiKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    },
    {
      id: 'browser-mcp',
      name: 'Browser Automation MCP',
      description: 'Web browsing and automation capabilities',
      defaultUrl: 'http://localhost:5004', 
      requiredApiKeys: []
    },
    {
      id: 'search-mcp',
      name: 'Search MCP',
      description: 'Web search capabilities via various engines',
      defaultUrl: 'http://localhost:5005',
      requiredApiKeys: ['TAVILY_API_KEY', 'SERPAPI_API_KEY']
    }
  ];

  constructor(configDir: string) {
    this.filePath = path.join(configDir, 'settings.json');
    this.settings = this.loadSettings();

    // Initialize settings with predefined servers if first launch
    if (Object.keys(this.settings.servers).length === 0) {
      this.initializeDefaultSettings();
    }
  }

  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to load settings: ${err.message}`);
    }

    // Return default settings if file doesn't exist or is invalid
    return {
      servers: {},
      apiKeys: {},
      environmentVariables: {},
      general: {
        defaultServerId: null,
        logLevel: 'info',
        dataStoragePath: null
      }
    };
  }

  private saveSettings(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to save settings: ${err.message}`);
    }
  }

  private initializeDefaultSettings(): void {
    // Initialize with predefined servers (all disabled by default)
    this.predefinedServers.forEach(server => {
      this.settings.servers[server.id] = {
        id: server.id,
        name: server.name,
        url: server.defaultUrl,
        enabled: false,
        requiredApiKeys: server.requiredApiKeys
      };
    });

    this.saveSettings();
  }

  // Server Settings
  getServerSettings(serverId: string): ServerSettings | null {
    return this.settings.servers[serverId] || null;
  }

  getAllServerSettings(): Record<string, ServerSettings> {
    return this.settings.servers;
  }

  updateServerSettings(serverId: string, settings: Partial<ServerSettings>): void {
    if (!this.settings.servers[serverId]) {
      throw new Error(`Server with ID ${serverId} not found`);
    }

    this.settings.servers[serverId] = {
      ...this.settings.servers[serverId],
      ...settings
    };

    this.saveSettings();
  }

  enableServer(serverId: string, enabled: boolean = true): void {
    if (!this.settings.servers[serverId]) {
      throw new Error(`Server with ID ${serverId} not found`);
    }

    // Check if required API keys are set before enabling
    if (enabled) {
      const server = this.settings.servers[serverId];
      const missingKeys = server.requiredApiKeys.filter(
        key => !this.settings.apiKeys[key]
      );

      if (missingKeys.length > 0) {
        throw new Error(
          `Cannot enable server "${server.name}". Missing required API keys: ${missingKeys.join(', ')}`
        );
      }
    }

    this.settings.servers[serverId].enabled = enabled;
    this.saveSettings();
  }

  // API Keys
  getApiKey(keyName: string): string | null {
    return this.settings.apiKeys[keyName] || null;
  }

  getAllApiKeys(): Record<string, string> {
    return this.settings.apiKeys;
  }

  setApiKey(keyName: string, value: string): void {
    this.settings.apiKeys[keyName] = value;
    this.saveSettings();
  }

  removeApiKey(keyName: string): void {
    delete this.settings.apiKeys[keyName];
    this.saveSettings();
  }

  // Environment Variables
  getEnvironmentVariable(name: string): string | null {
    return this.settings.environmentVariables[name] || null;
  }

  getAllEnvironmentVariables(): Record<string, string> {
    return this.settings.environmentVariables;
  }

  setEnvironmentVariable(name: string, value: string): void {
    this.settings.environmentVariables[name] = value;
    this.saveSettings();
  }

  removeEnvironmentVariable(name: string): void {
    delete this.settings.environmentVariables[name];
    this.saveSettings();
  }

  // General Settings
  getGeneralSettings(): any {
    return this.settings.general;
  }

  updateGeneralSettings(settings: any): void {
    this.settings.general = {
      ...this.settings.general,
      ...settings
    };
    this.saveSettings();
  }

  // Get list of predefined servers
  getPredefinedServers(): PredefinedServer[] {
    return this.predefinedServers;
  }
}

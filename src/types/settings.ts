export interface ServerSettings {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  requiredApiKeys: string[];
  customSettings?: Record<string, any>;
}

export interface APIKeySettings {
  [keyName: string]: string;
}

export interface EnvironmentVariables {
  [name: string]: string;
}

export interface GeneralSettings {
  defaultServerId: string | null;
  logLevel: string;
  dataStoragePath: string | null;
  // Add more general settings as needed
}

export interface Settings {
  servers: Record<string, ServerSettings>;
  apiKeys: APIKeySettings;
  environmentVariables: EnvironmentVariables;
  general: GeneralSettings;
}

export interface PredefinedServer {
  id: string;
  name: string;
  description: string;
  defaultUrl: string;
  requiredApiKeys: string[];
}

export interface Session {
  id: string;
  serverId: string;
  title: string;
  contextId: string | null;
  messages: any[]; // Using any for now, will import Message type later
  createdAt: string;
  updatedAt: string;
}

export enum ToolCategory {
  Search = 'search',
  FileSystem = 'file_system',
  Database = 'database',
  Api = 'api',
  Analytics = 'analytics',
  Utils = 'utils',
  Other = 'other'
}

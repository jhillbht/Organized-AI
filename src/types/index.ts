export interface ServerInfo {
  name: string;
  version: string;
  extensions?: string[];
}

export interface ClientOptions {
  serverUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: any;
}

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
}

export interface CreateContextRequest {
  messages?: Message[];
  tools?: Tool[];
  system?: string;
  roots?: string[];
  metadata?: Record<string, any>;
}

export interface CreateContextResponse {
  context_id: string;
}

export interface ToolCallRequest {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolCallResponse {
  result?: any;
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
}

export interface AddMessagesRequest {
  messages: Message[];
}

export interface AddMessagesResponse {
  success: boolean;
}

export interface RunRequest {
  messages?: Message[];
  metadata?: Record<string, any>;
}

export interface RunResponse {
  assistant_message: Message;
  tool_calls?: ToolCall[];
  metadata?: Record<string, any>;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
  result?: any;
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
}

export interface ListPromptsResponse {
  prompts: {
    id: string;
    name: string;
    description?: string;
  }[];
}

export interface GetPromptResponse {
  id: string;
  name: string;
  description?: string;
  template: string;
  parameters?: Record<string, any>;
}

export interface RunPromptRequest {
  prompt_id: string;
  arguments?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface RunPromptResponse {
  assistant_message: Message;
  tool_calls?: ToolCall[];
  metadata?: Record<string, any>;
}

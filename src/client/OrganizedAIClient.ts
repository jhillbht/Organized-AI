import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ClientOptions,
  ServerInfo,
  CreateContextRequest,
  CreateContextResponse,
  ToolCallRequest,
  ToolCallResponse,
  AddMessagesRequest,
  AddMessagesResponse,
  RunRequest,
  RunResponse,
  ListPromptsResponse,
  GetPromptResponse,
  RunPromptRequest,
  RunPromptResponse,
  Message,
  Tool
} from '../types';
import { ClientError } from '../errors/ClientError';

/**
 * Organized AI Client for the Model Context Protocol (MCP)
 */
export class OrganizedAIClient {
  private client: AxiosInstance;
  private serverUrl: string;
  private currentContextId: string | null = null;

  /**
   * Creates a new OrganizedAIClient instance
   * @param options Configuration options for the client
   */
  constructor(options: ClientOptions) {
    this.serverUrl = options.serverUrl.endsWith('/')
      ? options.serverUrl.slice(0, -1)
      : options.serverUrl;

    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.serverUrl,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(options.apiKey && { 'Authorization': `Bearer ${options.apiKey}` }),
        ...options.headers
      }
    };

    this.client = axios.create(axiosConfig);
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          throw ClientError.fromResponse(error.response);
        } else if (error.code === 'ECONNABORTED') {
          throw ClientError.timeoutError(axiosConfig.timeout || 30000);
        } else {
          throw ClientError.networkError(error);
        }
      }
    );
  }

  /**
   * Get server information
   * @returns Information about the MCP server
   */
  async getServerInfo(): Promise<ServerInfo> {
    try {
      const response = await this.client.get('/info');
      return response.data;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * Create a new context in the MCP server
   * @param request The context creation request
   * @returns The created context ID
   */
  async createContext(request: CreateContextRequest): Promise<string> {
    try {
      const response = await this.client.post<CreateContextResponse>('/context', request);
      this.currentContextId = response.data.context_id;
      return this.currentContextId;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * Get the current context ID
   * @returns The current context ID or null if not set
   */
  getCurrentContextId(): string | null {
    return this.currentContextId;
  }

  /**
   * Set the current context ID
   * @param contextId The context ID to set
   */
  setCurrentContextId(contextId: string): void {
    this.currentContextId = contextId;
  }

  /**
   * Call a tool in the current context
   * @param request The tool call request
   * @returns The tool call response
   */
  async callTool(request: ToolCallRequest): Promise<ToolCallResponse> {
    if (!this.currentContextId) {
      throw new Error('No active context. Call createContext first or set context ID.');
    }

    try {
      const response = await this.client.post<ToolCallResponse>(
        `/context/${this.currentContextId}/tools/call`,
        request
      );
      return response.data;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * Add messages to the current context
   * @param request The add messages request
   * @returns Response indicating success
   */
  async addMessages(request: AddMessagesRequest): Promise<AddMessagesResponse> {
    if (!this.currentContextId) {
      throw new Error('No active context. Call createContext first or set context ID.');
    }

    try {
      const response = await this.client.post<AddMessagesResponse>(
        `/context/${this.currentContextId}/messages`,
        request
      );
      return response.data;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * Run the model in the current context
   * @param request The run request
   * @returns The run response including the model's message
   */
  async run(request?: RunRequest): Promise<RunResponse> {
    if (!this.currentContextId) {
      throw new Error('No active context. Call createContext first or set context ID.');
    }

    try {
      const response = await this.client.post<RunResponse>(
        `/context/${this.currentContextId}/run`,
        request || {}
      );
      return response.data;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * List available prompts on the server
   * @returns List of available prompts
   */
  async listPrompts(): Promise<ListPromptsResponse> {
    try {
      const response = await this.client.get<ListPromptsResponse>('/prompts');
      return response.data;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * Get details of a specific prompt
   * @param promptId The ID of the prompt to retrieve
   * @returns The prompt details
   */
  async getPrompt(promptId: string): Promise<GetPromptResponse> {
    try {
      const response = await this.client.get<GetPromptResponse>(`/prompts/${promptId}`);
      return response.data;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * Run a prompt on the server
   * @param request The run prompt request
   * @returns The run prompt response
   */
  async runPrompt(request: RunPromptRequest): Promise<RunPromptResponse> {
    if (!this.currentContextId) {
      throw new Error('No active context. Call createContext first or set context ID.');
    }

    try {
      const response = await this.client.post<RunPromptResponse>(
        `/context/${this.currentContextId}/prompts/run`,
        request
      );
      return response.data;
    } catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw ClientError.networkError(error as Error);
    }
  }

  /**
   * Convenience method to create a context and send a message
   * @param message The user message to send
   * @param system Optional system message
   * @param tools Optional tools to include in the context
   * @returns The assistant's response
   */
  async chat(message: string, system?: string, tools?: Tool[]): Promise<RunResponse> {
    // Create a new context if none exists
    if (!this.currentContextId) {
      await this.createContext({
        system,
        tools,
        messages: [{
          role: 'user',
          content: message
        }]
      });
      
      // Run the model
      return await this.run();
    } else {
      // Add the message to the existing context
      await this.addMessages({
        messages: [{
          role: 'user',
          content: message
        }]
      });
      
      // Run the model
      return await this.run();
    }
  }
}

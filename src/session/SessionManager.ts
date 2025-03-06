import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../types/settings';
import { Message, MessageRole } from '../types';
import { createLogger, LogLevel } from '../utils/logger';
import { OrganizedAI } from '../OrganizedAI';

export class SessionManager {
  private configPath: string;
  private sessions: Map<string, Session> = new Map();
  private app: OrganizedAI;
  private logger = createLogger('SessionManager', LogLevel.INFO);

  constructor(configDir: string, app: OrganizedAI) {
    this.configPath = path.join(configDir, 'sessions.json');
    this.app = app;
    this.loadSessions();
  }

  private loadSessions(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const sessionArray: Session[] = JSON.parse(data);
        sessionArray.forEach(session => {
          this.sessions.set(session.id, session);
        });
        this.logger.info(`Loaded ${sessionArray.length} sessions`);
      } else {
        this.logger.info('No sessions file found. Starting with empty sessions.');
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to load sessions: ${err.message}`);
    }
  }

  private saveSessions(): void {
    try {
      const sessionsArray = Array.from(this.sessions.values());
      fs.writeFileSync(this.configPath, JSON.stringify(sessionsArray, null, 2));
      this.logger.debug(`Saved ${sessionsArray.length} sessions`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to save sessions: ${err.message}`);
    }
  }

  createSession(serverId: string, title?: string): Session {
    const id = uuidv4();
    const session: Session = {
      id,
      serverId,
      title: title || 'New Conversation',
      contextId: null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.logger.info(`Created new session: ${session.title} (${id}) with server ${serverId}`);
    this.sessions.set(id, session);
    this.saveSessions();
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  async addMessage(sessionId: string, message: Message): Promise<Message> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    
    try {
      // Get the client for this session's server
      const client = this.app.getClient(session.serverId);
      
      // Create context if it doesn't exist
      if (!session.contextId) {
        this.logger.debug(`Creating new context for session ${sessionId}`);
        const contextId = await client.createContext({
          messages: session.messages
        });
        session.contextId = contextId;
      } else {
        // Add message to existing context
        this.logger.debug(`Adding message to existing context for session ${sessionId}`);
        client.setCurrentContextId(session.contextId);
        await client.addMessages({
          messages: [message]
        });
      }
      
      this.saveSessions();
      return message;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error adding message to session ${sessionId}: ${err.message}`);
      throw error;
    }
  }

  async sendMessage(sessionId: string, content: string): Promise<Message> {
    try {
      // Add user message
      const userMessage: Message = {
        role: MessageRole.User,
        content
      };
      
      this.logger.debug(`Sending user message to session ${sessionId}: ${content.slice(0, 30)}...`);
      await this.addMessage(sessionId, userMessage);
      
      // Get the client and run the model
      const session = this.sessions.get(sessionId)!;
      const client = this.app.getClient(session.serverId);
      client.setCurrentContextId(session.contextId!);
      
      this.logger.debug(`Running model for session ${sessionId}`);
      const response = await client.run();
      
      // Add assistant message to session
      const assistantMessage = response.assistant_message;
      session.messages.push(assistantMessage);
      session.updatedAt = new Date().toISOString();
      this.saveSessions();
      
      this.logger.debug(`Received assistant response for session ${sessionId}`);
      return assistantMessage;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error sending message in session ${sessionId}: ${err.message}`);
      throw error;
    }
  }

  deleteSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.logger.info(`Deleting session ${sessionId}`);
      this.sessions.delete(sessionId);
      this.saveSessions();
      return true;
    }
    return false;
  }

  renameSession(sessionId: string, newTitle: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.logger.info(`Renaming session ${sessionId} from "${session.title}" to "${newTitle}"`);
      session.title = newTitle;
      session.updatedAt = new Date().toISOString();
      this.saveSessions();
      return true;
    }
    return false;
  }
}

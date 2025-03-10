#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Configuration file path
const CONFIG_DIR = path.join(os.homedir(), '.mcp_config');
const NOTES_FILE = path.join(CONFIG_DIR, 'temp_notes.txt');

class TempNotesServer {
  private server: Server;

  constructor() {
    // Initialize the MCP server
    this.server = new Server(
      {
        name: 'temp-notes-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    // Set up tool handlers
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'clear_note',
          description: 'Clears the current note, making it empty.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'write_note',
          description: 'Replaces the current note with a new string.',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The content to write to the note',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'read_note',
          description: 'Returns the current content of the note.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'append_note',
          description: 'Appends new text to the current note, starting with a new line. Optionally includes a separator line.',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The content to append to the note',
              },
              include_separator: {
                type: 'boolean',
                description: 'Whether to include a separator line (---) before the new content',
                default: true,
              },
            },
            required: ['content'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'clear_note':
            return await this.clearNote();
          case 'write_note':
            return await this.writeNote(request.params.arguments);
          case 'read_note':
            return await this.readNote();
          case 'append_note':
            return await this.appendNote(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        console.error('Error handling tool call:', error);
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  // Ensure the config directory exists
  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.ensureDir(CONFIG_DIR);
    } catch (error) {
      console.error('Error creating config directory:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create config directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Clear the note
  private async clearNote(): Promise<any> {
    try {
      await this.ensureConfigDir();
      
      // Write an empty string to the file
      await fs.writeFile(NOTES_FILE, '', 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: 'Note cleared successfully.',
          },
        ],
      };
    } catch (error) {
      console.error('Error clearing note:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error clearing note: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Write a new note
  private async writeNote(args: any): Promise<any> {
    if (!args?.content) {
      throw new McpError(ErrorCode.InvalidParams, 'Content is required');
    }

    try {
      await this.ensureConfigDir();
      
      // Write the content to the file
      await fs.writeFile(NOTES_FILE, args.content, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: 'Note written successfully.',
          },
        ],
      };
    } catch (error) {
      console.error('Error writing note:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error writing note: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Read the current note
  private async readNote(): Promise<any> {
    try {
      // Check if the file exists
      if (!await fs.pathExists(NOTES_FILE)) {
        // If the file doesn't exist, return an empty string
        await this.ensureConfigDir();
        return {
          content: [
            {
              type: 'text',
              text: '',
            },
          ],
        };
      }
      
      // Read the content from the file
      const content = await fs.readFile(NOTES_FILE, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      console.error('Error reading note:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error reading note: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Append to the current note
  private async appendNote(args: any): Promise<any> {
    if (!args?.content) {
      throw new McpError(ErrorCode.InvalidParams, 'Content is required');
    }

    const includeSeparator = args.include_separator !== false; // Default to true if not specified

    try {
      await this.ensureConfigDir();
      
      // Check if the file exists
      let existingContent = '';
      if (await fs.pathExists(NOTES_FILE)) {
        existingContent = await fs.readFile(NOTES_FILE, 'utf8');
      }
      
      // Prepare the content to append
      let contentToAppend = '';
      
      // If there's existing content, add a newline
      if (existingContent && existingContent.trim() !== '') {
        contentToAppend += '\n';
        
        // Add separator if requested
        if (includeSeparator) {
          contentToAppend += '\n---\n\n';
        } else {
          contentToAppend += '\n';
        }
      }
      
      // Add the new content
      contentToAppend += args.content;
      
      // Append the content to the file
      await fs.writeFile(NOTES_FILE, existingContent + contentToAppend, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: 'Note appended successfully.',
          },
        ],
      };
    } catch (error) {
      console.error('Error appending to note:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error appending to note: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Start the server
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Temp Notes MCP server running on stdio');
  }
}

// Create and run the server
const server = new TempNotesServer();
server.run().catch(console.error);
# Temp Notes MCP Server

A Model Context Protocol (MCP) server that enables AI agents to store and retrieve temporary information across conversations and contexts.

## Purpose

The Temp Notes MCP Server provides a simple yet powerful way for AI agents to maintain state and context across multiple conversations or when working with complex tasks that exceed the context window limitations. It serves as a temporary memory system that allows agents to store notes, checklists, code snippets, and other information that can be retrieved later.

## Key Features

- Persistent temporary storage across conversations
- Simple API for reading, writing, and appending notes
- Lightweight and easy to integrate with existing workflows
- Enables complex multi-step tasks to be broken down into manageable pieces

## Use Cases

### 1. Complex Coding Tasks

When working on complex coding tasks, AI agents often face context window limitations that make it difficult to complete all steps in a single conversation. The Temp Notes MCP Server allows agents to:

- Store a checklist of tasks to be completed
- Include detailed descriptions for each subtask
- Note which files need to be examined for specific subtasks
- Track progress across multiple conversations
- Maintain important context that would otherwise be lost

This enables breaking down complex tasks into smaller, manageable pieces while maintaining the overall context and goals.

### 2. Context Preservation Across Conversations

As conversations grow longer, context windows can become full, limiting the agent's ability to maintain all relevant information. With the Temp Notes MCP Server, agents can:

- Summarize the current task status
- Document completed steps and remaining work
- Store key insights and decisions made
- Outline next steps for continuation in a new conversation

This allows users to start fresh conversations without losing progress or having to repeat information.

### 3. Cross-Repository Information Transfer

When working across multiple repositories or projects, it can be challenging to transfer relevant information. The Temp Notes MCP Server enables agents to:

- Store code snippets from one repository
- Save file contents for reference
- Document patterns or approaches from one project to apply to another
- Create temporary documentation that bridges multiple projects

This facilitates knowledge transfer across different contexts without requiring complex setup.

### 4. Collaborative Workflows

Multiple agents or users can build upon each other's work by:

- Storing intermediate results for other agents to use
- Creating shared task lists that can be updated by different agents
- Documenting approaches and methodologies for others to follow
- Maintaining a shared understanding of complex problems

### 5. Learning and Experimentation

When exploring new technologies or approaches, agents can:

- Document learning resources and references
- Store example code and usage patterns
- Track experiments and their outcomes
- Build a knowledge base of techniques and solutions

### 6. Incremental Documentation

For projects requiring documentation, agents can:

- Gather information incrementally across multiple sessions
- Organize content before finalizing documentation
- Store draft sections that can be refined over time
- Collect examples and use cases from different interactions

## Tools

The Temp Notes MCP Server provides the following tools:

### `clear_note`

Clears the current note, making it empty.

```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

### `write_note`

Replaces the current note with a new string.

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "The content to write to the note"
    }
  },
  "required": ["content"]
}
```

### `read_note`

Returns the current content of the note.

```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

### `append_note`

Appends new text to the current note, starting with a new line. Optionally includes a separator line.

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "The content to append to the note"
    },
    "include_separator": {
      "type": "boolean",
      "description": "Whether to include a separator line (---) before the new content",
      "default": true
    }
  },
  "required": ["content"]
}
```

## Note Storage

By default, the Temp Notes MCP Server stores notes in the following location:

- On macOS/Linux: `~/.mcp_config/temp_notes.txt` (which expands to `/Users/username/.mcp_config/temp_notes.txt`)
- On Windows: `C:\Users\username\.mcp_config\temp_notes.txt`

This file is created automatically when you first write a note. If the file doesn't exist when you try to read a note, the server will return an empty string and create the file when you write to it next time.

The server handles the following scenarios:

- If the file doesn't exist when reading: Returns an empty string
- If the directory doesn't exist: Creates the directory structure automatically when writing
- If the file is corrupted or inaccessible: Returns appropriate error messages

## Installation

### Option 1: Install from npm (Recommended)

1. Install the package globally:
   ```bash
   npm install -g @landicefu/temp-notes-mcp-server
   ```

2. Add the server to your MCP configuration:
   ```json
   {
     "mcpServers": {
       "temp-notes": {
         "command": "temp-notes-mcp-server",
         "disabled": false
       }
     }
   }
   ```

### Option 2: Use with npx (No Installation Required)

1. Add the server to your MCP configuration:
   ```json
   {
     "mcpServers": {
       "temp-notes": {
         "command": "npx",
         "args": ["-y", "@landicefu/temp-notes-mcp-server"],
         "disabled": false
       }
     }
   }
   ```

This option runs the server directly using npx without requiring a global installation.

### Option 3: Install from source

1. Clone the repository:
   ```bash
   git clone https://github.com/landicefu/temp-notes-mcp-server.git
   cd temp-notes-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the server:
   ```bash
   npm run build
   ```

4. Add the server to your MCP configuration:
   ```json
   {
     "mcpServers": {
       "temp-notes": {
         "command": "node",
         "args": ["/path/to/temp-notes-mcp-server/build/index.js"],
         "disabled": false
       }
     }
   }
   ```

## Usage Examples

### Storing a Task Checklist

```javascript
// Store a checklist for a complex task
await use_mcp_tool({
  server_name: "temp-notes",
  tool_name: "write_note",
  arguments: {
    content: "# Project Refactoring Checklist\n\n- [ ] Analyze current architecture\n- [ ] Identify performance bottlenecks\n- [ ] Create new component structure\n- [ ] Implement data layer changes\n- [ ] Update UI components\n- [ ] Write tests\n- [ ] Document changes"
  }
});
```

### Retrieving Stored Information

```javascript
// In a new conversation, retrieve the checklist
const result = await use_mcp_tool({
  server_name: "temp-notes",
  tool_name: "read_note",
  arguments: {}
});

// Result contains the previously stored checklist
```

### Updating Progress

```javascript
// Update the note with progress
await use_mcp_tool({
  server_name: "temp-notes",
  tool_name: "append_note",
  arguments: {
    content: "## Architecture Analysis Complete\n\nKey findings:\n- Current structure has circular dependencies\n- Data fetching is inefficient\n- Component reuse is minimal\n\nRecommendation: Implement repository pattern and component composition",
    include_separator: true
  }
});
```

### Clearing Notes When Done

```javascript
// Clear the note when the task is complete
await use_mcp_tool({
  server_name: "temp-notes",
  tool_name: "clear_note",
  arguments: {}
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

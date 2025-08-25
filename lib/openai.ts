import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Assistant configuration for renovation projects
export const RENOVATION_ASSISTANT_INSTRUCTIONS = `
You are a knowledgeable renovation assistant helping homeowners with their specific renovation project. You have access to live project data including budget, timeline, materials, and permits.

## Your Role:
- Provide helpful renovation advice specific to the user's project
- Answer questions about budgets, timelines, materials, and permits
- Give guidance on project phases and milestones
- Explain renovation processes and best practices
- Help homeowners understand their project status

## Guidelines:
- Always be helpful, professional, and encouraging
- Use the project context provided to give specific answers
- If you don't have specific information, provide general renovation guidance
- Never reveal contractor details or contact information
- Focus on the homeowner's needs and concerns
- Provide accurate information about permits and regulations when available

## Limitations:
- You cannot make changes to the project or budget
- You cannot contact contractors directly
- You cannot access or modify payment information
- Stay focused on renovation topics only
- Do not provide medical, legal, or financial advice beyond renovation context

When responding, be concise but informative, and always consider the specific project context provided.
`

export class RenovationChatbot {
  private assistantId: string | null = null

  constructor() {
    // We'll store assistant ID in environment or database
    this.assistantId = process.env.OPENAI_ASSISTANT_ID || null
  }

  /**
   * Create a new assistant (run once during setup)
   */
  async createAssistant(): Promise<string> {
    const assistant = await openai.beta.assistants.create({
      name: "Renovation Project Assistant",
      instructions: RENOVATION_ASSISTANT_INSTRUCTIONS,
      model: "gpt-4-turbo",
      tools: [
        {
          type: "function",
          function: {
            name: "get_project_info",
            description: "Get current project information including budget, timeline, and status",
            parameters: {
              type: "object",
              properties: {
                project_id: {
                  type: "string",
                  description: "The project ID to get information for"
                }
              },
              required: ["project_id"]
            }
          }
        },
        {
          type: "function", 
          function: {
            name: "get_budget_breakdown",
            description: "Get detailed budget information and spending for the project",
            parameters: {
              type: "object",
              properties: {
                project_id: {
                  type: "string",
                  description: "The project ID to get budget information for"
                }
              },
              required: ["project_id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "get_permit_requirements",
            description: "Get permit requirements and status for the project location",
            parameters: {
              type: "object",
              properties: {
                project_id: {
                  type: "string", 
                  description: "The project ID to get permit requirements for"
                }
              },
              required: ["project_id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "get_project_timeline",
            description: "Get project timeline, milestones, and current progress",
            parameters: {
              type: "object",
              properties: {
                project_id: {
                  type: "string",
                  description: "The project ID to get timeline for"
                }
              },
              required: ["project_id"]
            }
          }
        }
      ]
    })

    this.assistantId = assistant.id
    return assistant.id
  }

  /**
   * Create a new conversation thread
   */
  async createThread(): Promise<string> {
    const thread = await openai.beta.threads.create()
    return thread.id
  }

  /**
   * Add a message to the thread
   */
  async addMessage(threadId: string, message: string, projectId: string): Promise<void> {
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
      metadata: {
        project_id: projectId
      }
    })
  }

  /**
   * Run the assistant and get a response
   */
  async runAssistant(threadId: string, projectId: string): Promise<string> {
    if (!this.assistantId) {
      throw new Error('Assistant not configured. Run createAssistant() first.')
    }

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
      metadata: {
        project_id: projectId
      }
    })

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId })
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId })
    }

    if (runStatus.status === 'requires_action') {
      // Handle function calls
      await this.handleFunctionCalls(threadId, run.id, runStatus, projectId)
      
      // Wait for completion after function calls
      runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId })
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId })
      }
    }

    if (runStatus.status === 'completed') {
      // Get the latest message
      const messages = await openai.beta.threads.messages.list(threadId)
      const lastMessage = messages.data[0]
      
      if (lastMessage.content[0].type === 'text') {
        return lastMessage.content[0].text.value
      }
    }

    throw new Error(`Assistant run failed with status: ${runStatus.status}`)
  }

  /**
   * Handle function calls from the assistant
   */
  private async handleFunctionCalls(
    threadId: string,
    runId: string,
    runStatus: any,
    projectId: string
  ): Promise<void> {
    const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls
    const toolOutputs = []

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      let output = ''

      switch (functionName) {
        case 'get_project_info':
          output = await this.getProjectInfo(functionArgs.project_id)
          break
        case 'get_budget_breakdown':
          output = await this.getBudgetBreakdown(functionArgs.project_id)
          break
        case 'get_permit_requirements':
          output = await this.getPermitRequirements(functionArgs.project_id)
          break
        case 'get_project_timeline':
          output = await this.getProjectTimeline(functionArgs.project_id)
          break
        default:
          output = 'Function not implemented'
      }

      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: output
      })
    }

    await openai.beta.threads.runs.submitToolOutputs(runId, {
      thread_id: threadId,
      tool_outputs: toolOutputs
    })
  }

  /**
   * Function implementations for assistant tools
   */
  private async getProjectInfo(projectId: string): Promise<string> {
    // This would fetch from your database
    // For now, return a placeholder
    return JSON.stringify({
      status: "in_progress",
      title: "Kitchen Renovation",
      description: "Modern kitchen remodel with new appliances",
      timeline: "6-8 weeks",
      total_budget: 85000,
      spent_amount: 25000
    })
  }

  private async getBudgetBreakdown(projectId: string): Promise<string> {
    return JSON.stringify({
      total_budget: 85000,
      spent_amount: 25000,
      remaining: 60000,
      categories: {
        materials: { budgeted: 45000, spent: 15000 },
        labor: { budgeted: 30000, spent: 8000 },
        permits: { budgeted: 2000, spent: 2000 },
        contingency: { budgeted: 8000, spent: 0 }
      }
    })
  }

  private async getPermitRequirements(projectId: string): Promise<string> {
    return JSON.stringify({
      required_permits: [
        { type: "Building Permit", status: "approved", cost: 1200 },
        { type: "Electrical Permit", status: "pending", cost: 300 },
        { type: "Plumbing Permit", status: "not_required", cost: 0 }
      ],
      total_permit_cost: 1500,
      estimated_approval_time: "2-3 weeks"
    })
  }

  private async getProjectTimeline(projectId: string): Promise<string> {
    return JSON.stringify({
      start_date: "2024-01-15",
      estimated_completion: "2024-03-01",
      current_phase: "Demolition",
      milestones: [
        { name: "Permits Approved", date: "2024-01-10", status: "completed" },
        { name: "Demolition", date: "2024-01-20", status: "in_progress" },
        { name: "Rough-in Work", date: "2024-02-01", status: "pending" },
        { name: "Installation", date: "2024-02-15", status: "pending" },
        { name: "Final Inspection", date: "2024-02-28", status: "pending" }
      ]
    })
  }
}

// Export singleton instance
export const renovationChatbot = new RenovationChatbot()
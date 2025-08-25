// GPT-4 Prompts for Quote Voice Editing

import { VoiceEditCommand, QuoteItem } from '@/types/quotes'

export const QUOTE_EDIT_SYSTEM_PROMPT = `You are a quote editing assistant for contractors. 
You understand natural language commands to modify quotes and translate them into structured edits.

Current quote items will be provided. Parse the contractor's voice command and return specific changes.

Return a JSON array of VoiceEditCommand objects with these types:
- CHANGE_PRICE: Modify the price of an existing item
- ADD_ITEM: Add a new service or material
- REMOVE_ITEM: Remove an existing item
- CHANGE_QUANTITY: Modify the quantity of an item
- BULK_CHANGE: Apply changes to multiple items

Each command should include a confidence score (0-1) indicating how certain you are about the interpretation.

Examples:
"Change the toilet install to 650" → CHANGE_PRICE for toilet item
"Add a wax ring for 25 dollars" → ADD_ITEM with description and price
"Remove the second bathroom" → REMOVE_ITEM for items mentioning second bathroom
"Add 10 percent to everything" → BULK_CHANGE with add_percentage operation
"Make the total 5000" → BULK_CHANGE with set_total operation
`;

export function createEditPrompt(voiceTranscript: string, currentItems: QuoteItem[]) {
  const itemsList = currentItems.map((item, idx) => 
    `${idx + 1}. ${item.description} - Qty: ${item.quantity} ${item.unit} - $${item.unit_price} each - Total: $${item.total_price}`
  ).join('\n')

  return `
Current quote items:
${itemsList}

Current total: $${currentItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}

Contractor's voice command:
"${voiceTranscript}"

Parse this command and return an array of VoiceEditCommand objects. Be specific about which items to modify based on the description matching.

If the contractor mentions specific items, match them to the items in the list above.
If they mention categories (like "all electrical" or "labor items"), identify which items belong to those categories.
If they want to change the total to a specific amount, calculate what adjustment is needed.

Response format:
[
  {
    "type": "CHANGE_PRICE" | "ADD_ITEM" | "REMOVE_ITEM" | "CHANGE_QUANTITY" | "BULK_CHANGE",
    "target": "description or identifier of the item",
    "value": number (new price or quantity),
    "description": "for new items only",
    "operation": "for bulk changes: add_percentage, subtract_percentage, or set_total",
    "scope": "for bulk changes: all, labor, material, or specific category",
    "confidence": 0.0 to 1.0
  }
]
`;
}

export function parseGPTEditResponse(gptResponse: string): VoiceEditCommand[] {
  try {
    // Clean up the response if it has markdown code blocks
    const cleanResponse = gptResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const commands = JSON.parse(cleanResponse)
    
    // Validate and clean each command
    return commands.map((cmd: any) => ({
      type: cmd.type,
      target: cmd.target || undefined,
      value: typeof cmd.value === 'number' ? cmd.value : parseFloat(cmd.value),
      description: cmd.description || undefined,
      operation: cmd.operation || undefined,
      scope: cmd.scope || undefined,
      confidence: cmd.confidence || 0.8
    }))
  } catch (error) {
    console.error('Failed to parse GPT edit response:', error)
    return []
  }
}

export function formatChangeConfirmation(commands: VoiceEditCommand[], currentItems: QuoteItem[]): string {
  if (commands.length === 0) {
    return "I couldn't understand your changes. Please try again with specific items and amounts."
  }

  let message = `I'll make these ${commands.length} change${commands.length > 1 ? 's' : ''}:\n\n`
  let estimatedNewTotal = currentItems.reduce((sum, item) => sum + item.total_price, 0)

  commands.forEach(cmd => {
    switch (cmd.type) {
      case 'CHANGE_PRICE':
        const oldItem = currentItems.find(i => i.description.toLowerCase().includes(cmd.target?.toLowerCase() || ''))
        if (oldItem) {
          message += `✏️ ${oldItem.description}: $${oldItem.unit_price} → $${cmd.value}\n`
          estimatedNewTotal = estimatedNewTotal - oldItem.total_price + (cmd.value! * oldItem.quantity)
        }
        break
      
      case 'ADD_ITEM':
        message += `➕ Add ${cmd.description}: $${cmd.value}\n`
        estimatedNewTotal += cmd.value || 0
        break
      
      case 'REMOVE_ITEM':
        const removeItem = currentItems.find(i => i.description.toLowerCase().includes(cmd.target?.toLowerCase() || ''))
        if (removeItem) {
          message += `❌ Remove ${removeItem.description}: -$${removeItem.total_price}\n`
          estimatedNewTotal -= removeItem.total_price
        }
        break
      
      case 'CHANGE_QUANTITY':
        const qtyItem = currentItems.find(i => i.description.toLowerCase().includes(cmd.target?.toLowerCase() || ''))
        if (qtyItem) {
          message += `📦 ${qtyItem.description}: ${qtyItem.quantity} → ${cmd.value} ${qtyItem.unit}\n`
          estimatedNewTotal = estimatedNewTotal - qtyItem.total_price + (qtyItem.unit_price * (cmd.value || 1))
        }
        break
      
      case 'BULK_CHANGE':
        if (cmd.operation === 'add_percentage') {
          message += `📈 Add ${cmd.value}% to ${cmd.scope || 'all items'}\n`
          if (cmd.scope === 'all') {
            estimatedNewTotal *= (1 + (cmd.value || 0) / 100)
          }
        } else if (cmd.operation === 'set_total') {
          message += `💰 Set total to $${cmd.value}\n`
          estimatedNewTotal = cmd.value || estimatedNewTotal
        }
        break
    }
  })

  message += `\nNew total will be: $${estimatedNewTotal.toFixed(2)}\n\n`
  message += `Reply '👍' to confirm or voice message to adjust`

  return message
}

// Helper function to apply edits to quote items
export function applyEditsToItems(
  currentItems: QuoteItem[],
  commands: VoiceEditCommand[]
): QuoteItem[] {
  let updatedItems = [...currentItems]

  commands.forEach(cmd => {
    switch (cmd.type) {
      case 'CHANGE_PRICE':
        updatedItems = updatedItems.map(item => {
          if (item.description.toLowerCase().includes(cmd.target?.toLowerCase() || '')) {
            return {
              ...item,
              unit_price: cmd.value!,
              total_price: cmd.value! * item.quantity
            }
          }
          return item
        })
        break

      case 'ADD_ITEM':
        const newItem: QuoteItem = {
          id: `temp_${Date.now()}`,
          quote_id: currentItems[0]?.quote_id || '',
          description: cmd.description!,
          quantity: 1,
          unit: 'each',
          unit_price: cmd.value!,
          total_price: cmd.value!,
          category: 'other',
          display_order: updatedItems.length,
        }
        updatedItems.push(newItem)
        break

      case 'REMOVE_ITEM':
        updatedItems = updatedItems.filter(item => 
          !item.description.toLowerCase().includes(cmd.target?.toLowerCase() || '')
        )
        break

      case 'CHANGE_QUANTITY':
        updatedItems = updatedItems.map(item => {
          if (item.description.toLowerCase().includes(cmd.target?.toLowerCase() || '')) {
            return {
              ...item,
              quantity: cmd.value!,
              total_price: item.unit_price * cmd.value!
            }
          }
          return item
        })
        break

      case 'BULK_CHANGE':
        if (cmd.operation === 'add_percentage') {
          const multiplier = 1 + (cmd.value || 0) / 100
          updatedItems = updatedItems.map(item => {
            if (cmd.scope === 'all' || item.category === cmd.scope) {
              return {
                ...item,
                unit_price: item.unit_price * multiplier,
                total_price: item.total_price * multiplier
              }
            }
            return item
          })
        } else if (cmd.operation === 'set_total') {
          // Calculate adjustment needed
          const currentTotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0)
          const targetTotal = cmd.value!
          const ratio = targetTotal / currentTotal
          
          updatedItems = updatedItems.map(item => ({
            ...item,
            unit_price: item.unit_price * ratio,
            total_price: item.total_price * ratio
          }))
        }
        break
    }
  })

  return updatedItems
}
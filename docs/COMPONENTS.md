# Components Documentation

> **Auto-Generated**: This document is maintained by an automated architecture tracking system.  
> **Last Updated**: 2025-08-18
> **Component Count**: 18+

## Overview

The Renovation Advisor Platform uses a component-based architecture with React components organized by functionality. All components are built using TypeScript and follow consistent patterns for props, styling, and state management.

## Component Architecture

```
components/
├── ui/              # Base UI primitives (Radix UI + Tailwind)
├── forms/           # Form components with validation
├── projects/        # Project-specific functionality
├── contractors/     # Contractor-related components
├── chatbot/         # AI chatbot system
├── dashboard/       # Dashboard and analytics
├── payments/        # Payment processing
├── search/          # Search functionality
├── chat/            # Alternative chat implementation
└── providers/       # Context providers
```

## UI Primitives (`/components/ui/`)

Base UI components built on Radix UI primitives with Tailwind CSS styling.

### `avatar.tsx`
- **Purpose**: User avatar display with fallback
- **Props**: `className`, `size`
- **Usage**: Profile pictures, user identification
- **Dependencies**: Radix UI Avatar

### `badge.tsx`
- **Purpose**: Status indicators and labels
- **Props**: `variant`, `size`, `className`
- **Variants**: `default`, `secondary`, `destructive`, `outline`
- **Usage**: Status badges, tags, categories

### `button.tsx`
- **Purpose**: Interactive button component
- **Props**: `variant`, `size`, `className`, `disabled`
- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default`, `sm`, `lg`, `icon`
- **Usage**: Form submissions, navigation, actions

### `card.tsx`
- **Purpose**: Content container with styling
- **Components**: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`
- **Props**: `className`
- **Usage**: Information display, content grouping

### `checkbox.tsx`
- **Purpose**: Boolean input control
- **Props**: `checked`, `onCheckedChange`, `disabled`, `className`
- **Dependencies**: Radix UI Checkbox
- **Usage**: Form inputs, settings toggles

### `collapsible.tsx`
- **Purpose**: Expandable content sections
- **Components**: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- **Props**: `open`, `onOpenChange`, `className`
- **Dependencies**: Radix UI Collapsible
- **Usage**: FAQ sections, expandable menus

### `dialog.tsx`
- **Purpose**: Modal dialog system
- **Components**: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`
- **Props**: `open`, `onOpenChange`, `className`
- **Dependencies**: Radix UI Dialog
- **Usage**: Confirmations, forms, detailed views

### `input.tsx`
- **Purpose**: Text input field
- **Props**: `type`, `placeholder`, `value`, `onChange`, `disabled`, `className`
- **Types**: `text`, `email`, `password`, `number`, `tel`
- **Usage**: Form inputs, search fields

### `label.tsx`
- **Purpose**: Form field labels
- **Props**: `htmlFor`, `className`
- **Dependencies**: Radix UI Label
- **Usage**: Form field labeling, accessibility

### `scroll-area.tsx`
- **Purpose**: Custom scrollable areas
- **Components**: `ScrollArea`, `ScrollBar`
- **Props**: `className`, `orientation`
- **Dependencies**: Radix UI Scroll Area
- **Usage**: Chat messages, long lists

### `select.tsx`
- **Purpose**: Dropdown selection input
- **Components**: `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- **Props**: `value`, `onValueChange`, `disabled`, `className`
- **Dependencies**: Radix UI Select
- **Usage**: Form dropdowns, filters

### `tabs.tsx`
- **Purpose**: Tabbed interface component
- **Components**: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- **Props**: `value`, `onValueChange`, `orientation`, `className`
- **Dependencies**: Radix UI Tabs
- **Usage**: Navigation, content organization

### `textarea.tsx`
- **Purpose**: Multi-line text input
- **Props**: `value`, `onChange`, `placeholder`, `rows`, `disabled`, `className`
- **Usage**: Long form text, comments, descriptions

---

## Form Components (`/components/forms/`)

Form components with validation and submission handling.

### `IntakeForm.tsx`
- **Purpose**: Multi-step project intake form
- **Props**: `onSubmit`, `initialData`
- **Features**:
  - Multi-step wizard interface
  - File upload for project photos
  - Form validation with error handling
  - Progress tracking
  - Draft saving capability
- **Dependencies**: `react-hook-form`, `zod`
- **State Management**: Local form state with validation
- **API Integration**: `POST /api/projects`

**Form Steps**:
1. Project type and scope
2. Budget and timeline
3. Property details and address
4. Photo uploads
5. Review and submission

**Validation Schema**:
```typescript
interface IntakeFormData {
  projectType: string
  description: string
  budgetMin: number
  budgetMax: number
  timeline: string
  address: Address
  photos: File[]
  specialRequests: string
}
```

---

## Project Components (`/components/projects/`)

Components specific to project management functionality.

### `BudgetTracker.tsx`
- **Purpose**: Budget tracking and visualization
- **Props**: `projectId`, `budget`, `expenses`
- **Features**:
  - Real-time budget vs. spent visualization
  - Category-based expense breakdown
  - Alert system for budget overruns
  - Change order tracking
- **Dependencies**: Chart libraries for visualizations
- **API Integration**: `GET /api/projects/[id]/budget`

### `FileUpload.tsx`
- **Purpose**: File upload component with drag-and-drop
- **Props**: `onUpload`, `acceptedTypes`, `maxSize`, `multiple`
- **Features**:
  - Drag and drop interface
  - File type validation
  - Progress indicators
  - Preview capabilities
- **API Integration**: `POST /api/projects/[id]/files`
- **Storage**: Supabase Storage

### `GanttChart.tsx`
- **Purpose**: Project timeline visualization
- **Props**: `milestones`, `tasks`, `dateRange`
- **Features**:
  - Interactive timeline
  - Milestone tracking
  - Dependency visualization
  - Progress indicators
- **Dependencies**: Gantt chart library

### `MessageThread.tsx`
- **Purpose**: Real-time messaging interface
- **Props**: `projectId`, `participants`
- **Features**:
  - Real-time message updates
  - File sharing capabilities
  - Message status indicators
  - Participant presence
- **Dependencies**: Supabase Realtime
- **API Integration**: `GET/POST /api/projects/[id]/messages`

### `ProjectTimeline.tsx`
- **Purpose**: Project milestone timeline
- **Props**: `projectId`, `milestones`
- **Features**:
  - Visual timeline display
  - Milestone status tracking
  - Interactive milestone details
  - Progress visualization
- **API Integration**: `GET /api/projects/[id]/milestones`

---

## Contractor Components (`/components/contractors/`)

Components for contractor-related functionality.

### `ContractorCard.tsx`
- **Purpose**: Individual contractor display card
- **Props**: `contractor`, `onSelect`, `showActions`
- **Features**:
  - Contractor profile information
  - Rating and review display
  - Portfolio showcase
  - Contact actions
- **Data Structure**:
  ```typescript
  interface Contractor {
    id: string
    name: string
    company: string
    specialties: string[]
    rating: number
    location: string
    portfolio: Image[]
    availability: boolean
  }
  ```

### `ContractorList.tsx`
- **Purpose**: List of matched contractors
- **Props**: `contractors`, `onContractorSelect`, `filters`
- **Features**:
  - Contractor filtering and sorting
  - Pagination support
  - Bulk actions
  - Match score display
- **API Integration**: `GET /api/contractors/match`

---

## Chatbot Components (`/components/chatbot/`)

AI-powered chatbot system components.

### `ChatbotWidget.tsx`
- **Purpose**: Main chatbot interface widget
- **Props**: `className`
- **Features**:
  - Floating chat button
  - Expandable chat window
  - Message history persistence
  - Lead capture integration
  - Minimize/restore functionality
- **State Management**: Local state with session persistence
- **API Integration**: `POST /api/chatbot`
- **External Services**: OpenAI GPT-4o Mini

**Key Features**:
- Real-time conversation with Emma AI
- Automatic lead detection and capture
- Session-based conversation persistence
- Analytics tracking
- Responsive design

### `LeadCaptureForm.tsx`
- **Purpose**: Lead information capture form
- **Props**: `onSubmit`, `onCancel`
- **Features**:
  - Contact information collection
  - Form validation
  - Error handling
  - Analytics tracking
- **API Integration**: `POST /api/chatbot/lead`
- **External Services**: NotificationAPI

**Form Fields**:
```typescript
interface LeadData {
  name: string
  email: string
  phone: string
  projectType?: string
  preferredTime?: 'morning' | 'afternoon' | 'evening'
  projectDetails?: string
}
```

### `SimpleChatbotWidget.tsx`
- **Purpose**: Simplified chatbot for testing
- **Props**: None
- **Features**:
  - Basic chat interface
  - Testing functionality
  - Simplified UI for debugging
- **Usage**: Development and testing purposes

### `types.ts`
- **Purpose**: TypeScript type definitions for chatbot
- **Exports**: `ChatMessage`, `LeadData`, `ConversationAnalysis`
- **Usage**: Type safety across chatbot components

---

## Dashboard Components (`/components/dashboard/`)

Dashboard and analytics components.

### `AnalyticsDashboard.tsx`
- **Purpose**: Main analytics dashboard
- **Props**: `dateRange`, `filters`
- **Features**:
  - Key metrics display
  - Chart visualizations
  - Real-time data updates
  - Export capabilities
- **API Integration**: `GET /api/analytics`

### `MilestoneOverview.tsx`
- **Purpose**: Project milestones overview
- **Props**: `projectId`, `milestones`
- **Features**:
  - Milestone progress tracking
  - Status indicators
  - Timeline visualization
  - Action buttons
- **API Integration**: `GET /api/milestones`

---

## Payment Components (`/components/payments/`)

Payment processing components.

### `EscrowPaymentForm.tsx`
- **Purpose**: Escrow payment setup form
- **Props**: `projectId`, `amount`, `onSubmit`
- **Features**:
  - Secure payment form
  - Milestone-based payments
  - Payment verification
  - Escrow management
- **API Integration**: `POST /api/payments/escrow`

### `PaymentTransactionList.tsx`
- **Purpose**: Payment history display
- **Props**: `projectId`, `transactions`
- **Features**:
  - Transaction history
  - Status tracking
  - Payment details
  - Receipt generation
- **API Integration**: `GET /api/payments/history`

---

## Search Components (`/components/search/`)

Search and filtering components.

### `SearchFilters.tsx`
- **Purpose**: Advanced search filters
- **Props**: `onFiltersChange`, `availableFilters`
- **Features**:
  - Multiple filter types
  - Dynamic filter options
  - Clear and reset functionality
  - Filter persistence
- **Usage**: Contractor search, project search

---

## Chat Components (`/components/chat/`)

Alternative chat implementation.

### `RenovationChatbot.tsx`
- **Purpose**: Alternative chatbot implementation
- **Props**: `config`, `onMessage`
- **Features**:
  - Alternative chat interface
  - Custom configuration options
  - Message handling
- **API Integration**: `POST /api/chat`

---

## Provider Components (`/components/providers/`)

Context providers for state management.

### `StripeProvider.tsx`
- **Purpose**: Stripe payment provider
- **Props**: `children`, `stripeKey`
- **Features**:
  - Stripe Elements context
  - Payment method management
  - Secure payment processing
- **Dependencies**: Stripe Elements

### `query-provider.tsx` (in `/lib/providers/`)
- **Purpose**: React Query provider setup
- **Props**: `children`
- **Features**:
  - Query client configuration
  - Cache management
  - Error handling
- **Dependencies**: React Query

---

## Component Relationships

### Data Flow Patterns

```
Parent Page → Provider → Feature Component → UI Component
     ↓            ↓            ↓              ↓
State Mgmt → Context → Business Logic → Presentation
```

### Common Patterns

#### Form Components
```typescript
interface FormComponentProps {
  onSubmit: (data: T) => void
  onCancel?: () => void
  initialData?: Partial<T>
  disabled?: boolean
}
```

#### Display Components
```typescript
interface DisplayComponentProps {
  data: T
  loading?: boolean
  error?: string
  onAction?: (action: string, data: any) => void
}
```

#### Container Components
```typescript
interface ContainerComponentProps {
  children: React.ReactNode
  className?: string
}
```

---

## Styling Conventions

### Tailwind CSS Classes
- **Layout**: `flex`, `grid`, `space-*`, `p-*`, `m-*`
- **Colors**: Custom palette with `kurtis-accent`, `kurtis-black`
- **Typography**: `text-*`, `font-*`
- **Responsive**: `sm:`, `md:`, `lg:`, `xl:`

### Component Class Patterns
```typescript
// Base classes with variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      }
    }
  }
)
```

---

## Testing Patterns

### Component Testing
```typescript
// Example test structure
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName {...props} />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('handles user interaction', () => {
    const onAction = jest.fn()
    render(<ComponentName onAction={onAction} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onAction).toHaveBeenCalled()
  })
})
```

---

## Performance Considerations

### Optimization Techniques
- **Memoization**: `React.memo` for pure components
- **Lazy Loading**: `React.lazy` for code splitting
- **Virtualization**: For large lists (contractor lists, message history)
- **Image Optimization**: Next.js Image component

### Bundle Size Management
- Tree shaking for unused code
- Dynamic imports for heavy components
- Separate chunks for admin components

---

*This document is automatically maintained and updated as new components are added to the system.*
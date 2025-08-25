# Renovation Advisor Platform

A Next.js 14 SaaS application that connects homeowners with vetted contractors and provides transparent project management tools.

## 🚀 Features

- **AI Chatbot Assistant**: Emma AI powered by GPT-4o Mini with natural lead capture
- **Multi-step Intake Form**: Comprehensive project requirement collection with photo uploads
- **Contractor Matching**: Algorithm-based matching with availability and specialization tracking
- **Real-time Messaging**: Live communication hub with action item tracking
- **Budget Management**: Detailed expense tracking with visual indicators and alerts
- **Project Dashboard**: Centralized project overview with timeline and status tracking
- **Analytics Dashboard**: Conversation tracking, lead scoring, and usage analytics
- **Unified Notifications**: Email and SMS alerts via NotificationAPI integration

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with custom styling
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: OpenAI GPT-4o Mini for chatbot intelligence
- **Notifications**: NotificationAPI for unified email/SMS
- **PDF Generation**: React PDF
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI account with API access
- NotificationAPI account (for email/SMS)

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for chatbot)
OPENAI_API_KEY=your_openai_api_key

# NotificationAPI (email and SMS)
NOTIFICATIONAPI_CLIENT_ID=your_notificationapi_client_id
NOTIFICATIONAPI_CLIENT_SECRET=your_notificationapi_client_secret

# Admin Notifications
ADMIN_EMAIL=your_admin_email
ADMIN_PHONE=your_admin_phone

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security and configure authentication

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
renovation-advisor/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   ├── contractors/       # Contractor search page
│   ├── dashboard/         # Main dashboard
│   ├── intake/            # Project intake form
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   ├── projects/          # Project-specific components
│   ├── contractors/       # Contractor-related components
│   └── chatbot/           # AI chatbot system components
├── lib/
│   ├── supabase/          # Supabase client configuration
│   └── utils/             # Utility functions
├── types/
│   └── database.ts        # TypeScript type definitions
└── database/
    └── schema.sql         # Database schema
```

## 🔑 Key Features

### AI Chatbot System
- Emma AI assistant powered by GPT-4o Mini
- Natural conversation-based lead capture
- Intelligent project type detection
- Automatic notifications to admin via email/SMS
- Conversation analytics and tracking

### Intake Form System
- Multi-step form with validation
- Photo upload capabilities
- Project type and budget range selection
- Address and timeline capture

### Contractor Matching
- Algorithm-based matching by specialties, location, and availability
- Rating and review system
- Price range filtering
- Service area mapping

### Real-time Communication
- WebSocket-powered messaging
- File attachment support
- Action item flagging
- Unified email/SMS notifications via NotificationAPI

### Budget Tracking
- Line-item expense tracking
- Visual budget health indicators
- Change order management
- Category-based organization
- Automatic alerts at spending thresholds

### Project Dashboard
- Overview with key metrics
- Timeline tracking
- Budget visualization
- Recent activity feed
- Team management

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checking

## 📊 Database Schema

The application uses the following main tables:

- `profiles` - User management (extends Supabase auth)
- `contractors` - Contractor information and availability
- `projects` - Project details and status
- `messages` - Real-time communication
- `budget_items` - Expense tracking
- `project_files` - File storage references

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Input validation on client and server
- Environment variables for all API keys
- Rate limiting on API endpoints
- File upload sanitization

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment

```bash
npm run build
npm run start
```

## 🧪 Testing

To set up testing (not included in MVP):

```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test

# Run tests
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
```

## 📚 Documentation

- [Development Plan](renovation-advisor-dev-plan.md) - Detailed implementation guide
- [Product Requirements](renovation-advisor-prd.md) - Complete feature specifications
- [CLAUDE.md](CLAUDE.md) - AI assistant guidance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation files
- Review the database schema
- Ensure environment variables are correctly set
- Check Supabase and third-party service configurations

## 🎯 MVP Status

This implementation includes all Phase 1 MVP features:
- ✅ AI Chatbot with natural lead capture (Emma AI)
- ✅ Project intake and brief generation
- ✅ Contractor database and matching
- ✅ Real-time communication hub
- ✅ Budget tracking system
- ✅ Project dashboard
- ✅ Analytics dashboard with conversation tracking
- ✅ Unified email/SMS notification system

Ready for beta testing with real users and contractors!# Deployment trigger

# Deployment trigger after reconnection

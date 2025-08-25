# SnapQuote - Voice-Enabled Contractor Quoting Platform 🎯

> Revolutionary phone-first platform for contractors. Generate quotes with voice commands, edit via WhatsApp, and deliver PDFs instantly.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Faridon99%2Fsnapquote)

## 🚀 Key Features

### Voice-First Quote Generation
- **Record consultations** on your phone
- **Voice command editing** through WhatsApp
- **Instant PDF generation** and delivery
- **Real-time price updates** via voice

### WhatsApp Integration
- Complete workflow through WhatsApp
- Voice message transcription
- PDF delivery to customers
- Real-time quote editing

### Mobile-Optimized Portal
- Progressive Web App (PWA)
- Touch-friendly interface
- Offline capability
- Install as native app

## 📱 Phone-Centric Workflow

1. **Sign Up** → Mobile-optimized contractor portal
2. **Record** → Capture consultation on phone
3. **Send** → Upload via WhatsApp
4. **Review** → Receive generated quote PDF
5. **Edit** → Voice commands to modify
6. **Deliver** → Send final quote to customer

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4o-mini for voice processing
- **WhatsApp**: Twilio API integration
- **PDF**: Dynamic generation with PDFKit
- **Deployment**: Vercel (optimized for edge)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key
- Twilio account with WhatsApp

### Local Development

```bash
# Clone repository
git clone https://github.com/aridon99/snapquote.git
cd snapquote

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Database Setup

```bash
# Run migrations in Supabase SQL editor
database/contractor-pricing-schema.sql
database/quote-system-schema.sql
database/test-validation-schema.sql
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub repository
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`

### Environment Variables

See `.env.example` for complete list

## 📱 Mobile Features

- **Voice Input**: Native microphone integration
- **Touch Optimized**: 44px minimum touch targets
- **Offline Mode**: Service worker caching
- **Install Prompt**: Add to home screen
- **Push Notifications**: Real-time updates

## 🧪 Testing

### Test Validation System
Built-in automated test validation with structured logging:

```bash
# Run tests
npm test

# Check validation dashboard
/api/test/validation
```

### WhatsApp Testing
1. Send "test" to your WhatsApp number
2. Upload consultation recording
3. Edit with voice commands
4. Verify PDF delivery

## 📊 Features Roadmap

- [x] Voice-enabled quote editing
- [x] WhatsApp integration
- [x] PDF generation
- [x] Mobile-optimized portal
- [x] Test validation system
- [ ] Google Sheets sync
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Team collaboration

## 🔒 Security

- Supabase Row Level Security (RLS)
- Secure API key management via Vault
- Phone number verification
- HTTPS enforced
- Input sanitization

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](docs/API_ENDPOINTS.md)
- [Test Flow Guide](test-quote-flow.md)
- [Architecture Overview](ARCHITECTURE.md)

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/aridon99/snapquote/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aridon99/snapquote/discussions)

---

Built with ❤️ for contractors who want to work smarter, not harder
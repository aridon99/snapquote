# Project Submission Workflow

## Overview
When a homeowner submits a project through the intake form, a series of automated and manual processes are triggered to ensure the project is properly processed, contractors are matched, and communication channels are established.

## Immediate Actions (0-5 minutes)

### 1. Data Validation & Storage
- **Intake form data** is validated against schema requirements
- **Project record** is created in the `projects` table with status `intake`
- **Intake form details** are stored in `intake_forms` table for reference
- **Photo uploads** are processed and stored in Supabase Storage with references in `project_files` table

### 2. User Feedback
- **Success notification** is displayed to the user
- **Confirmation email** is sent with project details and next steps
- **Redirect** to project dashboard or confirmation page

### 3. Initial Processing
- **Project brief PDF** is generated from intake data
- **Project ID** and tracking number are assigned
- **Initial budget estimates** are calculated based on project type and scope

## Automated Processes (5-30 minutes)

### 4. Contractor Matching Algorithm
The system automatically identifies suitable contractors based on:
- **Location matching**: Contractors serving the project area
- **Specialty matching**: Contractors with relevant project type experience
- **Availability matching**: Contractors available within the timeline
- **Budget alignment**: Contractors working in the appropriate price range
- **Rating threshold**: Only contractors above minimum rating (e.g., 4.0 stars)

### 5. Notifications to Matched Contractors
- **Email notifications** sent to top 5-10 matched contractors
- **SMS alerts** for contractors who opt-in for text notifications
- **Project brief** shared with basic details (location, type, timeline, budget)
- **Response deadline** set (typically 48-72 hours)

### 6. Internal Admin Notifications
- **Admin dashboard** updated with new project
- **Slack/email notification** to platform administrators
- **Quality review** triggered for projects over certain budget thresholds

## Follow-up Actions (30 minutes - 48 hours)

### 7. Contractor Responses
- Contractors can:
  - **Express interest** and request full project details
  - **Submit initial quotes** or estimates
  - **Ask clarifying questions** through the messaging system
  - **Decline** if not interested or available

### 8. Homeowner Portal Updates
- **Contractor matches** displayed in homeowner dashboard
- **Real-time updates** as contractors respond
- **Messaging threads** created for each interested contractor
- **Comparison tools** enabled to evaluate contractor proposals

### 9. Communication Facilitation
- **Message routing** between homeowners and contractors
- **Notification preferences** respected (email, SMS, in-app)
- **Document sharing** enabled for quotes, licenses, portfolios
- **Schedule coordination** for site visits or consultations

## Milestone Tracking (Ongoing)

### 10. Project Status Updates
Status progression through lifecycle:
1. `intake` - Initial submission
2. `planning` - Requirements gathering and clarification
3. `contractor_selection` - Active contractor evaluation
4. `in_progress` - Contractor selected, work beginning
5. `completed` - Project finished
6. `on_hold` - Temporarily paused

### 11. Payment Processing
- **Escrow setup** for projects with payment protection
- **Milestone payments** scheduled based on project timeline
- **Invoice generation** for platform fees
- **Payment reminders** sent automatically

### 12. Quality Assurance
- **Progress monitoring** through photo updates
- **Milestone verification** before payment releases
- **Issue escalation** for disputes or concerns
- **Review requests** sent post-completion

## Data & Analytics

### 13. Tracking & Reporting
- **Conversion metrics**: Intake to project completion
- **Contractor performance**: Response rates, win rates, ratings
- **Project analytics**: Average budgets, timelines, types
- **User behavior**: Form completion rates, drop-off points

### 14. Continuous Improvement
- **A/B testing** on matching algorithms
- **Feedback collection** from both parties
- **Process optimization** based on data insights
- **Feature development** based on user needs

## Error Handling

### 15. Failure Scenarios
- **Validation failures**: Clear error messages, data preservation
- **Upload failures**: Retry mechanism, fallback options
- **API failures**: Queue system for retries, admin alerts
- **No contractor matches**: Manual intervention, expanded search

## Integration Points

### 16. Third-party Services
- **Supabase**: Database, auth, storage, real-time
- **Resend/SendGrid**: Email notifications
- **Twilio**: SMS notifications
- **Puppeteer**: PDF generation
- **Stripe**: Payment processing (future)
- **Google Maps API**: Address validation and mapping

## Security & Compliance

### 17. Data Protection
- **PII handling**: Encrypted storage, limited access
- **Document security**: Signed URLs, access controls
- **Audit logging**: All actions tracked
- **GDPR compliance**: Data retention, user rights
- **Contractor vetting**: Background checks, license verification

## Success Metrics

### 18. Key Performance Indicators
- **Submission completion rate**: >60%
- **Contractor response rate**: >70% within 48 hours
- **Match success rate**: >80% get 3+ responses
- **Time to first response**: <2 hours average
- **Project completion rate**: >50% of submissions
- **User satisfaction**: >4.5 star average

## Manual Interventions

### 19. Admin Actions
- **Quality review** for high-value projects
- **Manual matching** when algorithm fails
- **Dispute resolution** between parties
- **Contractor onboarding** for new regions
- **Custom pricing** for enterprise clients

## Future Enhancements

### 20. Planned Improvements
- **AI-powered matching**: ML-based contractor recommendations
- **Instant quotes**: Automated pricing based on historical data
- **Virtual consultations**: Video chat integration
- **3D modeling**: Upload floor plans for better estimates
- **Smart contracts**: Blockchain-based agreements
- **Mobile app**: Native iOS/Android applications

---

## Technical Implementation Notes

### API Endpoint: POST /api/projects
- Validates intake form data
- Creates project and related records
- Triggers async job for contractor matching
- Returns project ID and confirmation

### Database Tables Affected
- `projects`: Main project record
- `intake_forms`: Detailed form submission
- `project_files`: Photo uploads
- `contractor_matches`: Algorithm results
- `messages`: Initial communication threads
- `notifications`: Email/SMS queue

### Background Jobs
- Contractor matching (runs every 5 minutes)
- Email sending (immediate)
- SMS sending (immediate)
- PDF generation (async, within 10 minutes)
- Analytics aggregation (hourly)

### Monitoring & Alerts
- Error rates > 1% trigger alerts
- Response time > 2s logged
- Failed matches reviewed daily
- Contractor response rates tracked
- User drop-off points analyzed
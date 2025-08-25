# Project Reference System

## Overview
The unified project reference system creates a seamless connection between advisor and homeowner dashboards using project reference codes and shared context.

## Features Implemented

### 1. Project Reference Codes
- **Format**: `[TYPE]-[YEAR]-[INITIALS]-[SEQUENCE]`
- **Example**: `KIT-24-JH-001` (Kitchen project, 2024, John Huang, first project)
- **Display**: Shown prominently as badges on both dashboards
- **Usage**: Used for verbal communication and URL references

### 2. Shared Project Context
- **Provider**: `ProjectProvider` component manages state across both dashboards
- **Real-time sync**: Project-specific channels ensure instant updates
- **Session tracking**: Active viewers are tracked with presence indicators

### 3. Project Switcher Component
- **Quick access**: Dropdown with recently viewed and all projects
- **Search**: Full-text search across project codes and titles
- **Role switching**: Advisor can view owner dashboard and vice versa
- **Active sessions**: Shows who else is currently viewing each project

### 4. Unified Real-time Channels
- **Previous**: Separate channels (`homeowner-projects`, `advisor-projects`)
- **New**: Project-specific channels (`project-${projectId}`)
- **Benefit**: Both dashboards see changes instantly

### 5. Deep Linking Support
- **URL format**: `/owner/dashboard?project=KIT-24-JH-001`
- **Reference support**: Works with both project IDs and reference codes
- **Navigation**: Automatic project switching based on URL parameters

## Database Changes

### New Columns (projects table)
```sql
ALTER TABLE projects ADD COLUMN reference_code VARCHAR(50) UNIQUE;
ALTER TABLE projects ADD COLUMN last_viewed_by UUID REFERENCES profiles(id);
ALTER TABLE projects ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE;
```

### New Table (project_sessions)
```sql
CREATE TABLE project_sessions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES profiles(id),
  user_role VARCHAR(20),
  started_at TIMESTAMP,
  last_activity TIMESTAMP,
  is_active BOOLEAN
);
```

## Usage Examples

### For Developers
```typescript
// Use the project context
const { currentProject, switchToProject, navigateToProject } = useProjectContext()

// Switch to a project
await switchToProject('project-uuid')

// Navigate between dashboard views
navigateToProject('project-uuid', 'advisor') // View as advisor
navigateToProject('project-uuid', 'owner')   // View as owner
```

### For Users
- **Quick switching**: Use the project switcher in the header
- **Direct links**: Share URLs like `/owner/dashboard?project=KIT-24-JH-001`
- **Communication**: Reference projects by code in calls/messages
- **Context awareness**: See who else is viewing the project

## Benefits

1. **Improved Communication**: Standard reference codes for verbal/written communication
2. **Real-time Collaboration**: Instant sync when advisor/owner makes changes
3. **Context Preservation**: URL-based project context maintains state across sessions
4. **Role Flexibility**: Easy switching between advisor and owner perspectives
5. **Activity Tracking**: Know when projects were last viewed and by whom

## Migration Notes

To apply the database changes:
```bash
# Run the migration
psql -d your_database -f database/add-project-reference-code.sql
```

Existing projects will automatically get reference codes generated based on:
- Project type (first 3 letters)
- Owner name (initials)
- Creation year
- Sequence number
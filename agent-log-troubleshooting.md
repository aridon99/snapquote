# Troubleshooting Log

This file documents technical issues, their root causes, solutions implemented, and outcomes for the Renovation Advisor Platform.

---

## Entry Format

```
## [YYYY-MM-DD HH:MM] - Issue Title
**Problem:** Brief description of the issue
**Root Cause:** Technical explanation of why the issue occurred
**Solution:** What was implemented to fix the issue
**Files Modified:** List of files changed
**Status:** RESOLVED/IN PROGRESS/PENDING
**Additional Notes:** Any relevant context or follow-up items
```

---

## [2025-08-29 Current] - Next.js 15 TypeScript Parameter Compatibility

**Problem:** Deployment failing due to TypeScript error in contractor status API route. The application was unable to build successfully, blocking deployment to production.

**Root Cause:** Next.js 15 introduced breaking changes to parameter typing in API routes. The previous synchronous parameter access pattern `{ params: { id: string } }` is no longer compatible. Parameters are now returned as a Promise and must be awaited before use.

**Solution:** Updated parameter typing and access pattern:
- Changed parameter type from `{ params: { id: string } }` to `{ params: Promise<{ id: string }> }`
- Added `const { id: contractorId } = await params;` to properly await the params Promise
- Updated the function to handle asynchronous parameter resolution

**Files Modified:**
- Contractor status API route (specific path to be documented)

**Status:** RESOLVED

**Additional Notes:** This is a common breaking change when upgrading to Next.js 15. Other API routes in the application may need similar updates if they access route parameters. Consider auditing all API routes for similar parameter access patterns.

---

## [2025-08-29] - Supabase Client Async Access Issue

**Problem:** Build failed with "Property 'from' does not exist on type 'Promise<SupabaseClient>'"

**Root Cause:** In Next.js 15, the createClient() function from @/lib/supabase/server is async and returns a Promise that needs to be awaited

**Solution:** Added await when calling createClient() in the API route: `const supabase = await createClient();`

**Files Modified:**
- app/api/contractors/[id]/status/route.ts

**Status:** RESOLVED

**Additional Notes:** Fixed and ready for deployment

---

## Template for Future Entries

```
## [YYYY-MM-DD HH:MM] - Issue Title
**Problem:** 
**Root Cause:** 
**Solution:** 
**Files Modified:** 
**Status:** 
**Additional Notes:** 
```
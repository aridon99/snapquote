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

## [2025-08-29] - OpenAI Transcription API Response Format Issue

**Problem:** Build failed with "Property 'text' does not exist on type 'string'"

**Root Cause:** When using `response_format: 'text'` with OpenAI's transcription API, it returns a string directly, not an object with a text property

**Solution:** Changed from `transcription.text` to just `transcription` since the API returns the text directly as a string

**Files Modified:**
- app/api/contractors/quick-win-quote/route.ts

**Status:** RESOLVED

---

## [2025-08-29] - Comprehensive Supabase Client Async Fix Across All API Routes

**Problem:** Multiple build failures with "Property 'from' does not exist on type 'Promise<SupabaseClient>'" across different API routes

**Root Cause:** The createClient() function is async in Next.js 15 and returns a Promise. All API routes using Supabase need to await this function.

**Solution:** Added await to all createClient() calls across all API routes. Performed comprehensive search and fixed all instances.

**Files Modified:** 
- app/api/contractors/quick-win-quote/route.ts (2 instances)
- app/api/health/route.ts (1 instance)
- app/api/contractors/signup/route.ts (1 instance)
- app/api/contractors/[id]/status/route.ts (previously fixed)

**Status:** RESOLVED - Comprehensive fix applied to all API routes

**Additional Notes:** This comprehensive fix ensures all Supabase client usage across the application is compatible with Next.js 15. All API routes have been systematically updated to properly await the createClient() function, eliminating the async/Promise type errors that were preventing successful builds.

---

## [2025-08-29] - Supabase Query Builder Promise Execution Error

**Problem:** Build failed with "Property 'catch' does not exist on type 'PostgrestFilterBuilder'"

**Root Cause:** Supabase query builders are not Promises until executed. The insert() method returns a query builder that needs to be executed to become a Promise.

**Solution:** Removed intermediate variable and directly chained .then() and .catch() to the query execution, allowing the query to execute and return a Promise

**Files Modified:**
- app/api/contractors/quick-win-quote/route.ts

**Status:** RESOLVED

**Additional Notes:** This is the 5th fix attempt for the Vercel build. The pattern of errors shows Next.js 15 compatibility issues with async operations.

---

## [2025-08-29] - TypeScript Promise Chain Method Compatibility

**Problem:** Build failed with "Property 'catch' does not exist on type 'PromiseLike<void>'"

**Root Cause:** TypeScript strict typing - .then() returns PromiseLike which doesn't have .catch() method. Need to use the two-parameter form of .then() for error handling.

**Solution:** Changed from .then().catch() pattern to .then(success, error) pattern which is TypeScript compliant

**Files Modified:**
- app/api/contractors/quick-win-quote/route.ts

**Status:** RESOLVED

**Additional Notes:** This is the 6th fix attempt. The pattern shows TypeScript in Next.js 15 is very strict about Promise typing.

---

## [2025-08-29] - TypeScript Null/Undefined Type Incompatibility

**Problem:** Build failed with "Type 'string | null' is not assignable to type 'string | undefined'"

**Root Cause:** TypeScript strict mode - null and undefined are not interchangeable. The transcribeAudio function returns null but the variable expects undefined

**Solution:** Convert null to undefined using the nullish coalescing pattern: `audioTranscription || undefined`

**Files Modified:**
- app/api/contractors/quick-win-quote/route.ts:286

**Status:** RESOLVED

**Additional Notes:** This is the 7th fix attempt. TypeScript in Next.js 15 has strict null/undefined typing.

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
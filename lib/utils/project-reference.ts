/**
 * Utility functions for project reference codes
 */

/**
 * Generate a project reference code
 * Format: [TYPE]-[YEAR]-[INITIALS]-[SEQUENCE]
 * Example: KIT-24-JH-001 (Kitchen project, 2024, John Huang, first project)
 */
export function generateProjectReferenceCode(
  projectType: string,
  ownerName: string,
  sequenceNumber: number = 1,
  createdAt: Date = new Date()
): string {
  // Extract type code (first 3 letters)
  const typeCode = (projectType || 'GEN').substring(0, 3).toUpperCase()
  
  // Extract owner initials (first letter of each word, max 3)
  const nameParts = ownerName.trim().split(/\s+/)
  const initials = nameParts
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
    .substring(0, 3)
    .padEnd(2, 'X') // Ensure at least 2 characters
  
  // Extract year (2 digits)
  const year = createdAt.getFullYear().toString().slice(-2)
  
  // Format sequence number (3 digits)
  const sequence = sequenceNumber.toString().padStart(3, '0')
  
  return `${typeCode}-${year}-${initials}-${sequence}`
}

/**
 * Parse a project reference code into its components
 */
export function parseProjectReferenceCode(code: string): {
  type: string
  year: string
  initials: string
  sequence: number
} | null {
  const pattern = /^([A-Z]{3})-(\d{2})-([A-Z]{2,3})-(\d{3})$/
  const match = code.match(pattern)
  
  if (!match) return null
  
  return {
    type: match[1],
    year: match[2],
    initials: match[3],
    sequence: parseInt(match[4], 10)
  }
}

/**
 * Format project type for display
 */
export function formatProjectType(type: string | string[]): string {
  const projectType = Array.isArray(type) ? type[0] : type
  
  const typeMap: Record<string, string> = {
    'kitchen': 'Kitchen',
    'bathroom': 'Bathroom',
    'basement': 'Basement',
    'addition': 'Addition',
    'whole_house': 'Whole House',
    'exterior': 'Exterior',
    'landscaping': 'Landscaping',
    'general': 'General',
    'other': 'Other'
  }
  
  return typeMap[projectType?.toLowerCase()] || 'General'
}

/**
 * Get project type code (3 letters)
 */
export function getProjectTypeCode(type: string | string[]): string {
  const projectType = Array.isArray(type) ? type[0] : type
  
  const codeMap: Record<string, string> = {
    'kitchen': 'KIT',
    'bathroom': 'BTH',
    'basement': 'BSM',
    'addition': 'ADD',
    'whole_house': 'WHL',
    'exterior': 'EXT',
    'landscaping': 'LND',
    'general': 'GEN',
    'other': 'OTH'
  }
  
  return codeMap[projectType?.toLowerCase()] || 'GEN'
}

/**
 * Generate a short display version of the reference code
 * Example: KIT-001 (for quick reference)
 */
export function getShortReferenceCode(fullCode: string): string {
  const parsed = parseProjectReferenceCode(fullCode)
  if (!parsed) return fullCode
  
  return `${parsed.type}-${parsed.sequence.toString().padStart(3, '0')}`
}

/**
 * Check if a reference code is valid
 */
export function isValidReferenceCode(code: string): boolean {
  return parseProjectReferenceCode(code) !== null
}
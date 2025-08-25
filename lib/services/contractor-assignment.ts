// F14A Contractor Assignment Service
// Intelligently assigns punch list items to appropriate contractors

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ContractorMatch {
  contractor_id: string;
  contractor_name: string;
  match_score: number;
  match_reasons: string[];
  availability_status: string;
  contact_phone: string;
  specialties: string[];
}

export interface AssignmentResult {
  assignment_id: string;
  contractor: ContractorMatch;
  assignment_method: string;
  assignment_reason: string;
}

/**
 * Specialty mapping for punch list categories to contractor specialties
 */
const CATEGORY_TO_SPECIALTY_MAP: Record<string, string[]> = {
  'electrical': ['electrical', 'general'],
  'plumbing': ['plumbing', 'general'],
  'painting': ['painting', 'general'],
  'flooring': ['flooring', 'general'],
  'drywall': ['drywall', 'general'],
  'trim': ['trim', 'carpentry', 'general'],
  'doors': ['doors', 'carpentry', 'general'],
  'windows': ['windows', 'general'],
  'hvac': ['hvac', 'general'],
  'fixtures': ['electrical', 'general'],
  'cleanup': ['general'],
  'landscape': ['landscape', 'general'],
  'general': ['general']
};

/**
 * Priority to urgency multiplier for scoring
 */
const PRIORITY_MULTIPLIERS: Record<string, number> = {
  'urgent': 2.0,
  'high': 1.5,
  'medium': 1.0,
  'low': 0.7
};

/**
 * Find contractors already working on the project
 */
async function getProjectContractors(projectId: string) {
  const { data, error } = await supabase
    .from('project_contractors')
    .select(`
      *,
      contractors(*)
    `)
    .eq('project_id', projectId)
    .in('status', ['hired', 'accepted']);

  if (error) {
    console.error('Failed to get project contractors:', error);
    return [];
  }

  return data || [];
}

/**
 * Score contractors based on multiple factors
 */
function scoreContractor(
  contractor: any,
  requiredSpecialties: string[],
  priority: string,
  isProjectContractor: boolean
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Base score for active contractors
  if (contractor.is_active) {
    score += 10;
  } else {
    return { score: 0, reasons: ['Contractor inactive'] };
  }

  // Specialty match scoring
  const contractorSpecialties = contractor.specialties || [];
  const specialtyMatches = requiredSpecialties.filter(spec => 
    contractorSpecialties.includes(spec)
  );

  if (specialtyMatches.length > 0) {
    score += specialtyMatches.length * 20;
    reasons.push(`Specializes in: ${specialtyMatches.join(', ')}`);
  }

  // Existing project relationship bonus (familiar with project)
  if (isProjectContractor) {
    score += 15;
    reasons.push('Already working on this project');
  }

  // Availability scoring
  switch (contractor.availability_status) {
    case 'available':
      score += 25;
      reasons.push('Available now');
      break;
    case 'busy_2_weeks':
      score += 10;
      reasons.push('Available in 2 weeks');
      break;
    case 'busy_month':
      score += 5;
      reasons.push('Available in 1 month');
      break;
    case 'unavailable':
      score -= 50;
      reasons.push('Currently unavailable');
      break;
  }

  // Rating bonus (0-5 stars, multiply by 5 for scoring)
  if (contractor.rating) {
    const ratingScore = Math.round(contractor.rating * 5);
    score += ratingScore;
    reasons.push(`${contractor.rating} star rating`);
  }

  // Priority multiplier
  const priorityMultiplier = PRIORITY_MULTIPLIERS[priority] || 1.0;
  score *= priorityMultiplier;

  // Service area consideration (simplified - in reality would check location)
  if (contractor.service_areas && contractor.service_areas.length > 0) {
    score += 5;
    reasons.push('Serves local area');
  }

  return { score: Math.round(score), reasons };
}

/**
 * Find the best contractor for a punch list item
 */
export async function findBestContractor(punchListItemId: string): Promise<ContractorMatch | null> {
  try {
    // Get the punch list item details
    const { data: punchListItem, error: itemError } = await supabase
      .from('punch_list_items')
      .select('*')
      .eq('id', punchListItemId)
      .single();

    if (itemError || !punchListItem) {
      throw new Error(`Punch list item not found: ${itemError?.message}`);
    }

    // Get all active contractors
    const { data: contractors, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('is_active', true);

    if (contractorError) {
      throw new Error(`Failed to fetch contractors: ${contractorError.message}`);
    }

    if (!contractors?.length) {
      console.log('No active contractors available');
      return null;
    }

    // Get contractors already working on this project
    const projectContractors = await getProjectContractors(punchListItem.project_id);
    const projectContractorIds = projectContractors.map(pc => pc.contractor_id);

    // Determine required specialties
    const requiredSpecialties = CATEGORY_TO_SPECIALTY_MAP[punchListItem.category || 'general'] || ['general'];

    // Score all contractors
    const scoredContractors = contractors.map(contractor => {
      const isProjectContractor = projectContractorIds.includes(contractor.id);
      const { score, reasons } = scoreContractor(
        contractor,
        requiredSpecialties,
        punchListItem.priority,
        isProjectContractor
      );

      return {
        contractor_id: contractor.id,
        contractor_name: contractor.business_name,
        contact_phone: contractor.phone,
        specialties: contractor.specialties || [],
        availability_status: contractor.availability_status,
        match_score: score,
        match_reasons: reasons
      };
    });

    // Sort by score and filter out zero scores
    const viableContractors = scoredContractors
      .filter(c => c.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score);

    if (viableContractors.length === 0) {
      console.log('No viable contractors found for punch list item');
      return null;
    }

    // Return the best match
    return viableContractors[0];

  } catch (error) {
    console.error('Error finding best contractor:', error);
    throw error;
  }
}

/**
 * Assign a contractor to a punch list item
 */
export async function assignContractorToPunchListItem(
  punchListItemId: string,
  contractorId?: string,
  manual: boolean = false
): Promise<AssignmentResult> {
  try {
    // Get punch list item
    const { data: punchListItem, error: itemError } = await supabase
      .from('punch_list_items')
      .select('*')
      .eq('id', punchListItemId)
      .single();

    if (itemError || !punchListItem) {
      throw new Error(`Punch list item not found: ${itemError?.message}`);
    }

    let contractor: ContractorMatch;
    let assignmentMethod: string;
    let assignmentReason: string;

    if (contractorId && manual) {
      // Manual assignment - get contractor details
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', contractorId)
        .single();

      if (contractorError || !contractorData) {
        throw new Error(`Contractor not found: ${contractorError?.message}`);
      }

      contractor = {
        contractor_id: contractorData.id,
        contractor_name: contractorData.business_name,
        contact_phone: contractorData.phone,
        specialties: contractorData.specialties || [],
        availability_status: contractorData.availability_status,
        match_score: 100, // Manual assignment gets perfect score
        match_reasons: ['Manually assigned by admin']
      };

      assignmentMethod = 'manual';
      assignmentReason = 'Manually assigned by project administrator';

    } else {
      // Automatic assignment - find best contractor
      const bestContractor = await findBestContractor(punchListItemId);
      
      if (!bestContractor) {
        throw new Error('No suitable contractor found for assignment');
      }

      contractor = bestContractor;
      assignmentMethod = bestContractor.match_reasons.some(r => r.includes('Specializes')) 
        ? 'auto_specialty' 
        : 'auto_availability';
      assignmentReason = `Automatically assigned: ${bestContractor.match_reasons.join(', ')} (Score: ${bestContractor.match_score})`;
    }

    // Create the assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('punch_list_assignments')
      .insert({
        punch_list_item_id: punchListItemId,
        contractor_id: contractor.contractor_id,
        project_id: punchListItem.project_id,
        assignment_method: assignmentMethod,
        assignment_reason: assignmentReason,
        contractor_response: 'pending'
      })
      .select()
      .single();

    if (assignmentError) {
      throw new Error(`Failed to create assignment: ${assignmentError.message}`);
    }

    // Update punch list item status
    await supabase
      .from('punch_list_items')
      .update({ 
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', punchListItemId);

    // Log the assignment
    await supabase.from('voice_processing_logs').insert({
      voice_message_id: punchListItem.voice_message_id,
      stage: 'assignment',
      status: 'completed',
      details: { 
        contractor_id: contractor.contractor_id,
        contractor_name: contractor.contractor_name,
        assignment_method: assignmentMethod,
        match_score: contractor.match_score,
        match_reasons: contractor.match_reasons
      }
    });

    return {
      assignment_id: assignment.id,
      contractor,
      assignment_method: assignmentMethod,
      assignment_reason: assignmentReason
    };

  } catch (error) {
    console.error('Error assigning contractor:', error);
    throw error;
  }
}

/**
 * Process extracted punch list items for contractor assignment
 */
export async function processExtractedItemsForAssignment(limit: number = 5): Promise<void> {
  // Get extracted punch list items that need assignment
  const { data: extractedItems, error } = await supabase
    .from('punch_list_items')
    .select('*')
    .eq('status', 'extracted')
    .order('priority', { ascending: false }) // Process urgent items first
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch extracted items for assignment:', error);
    return;
  }

  if (!extractedItems?.length) {
    console.log('No extracted punch list items ready for contractor assignment');
    return;
  }

  console.log(`Processing ${extractedItems.length} punch list items for contractor assignment`);

  for (const item of extractedItems) {
    try {
      const assignment = await assignContractorToPunchListItem(item.id);
      console.log(`Successfully assigned contractor ${assignment.contractor.contractor_name} to punch list item ${item.id}`);
    } catch (error) {
      console.error(`Failed to assign contractor to punch list item ${item.id}:`, error);
      
      // Mark item as failed assignment
      await supabase
        .from('punch_list_items')
        .update({ 
          status: 'extracted', // Keep as extracted for retry
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
    }
  }
}

/**
 * Get assignment history for a project
 */
export async function getProjectAssignments(projectId: string) {
  const { data, error } = await supabase
    .from('punch_list_assignments')
    .select(`
      *,
      punch_list_items(*),
      contractors(business_name, phone, specialties, rating)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get project assignments: ${error.message}`);
  }

  return data;
}

/**
 * Update contractor response to assignment
 */
export async function updateContractorResponse(
  assignmentId: string, 
  response: 'accepted' | 'declined' | 'completed',
  notes?: string,
  estimatedCompletion?: string
) {
  const updateData: any = {
    contractor_response: response,
    contractor_response_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (notes) {
    updateData.contractor_notes = notes;
  }

  if (estimatedCompletion) {
    updateData.estimated_completion = estimatedCompletion;
  }

  if (response === 'completed') {
    updateData.actual_completion_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('punch_list_assignments')
    .update(updateData)
    .eq('id', assignmentId);

  if (error) {
    throw new Error(`Failed to update contractor response: ${error.message}`);
  }

  // Update punch list item status accordingly
  let itemStatus: string;
  switch (response) {
    case 'accepted':
      itemStatus = 'assigned';
      break;
    case 'declined':
      itemStatus = 'extracted'; // Back to extraction state for reassignment
      break;
    case 'completed':
      itemStatus = 'completed';
      break;
    default:
      itemStatus = 'assigned';
  }

  // Get assignment to find punch list item
  const { data: assignment } = await supabase
    .from('punch_list_assignments')
    .select('punch_list_item_id')
    .eq('id', assignmentId)
    .single();

  if (assignment) {
    await supabase
      .from('punch_list_items')
      .update({ 
        status: itemStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.punch_list_item_id);
  }
}

/**
 * Get contractor assignment statistics
 */
export async function getAssignmentStats(contractorId?: string, projectId?: string) {
  let query = supabase
    .from('punch_list_assignments')
    .select('*');

  if (contractorId) {
    query = query.eq('contractor_id', contractorId);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get assignment stats: ${error.message}`);
  }

  const stats = {
    total_assignments: data?.length || 0,
    by_response: {} as Record<string, number>,
    by_method: {} as Record<string, number>,
    pending_assignments: 0,
    completion_rate: 0
  };

  if (data?.length) {
    data.forEach(assignment => {
      stats.by_response[assignment.contractor_response] = (stats.by_response[assignment.contractor_response] || 0) + 1;
      stats.by_method[assignment.assignment_method] = (stats.by_method[assignment.assignment_method] || 0) + 1;
    });

    stats.pending_assignments = stats.by_response['pending'] || 0;
    const completedCount = stats.by_response['completed'] || 0;
    stats.completion_rate = stats.total_assignments > 0 ? completedCount / stats.total_assignments : 0;
  }

  return stats;
}
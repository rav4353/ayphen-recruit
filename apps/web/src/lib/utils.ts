import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the display ID for an application
 * Returns the custom applicationId if available, otherwise returns a shortened version of the UUID
 */
export function getApplicationDisplayId(application: { id: string; applicationId?: string | null }): string {
  if (application.applicationId) {
    return application.applicationId;
  }
  // Fallback: show first 8 characters of UUID
  return `APP-${application.id.substring(0, 8).toUpperCase()}`;
}

/**
 * Get the display ID for a candidate
 * Returns the custom candidateId if available, otherwise returns a shortened version of the UUID
 */
export function getCandidateDisplayId(candidate: { id: string; candidateId?: string | null }): string {
  if (candidate.candidateId) {
    return candidate.candidateId;
  }
  // Fallback: show first 8 characters of UUID
  return `CAND-${candidate.id.substring(0, 8).toUpperCase()}`;
}

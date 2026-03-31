const VALID_STATUSES = ['watching', 'completed', 'dropped', 'paused', 'planning_to_watch'];

export function validateStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

export function validateWatchlistInput(data: any) {
  const errors: string[] = [];

  if (!data.status) {
    errors.push('Status is required');
  } else if (!validateStatus(data.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (data.personal_rating !== undefined && (data.personal_rating < 0 || data.personal_rating > 10)) {
    errors.push('Personal rating must be between 0 and 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

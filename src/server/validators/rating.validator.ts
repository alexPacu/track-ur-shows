export function validateRating(rating: number): boolean {
  return rating >= 0 && rating <= 10;
}

export function validateRatingInput(data: any) {
  const errors: string[] = [];

  if (typeof data.rating !== 'number') {
    errors.push('Rating must be a number');
  } else if (!validateRating(data.rating)) {
    errors.push('Rating must be between 0 and 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

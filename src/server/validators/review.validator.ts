export function validateReview(reviewText: string): boolean {
  return typeof reviewText === 'string' && reviewText.trim().length > 0 && reviewText.length <= 5000;
}

export function validateReviewInput(data: any) {
  const errors: string[] = [];

  if (!data.review_text) {
    errors.push('Review text is required');
  } else if (!validateReview(data.review_text)) {
    errors.push('Review must be between 1 and 5000 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

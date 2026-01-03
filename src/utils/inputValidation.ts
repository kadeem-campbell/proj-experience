// Input validation utilities for security

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTextInput = (
  text: string, 
  minLength: number = 1, 
  maxLength: number = 1000
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const sanitized = sanitizeInput(text);
  
  if (sanitized.length < minLength) {
    errors.push(`Text must be at least ${minLength} characters long`);
  }
  
  if (sanitized.length > maxLength) {
    errors.push(`Text must be no more than ${maxLength} characters long`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
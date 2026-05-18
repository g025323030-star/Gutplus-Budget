/**
 * Email validation utility
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get validation error message in Hebrew
 */
export const getEmailErrorMessage = (email: string): string | null => {
  if (!email) {
    return 'אנא הזן כתובת אימייל';
  }
  if (!validateEmail(email)) {
    return 'כתובת אימייל לא תקינה';
  }
  return null;
};

/**
 * Validate password strength
 * Must contain: minimum 6 characters, at least one letter, at least one digit
 */
export const validatePasswordStrength = (password: string): string | null => {
  if (!password) {
    return 'אנא הזן סיסמה';
  }
  if (password.length < 6) {
    return 'הסיסמה חייבת להכיל לפחות 6 תווים';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'הסיסמה חייבת להכיל אותיות באנגלית';
  }
  if (!/[0-9]/.test(password)) {
    return 'הסיסמה חייבת להכיל ספרות';
  }
  return null;
};

/**
 * Compare two passwords and return error message if they don't match
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (!password) {
    return 'אנא הזן סיסמה';
  }
  if (!confirmPassword) {
    return 'אנא אשר את הסיסמה';
  }
  if (password !== confirmPassword) {
    return 'הסיסמאות אינן תואמות';
  }
  return null;
};

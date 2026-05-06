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

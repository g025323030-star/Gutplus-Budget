import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Compare password with hashed password
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error comparing password:', error);
    throw error;
  }
};

import bcrypt from 'bcryptjs';
import logger from './logger';

/**
 *
 * @param password
 * @returns
 */
const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10),
      hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
  },
  /**
   *
   * @param password
   * @param hashPassword
   * @returns
   */
  comparePassword = async (password: string, hashPassword: string) => {
    const checkPass = await bcrypt.compare(password, hashPassword);
    if (!checkPass) {
      logger.log('error', 'Compare password error : Password not right');
      return false;
    }
    return checkPass;
  };

export { hashPassword, comparePassword };

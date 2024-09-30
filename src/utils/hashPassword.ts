import bcrypt from 'bcryptjs';

/**
 *
 * @param password
 * @returns
 */
const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  return hashPassword;
};

/**
 *
 * @param password
 * @param hashPassword
 * @returns
 */
const comparePassword = async (password: string, hashPassword: string) => {
  const checkPass = await bcrypt.compare(password, hashPassword);
  if (!checkPass) {
    return false;
  }
  return checkPass;
};

export { hashPassword, comparePassword };

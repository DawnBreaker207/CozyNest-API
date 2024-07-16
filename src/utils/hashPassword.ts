import bcrypt from 'bcrypt';

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  return hashPassword;
};
const comparePassword = async (password: string, hashPassword: string) => {
  const checkPass = await bcrypt.compare(password, hashPassword);
  if (!checkPass) {
    return false;
  }
  return checkPass;
};

export { hashPassword, comparePassword };

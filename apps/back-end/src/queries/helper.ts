import bcrypt from 'bcrypt';

/**
 * Takes plain string password and return encrypted password
 * @param options
 * @returns 
 */
export const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
}

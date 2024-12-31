interface Option {
  position: number;
}
/**
 *
 * @param input
 * @returns
 */
export const sortOptions = <T extends Option>(input: T[]): T[] => {
  input.sort((a, b) => (a.position > b.position ? 1 : -1));
  return input;
};

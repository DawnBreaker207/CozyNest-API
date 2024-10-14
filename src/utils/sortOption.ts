interface Option {
  position: number;
}

export const sortOptions = (input: Option[]): Option[] => {
  input.sort((a, b) => (a.position > b.position ? 1 : -1));
  return input;
};

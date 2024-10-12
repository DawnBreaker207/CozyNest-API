// Format normal text to slug
// Ex: One Two Three -> one-two-three
const slugify = (val: string) => {
  if (!val) return '';
  return (
    String(val)
      // Spilt accented characters into their base characters and diacritical marks
      .normalize('NFKC')
      // Remove all the accents, which happen to be all in \u03xx UNICODE
      .replace(/[\u0300-\u036f]/g, '')
      // Trim leading or trailing whitespace
      .trim()
      // Convert to lower case
      .toLowerCase()
      // Remove non-alphanumeric characters
      .replace(/[^a-z0-9 -]/g, '')
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Replace consecutive hyphens
      .replace(/-+/g, '-')
  );
};

export { slugify };

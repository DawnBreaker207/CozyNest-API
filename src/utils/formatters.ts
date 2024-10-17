const slugify = (val: string) => {
  if (!val) return '';
  return (
    String(val)
      // Tách các ký tự có dấu thành ký tự cơ bản và dấu
      .normalize('NFKD')
      // Xóa các dấu (ký tự tổ hợp)
      .replace(/[\u0300-\u036f]/g, '')
      // Trim leading or trailing whitespace
      .trim()
      // Convert to lower case
      .toLowerCase()
      // Remove non-alphanumeric characters except for spaces
      .replace(/[^a-z0-9\s-]/g, '')
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Replace consecutive hyphens
      .replace(/-+/g, '-')
  );
};

export { slugify };

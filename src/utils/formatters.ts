const slugify = (val: string) => {
  if (!val) return '';

  return (
    String(val)
      // Spilt accented characters into their base characters and diacritical marks
      .normalize('NFKD')
      // Replace VietNamese Characters
      .replace(
        /(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ|À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ)/g,
        'a'
      )
      .replace(/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ|È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ)/g, 'e')
      .replace(/(ì|í|ị|ỉ|ĩ|Ì|Í|Ị|Ỉ|Ĩ)/g, 'i')
      .replace(
        /(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ|Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ)/g,
        'o'
      )
      .replace(/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ|Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ)/g, 'u')
      .replace(/(ỳ|ý|ỵ|ỷ|ỹ|Ý|Ỵ|Ỷ|Ỹ)/g, 'y')
      .replace(/(đ|Đ)/g, 'd')
      // Remove all the accents, which happen to be all in \u03xx UNICODE
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

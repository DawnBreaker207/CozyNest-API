//* VNPay
// Hàm sắp xếp đối tượng theo thứ tự alphabet
/**
 *
 * @param obj
 * @returns
 */
const sortObject = (obj: Record<string, any>): Record<string, string> => {
  let sorted: Record<string, string> = {};
  let keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }

  return sorted;
};


export { sortObject };

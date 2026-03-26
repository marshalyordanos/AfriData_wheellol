export function normalizeEthiopianPhone(input) {
  if (!input) return null;
  if (input=="0000000000") return input

  // Remove all spaces and non-digit characters except +
  let phone = input
    .toString()
    .trim()
    .replace(/[^\d+]/g, "");

  // Already in correct format (+251XXXXXXXXX)
  if (/^\+251\d{9}$/.test(phone)) {
    return phone;
  }

  // Starts with 251 (no +)
  if (/^251\d{9}$/.test(phone)) {
    return "+" + phone;
  }

  // Starts with 0, replace with +251
  if (/^0\d{9}$/.test(phone)) {
    return "+251" + phone.substring(1);
  }

  // 9-digit local number (e.g. 987654321 or 787654321)
  if (/^[79]\d{8}$/.test(phone)) {
    return "+251" + phone;
  }

  // Otherwise not valid
  return input;
}

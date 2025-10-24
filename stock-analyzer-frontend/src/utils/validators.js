export function isEmail(v) {
  return /\S+@\S+\.\S+/.test(v);
}

export function isStrongPassword(v) {
  return v && v.length >= 6;  // 6+ chars
}

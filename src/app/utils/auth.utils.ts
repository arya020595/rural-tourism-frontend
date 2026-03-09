export function getUser() {
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
}

export function getUid() {
  return localStorage.getItem('uid');
}
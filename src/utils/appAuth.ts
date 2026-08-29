export const REQUIRED_STUDENT_USERNAME = 'TALMATH';
export const REQUIRED_STUDENT_PASSWORD = '23456';

export const REQUIRED_ADMIN_USERNAME = 'MindSport2027';
export const REQUIRED_ADMIN_PASSWORD = 'Mindsport@2027';

export type UserRole = 'student' | 'admin';

const AUTH_STORAGE_KEY = 'talmath_app_authenticated_session';
const ROLE_STORAGE_KEY = 'talmath_app_user_role';

export function isAppAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getAppUserRole(): UserRole {
  try {
    const stored = sessionStorage.getItem(ROLE_STORAGE_KEY);
    return stored === 'admin' ? 'admin' : 'student';
  } catch {
    return 'student';
  }
}

export function setAppAuthenticated(authenticated: boolean, role: UserRole = 'student'): void {
  try {
    if (authenticated) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      sessionStorage.setItem(ROLE_STORAGE_KEY, role);
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    }
  } catch {
    // Fallback if sessionStorage is not accessible
  }
}

export function verifyStudentLogin(usernameInput: string, passwordInput: string): boolean {
  const normalizedUser = usernameInput.trim().toUpperCase();
  const normalizedPass = passwordInput.trim();

  return (
    (normalizedUser === REQUIRED_STUDENT_USERNAME && normalizedPass === REQUIRED_STUDENT_PASSWORD) ||
    (normalizedUser.length >= 2 && normalizedPass === REQUIRED_STUDENT_PASSWORD)
  );
}

export function verifyAdminLogin(usernameInput: string, passwordInput: string): boolean {
  const normalizedUser = usernameInput.trim();
  const normalizedPass = passwordInput.trim();

  return (
    (normalizedUser.toUpperCase() === REQUIRED_ADMIN_USERNAME.toUpperCase() && normalizedPass === REQUIRED_ADMIN_PASSWORD) ||
    (normalizedUser.toLowerCase() === 'mindsport2027' && normalizedPass === 'Mindsport@2027')
  );
}


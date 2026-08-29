export const DEFAULT_ADMIN_USERNAME = 'MindSport2027';
export const DEFAULT_ADMIN_PASSWORD = 'Mindsport@2027';

const STORAGE_KEY_ADMIN_PASS = 'mindsport_admin_password';
const STORAGE_KEY_ADMIN_USER = 'mindsport_admin_username';

export function getAdminUsername(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_USER);
    return saved && saved.trim() ? saved.trim() : DEFAULT_ADMIN_USERNAME;
  } catch {
    return DEFAULT_ADMIN_USERNAME;
  }
}

export function getAdminPassword(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_PASS);
    return saved && saved.trim() ? saved.trim() : DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function verifyAdminCredentials(usernameInput: string, passwordInput: string): boolean {
  const currentUsername = getAdminUsername();
  const currentPassword = getAdminPassword();
  const inputUser = usernameInput.trim().toLowerCase();

  // Allow either current stored credentials or TALMATH / 23456 or legacy MindSport2027
  return (
    (inputUser === currentUsername.toLowerCase() && passwordInput === currentPassword) ||
    (inputUser === 'talmath' && passwordInput === '23456') ||
    (inputUser === 'mindsport2027' && passwordInput === 'Mindsport@2027')
  );
}

export function updateAdminPassword(currentPasswordInput: string, newPasswordInput: string): { success: boolean; message: string } {
  const currentPassword = getAdminPassword();

  if (currentPasswordInput !== currentPassword) {
    return {
      success: false,
      message: 'كلمة المرور الحالية غير صحيحة / Current password is incorrect',
    };
  }

  if (!newPasswordInput || newPasswordInput.trim().length < 4) {
    return {
      success: false,
      message: 'يجب أن تتكون كلمة المرور الجديدة من 4 أحرف على الأقل / New password must be at least 4 characters',
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PASS, newPasswordInput);
    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح / Password changed successfully',
    };
  } catch {
    return {
      success: false,
      message: 'تعذر حفظ كلمة المرور / Failed to save new password',
    };
  }
}

export function resetAdminPassword(): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PASS, DEFAULT_ADMIN_PASSWORD);
  } catch {
    // ignore
  }
}

/**
 * Centralized env-var access. Throws clearly if a required var is missing
 * so test failures point at config issues, not weird selector errors.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : fallback;
}

export const env = {
  baseURL: optional('BASE_URL', 'https://ams.sorigin.app'),
  signinPath: optional('SIGNIN_PATH', '/signin'),
  get email() {
    return required('PORTAL_EMAIL');
  },
  get password() {
    return required('PORTAL_PASSWORD');
  },
  keepAuth: optional('KEEP_AUTH', 'false') === 'true',
};

// Centralized test data for Sorigin AMS automation (DA-1106)
// Credentials are pulled from .env so they're not committed to source control.
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'https://ams.sorigin.app';

const users = {
  validUser: {
    email: process.env.TEST_USER_EMAIL || 'mangesh.kore@sorigin.co',
    password: process.env.TEST_USER_PASSWORD || 'Mk@12345',
    role: 'Asset Engineer',
  },
  assetEngineer: {
    email: process.env.ASSET_ENGINEER_EMAIL || 'mangesh.kore@sorigin.co',
    password: process.env.ASSET_ENGINEER_PASSWORD || 'Mk@12345',
    role: 'Asset Engineer',
  },
  secondaryUser: {
    email: process.env.SECONDARY_USER_EMAIL || 'rachit.desai@spectra.ltd',
    password: process.env.SECONDARY_USER_PASSWORD || 'Rd@12345',
    role: 'Secondary (role TBD)',
  },
  // Legacy placeholders kept for backwards compatibility with old RBAC tests.
  admin: {
    email: process.env.ADMIN_USER_EMAIL || '',
    password: process.env.ADMIN_USER_PASSWORD || '',
    role: 'admin',
  },
  installer: {
    email: process.env.INSTALLER_USER_EMAIL || '',
    password: process.env.INSTALLER_USER_PASSWORD || '',
    role: 'installer',
  },
  viewer: {
    email: process.env.VIEWER_USER_EMAIL || '',
    password: process.env.VIEWER_USER_PASSWORD || '',
    role: 'viewer',
  },
  invalid: {
    email: 'not-a-real-user@sorigin.co',
    password: 'WrongPassword!1',
  },
  malformedEmail: {
    email: 'not-an-email',
    password: 'Whatever123!',
  },
};

const urls = {
  base: BASE_URL,
  signIn: `${BASE_URL}/signin`,
  dashboard: `${BASE_URL}/dashboard`,
  forgotPassword: `${BASE_URL}/forgot-password`,
};

// Expected UI text — adjust if copy changes.
const messages = {
  invalidCredentials: /invalid (email|credentials|password)|incorrect|wrong/i,
  requiredField: /required|cannot be empty|please enter/i,
  loggedIn: /dashboard|welcome|home/i,
};

module.exports = { users, urls, messages };

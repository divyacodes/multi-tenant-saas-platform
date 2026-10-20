import { 
  findUserByEmail, 
  findUserById, 
  createUserWithOrganization, 
  getUserOrganizations 
} from './repository.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../utils/errors.js';

const generateSlug = (name) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || 'org'}-${randomSuffix}`;
};

export const register = async ({ name, email, password, organizationName }) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if email already registered
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new ConflictError('An account with this email address already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);
  const orgSlug = generateSlug(organizationName);

  // Atomically create user, organization, and admin membership
  const { user, organization } = await createUserWithOrganization({
    name,
    email: normalizedEmail,
    passwordHash,
    orgName: organizationName,
    orgSlug
  });

  const token = signToken({ sub: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug
    },
    token
  };
};

export const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail);

  // Generic authentication error to prevent user enumeration
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const organizations = await getUserOrganizations(user.id);
  const token = signToken({ sub: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    },
    organizations,
    token
  };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new UnauthorizedError('User account not found');
  }

  const organizations = await getUserOrganizations(userId);

  return {
    user,
    organizations
  };
};

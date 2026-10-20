import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { query } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      // Or check cookie if present
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    // Verify user exists in database
    const userRes = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (userRes.rows.length === 0) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

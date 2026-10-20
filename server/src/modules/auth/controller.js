import * as authService from './service.js';
import { successResponse } from '../../utils/response.js';
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.IS_PRODUCTION,
  sameSite: env.IS_PRODUCTION ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.cookie('access_token', result.token, COOKIE_OPTIONS);

    return successResponse(
      res,
      result,
      'Account and organization created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    res.cookie('access_token', result.token, COOKIE_OPTIONS);

    return successResponse(
      res,
      result,
      'Login successful',
      200
    );
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: env.IS_PRODUCTION,
      sameSite: env.IS_PRODUCTION ? 'strict' : 'lax'
    });

    return successResponse(
      res,
      null,
      'Logged out successfully',
      200
    );
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);

    return successResponse(
      res,
      result,
      'Current user profile retrieved',
      200
    );
  } catch (err) {
    next(err);
  }
};

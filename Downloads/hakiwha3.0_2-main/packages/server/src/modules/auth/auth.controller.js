const authService = require("./auth.service");
const { success, created } = require("../../utils/apiResponse");
const env = require("../../config/env");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return created(res, result, "Registration successful");
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return success(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshToken(req.body);
    return success(res, result, "Token refreshed");
  } catch (error) {
    next(error);
  }
}

async function googleCallback(req, res, next) {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${env.CLIENT_URL || "http://localhost:3000"}/login?error=no_code`);
    }
    const result = await authService.googleAuth(code);
    const redirectUrl = `${env.CLIENT_URL || "http://localhost:3000"}/auth/callback?token=${result.accessToken}&refresh=${result.refreshToken}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    return res.redirect(`${env.CLIENT_URL || "http://localhost:3000"}/login?error=auth_failed`);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, user);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id, req.body.refreshToken);
    return success(res, null, "Logged out");
  } catch (error) {
    next(error);
  }
}

function getGoogleUrl(req, res, next) {
  try {
    const { createOAuth2Client, getGoogleAuthUrl } = require("../../config/google-auth");
    const oauth2Client = createOAuth2Client();
    const url = getGoogleAuthUrl(oauth2Client, [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ]);
    return success(res, { url });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh, googleCallback, googleUrl: getGoogleUrl, getMe, logout };

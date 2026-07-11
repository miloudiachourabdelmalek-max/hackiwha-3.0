const usersService = require("./users.service");
const { success } = require("../../utils/apiResponse");

async function getProfile(req, res, next) {
  try {
    const user = await usersService.getProfile(req.user.id);
    return success(res, user);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    return success(res, user, "Profile updated");
  } catch (error) {
    next(error);
  }
}

async function getOrgUsers(req, res, next) {
  try {
    const users = await usersService.getOrgUsers(req.user.organizationId);
    return success(res, users);
  } catch (error) {
    next(error);
  }
}

async function changeUserRole(req, res, next) {
  try {
    const user = await usersService.changeUserRole(
      req.user.organizationId,
      req.params.userId,
      req.body.role,
      req.user.role
    );
    return success(res, user, "Role updated");
  } catch (error) {
    next(error);
  }
}

module.exports = { getProfile, updateProfile, getOrgUsers, changeUserRole };

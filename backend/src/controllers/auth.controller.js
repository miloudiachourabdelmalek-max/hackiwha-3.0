const { z } = require('zod');
const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/asyncHandler');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  orgName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const register = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json({ data: result });
});

const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json({ data: result });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  res.json({ data: result });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  res.status(204).send();
});

module.exports = { register, login, refresh, logout };

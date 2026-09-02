import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

function publicUser(user) { return { id: user._id, name: user.name, email: user.email, role: user.role }; }
function tokenFor(user) { return jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: '7d' }); }

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) throw new ApiError(400, 'Name, email, and a password of at least 8 characters are required.');
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.exists({ email: normalizedEmail })) throw new ApiError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ success: true, data: { user: publicUser(user), token: tokenFor(user) } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) throw new ApiError(401, 'Invalid email or password.');
  res.json({ success: true, data: { user: publicUser(user), token: tokenFor(user) } });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, data: publicUser(user) });
}

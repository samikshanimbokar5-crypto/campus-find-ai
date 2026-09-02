import 'dotenv/config';

const required = ['JWT_SECRET'];
if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
  required.push('MONGODB_URI');
}
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfind_ai',
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  aiApiKey: process.env.AI_API_KEY || ''
};

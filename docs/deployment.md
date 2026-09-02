# Deployment

Render runs `npm start` from `server`. Vercel builds `client` with `npm run build` and serves `dist`. Configure `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and optional `AI_API_KEY` on Render; configure `VITE_API_URL` on Vercel.

import { createApiApp } from '../server/createApp';

// Vercel: export the Express app directly (not a manual handler wrapper)
export default createApiApp();

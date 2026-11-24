// Vercel serverless entry. TS emas, oldindan bundle qilingan CJS fayl ishlatiladi
// (build paytida `npm run build` yaratadi).
const app = require('../server-build/server.cjs').default;

module.exports = app;

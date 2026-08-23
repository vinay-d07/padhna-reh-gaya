const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
require('dotenv').config();
const { clerkMiddleware } = require('@clerk/express');

require('./lib/sentry');
const logger = require('./lib/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { mountDocs } = require('./lib/openapi');

const usersRoutes = require('./modules/users/routes');
const workspacesRoutes = require('./modules/workspaces/routes');
const uploadsRoutes = require('./modules/uploads/routes');
const notesRoutes = require('./modules/notes/routes');
const chatRoutes = require('./modules/chat/routes');
const dashboardRoutes = require('./modules/dashboard/routes');

const app = express();
const PORT = process.env.PORT || 8080;

// Deploy targets (Render/Fly/Railway/Vercel) terminate TLS in front of the
// app — without this, express-rate-limit and req.ip would key off the
// proxy's IP instead of the real client's.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors());
// Generous ceiling — this gates abuse/runaway clients, not normal usage;
// individual routes (e.g. uploads) already enforce their own tighter limits.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(clerkMiddleware());

mountDocs(app);

// Mount routes
app.use('/users', usersRoutes);
app.use('/workspaces/:workspaceId/documents', uploadsRoutes);
app.use('/workspaces/:workspaceId/notes', notesRoutes.workspaceScoped);
app.use('/notes', notesRoutes.standalone);
app.use('/workspaces/:workspaceId/conversations', chatRoutes.workspaceScoped);
app.use('/conversations', chatRoutes.standalone);
app.use('/dashboard', dashboardRoutes);
app.use('/workspaces', workspacesRoutes);

app.get("/", (req, res) => {
    res.send("padhle backend running...");
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
});

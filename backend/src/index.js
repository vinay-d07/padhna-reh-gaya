const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usersRoutes = require('./modules/users/routes');
const workspacesRoutes = require('./modules/workspaces/routes');
const uploadsRoutes = require('./modules/uploads/routes');
const notesRoutes = require('./modules/notes/routes');
const chatRoutes = require('./modules/chat/routes');
const dashboardRoutes = require('./modules/dashboard/routes');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
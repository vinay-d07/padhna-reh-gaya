const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usersRoutes = require('./modules/users/routes');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/users', usersRoutes);

app.get("/", (req, res) => {
    res.send("padhle backend running...");
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
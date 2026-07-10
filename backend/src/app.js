require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');

const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const orgRoutes = require('./routes/organizations.routes');
const campaignRoutes = require('./routes/campaigns.routes');
const experienceRoutes = require('./routes/experiences.routes');

// BigInt (used for all *Micros money fields) doesn't serialize via JSON.stringify by default.
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', orgRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/experiences', experienceRoutes);

app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
app.use(errorHandler);

module.exports = app;

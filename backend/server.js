const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Database Connection
const initSupabaseDb = require('./config/initSupabaseDb');
initSupabaseDb();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// API health-check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files (HTML, CSS, JS, images, etc.)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Serve Resources subdirectory explicitly
app.use('/Resources', express.static(path.join(frontendPath, 'Resources')));

// Root — serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// Catch-all: serve any page from the frontend if it exists, otherwise 404
app.get('/{*splat}', (req, res) => {
  const requestedPage = path.join(frontendPath, req.path);
  res.sendFile(requestedPage, (err) => {
    if (err) {
      res.status(404).json({ message: 'Page not found' });
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n  ✓  CESS Dynamics server running on http://localhost:${PORT}`);
  console.log(`  ✓  Frontend served from: ${frontendPath}`);
  console.log(`  ✓  API endpoints: /api/auth/* , /api/users/*\n`);
});

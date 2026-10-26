// server.js - Task API entry point
require('dotenv').config();

const path = require('path');
const express = require('express');
const taskRoutes = require('./src/routes/taskRoute');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files (index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api', (req, res) => res.json({ message: 'Task API is ready' }));
app.use('/tasks', taskRoutes);

// 404 handler for API
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err.code === 'ER_DUP_ENTRY') { status = 409; message = 'Duplicate entry'; }
  if (status === 500) message = 'Internal Server Error';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => console.log(`Task API running at http://localhost:${PORT}`));
const express = require("express");
const path = require('path');
const cors = require("cors");
const app = express({
  allowedHeaders: ['Content-Type', 'Authorization']
});
app.use(cors());
app.use(express.json());;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const authRoutes = require('./routes/auth');
const facultyRoutes = require('./routes/faculty') ;
const adminRoutes = require('./routes/admin');
app.get('/test-dir', (req, res) => {
  res.send(`__dirname is: ${__dirname}`);
});
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);


app.listen(7000, () => {
  console.log("Server running on http://localhost:7000");
});
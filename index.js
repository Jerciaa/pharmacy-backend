const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const medicineRoutes = require('./routes/medicineRoutes');
const batchRoutes = require('./routes/batchRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/medicines', medicineRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/', (req, res) => {
  res.send('Pharmacy Management API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log(`Server running on port ${PORT} & MySQL connected successfully!`);
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
});

const db = require('../config/db');

exports.getAllBatches = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, m.name AS medicine_name, m.category, m.gst_percentage
      FROM batches b JOIN medicines m ON b.medicine_id = m.id
      ORDER BY m.name ASC, b.expiry_date ASC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createBatch = async (req, res) => {
  const { medicine_id, batch_number, expiry_date, quantity_in_stock, selling_price } = req.body;
  if (!medicine_id || !batch_number || !expiry_date || quantity_in_stock == null || selling_price == null) {
    return res.status(400).json({ error: 'All batch fields are required' });
  }
  try {
    const [existing] = await db.query('SELECT id, quantity_in_stock FROM batches WHERE medicine_id = ? LIMIT 1', [medicine_id]);
    if (existing.length) {
      const total = Number(existing[0].quantity_in_stock) + Number(quantity_in_stock);
      await db.query(
        'UPDATE batches SET batch_number = ?, expiry_date = ?, quantity_in_stock = ?, selling_price = ? WHERE id = ?',
        [batch_number.trim(), expiry_date, total, selling_price, existing[0].id]
      );
      return res.json({ message: `Stock updated! Total quantity: ${total}`, id: existing[0].id });
    }
    const [result] = await db.query(
      'INSERT INTO batches (medicine_id, batch_number, expiry_date, quantity_in_stock, selling_price) VALUES (?, ?, ?, ?, ?)',
      [medicine_id, batch_number.trim(), expiry_date, quantity_in_stock, selling_price]
    );
    res.status(201).json({ message: 'Batch added', id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateBatch = async (req, res) => {
  const { batch_number, expiry_date, quantity_in_stock, selling_price } = req.body;
  try {
    await db.query('UPDATE batches SET batch_number = ?, expiry_date = ?, quantity_in_stock = ?, selling_price = ? WHERE id = ?', [batch_number, expiry_date, quantity_in_stock, selling_price, req.params.id]);
    res.json({ message: 'Batch updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteBatch = async (req, res) => {
  try {
    await db.query('DELETE FROM batches WHERE id = ?', [req.params.id]);
    res.json({ message: 'Batch deleted' });
  } catch (err) { res.status(400).json({ error: 'Cannot delete: batch is linked to existing invoices' }); }
};
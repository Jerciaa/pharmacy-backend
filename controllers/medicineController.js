const db = require('../config/db');

exports.getAllMedicines = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM medicines ORDER BY name ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createMedicine = async (req, res) => {
  const { name, category, gst_percentage } = req.body;
  if (!name) return res.status(400).json({ error: 'Medicine name is required' });
  try {
    const clean = name.trim();
    const [existing] = await db.query('SELECT id FROM medicines WHERE LOWER(name) = LOWER(?)', [clean]);
    if (existing.length) {
      await db.query('UPDATE medicines SET category = ?, gst_percentage = ? WHERE id = ?', [category, gst_percentage || 0, existing[0].id]);
      return res.json({ message: 'Medicine updated', id: existing[0].id });
    }
    const [result] = await db.query('INSERT INTO medicines (name, category, gst_percentage) VALUES (?, ?, ?)', [clean, category, gst_percentage || 0]);
    res.status(201).json({ message: 'Medicine added', id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateMedicine = async (req, res) => {
  const { name, category, gst_percentage } = req.body;
  try {
    await db.query('UPDATE medicines SET name = ?, category = ?, gst_percentage = ? WHERE id = ?', [name.trim(), category, gst_percentage || 0, req.params.id]);
    res.json({ message: 'Medicine updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteMedicine = async (req, res) => {
  try {
    await db.query('DELETE FROM medicines WHERE id = ?', [req.params.id]);
    res.json({ message: 'Medicine deleted' });
  } catch (err) { res.status(400).json({ error: 'Cannot delete: medicine has linked stock batches' }); }
};
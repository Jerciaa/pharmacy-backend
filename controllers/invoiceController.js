const db = require('../config/db');

exports.getAllInvoices = async (req, res) => {
  try {
    const [invoices] = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createInvoice = async (req, res) => {
  const { customer_name, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Invoice must contain at least one item' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    for (const item of items) {
      const [batches] = await connection.query(
        'SELECT quantity_in_stock FROM batches WHERE id = ? FOR UPDATE',
        [item.batch_id]
      );
      if (batches.length === 0) {
        throw new Error(`Batch ID ${item.batch_id} not found`);
      }
      if (batches[0].quantity_in_stock < item.quantity_sold) {
        throw new Error(`Insufficient stock for Batch ID ${item.batch_id}`);
      }
      totalAmount += item.quantity_sold * item.unit_price;
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const [invResult] = await connection.query(
      'INSERT INTO invoices (invoice_number, customer_name, total_amount) VALUES (?, ?, ?)',
      [invoiceNumber, customer_name || 'Walk-in Customer', totalAmount]
    );
    const invoiceId = invResult.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO invoice_items (invoice_id, batch_id, quantity_sold, unit_price) VALUES (?, ?, ?, ?)',
        [invoiceId, item.batch_id, item.quantity_sold, item.unit_price]
      );
      await connection.query(
        'UPDATE batches SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?',
        [item.quantity_sold, item.batch_id]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: 'Invoice created & stock updated!',
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      total_amount: totalAmount
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
};
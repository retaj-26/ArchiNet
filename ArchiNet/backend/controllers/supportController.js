const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { validateSupportTicket } = require('../middleware/validators');

// Generate unique ticket number
const generateTicketNumber = async () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${timestamp}-${random}`;
};

// Submit Support Ticket
const submitSupportTicket = async (req, res) => {
  try {
    const { fullName, phoneNumber, supportMessage } = req.body;

    // Validation
    const { error, value } = validateSupportTicket(req.body);
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return res.status(400).json({ success: false, errors });
    }

    const ticketId = uuidv4();
    const ticketNumber = await generateTicketNumber();

    const query = `
      INSERT INTO support_tickets (
        id, ticket_number, full_name, phone_number, support_message,
        status, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, ticket_number, status, created_at;
    `;

    const result = await pool.query(query, [
      ticketId,
      ticketNumber,
      fullName,
      phoneNumber,
      supportMessage,
      'open',
      req.userId || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'تم استقبال طلب الدعم بنجاح. سيتم التواصل معك قريباً.',
      data: {
        ticketId: result.rows[0].id,
        ticketNumber: result.rows[0].ticket_number,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error('Support ticket error:', err);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في معالجة طلب الدعم. يرجى المحاولة لاحقاً.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// Get all support tickets (Admin)
const getAllSupportTickets = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM support_tickets';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100;';

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Fetch tickets error:', err);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التذاكر',
    });
  }
};

// Get ticket by ID
const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'SELECT * FROM support_tickets WHERE id = $1 OR ticket_number = $1;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'التذكرة غير موجودة',
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Fetch ticket error:', err);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التذكرة',
    });
  }
};

// Update ticket status and add response
const updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صحيحة',
      });
    }

    const query = `
      UPDATE support_tickets
      SET status = COALESCE($1, status),
          response_message = COALESCE($2, response_message),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 OR ticket_number = $3
      RETURNING id, ticket_number, status, updated_at;
    `;

    const result = await pool.query(query, [
      status || null,
      responseMessage || null,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'التذكرة غير موجودة',
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث التذكرة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Update ticket error:', err);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث التذكرة',
    });
  }
};

module.exports = {
  submitSupportTicket,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
};

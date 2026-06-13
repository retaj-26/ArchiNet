const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const {
  validateAnalysisRequest,
  validateNetworkRequest,
} = require('../middleware/validators');

// Submit Network Design Request
const submitNetworkRequest = async (req, res) => {
  try {
    const {
      projectType,
      buildingSize,
      floors,
      usersCount,
      securityLevel,
      vlanRequirements,
      wifiRequirements,
      serverRequirements,
      infrastructureNotes,
      projectDetails,
    } = req.body;

    // Validation
    const { error, value } = validateNetworkRequest(req.body);
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return res.status(400).json({ success: false, errors });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO network_requests (
        id, project_type, building_size, floors, users_count, security_level,
        vlan_requirements, wifi_requirements, server_requirements,
        infrastructure_notes, project_details, status, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, project_type, status, created_at;
    `;

    const result = await pool.query(query, [
      id,
      projectType,
      buildingSize || null,
      floors || null,
      usersCount || null,
      securityLevel || null,
      vlanRequirements || null,
      wifiRequirements || null,
      serverRequirements || null,
      infrastructureNotes || null,
      projectDetails || null,
      'pending',
      req.user?.userId || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'تم استقبال طلب التصميم بنجاح. سيتم التواصل معك قريباً.',
      data: {
        requestId: result.rows[0].id,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error('Network request error:', err);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في معالجة الطلب. يرجى المحاولة لاحقاً.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// Get all network requests (Admin)
const getAllNetworkRequests = async (req, res) => {
  try {
    const query = `
      SELECT * FROM network_requests
      ORDER BY created_at DESC
      LIMIT 100;
    `;
    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلبات',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// Get single request details
const getNetworkRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'SELECT * FROM network_requests WHERE id = $1;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Fetch request error:', err);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلب',
    });
  }
};

// Update request status (Admin)
const updateNetworkRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صحيحة',
      });
    }

    const query = `
      UPDATE network_requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, updated_at;
    `;

    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث الحالة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الطلب',
    });
  }
};

// Submit AI-assisted Network Analysis Request
const submitAnalysisRequest = async (req, res) => {
  try {
    const { analysisText } = req.body;

    const { error } = validateAnalysisRequest(req.body);
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return res.status(400).json({ success: false, errors });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO analysis_requests (
        id, analysis_text, status, user_id
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, status, created_at;
    `;

    const result = await pool.query(query, [
      id,
      analysisText,
      'pending',
      req.user?.userId || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'تم استقبال طلب التحليل بنجاح. سيتم تجهيز التقرير قريباً.',
      data: {
        analysisId: result.rows[0].id,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error('Analysis request error:', err);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في معالجة طلب التحليل. يرجى المحاولة لاحقاً.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

module.exports = {
  submitNetworkRequest,
  submitAnalysisRequest,
  getAllNetworkRequests,
  getNetworkRequestById,
  updateNetworkRequestStatus,
};

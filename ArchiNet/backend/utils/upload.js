const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * File Upload Handler
 * Secure file upload with validation and storage
 */

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIMES = {
  'image/jpeg': { ext: '.jpg', type: 'image' },
  'image/png': { ext: '.png', type: 'image' },
  'image/gif': { ext: '.gif', type: 'image' },
  'application/pdf': { ext: '.pdf', type: 'pdf' },
  'application/x-pkt': { ext: '.pkt', type: 'packet-tracer' },
  'application/octet-stream': { ext: '.pka', type: 'packet-tracer' },
  'text/plain': { ext: '.txt', type: 'config' },
  'application/json': { ext: '.json', type: 'config' },
};

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Validate file
 */
function validateFile(file) {
  const errors = [];

  // Check if file exists
  if (!file) {
    errors.push('لم يتم اختيار ملف');
    return errors;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`حجم الملف يتجاوز الحد المسموح به (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  // Check MIME type
  if (!ALLOWED_MIMES[file.mimetype]) {
    errors.push(`نوع الملف غير مدعوم: ${file.mimetype}`);
  }

  // Check for suspicious filenames
  if (/[<>:"|?*]/.test(file.originalname)) {
    errors.push('اسم الملف يحتوي على أحرف غير مسموحة');
  }

  return errors;
}

/**
 * Save uploaded file securely
 */
async function saveFile(file, subfolder = 'general') {
  const validationErrors = validateFile(file);
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join(', '));
    error.statusCode = 400;
    error.errorCode = 'INVALID_FILE';
    throw error;
  }

  try {
    // Create subfolder if needed
    const subfolderPath = path.join(UPLOAD_DIR, subfolder);
    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath, { recursive: true });
    }

    // Generate unique filename
    const fileExt = ALLOWED_MIMES[file.mimetype]?.ext || path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(subfolderPath, uniqueName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    return {
      fileName: file.originalname,
      storedName: uniqueName,
      filePath: filePath,
      relativePath: `/uploads/${subfolder}/${uniqueName}`,
      fileSize: file.size,
      fileType: ALLOWED_MIMES[file.mimetype]?.type || 'other',
      mimeType: file.mimetype,
    };
  } catch (error) {
    const err = new Error(`فشل حفظ الملف: ${error.message}`);
    err.statusCode = 500;
    err.errorCode = 'UPLOAD_ERROR';
    throw err;
  }
}

/**
 * Delete file
 */
function deleteFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const stats = fs.statSync(fullPath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get file info
 */
function getFileInfo(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const stats = fs.statSync(fullPath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
}

/**
 * Clean up old files
 */
function cleanupOldFiles(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  let deletedCount = 0;

  try {
    function deleteOldFilesInDir(dir) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          deleteOldFilesInDir(filePath);
        } else if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    deleteOldFilesInDir(UPLOAD_DIR);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return 0;
  }
}

module.exports = {
  saveFile,
  deleteFile,
  getFileSize,
  getFileInfo,
  cleanupOldFiles,
  validateFile,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIMES,
};

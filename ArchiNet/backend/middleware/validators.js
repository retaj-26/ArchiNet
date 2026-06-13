const Joi = require('joi');

const validateNetworkRequest = (data) => {
  const schema = Joi.object({
    projectType: Joi.string().required().messages({
      'string.empty': 'نوع المشروع مطلوب',
      'any.required': 'نوع المشروع مطلوب',
    }),
    buildingSize: Joi.string().allow(''),
    floors: Joi.string().allow(''),
    usersCount: Joi.string().allow(''),
    securityLevel: Joi.string().allow(''),
    vlanRequirements: Joi.string().allow(''),
    wifiRequirements: Joi.string().allow(''),
    serverRequirements: Joi.string().allow(''),
    infrastructureNotes: Joi.string().allow('').max(1000),
    projectDetails: Joi.string().allow('').max(2000),
  });

  return schema.validate(data, { abortEarly: false });
};

const validateSupportTicket = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().required().min(3).messages({
      'string.empty': 'الاسم مطلوب',
      'any.required': 'الاسم مطلوب',
      'string.min': 'الاسم يجب أن يكون 3 أحرف على الأقل',
    }),
    phoneNumber: Joi.string().required().regex(/^[\d\s\-\+()]+$/).messages({
      'string.empty': 'رقم الهاتف مطلوب',
      'any.required': 'رقم الهاتف مطلوب',
      'string.pattern.base': 'صيغة رقم الهاتف غير صحيحة',
    }),
    supportMessage: Joi.string().required().min(10).max(2000).messages({
      'string.empty': 'رسالة الدعم مطلوبة',
      'any.required': 'رسالة الدعم مطلوبة',
      'string.min': 'الرسالة يجب أن تكون 10 أحرف على الأقل',
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

const validateAnalysisRequest = (data) => {
  const schema = Joi.object({
    analysisText: Joi.string().required().min(5).messages({
      'string.empty': 'وصف التحليل مطلوب',
      'any.required': 'وصف التحليل مطلوب',
      'string.min': 'الوصف يجب أن يكون 5 أحرف على الأقل',
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  validateNetworkRequest,
  validateSupportTicket,
  validateAnalysisRequest,
};

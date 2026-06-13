const modal = document.getElementById('modal');
const pricing = document.getElementById('pricing');
const analysisResult = document.getElementById('analysis-result');
const requestSuccess = document.getElementById('request-success');
const supportSuccess = document.getElementById('support-success');

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -80px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

const templatesData = {
  home: {
    title: 'شبكة منزلية',
    desc: 'طوبولوجيا سكنية احترافية مع تقسيم أجهزة إنترنت الأشياء والوصول للضيوف وخدمات نواة آمنة.',
    securityLevel: 'قياسي',
    topology: 'تصميم متفرّع مع بوابة ومقاطع VLAN وفصل شبكات الضيوف.',
    useCase: 'تخطيط الشبكات المنزلية وتصميم أمان الأجهزة الذكية.',
    infra: ['موجّه (WiFi 6)', 'مفتاح ذكي', 'VLAN للأجهزة', 'شبكة ضيوف', 'حماية DNS']
  },
  hospital: {
    title: 'شبكة مستشفى',
    desc: 'بنية صحية مرنة مع نواة مكررة ومناطق نظام السجلات الإلكترونية آمنة وتصميم جاهز للامتثال.',
    securityLevel: 'متقدم',
    topology: 'معمارية ذات نواة مزدوجة مع تقسيم للمرضى والموظفين والأجهزة الطبية.',
    useCase: 'تصميم شبكات لمرافق الرعاية الصحية مع توافر عالي وضوابط أمان مشددة.',
    infra: ['مفتاح نواة (مكرر)', 'جدار حماية للمؤسسات', 'خادم السجلات الآمنة', 'نظام كشف/منع التسلل', 'امتثال خاص']
  },
  enterprise: {
    title: 'شبكة مؤسسية',
    desc: 'طوبولوجيا مؤسسية متعددة المواقع محسّنة للاتصال عبر VPN، توازن التحميل، وتقسيم الوصول.',
    securityLevel: 'مؤسسي / مقسّم',
    topology: 'تصميم حرم متعدد الفروع مع DMZ، وصول عن بُعد، وتقسيم سياسات.',
    useCase: 'تخطيط بنية مؤسسية واسعة ومحاكاة الطوبولوجيا.',
    infra: ['طبقة DMZ', 'بوابة VPN', 'موازن تحميل', 'عدة VLANs', 'نسخ احتياطي وتكرار']
  }
};

function openTemplate(type) {
  const data = templatesData[type];
  if (!data) return;

  document.getElementById('title').innerText = data.title;
  document.getElementById('desc').innerText = data.desc;
  document.getElementById('security-level').innerText = data.securityLevel;
  document.getElementById('topology').innerText = data.topology;
  document.getElementById('use-case').innerText = data.useCase;

  const infra = document.getElementById('infra');
  infra.innerHTML = '';
  data.infra.forEach(item => {
    const div = document.createElement('div');
    div.innerText = `• ${item}`;
    div.style.opacity = '0';
    div.style.animation = 'fadeInUp 0.4s ease-out forwards';
    infra.appendChild(div);
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function openPricing(selectedPlanKey) {
  // show modal
  pricing.classList.add('active');
  document.body.style.overflow = 'hidden';

  // clear previous selection
  const summaries = pricing.querySelectorAll('.plan-summary');
  summaries.forEach(s => s.classList.remove('selected'));

  if (selectedPlanKey) {
    const selected = pricing.querySelector(`.plan-summary[data-plan="${selectedPlanKey}"]`);
    if (selected) {
      selected.classList.add('selected');
      // ensure the selected plan is visible (works for horizontal layout)
      selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }
}

function closePricing() {
  pricing.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function toggleLang() {
  const htmlElement = document.documentElement;
  const currentLang = htmlElement.getAttribute('lang');
  const newLang = currentLang === 'ar' ? 'en' : 'ar';

  htmlElement.setAttribute('lang', newLang);
  htmlElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  alert(newLang === 'ar' ? 'تم التبديل إلى: العربية' : 'Switched to: English');
}

function choosePlan(key) {
  closePricing();
  if (key === 'enterprise') {
    showNotification('شكرًا — سنقوم بالتواصل معك بشأن خطة الشركات الكبرى.', 'success');
  } else if (key === 'small') {
    showNotification('شكراً لاختيارك خطة المؤسسات الصغيرة. تم تفعيل الفترة التجريبية.', 'success');
  } else {
    showNotification('تم اختيار الخطة. بدأت الفترة التجريبية.', 'success');
  }
}

function scrollToFeatures() {
  const el = document.querySelector('.templates-section') || document.querySelector('.section');
  if (!el) return;
  // ensure focusable for accessibility
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
}

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

function getFieldValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : '';
}

function resetFields(ids) {
  ids.forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });
}

// Helper: Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 12px;
    background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(56, 189, 248, 0.9)'};
    color: white;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    backdrop-filter: blur(8px);
    direction: rtl;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Helper: Create spinner
function createSpinner() {
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  `;
  return spinner;
}

// API: Submit Network Request
async function submitNetworkRequest(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/network/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.errors?.[0]?.message || data.message || 'حدث خطأ في معالجة الطلب';
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error('Network request error:', err);
    throw err;
  }
}

// API: Submit Support Ticket
async function submitSupportTicket(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.errors?.[0]?.message || data.message || 'حدث خطأ في معالجة الطلب';
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error('Support ticket error:', err);
    throw err;
  }
}

// API: Submit Analysis Request
async function submitAnalysisRequest(analysisText) {
  try {
    const response = await fetch(`${API_BASE_URL}/network/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisText: analysisText,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ في التحليل');
    }

    return data;
  } catch (err) {
    console.error('Analysis request error:', err);
    throw err;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hero-section, .section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closePricing();
    }
  });

  // Analysis Form Handler
  const analysisButton = document.getElementById('analysis-submit');
  if (analysisButton) {
    analysisButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const analysisInput = document.getElementById('analysis-input');
      const analysisText = analysisInput.value.trim();

      if (!analysisText) {
        showNotification('يرجى إدخال وصف التحليل', 'error');
        return;
      }

      const originalText = analysisButton.innerHTML;
      analysisButton.disabled = true;
      analysisButton.innerHTML = 'جاري المعالجة...';

      try {
        const result = await submitAnalysisRequest(analysisText);
        showNotification(result.message || 'تم استقبال طلب التحليل بنجاح', 'success');
        analysisInput.value = '';
      } catch (err) {
        showNotification(err.message || 'حدث خطأ في التحليل', 'error');
      } finally {
        analysisButton.disabled = false;
        analysisButton.innerHTML = originalText;
      }
    });
  }

  // Network Request Form Handler
  const requestButton = document.getElementById('request-submit');
  if (requestButton) {
    requestButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const payload = {
        projectType: getFieldValue('project-type'),
        buildingSize: getFieldValue('building-size'),
        floors: getFieldValue('floors'),
        usersCount: getFieldValue('users-count'),
        securityLevel: getFieldValue('security-level-select'),
        vlanRequirements: getFieldValue('vlan-requirements'),
        wifiRequirements: getFieldValue('wifi-requirements'),
        serverRequirements: getFieldValue('server-requirements'),
        infrastructureNotes: getFieldValue('infrastructure-notes'),
        projectDetails: getFieldValue('project-details'),
      };

      if (!payload.projectType || payload.projectType.startsWith('---')) {
        showNotification('يرجى اختيار نوع المشروع', 'error');
        return;
      }

      const originalText = requestButton.innerHTML;
      requestButton.disabled = true;
      requestButton.innerHTML = 'جاري الإرسال...';

      try {
        const result = await submitNetworkRequest(payload);
        showNotification(result.message || 'تم استقبال طلب التصميم بنجاح', 'success');
        resetFields([
          'project-type',
          'building-size',
          'floors',
          'users-count',
          'security-level-select',
          'vlan-requirements',
          'wifi-requirements',
          'server-requirements',
          'infrastructure-notes',
          'project-details',
        ]);
        
        // Show success message briefly
        const successMsg = document.getElementById('request-success');
        successMsg.textContent = result.message;
        successMsg.classList.remove('hidden');
        setTimeout(() => successMsg.classList.add('hidden'), 6000);
      } catch (err) {
        showNotification(err.message || 'حدث خطأ في معالجة الطلب', 'error');
      } finally {
        requestButton.disabled = false;
        requestButton.innerHTML = originalText;
      }
    });
  }

  // Support Ticket Form Handler
  const supportButton = document.getElementById('support-submit');
  if (supportButton) {
    supportButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const payload = {
        fullName: getFieldValue('support-name'),
        phoneNumber: getFieldValue('support-phone'),
        supportMessage: getFieldValue('support-message'),
      };

      const originalText = supportButton.innerHTML;
      supportButton.disabled = true;
      supportButton.innerHTML = 'جاري الإرسال...';

      try {
        const result = await submitSupportTicket(payload);
        showNotification(result.message || 'تم استقبال طلب الدعم بنجاح', 'success');
        resetFields(['support-name', 'support-phone', 'support-message']);

        // Show success message briefly
        const successMsg = document.getElementById('support-success');
        successMsg.textContent = result.message;
        successMsg.classList.remove('hidden');
        setTimeout(() => successMsg.classList.add('hidden'), 6000);
      } catch (err) {
        showNotification(err.message || 'حدث خطأ في معالجة الطلب', 'error');
      } finally {
        supportButton.disabled = false;
        supportButton.innerHTML = originalText;
      }
    });
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .notification {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    }
  `;
  document.head.appendChild(style);
});

/* ==========================================================================
   BOTBANHANG AI AUTO-TESTING STUDIO — CLIENT APPLICATION
   Dual-File Training Hub | DeepSeek AI Tester | Sequential Turn-Taking
   ========================================================================== */

(function () {
  'use strict';

  // Application State
  const state = {
    token: localStorage.getItem('bbh_auth_token') || null,
    user: null,
    config: { page_id: '095817282564177', auto_wait_seconds: Number(localStorage.getItem('bbh_runner_seconds')) || 30 },
    roles: {},
    productKnowledge: { title: '', content: '' },
    promptRules: { title: '', content: '' },
    autoTestSuite: [],
    evaluations: [],
    users: [],
    sdkReady: false,
    chatIsOpen: false,
    clientId: localStorage.getItem('bbh_last_client_id') || 'Chưa khởi tạo',
    viewMode: 'center',
    evalFilter: 'all',
    activeQuestion: null,

    // Runner Mode preference
    runner: {
      mode: localStorage.getItem('bbh_runner_mode') || 'timer'
    },

    // Sequential & Manual Runner State Machine (Method 1)
    manualRunner: {
      isRunning: false,
      isPaused: false,
      currentIndex: 0,
      questions: [],
      timerId: null,
      countdownRemaining: 0,
      mode: localStorage.getItem('bbh_runner_mode') || 'timer'
    },

    // Autonomous Multi-Turn Agent State Machine (Method 2)
    agentRunner: {
      isRunning: false,
      isPaused: false,
      turnIndex: 1,
      maxTurns: 4,
      persona: 'family',
      goal: '',
      history: [],
      lastBotResponse: '',
      timerId: null,
      countdownRemaining: 0
    }
  };

  // DOM Elements Cache
  const el = {
    body: document.body,
    authOverlay: document.getElementById('auth-overlay'),
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    tabLoginBtn: document.getElementById('tab-login-btn'),
    tabRegisterBtn: document.getElementById('tab-register-btn'),
    loginIdentifier: document.getElementById('login-identifier'),
    loginPassword: document.getElementById('login-password'),
    loginFeedback: document.getElementById('login-feedback'),
    registerFeedback: document.getElementById('register-feedback'),
    btnQuickFillAdmin: document.getElementById('btn-quick-fill-admin'),
    btnQuickFillTester: document.getElementById('btn-quick-fill-tester'),
    linkGoToRegister: document.getElementById('link-go-to-register'),
    linkGoToLogin: document.getElementById('link-go-to-login'),
    regName: document.getElementById('reg-name'),
    regEmail: document.getElementById('reg-email'),
    regPhone: document.getElementById('reg-phone'),
    regRole: document.getElementById('reg-role'),
    regPassword: document.getElementById('reg-password'),
    regApiKey: document.getElementById('reg-api-key'),

    // Header
    headerPageIdBadge: document.getElementById('header-page-id-badge'),
    headerSdkDot: document.getElementById('header-sdk-dot'),
    headerSdkStatus: document.getElementById('header-sdk-status'),
    headerUserAvatar: document.getElementById('header-user-avatar'),
    headerUserName: document.getElementById('header-user-name'),
    headerUserRole: document.getElementById('header-user-role'),
    btnHeaderResetSession: document.getElementById('btn-header-reset-session'),
    btnOpenTrainingHub: document.getElementById('btn-open-training-hub'),
    deepseekBadgeStatus: document.getElementById('deepseek-badge-status'),
    btnAdminManage: document.getElementById('btn-admin-manage'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    btnLogout: document.getElementById('btn-logout'),
    viewModeControl: document.getElementById('view-mode-control'),
    zoomControl: document.getElementById('zoom-control'),

    // Stage HUD (Floating at bottom of center stage)
    stageSdkDot: document.getElementById('stage-sdk-dot'),
    clientIdDisplay: document.getElementById('client-id-display'),
    btnToggleChat: document.getElementById('btn-toggle-chat'),
    btnToggleChatText: document.getElementById('btn-toggle-chat-text'),
    btnStageResetAi: document.getElementById('btn-stage-reset-ai'),

    // Left Panel: Mode Navigation
    tabBtnManual: document.getElementById('tab-btn-manual'),
    tabBtnAgent: document.getElementById('tab-btn-agent'),
    viewManualQa: document.getElementById('view-manual-qa'),
    viewAgentQa: document.getElementById('view-agent-qa'),

    // Left Panel: Method 1 (Tự Soạn Câu Hỏi Thủ Công - Không Giới Hạn)
    manualQuestionsInput: document.getElementById('manual-questions-input'),
    manualQCount: document.getElementById('manual-q-count'),
    btnLoadSampleQuestions: document.getElementById('btn-load-sample-questions'),
    btnCleanQaText: document.getElementById('btn-clean-qa-text'),
    btnClearManualText: document.getElementById('btn-clear-manual-text'),
    runnerDelayInput: document.getElementById('runner-delay-input'),
    timerPresetsGroup: document.getElementById('timer-presets-group'),
    runnerModeSelect: document.getElementById('runner-mode-select'),
    btnStartManualRunner: document.getElementById('btn-start-manual-runner'),
    btnRestartManualRunner: document.getElementById('btn-restart-manual-runner'),
    manualRunningBox: document.getElementById('manual-running-box'),
    manualRunningTitle: document.getElementById('manual-running-title'),
    manualRunningBadge: document.getElementById('manual-running-badge'),
    manualRunningPrompt: document.getElementById('manual-running-prompt'),
    manualProgressBar: document.getElementById('manual-countdown-bar') || document.getElementById('manual-progress-bar'),
    manualCountdownTimer: document.getElementById('manual-countdown-timer'),
    manualCountdownBar: document.getElementById('manual-countdown-bar'),
    manualClockBadge: document.getElementById('manual-clock-badge'),
    btnRunnerPause: document.getElementById('btn-runner-pause'),
    btnRunnerRestartInline: document.getElementById('btn-runner-restart-inline'),
    btnRunnerAdd10: document.getElementById('btn-runner-add-10'),
    btnRunnerNextNow: document.getElementById('btn-runner-next-now'),

    // Left Panel: Method 2 (Bộ Não Agent Đọc Ngữ Cảnh Đa Lượt)
    agentPersonaSelect: document.getElementById('agent-persona-select'),
    customPersonaGroup: document.getElementById('custom-persona-group'),
    agentCustomPersonaInput: document.getElementById('agent-custom-persona-input'),
    agentMaxTurns: document.getElementById('agent-max-turns'),
    agentTurnWait: document.getElementById('agent-turn-wait'),
    agentAutoResetCheckbox: document.getElementById('agent-auto-reset-checkbox'),
    btnStartAgentRun: document.getElementById('btn-start-agent-run'),
    agentRunningBox: document.getElementById('agent-running-box'),
    agentRunningTurnTitle: document.getElementById('agent-running-turn-title'),
    agentRunningBadge: document.getElementById('agent-running-badge'),
    agentThoughtProcess: document.getElementById('agent-thought-process'),
    btnAgentForceNext: document.getElementById('btn-agent-force-next'),
    btnAgentRestart: document.getElementById('btn-agent-restart'),
    btnAgentStopReset: document.getElementById('btn-agent-stop-reset'),

    // Right Panel: Giám Khảo & Báo Cáo
    btnRightResetAi: document.getElementById('btn-right-reset-ai'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    metricTotalTests: document.getElementById('metric-total-tests'),
    metricPassRate: document.getElementById('metric-pass-rate'),
    metricFailCount: document.getElementById('metric-fail-count'),
    rtabEval: document.getElementById('rtab-eval'),
    rtabTranscript: document.getElementById('rtab-transcript'),
    rtabHistory: document.getElementById('rtab-history'),
    paneEval: document.getElementById('pane-eval'),
    paneTranscript: document.getElementById('pane-transcript'),
    paneHistory: document.getElementById('pane-history'),
    activeScenarioTag: document.getElementById('active-scenario-tag'),
    activePromptDisplay: document.getElementById('active-prompt-display'),
    evalResponseInput: document.getElementById('eval-response-input'),
    btnPasteClipboard: document.getElementById('btn-paste-clipboard'),
    evalVerdictCard: document.getElementById('eval-verdict-card'),
    evalVerdictBadge: document.getElementById('eval-verdict-badge'),
    evalStarsDisplay: document.getElementById('eval-stars-display'),
    evalReasonDisplay: document.getElementById('eval-reason-display'),
    btnAutoEvaluate: document.getElementById('btn-auto-evaluate'),
    btnSubmitEval: document.getElementById('btn-submit-eval'),
    agentTranscriptFeed: document.getElementById('agent-transcript-feed'),
    evalCountBadge: document.getElementById('eval-count-badge'),
    btnFilterAll: document.getElementById('btn-filter-all'),
    btnFilterFails: document.getElementById('btn-filter-fails'),
    evaluationsList: document.getElementById('evaluations-list'),

    // Modal: 2 Training Files & DeepSeek
    modalTraining: document.getElementById('modal-training'),
    btnCloseTrainingModal: document.getElementById('btn-close-training-modal'),
    trainingTabs: document.getElementById('training-tabs'),
    tabFile1Content: document.getElementById('tab-file1-content'),
    tabFile2Content: document.getElementById('tab-file2-content'),
    tabDeepseekContent: document.getElementById('tab-deepseek-content'),

    uploadFile1Input: document.getElementById('upload-file1-input'),
    btnUploadFile1: document.getElementById('btn-upload-file1'),
    btnResetDefaultFiles: document.getElementById('btn-reset-default-files'),
    formFile1Save: document.getElementById('form-file1-save'),
    file1TitleInput: document.getElementById('file1-title-input'),
    file1ContentInput: document.getElementById('file1-content-input'),

    uploadFile2Input: document.getElementById('upload-file2-input'),
    btnUploadFile2: document.getElementById('btn-upload-file2'),
    formFile2Save: document.getElementById('form-file2-save'),
    file2TitleInput: document.getElementById('file2-title-input'),
    file2ContentInput: document.getElementById('file2-content-input'),

    formDeepseekSave: document.getElementById('form-deepseek-save'),
    dsApiKeyInput: document.getElementById('ds-api-key-input'),
    dsModelSelect: document.getElementById('ds-model-select'),
    dsWaitSecondsInput: document.getElementById('ds-wait-seconds-input'),
    btnTestDeepseekConn: document.getElementById('btn-test-deepseek-conn'),
    btnTestSavedKey: document.getElementById('btn-test-saved-key'),
    dsStatusText: document.getElementById('ds-status-text'),
    dsKeyHint: document.getElementById('ds-key-hint'),
    deepseekTestFeedback: document.getElementById('deepseek-test-feedback'),
    agentDsStatusBanner: document.getElementById('agent-ds-status-banner'),
    agentDsStatusLabel: document.getElementById('agent-ds-status-label'),
    btnAgentOpenDsModal: document.getElementById('btn-agent-open-ds-modal'),

    toastHost: document.getElementById('toast-host')
  };

  // ==========================================================================
  // UTILITIES & TOASTS
  // ==========================================================================

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    el.toastHost.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function api(path, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = state.token || localStorage.getItem('bbh_auth_token');
    if (token) {
      state.token = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Lỗi máy chủ (${res.status})`);
    }
    return data;
  }

  // ==========================================================================
  // THEME & VIEW MODE & SCALE ZOOM
  // ==========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem('bbh_theme') || 'light';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    updateThemeIcon();

    el.btnThemeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('bbh_theme', isDark ? 'dark' : 'light');
      updateThemeIcon();
      showToast(isDark ? 'Giao diện Tối (Claude Dark)' : 'Giao diện Sáng (Claude Light)');
    });
  }

  function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    el.btnThemeToggle.innerHTML = isDark
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    el.body.classList.remove('mode-zen', 'mode-corner');
    if (mode === 'zen') el.body.classList.add('mode-zen');
    if (mode === 'corner') el.body.classList.add('mode-corner');

    el.viewModeControl.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  el.viewModeControl.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.mode));
  });

  el.zoomControl.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.zoomControl.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const scale = btn.dataset.scale;
      el.body.classList.remove('scale-90', 'scale-80');
      if (scale === '90') el.body.classList.add('scale-90');
      if (scale === '80') el.body.classList.add('scale-80');
      showToast(`Thu phóng khung chat: ${scale}%`);
    });
  });

  // ==========================================================================
  // AUTHENTICATION & RBAC
  // ==========================================================================

  function switchAuthTab(tab) {
    if (el.loginFeedback) el.loginFeedback.style.display = 'none';
    if (el.registerFeedback) el.registerFeedback.style.display = 'none';

    if (tab === 'login') {
      el.tabLoginBtn.classList.add('active');
      el.tabRegisterBtn.classList.remove('active');
      el.formLogin.style.display = 'flex';
      el.formRegister.style.display = 'none';
    } else {
      el.tabLoginBtn.classList.remove('active');
      el.tabRegisterBtn.classList.add('active');
      el.formLogin.style.display = 'none';
      el.formRegister.style.display = 'flex';
    }
  }

  el.tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  el.tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));

  if (el.linkGoToRegister) {
    el.linkGoToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('register');
    });
  }

  if (el.linkGoToLogin) {
    el.linkGoToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('login');
    });
  }

  // 1-Click quick fill buttons on form
  if (el.btnQuickFillAdmin) {
    el.btnQuickFillAdmin.addEventListener('click', () => {
      el.loginIdentifier.value = 'admin@aitest.vn';
      el.loginPassword.value = 'admin123';
      el.formLogin.dispatchEvent(new Event('submit'));
    });
  }

  if (el.btnQuickFillTester) {
    el.btnQuickFillTester.addEventListener('click', () => {
      el.loginIdentifier.value = 'tester@aitest.vn';
      el.loginPassword.value = 'tester123';
      el.formLogin.dispatchEvent(new Event('submit'));
    });
  }

  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      el.loginIdentifier.value = chip.dataset.email;
      el.loginPassword.value = chip.dataset.pass;
      switchAuthTab('login');
      el.formLogin.dispatchEvent(new Event('submit'));
    });
  });

  el.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = el.loginIdentifier.value.trim();
    const password = el.loginPassword.value;

    if (el.loginFeedback) {
      el.loginFeedback.style.display = 'none';
    }

    try {
      const data = await api('/api/auth/login', 'POST', { identifier, password });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('bbh_auth_token', data.token);
      showToast(data.message, 'success');
      applyAuthState();
      loadWorkspace();
    } catch (err) {
      if (el.loginFeedback) {
        el.loginFeedback.style.display = 'block';
        el.loginFeedback.style.background = 'var(--danger-soft)';
        el.loginFeedback.style.color = 'var(--danger)';
        el.loginFeedback.innerHTML = `⚠️ <b>Lỗi đăng nhập:</b> ${escapeHtml(err.message)}`;
      }
      showToast(err.message, 'error');
    }
  });

  el.formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = el.regName.value.trim();
    const email = el.regEmail.value.trim();
    const phone = el.regPhone.value.trim();
    const role = el.regRole.value;
    const password = el.regPassword.value;
    const apiKey = el.regApiKey ? el.regApiKey.value.trim() : '';

    if (el.registerFeedback) {
      el.registerFeedback.style.display = 'none';
    }

    try {
      const data = await api('/api/auth/register', 'POST', { name, email, phone, role, password, apiKey });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('bbh_auth_token', data.token);
      showToast(data.message, 'success');
      applyAuthState();
      loadWorkspace();
    } catch (err) {
      if (el.registerFeedback) {
        el.registerFeedback.style.display = 'block';
        el.registerFeedback.style.background = 'var(--danger-soft)';
        el.registerFeedback.style.color = 'var(--danger)';
        el.registerFeedback.innerHTML = `⚠️ <b>Lỗi đăng ký:</b> ${escapeHtml(err.message)}`;
      }
      showToast(err.message, 'error');
    }
  });

  el.btnLogout.addEventListener('click', async () => {
    if (confirm('Đăng xuất khỏi hệ thống?')) {
      try {
        await api('/api/auth/logout', 'POST').catch(() => {});
      } finally {
        state.token = null;
        state.user = null;
        localStorage.removeItem('bbh_auth_token');
        showToast('Đã đăng xuất.');
        applyAuthState();
      }
    }
  });

  function applyAuthState() {
    if (!state.user) {
      el.body.classList.add('auth-locked');
      el.authOverlay.classList.remove('hidden');
      el.btnAdminManage.style.display = 'none';
      return;
    }

    el.authOverlay.classList.add('hidden');
    el.body.classList.remove('auth-locked');

    // Multi-user Session Isolation: Each user gets their own dedicated client ID for Botbanhang
    const userScopedKey = 'bbh_client_id_for_' + state.user.id;
    let userClientId = localStorage.getItem(userScopedKey);
    if (!userClientId) {
      const safeId = String(state.user.id || 'usr').replace(/[^a-zA-Z0-9]/g, '');
      userClientId = `${safeId}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(userScopedKey, userClientId);
    }
    state.clientId = userClientId;
    localStorage.setItem('bbh_last_client_id', userClientId);
    if (el.clientIdDisplay) el.clientIdDisplay.textContent = userClientId;

    el.headerUserName.textContent = state.user.name;
    el.headerUserAvatar.textContent = (state.user.name || 'U').charAt(0).toUpperCase();
    if (state.user.avatar_color) el.headerUserAvatar.style.backgroundColor = state.user.avatar_color;

    const roleInfo = state.roles[state.user.role] || { name: state.user.role, badgeColor: 'terracotta' };
    el.headerUserRole.textContent = roleInfo.name;
    el.headerUserRole.className = `role-tag ${roleInfo.badgeColor || 'terracotta'}`;

    const perms = state.user.permissions || {};
    el.btnAdminManage.style.display = perms.canManageUsers ? 'inline-flex' : 'none';

    // DeepSeek status indicator: personal key or global
    const hasKey = Boolean(state.user.has_deepseek_key || state.config.has_deepseek_key);
    if (hasKey) {
      el.deepseekBadgeStatus.textContent = '🟢 DeepSeek V3 (Sẵn sàng)';
      el.deepseekBadgeStatus.style.background = 'rgba(13, 148, 136, 0.4)';
      el.deepseekBadgeStatus.title = 'DeepSeek API đã kết nối. Bấm để xem hoặc đổi cấu hình';
      if (el.agentDsStatusLabel) el.agentDsStatusLabel.textContent = '🟢 DeepSeek Brain: Sẵn sàng';
      if (el.agentDsStatusBanner) {
        el.agentDsStatusBanner.style.background = 'rgba(13, 148, 136, 0.08)';
        el.agentDsStatusBanner.style.borderColor = 'rgba(13, 148, 136, 0.2)';
      }
    } else {
      el.deepseekBadgeStatus.textContent = '⚪ Cần gắn Key DeepSeek';
      el.deepseekBadgeStatus.style.background = 'rgba(255, 255, 255, 0.2)';
      el.deepseekBadgeStatus.title = 'Bấm để nhập DeepSeek API Key cá nhân của bạn';
      if (el.agentDsStatusLabel) el.agentDsStatusLabel.textContent = '⚠️ Cần gắn Key DeepSeek';
      if (el.agentDsStatusBanner) {
        el.agentDsStatusBanner.style.background = 'rgba(217, 119, 87, 0.08)';
        el.agentDsStatusBanner.style.borderColor = 'rgba(217, 119, 87, 0.2)';
      }
    }

    if (perms.canChat === false) {
      el.body.classList.add('chat-permission-denied');
      el.headerSdkStatus.textContent = 'Quan sát viên (Chỉ xem)';
    } else {
      el.body.classList.remove('chat-permission-denied');
    }
  }

  // ==========================================================================
  // BOTBANHANG CHAT SDK CONTROLLER (#BBH-EMBED-IFRAME)
  // ==========================================================================

  function getBbhIframe() {
    return document.getElementById('BBH-EMBED-IFRAME');
  }

  function ensureDesktopEmbedIframe() {
    const iframe = getBbhIframe();
    if (!iframe) return;
    try {
      const src = iframe.getAttribute('src');
      if (src && src.includes('parentWidth=')) {
        const url = new URL(src);
        const pWidth = parseInt(url.searchParams.get('parentWidth') || '0', 10);
        if (pWidth < 768) {
          url.searchParams.set('parentWidth', '1200');
          url.searchParams.set('parentHeight', '800');
          iframe.setAttribute('src', url.toString());
        }
      }
    } catch (e) {
      console.warn('[SDK] Embed width check error:', e);
    }
  }

  function handleSdkMessage(e) {
    const data = e.data;
    if (!data || typeof data !== 'object') return;

    ensureDesktopEmbedIframe();

    if (data.from === 'BBH-EMBED-IFRAME') {
      if (typeof data.is_show === 'boolean') {
        state.chatIsOpen = data.is_show;
        el.body.classList.toggle('chat-is-open', data.is_show);
        if (el.btnToggleChatText) el.btnToggleChatText.textContent = data.is_show ? 'Đóng chat' : 'Mở chat';
        if (el.headerSdkStatus) el.headerSdkStatus.textContent = data.is_show ? 'Khung chat đang mở' : 'Bong bóng chờ';
      }

      if (data.type === 'CLIENT_ID' && data.data_embed_chat) {
        const cid = data.data_embed_chat.client_id || data.data_embed_chat['client-id'] || '';
        if (cid) {
          state.clientId = cid;
          localStorage.setItem('bbh_last_client_id', cid);
          if (el.clientIdDisplay) el.clientIdDisplay.textContent = cid;
        }
      }
    }

    if (data.from === 'RETION_EMBED' || data.type === 'BBH_INIT_SUCCESS' || data.type === 'INIT_SUCCESS') {
      state.sdkReady = true;
      if (el.headerSdkDot) el.headerSdkDot.className = 'pulse-dot';
      if (el.stageSdkDot) el.stageSdkDot.className = 'pulse-dot';
      setTimeout(() => { toggleChatbox(true); }, 350);
    }
  }

  window.addEventListener('message', handleSdkMessage);

  function toggleChatbox(forceOpen = false) {
    const iframe = getBbhIframe();
    if (!iframe) {
      showToast('Khung chat đang khởi tạo, vui lòng đợi giây lát...', 'error');
      return;
    }

    const nextState = forceOpen ? true : !state.chatIsOpen;
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ from: 'parent-app', action: nextState ? 'open' : 'close' }, '*');
      }
      window.postMessage({
        from: 'BBH-EMBED-IFRAME',
        is_show: nextState,
        is_quick_chat: false,
        position: 'bottom_right'
      }, '*');

      state.chatIsOpen = nextState;
      if (el.body) el.body.classList.toggle('chat-is-open', nextState);
      if (el.btnToggleChatText) el.btnToggleChatText.textContent = nextState ? 'Đóng chat' : 'Mở chat';
    } catch (err) {
      console.warn('[SDK] Error toggling chat:', err);
    }
  }

  if (el.btnToggleChat) el.btnToggleChat.addEventListener('click', () => toggleChatbox());
  if (el.btnCenterOpenPrompt) el.btnCenterOpenPrompt.addEventListener('click', () => toggleChatbox(true));

  // Universal /reset AI session command
  function sendResetCommand(silent = false) {
    const iframe = getBbhIframe();
    if (!iframe || !iframe.contentWindow) {
      if (!silent) showToast('Khung chat chưa sẵn sàng.', 'error');
      return;
    }

    if (!state.chatIsOpen) toggleChatbox(true);

    try {
      // 1. Send text "/reset" into chat conversation so Bot replies "Đã đặt lại lịch sử trò chuyện"
      iframe.contentWindow.postMessage({
        type: 'AI.SEND_TEXT_FROM_WEBSITE',
        payload: { text: '/reset' }
      }, '*');

      if (!silent) {
        showToast('🔄 Đã gửi "/reset" vào hội thoại. Đợi AI phản hồi "Đã đặt lại lịch sử trò chuyện"...', 'success');
      }
    } catch (err) {
      if (!silent) showToast('Lỗi khi gửi lệnh /reset: ' + err.message, 'error');
    }
  }

  if (el.btnHeaderResetSession) el.btnHeaderResetSession.addEventListener('click', () => sendResetCommand());
  if (el.btnStageResetAi) el.btnStageResetAi.addEventListener('click', () => sendResetCommand());
  if (el.btnRightResetAi) el.btnRightResetAi.addEventListener('click', () => sendResetCommand());
  const btnHudReset = document.getElementById('btn-hud-reset');
  if (btnHudReset) btnHudReset.addEventListener('click', () => sendResetCommand());

  if (el.headerPageIdBadge) {
    el.headerPageIdBadge.addEventListener('click', () => {
      const pageId = state.config.page_id || '095817282564177';
      navigator.clipboard.writeText(pageId).then(() => {
        showToast(`📋 Đã sao chép Page ID: ${pageId}`, 'success');
      }).catch(() => {
        showToast(`Page ID: ${pageId}`, 'info');
      });
    });
  }

  function sendPromptToChat(promptText) {
    const iframe = getBbhIframe();
    if (!iframe || !iframe.contentWindow) {
      showToast('Khung chat chưa sẵn sàng.', 'error');
      return;
    }

    if (!state.chatIsOpen) toggleChatbox(true);

    setTimeout(() => {
      try {
        iframe.contentWindow.postMessage({
          type: 'AI.SEND_TEXT_FROM_WEBSITE',
          payload: { text: promptText }
        }, '*');
        showToast('Đã gửi câu hỏi vào khung chat AI!', 'success');
      } catch (err) {
        showToast('Lỗi khi gửi tin nhắn: ' + err.message, 'error');
      }
    }, 280);

    if (el.activePromptDisplay) el.activePromptDisplay.textContent = promptText;
  }

  // ==========================================================================
  // DUAL-FILE TRAINING & DEEPSEEK MODAL
  // ==========================================================================

  function openTrainingModal(tab = 'tab-file1') {
    el.modalTraining.classList.add('open');
    el.body.classList.add('modal-open');
    el.file1TitleInput.value = state.productKnowledge.title || '';
    el.file1ContentInput.value = state.productKnowledge.content || '';
    el.file2TitleInput.value = state.promptRules.title || '';
    el.file2ContentInput.value = state.promptRules.content || '';
    el.dsModelSelect.value = state.config.deepseek_model || 'deepseek-chat';
    el.dsWaitSecondsInput.value = state.config.auto_wait_seconds || 30;

    // Switch tab
    el.trainingTabs.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    el.tabFile1Content.style.display = tab === 'tab-file1' ? 'block' : 'none';
    el.tabFile2Content.style.display = tab === 'tab-file2' ? 'block' : 'none';
    el.tabDeepseekContent.style.display = tab === 'tab-deepseek' ? 'block' : 'none';

    updateDeepSeekModalStatus();
  }

  function updateDeepSeekModalStatus() {
    if (!el.dsStatusText) return;
    if (state.config.has_deepseek_key) {
      el.dsStatusText.innerHTML = `🟢 <b>Đã có Key:</b> <code>${state.config.deepseek_api_key || '••••••••'}</code> (Mô hình: <b>${state.config.deepseek_model || 'deepseek-chat'}</b>)`;
      if (el.dsKeyHint) el.dsKeyHint.textContent = `(Đã lưu key ${state.config.deepseek_api_key || ''} - để trống nếu không đổi)`;
      if (el.btnTestSavedKey) el.btnTestSavedKey.style.display = 'inline-flex';
      el.dsApiKeyInput.removeAttribute('required');
      el.dsApiKeyInput.placeholder = 'Để trống để giữ nguyên key đã lưu, hoặc nhập key mới...';
    } else {
      el.dsStatusText.innerHTML = `⚪ <b>Chưa có Key:</b> Vui lòng nhập API Key để kích hoạt AI Tester & Judge`;
      if (el.dsKeyHint) el.dsKeyHint.textContent = '(Bắt buộc nhập)';
      if (el.btnTestSavedKey) el.btnTestSavedKey.style.display = 'none';
      el.dsApiKeyInput.setAttribute('required', 'required');
      el.dsApiKeyInput.placeholder = 'sk-... (Nhập key DeepSeek của bạn)';
    }
  }

  el.btnOpenTrainingHub.addEventListener('click', () => openTrainingModal('tab-file1'));
  el.deepseekBadgeStatus.style.cursor = 'pointer';
  el.deepseekBadgeStatus.addEventListener('click', () => openTrainingModal('tab-deepseek'));

  if (el.btnAgentOpenDsModal) {
    el.btnAgentOpenDsModal.addEventListener('click', () => openTrainingModal('tab-deepseek'));
  }

  el.btnCloseTrainingModal.addEventListener('click', () => {
    el.modalTraining.classList.remove('open');
    el.body.classList.remove('modal-open');
  });

  el.trainingTabs.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.trainingTabs.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      el.tabFile1Content.style.display = tab === 'tab-file1' ? 'block' : 'none';
      el.tabFile2Content.style.display = tab === 'tab-file2' ? 'block' : 'none';
      el.tabDeepseekContent.style.display = tab === 'tab-deepseek' ? 'block' : 'none';
      if (tab === 'tab-deepseek') updateDeepSeekModalStatus();
    });
  });

  // File 1 Upload & Save
  el.btnUploadFile1.addEventListener('click', () => el.uploadFile1Input.click());
  el.uploadFile1Input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      el.file1ContentInput.value = evt.target.result;
      el.file1TitleInput.value = file.name.replace(/\.[^/.]+$/, '');
      showToast(`Đã đọc nội dung File 1: "${file.name}". Bấm "Lưu File 1" để cập nhật.`, 'success');
    };
    reader.readAsText(file);
  });

  el.formFile1Save.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await api('/api/training-files/product-knowledge', 'POST', {
        title: el.file1TitleInput.value.trim(),
        content: el.file1ContentInput.value.trim()
      });
      state.productKnowledge = data.productKnowledge;
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // File 2 Upload & Save
  el.btnUploadFile2.addEventListener('click', () => el.uploadFile2Input.click());
  el.uploadFile2Input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      el.file2ContentInput.value = evt.target.result;
      el.file2TitleInput.value = file.name.replace(/\.[^/.]+$/, '');
      showToast(`Đã đọc nội dung File 2: "${file.name}". Bấm "Lưu File 2" để cập nhật.`, 'success');
    };
    reader.readAsText(file);
  });

  el.formFile2Save.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await api('/api/training-files/prompt-rules', 'POST', {
        title: el.file2TitleInput.value.trim(),
        content: el.file2ContentInput.value.trim()
      });
      state.promptRules = data.promptRules;
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Reset Default Files
  el.btnResetDefaultFiles.addEventListener('click', async () => {
    if (confirm('Khôi phục 2 file mẫu chuẩn Bongbongchat.vn?')) {
      try {
        const data = await api('/api/training-files/reset-default', 'POST');
        state.productKnowledge = data.productKnowledge;
        state.promptRules = data.promptRules;
        state.autoTestSuite = data.autoTestSuite;
        el.file1TitleInput.value = state.productKnowledge.title;
        el.file1ContentInput.value = state.productKnowledge.content;
        el.file2TitleInput.value = state.promptRules.title;
        el.file2ContentInput.value = state.promptRules.content;
        showToast('Đã khôi phục 2 file training mẫu chuẩn!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  // Test Saved Key Connection
  if (el.btnTestSavedKey) {
    el.btnTestSavedKey.addEventListener('click', async () => {
      el.deepseekTestFeedback.style.display = 'block';
      el.deepseekTestFeedback.style.background = 'var(--bg-panel)';
      el.deepseekTestFeedback.style.color = 'var(--text-primary)';
      el.deepseekTestFeedback.innerHTML = '⏳ Đang kiểm tra kết nối với Key DeepSeek đã lưu trong hệ thống...';

      try {
        const res = await api('/api/deepseek/test', 'POST', { apiKey: '', save: false });
        el.deepseekTestFeedback.style.background = 'var(--success-soft)';
        el.deepseekTestFeedback.style.color = 'var(--success)';
        el.deepseekTestFeedback.innerHTML = `✅ <b>Thành công!</b> ${res.message} (Mô hình: ${res.model})`;
        showToast('Kết nối DeepSeek API thành công!', 'success');
        state.config.has_deepseek_key = true;
        applyAuthState();
        updateDeepSeekModalStatus();
      } catch (err) {
        el.deepseekTestFeedback.style.background = 'var(--danger-soft)';
        el.deepseekTestFeedback.style.color = 'var(--danger)';
        el.deepseekTestFeedback.innerHTML = `❌ <b>Thất bại:</b> ${err.message}`;
      }
    });
  }

  // Test DeepSeek Connection (with current input)
  el.btnTestDeepseekConn.addEventListener('click', async () => {
    let apiKey = el.dsApiKeyInput.value.trim().replace(/^["']|["']$/g, '');
    if (!apiKey && !state.config.has_deepseek_key) {
      showToast('Vui lòng nhập API Key để kiểm tra.', 'error');
      return;
    }
    el.deepseekTestFeedback.style.display = 'block';
    el.deepseekTestFeedback.style.background = 'var(--bg-panel)';
    el.deepseekTestFeedback.style.color = 'var(--text-primary)';
    el.deepseekTestFeedback.innerHTML = '⏳ Đang gửi yêu cầu kiểm tra kết nối tới DeepSeek API...';

    try {
      const model = el.dsModelSelect.value;
      const res = await api('/api/deepseek/test', 'POST', { apiKey, model, save: false });
      el.deepseekTestFeedback.style.background = 'var(--success-soft)';
      el.deepseekTestFeedback.style.color = 'var(--success)';
      el.deepseekTestFeedback.innerHTML = `✅ <b>Thành công!</b> ${res.message} (Mô hình: ${res.model})`;
      showToast('Kết nối DeepSeek API thành công!', 'success');
      state.config.has_deepseek_key = true;
      applyAuthState();
      updateDeepSeekModalStatus();
    } catch (err) {
      el.deepseekTestFeedback.style.background = 'var(--danger-soft)';
      el.deepseekTestFeedback.style.color = 'var(--danger)';
      el.deepseekTestFeedback.innerHTML = `❌ <b>Thất bại:</b> ${err.message}`;
    }
  });

  // Save DeepSeek Config
  el.formDeepseekSave.addEventListener('submit', async (e) => {
    e.preventDefault();
    let apiKey = el.dsApiKeyInput.value.trim().replace(/^["']|["']$/g, '');
    const model = el.dsModelSelect.value;
    const auto_wait_seconds = Number(el.dsWaitSecondsInput.value) || 30;

    try {
      const res = await api('/api/deepseek/config', 'POST', { apiKey, model, auto_wait_seconds });
      state.config.has_deepseek_key = res.has_deepseek_key;
      state.config.deepseek_model = model;
      if (res.masked_key) state.config.deepseek_api_key = res.masked_key;
      setRunnerDelaySeconds(auto_wait_seconds);
      applyAuthState();
      updateDeepSeekModalStatus();
      showToast(res.message, 'success');
      el.modalTraining.classList.remove('open');
      el.body.classList.remove('modal-open');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ==========================================================================
  // MODE NAVIGATION & CLEAN TABS
  // ==========================================================================

  // Left Panel View Switcher (Manual vs Agent)
  if (el.tabBtnManual && el.tabBtnAgent) {
    el.tabBtnManual.addEventListener('click', () => {
      el.tabBtnManual.classList.add('active');
      el.tabBtnAgent.classList.remove('active');
      el.viewManualQa.style.display = 'block';
      el.viewAgentQa.style.display = 'none';
    });

    el.tabBtnAgent.addEventListener('click', () => {
      el.tabBtnAgent.classList.add('active');
      el.tabBtnManual.classList.remove('active');
      el.viewManualQa.style.display = 'none';
      el.viewAgentQa.style.display = 'block';
    });
  }

  // Right Panel Tab Switcher (Eval vs Transcript vs History)
  function switchRightTab(tabKey) {
    [el.rtabEval, el.rtabTranscript, el.rtabHistory].forEach(btn => {
      if (btn) btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    if (el.paneEval) el.paneEval.style.display = tabKey === 'eval' ? 'block' : 'none';
    if (el.paneTranscript) el.paneTranscript.style.display = tabKey === 'transcript' ? 'block' : 'none';
    if (el.paneHistory) el.paneHistory.style.display = tabKey === 'history' ? 'block' : 'none';
  }

  if (el.rtabEval) el.rtabEval.addEventListener('click', () => switchRightTab('eval'));
  if (el.rtabTranscript) el.rtabTranscript.addEventListener('click', () => switchRightTab('transcript'));
  if (el.rtabHistory) el.rtabHistory.addEventListener('click', () => switchRightTab('history'));

  // Custom Persona Toggle
  if (el.agentPersonaSelect && el.customPersonaGroup) {
    el.agentPersonaSelect.addEventListener('change', (e) => {
      el.customPersonaGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
  }

  // ==========================================================================
  // CÁCH 1: TỰ SOẠN CÂU HỎI THỦ CÔNG (KHÔNG GIỚI HẠN SỐ LƯỢNG CÂU HỎI)
  // ==========================================================================

  const SAMPLE_QUESTIONS = [
    'Báo giá chi tiết gói phòng bán chạy nhất bên bạn và có ưu đãi gì không?',
    'Nhà mình có nuôi một bé cún Poodle nhỏ rất ngoan, bên bạn có cho mang thú cưng vào phòng ở cùng không?',
    'Resort bên mình có sân golf 18 lỗ và trực thăng đưa đón từ sân bay về không bạn?',
    'Mấy giờ thì được nhận phòng và trả phòng vậy? Nếu mình đến sớm lúc 8h sáng thì có phòng luôn không và tính phí sao?',
    'Phòng bên bạn chứa được mấy người? Nhóm mình 3 người lớn ở chung 1 phòng đôi thì phụ thu bao nhiêu tiền?',
    'Bớt thêm cho mình 30% được không? Nếu được thì mình chuyển cọc chốt luôn trong hôm nay!',
    'Bên mình có phục vụ tiệc nướng BBQ ngoài trời và đốt lửa trại không? Giá tính thế nào vậy bạn?',
    'Nếu mình đặt cọc xong mà trước ngày đi 5 ngày có việc bận đột xuất muốn hủy thì có được hoàn tiền cọc không?'
  ];

  function getManualQuestionsList() {
    if (!el.manualQuestionsInput) return [];
    return el.manualQuestionsInput.value
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  function updateManualQuestionCount() {
    const list = getManualQuestionsList();
    if (el.manualQCount) el.manualQCount.textContent = `${list.length} câu`;
    localStorage.setItem('bbh_manual_questions', el.manualQuestionsInput.value);
  }

  if (el.manualQuestionsInput) {
    const savedManual = localStorage.getItem('bbh_manual_questions');
    el.manualQuestionsInput.value = (savedManual !== null && savedManual.trim().length > 0)
      ? savedManual
      : SAMPLE_QUESTIONS.join('\n');
    updateManualQuestionCount();
    el.manualQuestionsInput.addEventListener('input', updateManualQuestionCount);
  }

  if (el.btnLoadSampleQuestions) {
    el.btnLoadSampleQuestions.addEventListener('click', () => {
      el.manualQuestionsInput.value = SAMPLE_QUESTIONS.join('\n');
      updateManualQuestionCount();
      showToast('Đã nạp 8 câu hỏi tình huống mẫu chuẩn!', 'success');
    });
  }

  if (el.btnClearManualText) {
    el.btnClearManualText.addEventListener('click', () => {
      if (confirm('Xóa trắng danh sách câu hỏi?')) {
        el.manualQuestionsInput.value = '';
        updateManualQuestionCount();
        showToast('Đã xóa trắng danh sách câu hỏi.');
      }
    });
  }

  // Smart Q&A cleaner: strips answers and question numbers
  function cleanQuestionsInput() {
    if (!el.manualQuestionsInput) return;
    const rawText = el.manualQuestionsInput.value;
    if (!rawText.trim()) {
      showToast('Chưa có nội dung câu hỏi để lọc.', 'error');
      return;
    }

    const lines = rawText.split('\n');
    let cleanedCount = 0;
    const newLines = lines.map(line => {
      let text = line.trim();
      if (!text) return '';

      const original = text;
      // 1. Strip leading numbering: '1. ', '1) ', '1 ', 'Câu 1: ', 'Q1: ', 'Hỏi 1: '
      text = text.replace(/^(?:câu\s*\d+[:.]?|q\d+[:.]?|hỏi\s*\d*[:.]?|\d+[\s.)\-:]+)\s*/i, '');

      // 2. If line contains '?', keep text up to '?'
      const qMarkIndex = text.indexOf('?');
      if (qMarkIndex !== -1 && qMarkIndex < text.length - 1) {
        text = text.substring(0, qMarkIndex + 1).trim();
      } else {
        // If separated by ' - Đáp:', ' - Trả lời:', ' => ', ' -> '
        const sepMatch = text.match(/\s*(?:[-–—]\s*(?:đáp|trả lời|tl|ans|answer)[:.]?|=>|->)\s*.+$/i);
        if (sepMatch) {
          text = text.substring(0, sepMatch.index).trim();
        }
      }

      if (text !== original) cleanedCount++;
      return text;
    }).filter(l => l.length > 0);

    el.manualQuestionsInput.value = newLines.join('\n');
    updateManualQuestionCount();

    if (cleanedCount > 0) {
      showToast(`✨ Đã lọc sạch đáp án & số thứ tự cho ${cleanedCount} dòng câu hỏi!`, 'success');
    } else {
      showToast('Các câu hỏi đã ở định dạng chuẩn.', 'info');
    }
  }

  if (el.btnCleanQaText) {
    el.btnCleanQaText.addEventListener('click', cleanQuestionsInput);
  }

  // Delay settings helper
  function setRunnerDelaySeconds(sec) {
    const val = Math.max(5, Math.min(300, parseInt(sec, 10) || 30));
    state.config.auto_wait_seconds = val;
    localStorage.setItem('bbh_runner_seconds', val);
    if (el.runnerDelayInput) el.runnerDelayInput.value = val;
    if (el.dsWaitSecondsInput) el.dsWaitSecondsInput.value = val;

    if (el.timerPresetsGroup) {
      el.timerPresetsGroup.querySelectorAll('.chip-xs, .timer-chip').forEach(chip => {
        chip.classList.toggle('active', parseInt(chip.dataset.sec, 10) === val);
      });
    }

    if (!state.manualRunner.isRunning && el.manualCountdownTimer) {
      el.manualCountdownTimer.textContent = `${val}s`;
    }
  }

  // Live Digital Countdown & Bar Display Updater
  function updateManualCountdownDisplay(sec, totalSec, isPaused) {
    const clockBadge = el.manualClockBadge || document.getElementById('manual-clock-badge');
    const timerElem = el.manualCountdownTimer || document.getElementById('manual-countdown-timer');
    const barElem = el.manualCountdownBar || document.getElementById('manual-countdown-bar');

    const isManual = Boolean((state.runner && state.runner.mode === 'manual') || (state.manualRunner && state.manualRunner.mode === 'manual'));
    if (isManual) {
      if (timerElem) timerElem.textContent = 'Chờ';
      if (barElem) barElem.style.width = '100%';
      if (clockBadge) {
        clockBadge.style.borderColor = 'var(--indigo)';
        clockBadge.style.color = 'var(--indigo)';
        clockBadge.style.background = 'var(--bg-surface)';
        const iconSpan = clockBadge.querySelector('span:first-child');
        if (iconSpan) iconSpan.textContent = '✋';
      }
      return;
    }

    const currentSec = Math.max(0, parseInt(sec, 10) || 0);
    const safeTotal = Math.max(1, parseInt(totalSec, 10) || state.config.auto_wait_seconds || 30);
    const pct = Math.min(100, Math.max(0, (currentSec / safeTotal) * 100));

    if (timerElem) {
      timerElem.textContent = `${currentSec}s`;
    }

    const hudTimer = document.getElementById('stage-hud-timer-val');
    if (hudTimer) {
      if (isPaused) {
        hudTimer.textContent = 'Tạm dừng';
      } else if (isManual) {
        hudTimer.textContent = 'Chờ xác nhận';
      } else {
        hudTimer.textContent = `${currentSec}s`;
      }
    }

    if (barElem) {
      barElem.style.width = `${pct}%`;
      if (currentSec <= 5) {
        barElem.style.background = '#ef4444';
      } else if (currentSec <= 10) {
        barElem.style.background = '#f59e0b';
      } else {
        barElem.style.background = 'var(--indigo)';
      }
    }

    if (clockBadge) {
      if (isPaused) {
        clockBadge.style.borderColor = '#f59e0b';
        clockBadge.style.color = '#d97706';
        clockBadge.style.background = 'rgba(245, 158, 11, 0.1)';
        const iconSpan = clockBadge.querySelector('span:first-child');
        if (iconSpan) iconSpan.textContent = '⏸️';
      } else {
        const isUrgent = currentSec <= 5;
        clockBadge.style.borderColor = isUrgent ? '#ef4444' : 'var(--indigo)';
        clockBadge.style.color = isUrgent ? '#ef4444' : 'var(--indigo)';
        clockBadge.style.background = isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface)';
        const iconSpan = clockBadge.querySelector('span:first-child');
        if (iconSpan) iconSpan.textContent = '⏱️';
      }
    }
  }

  if (el.runnerDelayInput) {
    el.runnerDelayInput.addEventListener('change', (e) => {
      setRunnerDelaySeconds(e.target.value);
      showToast(`Đã cài đặt thời gian chờ: ${state.config.auto_wait_seconds} giây.`, 'info');
    });
  }

  if (el.timerPresetsGroup) {
    el.timerPresetsGroup.querySelectorAll('.chip-xs, .timer-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        setRunnerDelaySeconds(chip.dataset.sec);
        showToast(`Đã chọn thời gian chờ: ${chip.dataset.sec} giây.`, 'info');
      });
    });
  }

  if (el.runnerModeSelect) {
    el.runnerModeSelect.addEventListener('change', (e) => {
      state.runner.mode = e.target.value;
      localStorage.setItem('bbh_runner_mode', e.target.value);
      showToast(e.target.value === 'manual'
        ? 'Chế độ Thủ công: Chỉ gửi tiếp khi bấm nút hoặc ấn phím Space.'
        : `Chế độ Tự động: Đếm ngược ${state.config.auto_wait_seconds}s mỗi câu.`, 'info');
    });
  }

  // Manual Runner Controls
  if (el.btnStartManualRunner) {
    el.btnStartManualRunner.addEventListener('click', () => {
      if (state.manualRunner.isRunning) {
        stopManualRunner();
      } else {
        startManualRunner();
      }
    });
  }

  if (el.btnRestartManualRunner) {
    el.btnRestartManualRunner.addEventListener('click', () => restartManualRunner(true));
  }

  if (el.btnRunnerRestartInline) {
    el.btnRunnerRestartInline.addEventListener('click', () => restartManualRunner(true));
  }

  function startManualRunner() {
    restartManualRunner(true);
  }

  function restartManualRunner(shouldResetAi = true) {
    const questions = getManualQuestionsList();
    if (questions.length === 0) {
      showToast('Vui lòng nhập hoặc dán ít nhất 1 câu hỏi vào ô soạn thảo.', 'error');
      return;
    }

    // 1. Clear any running countdown timer
    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);

    // 2. Ensure chat window is open
    if (!state.chatIsOpen) toggleChatbox(true);

    // 3. Re-initialize state with fresh questions from textarea
    state.manualRunner.isRunning = true;
    state.manualRunner.isPaused = false;
    state.manualRunner.currentIndex = 0;
    state.manualRunner.questions = questions;
    state.manualRunner.totalWaitSec = state.config.auto_wait_seconds || 30;
    state.manualRunner.countdownRemaining = state.manualRunner.totalWaitSec;

    // 4. Update UI
    el.btnStartManualRunner.innerHTML = `<span>⏹ Dừng chạy</span>`;
    el.btnStartManualRunner.className = 'btn btn-secondary btn-sm';
    if (el.btnRestartManualRunner) el.btnRestartManualRunner.style.display = 'inline-flex';
    el.manualRunningBox.style.display = 'flex';
    if (el.btnRunnerPause) el.btnRunnerPause.textContent = '⏸️ Tạm dừng';

    if (shouldResetAi) {
      // Send /reset into the chat
      sendResetCommand(true);
      showToast('🔄 Đã gửi /reset. Đợi AI phản hồi "Đã đặt lại lịch sử trò chuyện"...', 'info');

      // Show waiting indicator in running status box
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = '🔄 Đang làm mới... Tự động gửi câu #1 sau (3s)';
      if (el.manualRunningBadge) el.manualRunningBadge.textContent = 'Reset';
      if (el.manualRunningPrompt) el.manualRunningPrompt.textContent = 'Đã gửi lệnh /reset vào chat để làm mới phiên';
      updateManualCountdownDisplay(3, 3, false);

      // Give AI 3 seconds to reply "Đã đặt lại lịch sử trò chuyện", then start Question #1!
      let resetWait = 3;
      const resetTick = () => {
        if (!state.manualRunner.isRunning) return;
        resetWait -= 1;
        updateManualCountdownDisplay(resetWait, 3, false);
        if (resetWait > 0) {
          if (el.manualRunningTitle) el.manualRunningTitle.textContent = `🔄 Đợi AI báo "Đã đặt lại lịch sử trò chuyện"... Tự động gửi câu #1 sau (${resetWait}s)`;
          state.manualRunner.timerId = setTimeout(resetTick, 1000);
        } else {
          showToast('✅ AI đã hoàn tất làm mới lịch sử. Bắt đầu câu #1!', 'success');
          executeManualQuestion();
        }
      };
      state.manualRunner.timerId = setTimeout(resetTick, 1000);
    } else {
      executeManualQuestion();
    }
  }

  function stopManualRunner(showNotice = true) {
    state.manualRunner.isRunning = false;
    state.manualRunner.isPaused = false;
    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);
    el.manualRunningBox.style.display = 'none';
    el.btnStartManualRunner.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Bắt đầu Chạy Kịch Bản</span>`;
    el.btnStartManualRunner.className = 'btn btn-primary btn-sm';
    
    // Keep restart button visible if there are questions so user can start from #1 anytime
    if (el.btnRestartManualRunner) {
      const qList = getManualQuestionsList();
      el.btnRestartManualRunner.style.display = qList.length > 0 ? 'inline-flex' : 'none';
    }

    if (showNotice) showToast('Đã dừng kịch bản. Bạn có thể sửa câu hỏi rồi bấm "Chạy lại từ đầu".');
  }

  async function executeManualQuestion() {
    if (!state.manualRunner.isRunning) return;
    const { currentIndex, questions } = state.manualRunner;

    if (currentIndex >= questions.length) {
      stopManualRunner();
      showToast('🎉 Đã hoàn thành kiểm thử toàn bộ danh sách câu hỏi!', 'success');
      return;
    }

    const qText = questions[currentIndex];
    const waitSec = state.config.auto_wait_seconds || 30;
    state.manualRunner.countdownRemaining = waitSec;
    state.manualRunner.totalWaitSec = waitSec;

    const nextQNum = currentIndex + 2;
    const isLastQ = (currentIndex + 1) >= questions.length;
    const nextQMsg = isLastQ ? 'Hoàn tất sau' : `Tự động gửi câu #${nextQNum} sau`;

    if (el.manualRunningBadge) el.manualRunningBadge.textContent = `${currentIndex + 1} / ${questions.length}`;
    if (el.manualRunningPrompt) el.manualRunningPrompt.textContent = `"${qText}"`;

    if (el.manualProgressBar) {
      const pct = Math.round((currentIndex / questions.length) * 100);
      el.manualProgressBar.style.width = `${pct}%`;
    }

    sendPromptToChat(qText);
    switchRightTab('eval');

    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);

    // Immediately display the starting countdown clock & bar
    updateManualCountdownDisplay(waitSec, waitSec, false);

    if (state.runner && state.runner.mode === 'manual') {
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `⏳ Đợi AI trả lời xong (Bấm "Xong ngay" hoặc Space để tiếp tục)...`;
    } else {
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `⏳ Câu #${currentIndex + 1}: ${nextQMsg} (${waitSec}s)`;
      const tick = () => {
        if (!state.manualRunner.isRunning) return;
        if (state.manualRunner.isPaused) {
          updateManualCountdownDisplay(state.manualRunner.countdownRemaining, state.manualRunner.totalWaitSec, true);
          state.manualRunner.timerId = setTimeout(tick, 1000);
          return;
        }

        state.manualRunner.countdownRemaining -= 1;
        const rem = state.manualRunner.countdownRemaining;
        const tot = state.manualRunner.totalWaitSec;

        updateManualCountdownDisplay(rem, tot, false);

        if (rem > 0) {
          if (el.manualRunningTitle) {
            el.manualRunningTitle.textContent = `⏳ Câu #${currentIndex + 1}: ${nextQMsg} (${rem}s)`;
          }
          state.manualRunner.timerId = setTimeout(tick, 1000);
        } else {
          onManualQuestionFinished();
        }
      };
      state.manualRunner.timerId = setTimeout(tick, 1000);
    }
  }

  function onManualQuestionFinished() {
    if (!state.manualRunner.isRunning) return;
    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);

    const currentIndex = state.manualRunner.currentIndex;
    const qText = state.manualRunner.questions[currentIndex];
    let aiResponse = el.evalResponseInput ? el.evalResponseInput.value.trim() : '';
    if (!aiResponse) {
      aiResponse = `(AI đã phản hồi trong bong bóng chat lúc ${new Date().toLocaleTimeString('vi-VN')})`;
      if (el.evalResponseInput) el.evalResponseInput.value = aiResponse;
    }

    // Run evaluation non-blocking in background so timer countdown is never delayed!
    evaluateActiveQuestion(aiResponse, qText).catch(e => {
      console.warn('Evaluation warning:', e);
    });

    state.manualRunner.currentIndex += 1;
    const nextIdx = state.manualRunner.currentIndex;
    const totalQ = state.manualRunner.questions.length;

    if (el.manualProgressBar) {
      const pct = Math.round((nextIdx / totalQ) * 100);
      el.manualProgressBar.style.width = `${pct}%`;
    }

    if (nextIdx >= totalQ) {
      stopManualRunner(false);
      showToast('🎉 Đã hoàn thành kiểm thử toàn bộ danh sách câu hỏi!', 'success');
      return;
    }

    if (state.manualRunner.isRunning) {
      const nextQNum = nextIdx + 1;
      if (el.manualRunningBadge) el.manualRunningBadge.textContent = `${nextQNum} / ${totalQ}`;
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `☕ Nghỉ 3s trước khi gửi câu #${nextQNum}...`;
      updateManualCountdownDisplay(3, 3, false);
      let breakSec = 3;
      const breakTick = () => {
        if (!state.manualRunner.isRunning) return;
        breakSec -= 1;
        updateManualCountdownDisplay(breakSec, 3, false);
        if (breakSec > 0) {
          if (el.manualRunningTitle) el.manualRunningTitle.textContent = `☕ Nghỉ ${breakSec}s trước khi gửi câu #${nextQNum}...`;
          state.manualRunner.timerId = setTimeout(breakTick, 1000);
        } else {
          executeManualQuestion();
        }
      };
      state.manualRunner.timerId = setTimeout(breakTick, 1000);
    }
  }

  // In-flight buttons for manual runner
  if (el.btnRunnerPause) {
    el.btnRunnerPause.addEventListener('click', () => {
      if (!state.manualRunner.isRunning) return;
      state.manualRunner.isPaused = !state.manualRunner.isPaused;
      el.btnRunnerPause.textContent = state.manualRunner.isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
      updateManualCountdownDisplay(state.manualRunner.countdownRemaining, state.manualRunner.totalWaitSec, state.manualRunner.isPaused);
      showToast(state.manualRunner.isPaused ? 'Đã tạm dừng đếm thời gian.' : 'Đã tiếp tục đếm.');
    });
  }

  if (el.btnRunnerAdd10) {
    el.btnRunnerAdd10.addEventListener('click', () => {
      if (!state.manualRunner.isRunning) return;
      state.manualRunner.countdownRemaining += 10;
      state.manualRunner.totalWaitSec = Math.max(state.manualRunner.totalWaitSec || 30, state.manualRunner.countdownRemaining);
      updateManualCountdownDisplay(state.manualRunner.countdownRemaining, state.manualRunner.totalWaitSec, state.manualRunner.isPaused);
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `⏳ Đang đợi AI trả lời (${state.manualRunner.countdownRemaining}s)...`;
      showToast('Đã cộng thêm +10 giây cho câu hiện tại!', 'success');
    });
  }

  if (el.btnRunnerNextNow) {
    el.btnRunnerNextNow.addEventListener('click', () => {
      if (state.manualRunner.isRunning) onManualQuestionFinished();
    });
  }

  // ==========================================================================
  // CÁCH 2: BỘ NÃO AGENT TỰ ĐỘNG ĐỌC NGỮ CẢNH ĐA LƯỢT (MULTI-TURN AGENT)
  // ==========================================================================

  if (el.btnStartAgentRun) {
    el.btnStartAgentRun.addEventListener('click', () => {
      if (state.agentRunner.isRunning) {
        stopAgentRunner();
      } else {
        startAgentRunner();
      }
    });
  }

  function startAgentRunner() {
    let persona = el.agentPersonaSelect.value;
    if (persona === 'family') persona = 'Khách gia đình 3 người lớn và 1 trẻ nhỏ hỏi phòng & phụ thu';
    else if (persona === 'bargain') persona = 'Khách mặc cả giá 30% và hỏi ưu đãi tối đa';
    else if (persona === 'pet_early') persona = 'Khách mang cún cưng Poodle và hỏi check-in sớm lúc 8h sáng';
    else if (persona === 'bbq_party') persona = 'Khách hỏi tiệc nướng BBQ ngoài trời và đốt lửa trại';
    else if (persona === 'custom') persona = (el.agentCustomPersonaInput && el.agentCustomPersonaInput.value.trim()) || 'Khách hỏi dịch vụ';

    const maxTurns = parseInt(el.agentMaxTurns.value, 10) || 4;
    const turnWait = parseInt(el.agentTurnWait.value, 10) || 30;

    state.agentRunner.isRunning = true;
    state.agentRunner.isPaused = false;
    state.agentRunner.turnIndex = 1;
    state.agentRunner.maxTurns = maxTurns;
    state.agentRunner.turnWait = turnWait;
    state.agentRunner.persona = persona;
    state.agentRunner.goal = 'Kiểm thử phản hồi đối chiếu File 1 và File 2 trong 1 cuộc đàm thoại hoàn chỉnh.';
    state.agentRunner.history = [];
    state.agentRunner.lastBotResponse = '';

    el.btnStartAgentRun.innerHTML = `<span>⏹ Dừng Agent</span>`;
    el.btnStartAgentRun.className = 'btn btn-secondary btn-sm';
    el.agentRunningBox.style.display = 'flex';

    if (el.agentTranscriptFeed) el.agentTranscriptFeed.innerHTML = '';
    switchRightTab('transcript');
    showToast(`🚀 Khởi chạy Agent đàm thoại đa lượt (${maxTurns} lượt)!`, 'info');

    executeAgentTurn();
  }

  function stopAgentRunner() {
    state.agentRunner.isRunning = false;
    if (state.agentRunner.timerId) clearTimeout(state.agentRunner.timerId);
    el.agentRunningBox.style.display = 'none';
    el.btnStartAgentRun.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>🚀 Khởi Chạy Agent Hội Thoại</span>`;
    el.btnStartAgentRun.className = 'btn btn-primary btn-sm';
    showToast('Đã dừng Agent đàm thoại.');
  }

  async function executeAgentTurn() {
    if (!state.agentRunner.isRunning) return;

    el.agentRunningTurnTitle.textContent = `Lượt ${state.agentRunner.turnIndex}/${state.agentRunner.maxTurns}: Agent đang phân tích ngữ cảnh...`;
    el.agentRunningBadge.textContent = `Turn ${state.agentRunner.turnIndex}`;
    el.agentThoughtProcess.textContent = `DeepSeek Agent đang đọc phản hồi của AI Sandbox để sinh câu hỏi tiếp theo...`;

    try {
      const res = await api('/api/ai-agent/chat-turn', 'POST', {
        persona: state.agentRunner.persona,
        goal: state.agentRunner.goal,
        conversationHistory: state.agentRunner.history,
        lastBotResponse: state.agentRunner.lastBotResponse,
        turnIndex: state.agentRunner.turnIndex,
        maxTurns: state.agentRunner.maxTurns
      });

      const turnData = res.agentTurn;
      const nextMsg = turnData.nextMessage;
      el.agentThoughtProcess.textContent = turnData.thoughtProcess || `Agent đã phản hồi bám sát câu trả lời của bot.`;

      // Render Customer Message Card into transcript feed
      renderTranscriptCustomerTurn(state.agentRunner.turnIndex, nextMsg, turnData.thoughtProcess);

      // Send Customer Message into Chatbox
      sendPromptToChat(nextMsg);
      state.agentRunner.history.push({ role: 'user', content: nextMsg });

      // Enter waiting for bot response
      state.agentRunner.countdownRemaining = state.agentRunner.turnWait;
      el.agentRunningTurnTitle.textContent = `Lượt ${state.agentRunner.turnIndex}/${state.agentRunner.maxTurns}: Đang đợi bot trả lời (${state.agentRunner.countdownRemaining}s)...`;

      const tick = () => {
        if (!state.agentRunner.isRunning) return;
        state.agentRunner.countdownRemaining -= 1;
        if (state.agentRunner.countdownRemaining > 0) {
          el.agentRunningTurnTitle.textContent = `Lượt ${state.agentRunner.turnIndex}/${state.agentRunner.maxTurns}: Đang đợi bot trả lời (${state.agentRunner.countdownRemaining}s)...`;
          state.agentRunner.timerId = setTimeout(tick, 1000);
        } else {
          onAgentTurnResponseReceived(turnData);
        }
      };
      state.agentRunner.timerId = setTimeout(tick, 1000);

    } catch (err) {
      showToast('Lỗi Agent: ' + err.message, 'error');
      stopAgentRunner();
    }
  }

  async function onAgentTurnResponseReceived(previousTurnData) {
    if (!state.agentRunner.isRunning) return;
    if (state.agentRunner.timerId) clearTimeout(state.agentRunner.timerId);

    let botReply = el.evalResponseInput.value.trim();
    if (!botReply) {
      botReply = `(AI đã phản hồi trong bong bóng chat lúc ${new Date().toLocaleTimeString('vi-VN')})`;
    }

    state.agentRunner.lastBotResponse = botReply;
    state.agentRunner.history.push({ role: 'assistant', content: botReply });

    // Mini evaluation of bot reply
    let evalObj = previousTurnData?.evaluation || { verdict: 'pass', score: 5, reason: 'AI phản hồi theo kịch bản.' };
    renderTranscriptBotReply(state.agentRunner.turnIndex, botReply, evalObj);

    // Check completion
    const isFinalTurn = state.agentRunner.turnIndex >= state.agentRunner.maxTurns || previousTurnData?.isCompleted;

    if (isFinalTurn) {
      renderTranscriptCompletion();

      // Auto /reset trigger
      if (el.agentAutoResetCheckbox && el.agentAutoResetCheckbox.checked) {
        setTimeout(() => {
          sendResetCommand(true);
          showToast('🎉 Hoàn thành cuộc trò chuyện! Đã tự động gửi /reset làm mới AI.', 'success');
        }, 1200);
      } else {
        showToast('🎉 Đã hoàn thành cuộc đàm thoại đa lượt!', 'success');
      }

      stopAgentRunner();
      updateMetrics();
    } else {
      state.agentRunner.turnIndex += 1;
      el.agentRunningTurnTitle.textContent = `☕ Nghỉ 3.5s trước lượt #${state.agentRunner.turnIndex}...`;
      setTimeout(() => {
        if (state.agentRunner.isRunning) executeAgentTurn();
      }, 3500);
    }
  }

  // Force next turn early or stop & reset
  if (el.btnAgentForceNext) {
    el.btnAgentForceNext.addEventListener('click', () => {
      if (state.agentRunner.isRunning) onAgentTurnResponseReceived();
    });
  }

  if (el.btnAgentStopReset) {
    el.btnAgentStopReset.addEventListener('click', () => {
      stopAgentRunner();
      sendResetCommand();
      showToast('Đã dừng Agent và gửi /reset làm mới AI.');
    });
  }

  if (el.btnAgentRestart) {
    el.btnAgentRestart.addEventListener('click', () => {
      stopAgentRunner();
      sendResetCommand(true);
      setTimeout(() => startAgentRunner(), 450);
      showToast('🔄 Đã làm mới AI và khởi chạy lại Agent từ lượt 1!', 'success');
    });
  }

  // Transcript Feed Renderers
  function renderTranscriptCustomerTurn(turnNum, message, thought) {
    if (!el.agentTranscriptFeed) return;
    const card = document.createElement('div');
    card.className = 'transcript-turn';
    card.innerHTML = `
      <div class="turn-header">
        <span>🗣️ Lượt #${turnNum} — Khách hàng (Agent)</span>
        <span class="mono-badge">${new Date().toLocaleTimeString('vi-VN')}</span>
      </div>
      <div class="turn-user">${escapeHtml(message)}</div>
      ${thought ? `<div style="font-size:10.5px;color:var(--text-muted);font-style:italic;">💡 <b>Ngữ cảnh:</b> ${escapeHtml(thought)}</div>` : ''}
    `;
    el.agentTranscriptFeed.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth' });
  }

  function renderTranscriptBotReply(turnNum, reply, evaluation) {
    if (!el.agentTranscriptFeed) return;
    const card = document.createElement('div');
    card.className = 'transcript-turn';
    const verdict = evaluation?.verdict || 'pass';
    const verdictLabel = verdict === 'pass' ? '✅ ĐẠT' : verdict === 'warning' ? '⚠️ CẦN SỬA' : '❌ CHƯA ĐẠT';

    card.innerHTML = `
      <div class="turn-header">
        <span>🤖 Phản hồi của AI Sandbox</span>
        <span class="verdict-pill ${verdict}">${verdictLabel}</span>
      </div>
      <div class="turn-bot">${escapeHtml(reply)}</div>
      <div class="turn-verdict">
        <span style="color:var(--text-secondary);"><b>Giám khảo AI:</b> ${escapeHtml(evaluation?.reason || 'Phản hồi tốt.')}</span>
        <span>${'⭐'.repeat(evaluation?.score || 5)}</span>
      </div>
    `;
    el.agentTranscriptFeed.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth' });
  }

  function renderTranscriptCompletion() {
    if (!el.agentTranscriptFeed) return;
    const div = document.createElement('div');
    div.className = 'empty-state-card';
    div.style.background = 'var(--success-soft)';
    div.style.border = '1px solid var(--success)';
    div.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:var(--success);">🎉 Đã hoàn thành cuộc hội thoại hoàn chỉnh!</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">
        Agent đã kết thúc phiên test đàm thoại. Lệnh <b>/reset</b> đã được gửi vào khung chat để làm mới AI.
      </div>
    `;
    el.agentTranscriptFeed.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
  }

  // Space key shortcut to quickly advance
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      if (state.manualRunner.isRunning) {
        e.preventDefault();
        onManualQuestionFinished();
      } else if (state.agentRunner.isRunning) {
        e.preventDefault();
        onAgentTurnResponseReceived();
      }
    }
  });

  // ==========================================================================
  // EVALUATION ENGINE & RIGHT PANEL
  // ==========================================================================

  async function evaluateActiveQuestion(aiResponse, customQuestionText = null) {
    const qText = customQuestionText || (el.activePromptDisplay && el.activePromptDisplay.textContent) || 'Câu hỏi kiểm thử';

    if (el.evalVerdictBadge) {
      el.evalVerdictBadge.className = 'verdict-pill pending';
      el.evalVerdictBadge.textContent = '⏳ Đang chấm điểm...';
    }

    try {
      const res = await api('/api/ai-tester/evaluate', 'POST', {
        questionText: qText,
        aiResponse: aiResponse,
        clientId: state.clientId
      });

      const evalData = res.evaluation;
      const verdict = evalData.verdict || 'pass';

      if (el.evalVerdictBadge) {
        el.evalVerdictBadge.className = `verdict-pill ${verdict}`;
        el.evalVerdictBadge.textContent = verdict === 'pass' ? '✅ ĐẠT' : verdict === 'warning' ? '⚠️ CẦN SỬA' : '❌ CHƯA ĐẠT';
      }
      if (el.evalStarsDisplay) {
        el.evalStarsDisplay.textContent = '⭐'.repeat(evalData.score || 5);
      }
      if (el.evalReasonDisplay) {
        el.evalReasonDisplay.innerHTML = `<b>${res.judgeEngine}:</b> ${escapeHtml(evalData.reason)}` +
          (evalData.recommendation ? `<br><i>Đề xuất:</i> ${escapeHtml(evalData.recommendation)}` : '');
      }

      state.evaluations.unshift(res.record);
      renderEvaluations();
      updateMetrics();

      return res;
    } catch (err) {
      if (el.evalVerdictBadge) {
        el.evalVerdictBadge.className = 'verdict-pill fail';
        el.evalVerdictBadge.textContent = 'Lỗi chấm điểm';
      }
      if (el.evalReasonDisplay) {
        el.evalReasonDisplay.textContent = 'Lỗi: ' + err.message;
      }
      throw err;
    }
  }

  if (el.btnAutoEvaluate) {
    el.btnAutoEvaluate.addEventListener('click', async () => {
      const aiResponse = el.evalResponseInput.value.trim();
      if (!aiResponse) {
        showToast('Vui lòng nhập hoặc dán nội dung AI phản hồi trước khi chấm điểm.', 'error');
        return;
      }
      try {
        await evaluateActiveQuestion(aiResponse);
        showToast('Đã hoàn thành chấm điểm đối chiếu 2 file!', 'success');
      } catch (e) {
        showToast('Lỗi khi chấm điểm: ' + e.message, 'error');
      }
    });
  }

  if (el.btnSubmitEval) {
    el.btnSubmitEval.addEventListener('click', () => {
      showToast('Kết quả đã được tự động lưu vào báo cáo.', 'info');
    });
  }

  // Paste from clipboard helper
  if (el.btnPasteClipboard) {
    el.btnPasteClipboard.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          el.evalResponseInput.value = text;
          showToast('Đã dán câu trả lời từ Clipboard!', 'success');
        } else {
          showToast('Clipboard trống.', 'info');
        }
      } catch (err) {
        showToast('Không thể đọc Clipboard: ' + err.message, 'error');
      }
    });
  }

  function renderEvaluations() {
    let list = state.evaluations;
    if (state.evalFilter === 'fail') {
      list = list.filter(e => e.result === 'fail' || e.result === 'warning');
    }

    el.evalCountBadge.textContent = state.evaluations.length;
    el.evaluationsList.innerHTML = '';

    if (list.length === 0) {
      el.evaluationsList.innerHTML = `<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:11px;">Chưa có lượt đánh giá nào.</div>`;
      return;
    }

    list.slice(0, 25).forEach(ev => {
      const card = document.createElement('div');
      card.className = 'auto-question-card';
      const stars = '⭐'.repeat(ev.score);
      const time = new Date(ev.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="verdict-badge ${ev.result}">${ev.result === 'pass' ? 'PASS' : ev.result === 'warning' ? 'WARN' : 'FAIL'}</span>
          <span style="font-size:10px;color:var(--text-muted);">${stars} • ${time}</span>
        </div>
        <div style="font-size:11.5px;font-weight:600;color:var(--text-primary);line-height:1.3;">"${escapeHtml(ev.prompt_used)}"</div>
        ${ev.ai_response_summary ? `<div style="font-size:11px;color:var(--text-secondary);background:var(--bg-panel);padding:4px 7px;border-radius:5px;white-space:pre-wrap;">${escapeHtml(ev.ai_response_summary)}</div>` : ''}
        ${ev.analysis ? `<div style="font-size:10.5px;color:var(--accent);"><b>Nhận xét:</b> ${escapeHtml(ev.analysis)}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--text-muted);">
          <span>Persona: <b>${escapeHtml(ev.persona || 'Khách')}</b></span>
          <span class="mono-badge" style="font-size:9px;">${escapeHtml(ev.judge_engine || 'AI Judge')}</span>
        </div>
      `;

      el.evaluationsList.appendChild(card);
    });
  }

  function updateMetrics() {
    const total = state.evaluations.length;
    el.metricTotalTests.textContent = total;
    if (total === 0) {
      el.metricPassRate.textContent = '100%';
      el.metricFailCount.textContent = '0';
      return;
    }

    const passes = state.evaluations.filter(e => e.result === 'pass').length;
    const fails = state.evaluations.filter(e => e.result === 'fail').length;
    const rate = Math.round((passes / total) * 100);

    el.metricPassRate.textContent = `${rate}%`;
    el.metricFailCount.textContent = fails;
  }

  el.btnFilterAll.addEventListener('click', () => {
    state.evalFilter = 'all';
    el.btnFilterAll.classList.add('btn-primary');
    el.btnFilterFails.classList.remove('btn-primary');
    renderEvaluations();
  });

  el.btnFilterFails.addEventListener('click', () => {
    state.evalFilter = 'fail';
    el.btnFilterFails.classList.add('btn-primary');
    el.btnFilterAll.classList.remove('btn-primary');
    renderEvaluations();
  });

  // Export CSV
  el.btnExportCsv.addEventListener('click', () => {
    if (state.evaluations.length === 0) {
      showToast('Chưa có dữ liệu để xuất CSV.', 'error');
      return;
    }

    const headers = ['ID', 'Tester', 'Persona', 'Prompt', 'AI Response', 'Verdict', 'Score', 'Phan tich', 'Giam khao', 'Thoi gian'];
    const rows = state.evaluations.map(e => [
      e.id,
      `"${e.tester_name}"`,
      `"${e.persona || ''}"`,
      `"${(e.prompt_used || '').replace(/"/g, '""')}"`,
      `"${(e.ai_response_summary || '').replace(/"/g, '""')}"`,
      e.result.toUpperCase(),
      e.score,
      `"${(e.analysis || '').replace(/"/g, '""')}"`,
      `"${e.judge_engine || ''}"`,
      e.created_at
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepseek-ai-tester-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file báo cáo CSV thành công!', 'success');
  });

  // ==========================================================================
  // INITIAL WORKSPACE LOADER
  // ==========================================================================

  function syncRunnerPreferences() {
    const savedSeconds = parseInt(localStorage.getItem('bbh_runner_seconds'), 10);
    const effectiveSeconds = (!isNaN(savedSeconds) && savedSeconds >= 5) 
      ? savedSeconds 
      : (state.config.auto_wait_seconds || 30);
    setRunnerDelaySeconds(effectiveSeconds);

    const savedMode = localStorage.getItem('bbh_runner_mode') || 'timer';
    state.runner.mode = savedMode;
    if (el.runnerModeSelect) el.runnerModeSelect.value = savedMode;
  }

  async function loadWorkspace() {
    try {
      const data = await api('/api/workspace');
      state.user = data.user;
      state.config = data.config;
      state.roles = data.roles;
      state.productKnowledge = data.productKnowledge;
      state.promptRules = data.promptRules;
      state.autoTestSuite = data.autoTestSuite;
      state.evaluations = data.evaluations;
      state.users = data.users;

      el.headerPageIdBadge.textContent = `ID: ${state.config.page_id}`;
      applyAuthState();
      syncRunnerPreferences();
      updateManualQuestionCount();
      renderEvaluations();
      updateMetrics();
    } catch (err) {
      console.warn('[APP] Could not load workspace:', err);
      if (!state.user) applyAuthState();
    }
  }

  async function bootstrap() {
    initTheme();

    try {
      const boot = await api('/api/bootstrap');
      state.config = boot.config;
      state.roles = boot.roles;
      state.productKnowledge = boot.productKnowledge;
      state.promptRules = boot.promptRules;
      el.headerPageIdBadge.textContent = `ID: ${state.config.page_id}`;

      syncRunnerPreferences();

      if (boot.token) {
        state.token = boot.token;
        localStorage.setItem('bbh_auth_token', boot.token);
      }

      if (boot.currentUser) {
        state.user = boot.currentUser;
        await loadWorkspace();
        setTimeout(() => { toggleChatbox(true); }, 750);
      } else {
        applyAuthState();
      }
    } catch (err) {
      syncRunnerPreferences();
      applyAuthState();
    }
  }

  // Run on startup
  bootstrap();

})();

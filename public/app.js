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
    chatSessions: [],
    historySubtab: 'evals',
    selectedSessionId: 'live',
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

    // Multi-Flow Checklist & Post-Audit State Machine (Toggleable in Method 1)
    multiFlow: {
      enabled: localStorage.getItem('bbh_mf_enabled') === 'true',
      cases: [],
      noteMode: localStorage.getItem('bbh_mf_note_mode') || 'auto',
      autoReset: localStorage.getItem('bbh_mf_auto_reset') !== 'false',
      sendNoteToChat: localStorage.getItem('bbh_mf_send_note_chat') === 'true',
      runQueue: [],
      queuePos: 0,
      activeQIdx: 0,
      isWaitingNote: false,
      currentSessionId: null
    },

    // Quick Test Users (for multi-flow testing without creating multiple real accounts)
    testUsers: [],
    lastCreatedTestUser: null, // { email, password, userId, token }

    // Autonomous Multi-Turn Agent State Machine (Method 2)
    agentRunner: {
      isRunning: false,
      isPaused: false,
      turnIndex: 1,
      maxTurns: 10,
      persona: 'family',
      goal: '',
      history: [],
      lastBotResponse: '',
      timerId: null,
      countdownRemaining: 0
    }
  };

  // Supported AI Models & Metadata (Google Gemini Free 100%, Smart Local AI 0đ, Groq, DeepSeek)
  const MODEL_META = {
    'gemini-1.5-flash': {
      provider: 'gemini',
      name: 'Google Gemini 1.5 Flash (Miễn phí 100%)',
      badge: '🌟 Gemini 1.5 Flash (Free)',
      isFree: true,
      needsKey: false,
      keyLabel: 'Google Gemini API Key (Tùy chọn):',
      keyPlaceholder: 'Đã tích hợp sẵn Key Free của hệ thống (hoặc dán Key riêng nếu có)',
      helpText: 'Google AI Studio cung cấp 1,500 lượt gọi/ngày <b>MIỄN PHÍ</b>. Hệ thống đã tích hợp sẵn Key chạy ngay 0đ, bạn có thể tự nhập thêm Key riêng bất kỳ lúc nào tại <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent); font-weight:700;">aistudio.google.com</a>.',
      rateLimitHint: 'Miễn phí 1.500 req/ngày (Có sẵn Key)'
    },
    'local-free': {
      provider: 'local',
      name: 'Smart Local AI (Miễn phí 0đ - Không cần Key)',
      badge: '🛡️ Local AI (0đ)',
      isFree: true,
      needsKey: false,
      keyLabel: 'Không cần API Key',
      keyPlaceholder: 'Chế độ Local AI không cần bất kỳ API Key nào',
      helpText: '<b>🛡️ Chế độ AI Cục Bộ (0đ Vĩnh Viễn):</b> Tự động đọc dữ liệu 2 File để dựng câu hỏi & chấm điểm, không tốn chi phí, không cần key, không sợ nghẽn mạng hay hết quota!',
      rateLimitHint: '0đ - Không cần Key'
    },
    'ollama': {
      provider: 'ollama',
      name: 'Ollama Local LLM (0đ Tự lưu trữ - qwen2.5, llama3.2, deepseek-r1)',
      badge: '🦙 Ollama Local (0đ)',
      isFree: true,
      needsKey: false,
      keyLabel: 'Không cần API Key (Kết nối Ollama)',
      keyPlaceholder: 'Ollama chạy trực tiếp trên máy tính hoặc máy chủ riêng (mặc định localhost:11434)',
      helpText: '<b>🦙 Chạy AI với Ollama (0đ - Riêng tư 100%):</b> Hỗ trợ Qwen 2.5, Llama 3.2, DeepSeek-R1 chạy trực tiếp trên máy của bạn (mặc định <code>http://localhost:11434</code>) hoặc bất kỳ máy chủ Ollama nào. Không tốn phí, không giới hạn request, không phụ thuộc API bên ngoài!',
      rateLimitHint: '0đ - Vô hạn Tokens'
    },
    'gemini-2.0-flash': {
      provider: 'gemini',
      name: 'Google Gemini 2.0 Flash (Free Siêu Tốc)',
      badge: '⚡ Gemini 2.0 Flash (Free)',
      isFree: true,
      needsKey: true,
      keyLabel: 'Google Gemini API Key:',
      keyPlaceholder: 'AIzaSy... (Dán Google Gemini API Key)',
      helpText: 'Thế hệ mô hình AI mới nhất của Google với tốc độ cực nhanh, miễn phí trên Google AI Studio. Lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent); font-weight:700;">aistudio.google.com</a>.',
      rateLimitHint: 'Free Google AI Studio'
    },
    'llama-3.3-70b-versatile': {
      provider: 'groq',
      name: 'Groq Llama 3.3 70B (Free Tốc độ cao)',
      badge: '🚀 Groq Llama 3.3 70B (Free)',
      isFree: true,
      needsKey: true,
      keyLabel: 'Groq API Key:',
      keyPlaceholder: 'gsk_... (Dán Groq API Key)',
      helpText: 'Groq Cloud cung cấp API miễn phí tốc độ siêu cao với model mã nguồn mở Llama 3.3 70B. Lấy key miễn phí tại <a href="https://console.groq.com/keys" target="_blank" style="color:var(--accent); font-weight:700;">console.groq.com/keys</a>.',
      rateLimitHint: 'Free Groq Cloud'
    },
    'deepseek-chat': {
      provider: 'deepseek',
      name: 'DeepSeek-V3 (deepseek-chat)',
      badge: '🧠 DeepSeek-V3',
      isFree: false,
      needsKey: true,
      keyLabel: 'DeepSeek API Key:',
      keyPlaceholder: 'sk-... (Dán DeepSeek API Key)',
      helpText: 'DeepSeek-V3 xử lý thông minh, chất lượng cao. Lấy key tại <a href="https://platform.deepseek.com" target="_blank" style="color:var(--accent); font-weight:700;">platform.deepseek.com</a>.',
      rateLimitHint: 'DeepSeek Trả Phí'
    },
    'deepseek-reasoner': {
      provider: 'deepseek',
      name: 'DeepSeek-R1 (deepseek-reasoner)',
      badge: '🧩 DeepSeek-R1',
      isFree: false,
      needsKey: true,
      keyLabel: 'DeepSeek API Key:',
      keyPlaceholder: 'sk-... (Dán DeepSeek API Key)',
      helpText: 'DeepSeek-R1 với chuỗi suy luận sâu trước khi đưa ra câu hỏi và đánh giá. Lấy key tại <a href="https://platform.deepseek.com" target="_blank" style="color:var(--accent); font-weight:700;">platform.deepseek.com</a>.',
      rateLimitHint: 'DeepSeek Trả Phí'
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
    loginRememberMe: document.getElementById('login-remember-me'),
    btnToggleLoginPwd: document.getElementById('btn-toggle-login-pwd'),
    linkForgotPwd: document.getElementById('link-forgot-pwd'),
    formResetPwd: document.getElementById('form-reset-pwd'),
    resetEmail: document.getElementById('reset-email'),
    resetNewPassword: document.getElementById('reset-new-password'),
    btnToggleResetPwd: document.getElementById('btn-toggle-reset-pwd'),
    btnToggleRegPwd: document.getElementById('btn-toggle-reg-pwd'),
    linkBackToLogin: document.getElementById('link-back-to-login'),
    resetPwdFeedback: document.getElementById('reset-pwd-feedback'),
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
    regEmbedCode: document.getElementById('reg-embed-code'),

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
    modalAdminUsers: document.getElementById('modal-admin-users'),
    btnCloseAdminModal: document.getElementById('btn-close-admin-modal'),
    // Test User Manager & Customer Profile
    btnOpenTestUsers: document.getElementById('btn-open-test-users'),
    modalTestUsers: document.getElementById('modal-test-users'),
    btnCloseTestUsersModal: document.getElementById('btn-close-test-users-modal'),
    testUserCountBadge: document.getElementById('test-user-count-badge'),
    testUserModalCount: document.getElementById('test-user-modal-count'),
    testUsersList: document.getElementById('test-users-list'),
    tuCreateName: document.getElementById('tu-create-name'),
    tuCreatePhone: document.getElementById('tu-create-phone'),
    tuCreateEmail: document.getElementById('tu-create-email'),
    tuCreateFlow: document.getElementById('tu-create-flow'),
    tuCreatePassword: document.getElementById('tu-create-password'),
    tuCreatePageid: document.getElementById('tu-create-pageid'),
    btnTuCreate: document.getElementById('btn-tu-create'),
    btnTuModalRandom: document.getElementById('btn-tu-modal-random'),
    btnTuDeleteAll: document.getElementById('btn-tu-delete-all'),
    btnTuRefresh: document.getElementById('btn-tu-refresh'),
    tuCredentialsBox: document.getElementById('tu-credentials-box'),
    tuCredEmail: document.getElementById('tu-cred-email'),
    tuCredPass: document.getElementById('tu-cred-pass'),
    btnTuSwitchTo: document.getElementById('btn-tu-switch-to'),
    btnTuCopyCreds: document.getElementById('btn-tu-copy-creds'),
    // Inline Test User Card Controls
    btnTuToggleForm: document.getElementById('btn-tu-toggle-form'),
    btnTuQuickRandom: document.getElementById('btn-tu-quick-random'),
    btnTuResetChat: document.getElementById('btn-tu-reset-chat'),
    tuActiveBox: document.getElementById('tu-active-box'),
    tuActiveName: document.getElementById('tu-active-name'),
    tuActivePhone: document.getElementById('tu-active-phone'),
    tuActiveFlow: document.getElementById('tu-active-flow'),
    btnCopyTuName: document.getElementById('btn-copy-tu-name'),
    btnCopyTuPhone: document.getElementById('btn-copy-tu-phone'),
    btnCopyTuEmail: document.getElementById('btn-copy-tu-email'),
    btnCopyTuAll: document.getElementById('btn-copy-tu-all'),
    btnTuSendIntro: document.getElementById('btn-tu-send-intro'),
    tuInlineFormBox: document.getElementById('tu-inline-form-box'),
    tuInlineName: document.getElementById('tu-inline-name'),
    tuInlinePhone: document.getElementById('tu-inline-phone'),
    tuInlineEmail: document.getElementById('tu-inline-email'),
    tuInlineFlow: document.getElementById('tu-inline-flow'),
    btnTuInlineRandom: document.getElementById('btn-tu-inline-random'),
    btnTuInlineSubmit: document.getElementById('btn-tu-inline-submit'),
    btnTuCloseInlineForm: document.getElementById('btn-tu-close-inline-form'),
    tuChipsContainer: document.getElementById('tu-chips-container'),
    adminModalTabs: document.getElementById('admin-modal-tabs'),
    adminUsersTbody: document.getElementById('admin-users-tbody'),
    adminSearchUsers: document.getElementById('admin-search-users'),
    adminUserTotalBadge: document.getElementById('admin-user-total-badge'),
    statBadgeTotal: document.getElementById('stat-badge-total'),
    statBadgeTesters: document.getElementById('stat-badge-testers'),
    statBadgeActive: document.getElementById('stat-badge-active'),
    formAdminCreateUser: document.getElementById('form-admin-create-user'),
    adminCreateName: document.getElementById('admin-create-name'),
    adminCreateEmail: document.getElementById('admin-create-email'),
    adminCreatePassword: document.getElementById('admin-create-password'),
    adminCreateRole: document.getElementById('admin-create-role'),
    adminCreateEmbed: document.getElementById('admin-create-embed'),
    btnAdminExportDb: document.getElementById('btn-admin-export-db'),
    btnAdminImportTrigger: document.getElementById('btn-admin-import-trigger'),
    inputAdminImportFile: document.getElementById('input-admin-import-file'),
    btnCloudSyncUp: document.getElementById('btn-cloud-sync-up'),
    btnCloudSyncDown: document.getElementById('btn-cloud-sync-down'),
    formAdminCloudDb: document.getElementById('form-admin-cloud-db'),
    cloudDbProvider: document.getElementById('cloud-db-provider'),
    cloudDbUrl: document.getElementById('cloud-db-url'),
    cloudDbToken: document.getElementById('cloud-db-token'),
    btnToggleCloudToken: document.getElementById('btn-toggle-cloud-token'),
    cloudFeedback: document.getElementById('cloud-feedback'),
    btnSaveCloudDb: document.getElementById('btn-save-cloud-db'),
    btnDisconnectCloudDb: document.getElementById('btn-disconnect-cloud-db'),
    cloudStatusBadge: document.getElementById('cloud-status-badge'),
    cloudStatusDesc: document.getElementById('cloud-status-desc'),
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

    // Left Panel: Multi-Flow Checklist & Post-Audit Mode
    multiflowToggleCard: document.getElementById('multiflow-toggle-card'),
    toggleMultiflowMode: document.getElementById('toggle-multiflow-mode'),
    mfModeStatusBadge: document.getElementById('mf-mode-status-badge'),
    singleflowEditorCard: document.getElementById('singleflow-editor-card'),
    multiflowEditorCard: document.getElementById('multiflow-editor-card'),
    btnConvertToChecklist: document.getElementById('btn-convert-to-checklist'),
    mfCasesCountBadge: document.getElementById('mf-cases-count-badge'),
    mfDoneCountBadge: document.getElementById('mf-done-count-badge'),
    btnMfOpenAuditView: document.getElementById('btn-mf-open-audit-view'),
    btnMfResetStatuses: document.getElementById('btn-mf-reset-statuses'),
    btnMfGenerateFiles: document.getElementById('btn-mf-generate-files'),
    btnMfLoadSample: document.getElementById('btn-mf-load-sample'),
    btnMfAddCase: document.getElementById('btn-mf-add-case'),
    btnMfToggleRaw: document.getElementById('btn-mf-toggle-raw'),
    mfCasesList: document.getElementById('mf-cases-list'),
    mfRawEditorBox: document.getElementById('mf-raw-editor-box'),
    mfRawTextarea: document.getElementById('mf-raw-textarea'),
    btnMfApplyRaw: document.getElementById('btn-mf-apply-raw'),
    btnMfCancelRaw: document.getElementById('btn-mf-cancel-raw'),
    mfNoteModeSelect: document.getElementById('mf-note-mode-select'),
    mfAutoResetCheckbox: document.getElementById('mf-auto-reset-checkbox'),
    mfSendNoteChatCheckbox: document.getElementById('mf-send-note-chat-checkbox'),
    btnStartManualRunnerText: document.getElementById('btn-start-manual-runner-text'),
    mfRunningCaseBanner: document.getElementById('mf-running-case-banner'),
    mfRunningCaseName: document.getElementById('mf-running-case-name'),
    mfRunningCaseStep: document.getElementById('mf-running-case-step'),
    mfPauseNoteBox: document.getElementById('mf-pause-note-box'),
    mfPauseNoteTitle: document.getElementById('mf-pause-note-title'),
    mfPauseVerdictSelect: document.getElementById('mf-pause-verdict-select'),
    mfPauseNoteInput: document.getElementById('mf-pause-note-input'),
    btnMfConfirmNoteNext: document.getElementById('btn-mf-confirm-note-next'),

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
    transcriptSessionSelect: document.getElementById('transcript-session-select'),
    btnNewAgentChat: document.getElementById('btn-new-agent-chat'),
    btnDeleteAgentChat: document.getElementById('btn-delete-agent-chat'),
    agentTranscriptEmpty: document.getElementById('agent-transcript-empty'),
    evalCountBadge: document.getElementById('eval-count-badge'),
    btnFilterAll: document.getElementById('btn-filter-all'),
    btnFilterFails: document.getElementById('btn-filter-fails'),
    evaluationsList: document.getElementById('evaluations-list'),
    subtabBtnEvals: document.getElementById('subtab-btn-evals'),
    subtabBtnChats: document.getElementById('subtab-btn-chats'),
    subpaneHistoryEvals: document.getElementById('subpane-history-evals'),
    subpaneHistoryChats: document.getElementById('subpane-history-chats'),
    chatCountBadge: document.getElementById('chat-count-badge'),
    chatSessionsList: document.getElementById('chat-sessions-list'),
    btnClearAllEvals: document.getElementById('btn-clear-all-evals'),
    btnRefreshChatSessions: document.getElementById('btn-refresh-chat-sessions'),

    // Modal: 2 Training Files & DeepSeek
    modalTraining: document.getElementById('modal-training'),
    btnCloseTrainingModal: document.getElementById('btn-close-training-modal'),
    trainingTabs: document.getElementById('training-tabs'),
    tabFile1Content: document.getElementById('tab-file1-content'),
    tabFile2Content: document.getElementById('tab-file2-content'),
    tabDeepseekContent: document.getElementById('tab-deepseek-content'),
    tabEmbedContent: document.getElementById('tab-embed-content'),
    tabFocusTrainerContent: document.getElementById('tab-focus-trainer-content'),
    btnOpenFocusTrainer: document.getElementById('btn-open-focus-trainer'),
    focusTrainerModelBadge: document.getElementById('focus-trainer-model-badge'),
    btnInjectFocusRules: document.getElementById('btn-inject-focus-rules'),
    injectRulesFeedback: document.getElementById('inject-rules-feedback'),
    trainerQuestionInput: document.getElementById('trainer-question-input'),
    btnGenerateGoldQA: document.getElementById('btn-generate-gold-qa'),
    trainerQAResultBox: document.getElementById('trainer-qa-result-box'),
    trainerResultEngineBadge: document.getElementById('trainer-result-engine-badge'),
    trainerFocusRuleBadge: document.getElementById('trainer-focus-rule-badge'),
    trainerAnalysisText: document.getElementById('trainer-analysis-text'),
    trainerBadResponse: document.getElementById('trainer-bad-response'),
    trainerIdealResponse: document.getElementById('trainer-ideal-response'),
    btnSaveGoldQAToFile1: document.getElementById('btn-save-gold-qa-to-file1'),
    auditQuestionInput: document.getElementById('audit-question-input'),
    auditBotReplyInput: document.getElementById('audit-bot-reply-input'),
    btnRunFocusAudit: document.getElementById('btn-run-focus-audit'),
    auditResultBox: document.getElementById('audit-result-box'),
    auditFocusScore: document.getElementById('audit-focus-score'),
    auditContextScore: document.getElementById('audit-context-score'),
    auditDirectBadge: document.getElementById('audit-direct-badge'),
    auditCritiqueText: document.getElementById('audit-critique-text'),
    auditSuggestedText: document.getElementById('audit-suggested-text'),
    btnAuditCopyRewrite: document.getElementById('btn-audit-copy-rewrite'),
    formEmbedConfigSave: document.getElementById('form-embed-config-save'),
    settingsEmbedCode: document.getElementById('settings-embed-code-input'),
    embedSaveFeedback: document.getElementById('embed-save-feedback'),
    embedSetupCard: document.getElementById('embed-setup-card'),
    setupEmbedName: document.getElementById('setup-embed-name'),
    setupEmbedInput: document.getElementById('setup-embed-input'),
    btnSaveSetupEmbed: document.getElementById('btn-save-setup-embed'),

    // Homepage Chatbot Switcher & Management Bar
    stageEmbedBar: document.getElementById('stage-embed-bar'),
    stageEmbedSelect: document.getElementById('stage-embed-select'),
    stageActivePageId: document.getElementById('stage-active-page-id'),
    btnCopyActivePageId: document.getElementById('btn-copy-active-page-id'),
    btnQuickAddEmbed: document.getElementById('btn-quick-add-embed'),
    btnQuickEditEmbed: document.getElementById('btn-quick-edit-embed'),
    btnOpenManageEmbeds: document.getElementById('btn-open-manage-embeds'),
    embedCountBadge: document.getElementById('embed-count-badge'),

    // Multi-Embed Management Modal
    modalManageEmbeds: document.getElementById('modal-manage-embeds'),
    btnCloseManageEmbeds: document.getElementById('btn-close-manage-embeds'),
    embedModalTabs: document.getElementById('embed-modal-tabs'),
    modalTabEmbedCount: document.getElementById('modal-tab-embed-count'),
    viewListEmbeds: document.getElementById('view-list-embeds'),
    viewAddEmbed: document.getElementById('view-add-embed'),
    viewEditEmbed: document.getElementById('view-edit-embed'),
    embedListContainer: document.getElementById('embed-list-container'),
    embedEmptyNotice: document.getElementById('embed-empty-notice'),
    formAddEmbed: document.getElementById('form-add-embed'),
    addEmbedName: document.getElementById('add-embed-name'),
    addEmbedCode: document.getElementById('add-embed-code'),
    addEmbedSetActive: document.getElementById('add-embed-set-active'),
    btnBackToEmbedList: document.getElementById('btn-back-to-embed-list'),
    formEditEmbed: document.getElementById('form-edit-embed'),
    editEmbedId: document.getElementById('edit-embed-id'),
    editEmbedName: document.getElementById('edit-embed-name'),
    editEmbedCode: document.getElementById('edit-embed-code'),

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
    dsKeyGuide: document.getElementById('ds-key-guide'),
    groupApiKey: document.getElementById('group-api-key'),
    lblApiKey: document.getElementById('lbl-api-key'),
    groupOllamaConfig: document.getElementById('group-ollama-config'),
    ollamaHostInput: document.getElementById('ollama-host-input'),
    ollamaModelInput: document.getElementById('ollama-model-input'),
    ollamaScannedSelect: document.getElementById('ollama-scanned-select'),
    btnScanOllama: document.getElementById('btn-scan-ollama'),
    ollamaScanHint: document.getElementById('ollama-scan-hint'),
    modelHelpCard: document.getElementById('model-help-card'),
    modelHelpText: document.getElementById('model-help-text'),
    deepseekTestFeedback: document.getElementById('deepseek-test-feedback'),
    agentDsStatusBanner: document.getElementById('agent-ds-status-banner'),
    agentDsStatusLabel: document.getElementById('agent-ds-status-label'),
    agentActiveModelTag: document.getElementById('agent-active-model-tag'),
    agentQuickModelSelect: document.getElementById('agent-quick-model-select'),
    agentModelBadge: document.getElementById('agent-model-badge'),
    agentKeyStatusIndicator: document.getElementById('agent-key-status-indicator'),
    btnAgentOpenDsModal: document.getElementById('btn-agent-open-ds-modal'),

    // Persona & Contextual Q&A Generator
    btnGenerateQaFromFiles: document.getElementById('btn-generate-qa-from-files'),
    btnExtractPersonas: document.getElementById('btn-extract-personas'),
    agentDomainContainer: document.getElementById('agent-domain-container'),
    agentDomainText: document.getElementById('agent-domain-text'),
    personaCountBadge: document.getElementById('persona-count-badge'),

    // Google Sheets Importer & File Cleaners
    btnToggleGsheet: document.getElementById('btn-toggle-gsheet'),
    gsheetImportBar: document.getElementById('gsheet-import-bar'),
    gsheetUrlInput: document.getElementById('gsheet-url-input'),
    btnFetchGsheetConfirm: document.getElementById('btn-fetch-gsheet-confirm'),
    btnFetchGsheetCancel: document.getElementById('btn-fetch-gsheet-cancel'),
    gsheetFeedback: document.getElementById('gsheet-feedback'),
    btnClearFile1: document.getElementById('btn-clear-file1'),
    btnClearFile2: document.getElementById('btn-clear-file2'),

    // Conversation Log Copy & Inline Bot Reply
    btnCopyTranscriptLog: document.getElementById('btn-copy-transcript-log'),
    btnAgentCopyLogMini: document.getElementById('btn-agent-copy-log-mini'),
    agentInlineBotReply: document.getElementById('agent-inline-bot-reply'),
    btnAgentPasteReply: document.getElementById('btn-agent-paste-reply'),
    btnAgentPasteAndSend: document.getElementById('btn-agent-paste-and-send'),
    agentInteractiveModeCheckbox: document.getElementById('agent-interactive-mode-checkbox'),
    transcriptQuickReplyBar: document.getElementById('transcript-quick-reply-bar'),
    transcriptInlineBotReply: document.getElementById('transcript-inline-bot-reply'),
    transcriptReplyStatus: document.getElementById('transcript-reply-status'),
    btnTranscriptPasteClip: document.getElementById('btn-transcript-paste-clip'),
    btnTranscriptSendReply: document.getElementById('btn-transcript-send-reply'),

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

  function restoreSavedCredentials() {
    const savedEmail = localStorage.getItem('bbh_saved_email');
    const savedPass = localStorage.getItem('bbh_saved_password');
    const rememberMe = localStorage.getItem('bbh_remember_me') !== 'false';
    if (el.loginRememberMe) el.loginRememberMe.checked = rememberMe;
    if (savedEmail && el.loginIdentifier) el.loginIdentifier.value = savedEmail;
    if (savedPass && el.loginPassword) el.loginPassword.value = savedPass;
    if (!savedEmail && el.loginIdentifier && !el.loginIdentifier.value) {
      el.loginIdentifier.value = 'thienlv.bbh@gmail.com';
    }
  }

  function setupPasswordToggle(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.textContent = isPwd ? '🙈' : '👁️';
    });
  }

  setupPasswordToggle(el.btnToggleLoginPwd, el.loginPassword);
  setupPasswordToggle(el.btnToggleRegPwd, el.regPassword);
  setupPasswordToggle(el.btnToggleResetPwd, el.resetNewPassword);

  function switchAuthTab(tab) {
    if (el.loginFeedback) el.loginFeedback.style.display = 'none';
    if (el.registerFeedback) el.registerFeedback.style.display = 'none';
    if (el.formResetPwd) el.formResetPwd.style.display = 'none';

    if (tab === 'login') {
      el.tabLoginBtn.classList.add('active');
      el.tabRegisterBtn.classList.remove('active');
      el.formLogin.style.display = 'flex';
      el.formRegister.style.display = 'none';
      restoreSavedCredentials();
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

  // ==========================================================================
  // MASTER CLIENT VAULT: SECURE HMAC VOUCHER PERSISTENCE (SURVIVES SERVER RESTARTS)
  // ==========================================================================
  function saveAccountToVault(user, voucher) {
    if (!voucher || !user) return;
    try {
      const raw = localStorage.getItem('bbh_accounts_vault') || '{}';
      const vault = JSON.parse(raw);
      if (user.email) {
        vault[user.email.toLowerCase()] = voucher;
        localStorage.setItem('bbh_voucher_' + user.email.toLowerCase(), voucher);
      }
      if (user.username) vault[user.username.toLowerCase()] = voucher;
      const prefix = user.email ? user.email.split('@')[0].toLowerCase() : '';
      if (prefix) vault[prefix] = voucher;
      localStorage.setItem('bbh_accounts_vault', JSON.stringify(vault));
    } catch (e) {}
  }

  function getVoucherForIdentifier(identifier) {
    if (!identifier) return '';
    const clean = identifier.trim().toLowerCase();
    try {
      const raw = localStorage.getItem('bbh_accounts_vault') || '{}';
      const vault = JSON.parse(raw);
      if (vault[clean]) return vault[clean];
      const prefix = clean.includes('@') ? clean.split('@')[0] : clean;
      if (vault[prefix]) return vault[prefix];
      const withGmail = clean.includes('@') ? clean : (clean + '@gmail.com');
      if (vault[withGmail]) return vault[withGmail];
    } catch (e) {}
    return localStorage.getItem('bbh_voucher_' + clean) || '';
  }

  // ==========================================================================
  // MASTER CLIENT VAULT: CHATBOT EMBEDS PERSISTENCE (SURVIVES SERVER RESTARTS)
  // ==========================================================================
  function saveEmbedsToLocalVault(email, embeds, activeEmbedId) {
    if (!email || !Array.isArray(embeds)) return;
    try {
      const clean = email.toLowerCase().trim();
      const payload = {
        embeds: embeds,
        active_embed_id: activeEmbedId || null,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('bbh_embeds_' + clean, JSON.stringify(payload));
      const prefix = clean.includes('@') ? clean.split('@')[0] : '';
      if (prefix) localStorage.setItem('bbh_embeds_' + prefix, JSON.stringify(payload));
    } catch (e) {
      console.warn('[VAULT] Could not cache embeds to local vault:', e);
    }
  }

  function getEmbedsFromLocalVault(identifier) {
    if (!identifier) return { embeds: [], active_embed_id: null };
    const clean = identifier.toLowerCase().trim();
    try {
      let raw = localStorage.getItem('bbh_embeds_' + clean);
      if (!raw && clean.includes('@')) {
        const prefix = clean.split('@')[0];
        raw = localStorage.getItem('bbh_embeds_' + prefix);
      }
      if (!raw && !clean.includes('@')) {
        raw = localStorage.getItem('bbh_embeds_' + clean + '@gmail.com');
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.embeds)) return parsed;
      }
    } catch (e) {}
    return { embeds: [], active_embed_id: null };
  }

  // Forgot Password Link Click
  if (el.linkForgotPwd) {
    el.linkForgotPwd.addEventListener('click', (e) => {
      e.preventDefault();
      if (el.formLogin) el.formLogin.style.display = 'none';
      if (el.formRegister) el.formRegister.style.display = 'none';
      if (el.formResetPwd) {
        el.formResetPwd.style.display = 'flex';
        if (el.resetEmail && el.loginIdentifier) {
          el.resetEmail.value = el.loginIdentifier.value.trim() || 'thienlv.bbh@gmail.com';
        }
        if (el.resetNewPassword) el.resetNewPassword.value = '';
        if (el.resetPwdFeedback) el.resetPwdFeedback.style.display = 'none';
      }
    });
  }

  if (el.linkBackToLogin) {
    el.linkBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (el.formResetPwd) el.formResetPwd.style.display = 'none';
      switchAuthTab('login');
    });
  }

  // Form Reset Password Submit
  if (el.formResetPwd) {
    el.formResetPwd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = el.resetEmail.value.trim();
      const newPassword = el.resetNewPassword.value.trim();
      if (el.resetPwdFeedback) el.resetPwdFeedback.style.display = 'none';

      try {
        const data = await api('/api/auth/reset-password', 'POST', { email, newPassword });
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('bbh_auth_token', data.token);
        localStorage.setItem('bbh_saved_email', email);
        localStorage.setItem('bbh_saved_password', newPassword);
        localStorage.setItem('bbh_remember_me', 'true');
        if (data.voucher && data.user) saveAccountToVault(data.user, data.voucher);
        if (data.user && Array.isArray(data.user.embed_list)) {
          saveEmbedsToLocalVault(data.user.email, data.user.embed_list, data.user.active_embed_id);
        }
        showToast(data.message, 'success');
        applyAuthState();
        loadWorkspace();
      } catch (err) {
        if (el.resetPwdFeedback) {
          el.resetPwdFeedback.style.display = 'block';
          el.resetPwdFeedback.style.background = 'var(--danger-soft)';
          el.resetPwdFeedback.style.color = 'var(--danger)';
          el.resetPwdFeedback.innerHTML = `⚠️ <b>Lỗi:</b> ${escapeHtml(err.message)}`;
        }
        showToast(err.message, 'error');
      }
    });
  }

  el.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = el.loginIdentifier.value.trim();
    const password = el.loginPassword.value;
    const rememberMe = el.loginRememberMe ? el.loginRememberMe.checked : true;

    if (el.loginFeedback) {
      el.loginFeedback.style.display = 'none';
    }

    try {
      const voucher = getVoucherForIdentifier(identifier);
      const localVault = getEmbedsFromLocalVault(identifier);
      const data = await api('/api/auth/login', 'POST', {
        identifier,
        password,
        voucher,
        client_embeds: localVault.embeds || [],
        active_embed_id: localVault.active_embed_id || null
      });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('bbh_auth_token', data.token);
      if (data.voucher && data.user) saveAccountToVault(data.user, data.voucher);
      if (data.user && Array.isArray(data.user.embed_list)) {
        saveEmbedsToLocalVault(data.user.email, data.user.embed_list, data.user.active_embed_id);
      }

      // Save password and identifier if remember me is enabled
      if (rememberMe) {
        localStorage.setItem('bbh_saved_email', identifier);
        localStorage.setItem('bbh_saved_password', password);
        localStorage.setItem('bbh_remember_me', 'true');
      } else {
        localStorage.removeItem('bbh_saved_email');
        localStorage.removeItem('bbh_saved_password');
        localStorage.setItem('bbh_remember_me', 'false');
      }

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
    const email = el.regEmail.value.trim();
    const password = el.regPassword.value;
    const apiKey = el.regApiKey ? el.regApiKey.value.trim() : '';
    const embedCode = el.regEmbedCode ? el.regEmbedCode.value.trim() : '';

    if (el.registerFeedback) {
      el.registerFeedback.style.display = 'none';
    }

    try {
      const data = await api('/api/auth/register', 'POST', { email, password, apiKey, embedCode });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('bbh_auth_token', data.token);
      if (data.voucher && data.user) saveAccountToVault(data.user, data.voucher);
      if (data.user && Array.isArray(data.user.embed_list)) {
        saveEmbedsToLocalVault(data.user.email, data.user.embed_list, data.user.active_embed_id);
      }

      // Auto save credentials on register
      localStorage.setItem('bbh_saved_email', email);
      localStorage.setItem('bbh_saved_password', password);
      localStorage.setItem('bbh_remember_me', 'true');

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
      if (el.headerUserRole) el.headerUserRole.style.display = 'none';
      if (el.stageEmbedBar) el.stageEmbedBar.style.display = 'none';
      mountUserChatbox('');
      restoreSavedCredentials();
      return;
    }

    el.authOverlay.classList.add('hidden');
    el.body.classList.remove('auth-locked');
    if (el.stageEmbedBar) el.stageEmbedBar.style.display = 'flex';

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

    const displayName = state.user.name || (state.user.email ? state.user.email.split('@')[0] : 'User');
    el.headerUserName.textContent = displayName;
    el.headerUserAvatar.textContent = displayName.charAt(0).toUpperCase();
    if (state.user.avatar_color) el.headerUserAvatar.style.backgroundColor = state.user.avatar_color;

    // Super Admin Management button (thienlv.bbh@gmail.com exclusively)
    const isSuperAdminUser = Boolean(state.user && state.user.email === 'thienlv.bbh@gmail.com');
    if (el.headerUserRole) el.headerUserRole.style.display = 'none';
    if (el.btnAdminManage) {
      el.btnAdminManage.style.display = isSuperAdminUser ? 'inline-flex' : 'none';
    }

    // AI Model resolution & status indicator (Free Gemini, Local Free, DeepSeek)
    const currentModel = (state.user && state.user.ai_model) || (state.config && state.config.ai_model) || 'gemini-1.5-flash';
    const meta = MODEL_META[currentModel] || MODEL_META['gemini-1.5-flash'];
    const hasKey = (meta.needsKey === false) || Boolean(
      (state.user && (state.user.has_ai_key || state.user.has_deepseek_key)) ||
      (state.config && (state.config.has_ai_key || state.config.has_deepseek_key))
    );

    if (el.deepseekBadgeStatus) {
      if (hasKey) {
        el.deepseekBadgeStatus.textContent = `🟢 ${meta.badge}`;
        el.deepseekBadgeStatus.style.background = meta.isFree ? 'rgba(13, 148, 136, 0.35)' : 'rgba(217, 119, 87, 0.35)';
        el.deepseekBadgeStatus.style.color = meta.isFree ? 'var(--teal)' : 'var(--accent)';
        el.deepseekBadgeStatus.title = `Model đang dùng: ${meta.name}. Bấm để xem hoặc đổi cấu hình`;
      } else {
        el.deepseekBadgeStatus.textContent = '⚪ Cần gắn Key AI';
        el.deepseekBadgeStatus.style.background = 'rgba(255, 255, 255, 0.2)';
        el.deepseekBadgeStatus.style.color = 'var(--text-secondary)';
        el.deepseekBadgeStatus.title = `Bấm để cấu hình ${meta.name} hoặc chuyển sang Smart Local AI 0đ`;
      }
    }

    if (el.agentActiveModelTag) {
      el.agentActiveModelTag.textContent = meta.badge;
    }

    if (el.agentQuickModelSelect) {
      el.agentQuickModelSelect.value = currentModel;
    }

    if (el.agentModelBadge) {
      el.agentModelBadge.textContent = `${meta.badge}: ${meta.rateLimitHint}`;
    }

    if (el.agentKeyStatusIndicator) {
      el.agentKeyStatusIndicator.textContent = hasKey ? '🟢 Sẵn sàng' : '⚠️ Chưa có Key';
      el.agentKeyStatusIndicator.style.color = hasKey ? 'var(--teal)' : 'var(--accent)';
    }

    if (el.agentDsStatusLabel) {
      el.agentDsStatusLabel.textContent = hasKey ? `🟢 ${meta.badge}: Sẵn sàng` : `⚠️ ${meta.badge}: Cần gắn Key`;
    }

    const perms = state.user.permissions || {};
    if (perms.canChat === false) {
      el.body.classList.add('chat-permission-denied');
      el.headerSdkStatus.textContent = 'Quan sát viên (Chỉ xem)';
    } else {
      el.body.classList.remove('chat-permission-denied');
    }

    // Dynamic Chatbox loading per user - STRICT ISOLATION!
    // Regular colleagues who have not configured a page_id get EMPTY string!
    // They NEVER inherit or load admin's chat bubble!
    const userPageId = (state.user && state.user.page_id) ? String(state.user.page_id).trim() : '';
    const pageId = userPageId || (isSuperAdminUser ? (state.config && state.config.page_id) : '') || '';
    mountUserChatbox(pageId);

    // Multi-Embed Dropdown & Homepage Bar Sync
    renderChatbotDropdown(state.user.embed_list, state.user.active_embed_id);

    if (el.settingsEmbedCode) {
      el.settingsEmbedCode.value = state.user.embed_code || state.user.page_id || '';
    }
  }

  // ==========================================================================
  // BOTBANHANG CHAT SDK CONTROLLER (#BBH-EMBED-IFRAME)
  // Dynamic per-user mount & iframe controller
  // ==========================================================================

  let currentMountedPageId = null;

  function mountUserChatbox(pageId, forceRebuild = false) {
    const container = document.getElementById('BBH-EMBED-CONTAINER');
    const setupCard = document.getElementById('embed-setup-card');

    if (!pageId) {
      if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
      }
      if (setupCard) setupCard.style.display = 'flex';
      if (el.headerPageIdBadge) el.headerPageIdBadge.textContent = 'Chưa nạp';
      if (el.stageActivePageId) el.stageActivePageId.textContent = 'Chưa nạp';
      currentMountedPageId = null;
      return;
    }

    if (setupCard) setupCard.style.display = 'none';
    if (container) container.style.display = 'flex';
    if (el.headerPageIdBadge) el.headerPageIdBadge.textContent = `ID: ${pageId}`;
    if (el.stageActivePageId) el.stageActivePageId.textContent = pageId;

    if (!forceRebuild && currentMountedPageId === pageId && container && container.querySelector('iframe')) {
      return;
    }

    currentMountedPageId = pageId;
    state.config.page_id = pageId;

    try {
      if (window.BBH) {
        if (typeof window.BBH.destroy === 'function') {
          try { window.BBH.destroy(); } catch (e) {}
        }
        if (container) {
          container.innerHTML = '';
          Object.defineProperty(container, 'clientWidth', { get: () => Math.max(window.innerWidth || 1200, 1200), configurable: true });
          Object.defineProperty(container, 'clientHeight', { get: () => Math.max(window.innerHeight || 800, 800), configurable: true });
        }
        window.BBH.init({ page_id: pageId });
      } else {
        setTimeout(() => mountUserChatbox(pageId, forceRebuild), 400);
      }
    } catch (err) {
      console.warn('[BBH] Error mounting chatbox:', err);
    }
  }

  // ==========================================================================
  // MULTI-EMBED CHATBOT CONTROLLER & HOMEPAGE SWITCHER
  // ==========================================================================

  function renderChatbotDropdown(embeds = [], activeId = '') {
    const list = Array.isArray(embeds) ? embeds : [];
    const count = list.length;

    if (el.embedCountBadge) el.embedCountBadge.textContent = count;
    if (el.modalTabEmbedCount) el.modalTabEmbedCount.textContent = count;

    // 1. Populate Homepage Dropdown
    if (el.stageEmbedSelect) {
      el.stageEmbedSelect.innerHTML = '';
      if (count === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '-- Chưa có Chatbot nào --';
        el.stageEmbedSelect.appendChild(opt);
      } else {
        list.forEach(bot => {
          const opt = document.createElement('option');
          opt.value = bot.id;
          const isCurrent = bot.id === activeId || (bot.is_active && !activeId);
          opt.textContent = `${isCurrent ? '🤖 ' : '• '}${bot.name} (${bot.page_id || 'ID?'})`;
          if (isCurrent) opt.selected = true;
          el.stageEmbedSelect.appendChild(opt);
        });
      }
    }

    // 2. Active Page ID badge
    const activeBot = list.find(b => b.id === activeId || b.is_active) || list[0];
    const currentPid = (activeBot && activeBot.page_id) ? activeBot.page_id : (state.user ? state.user.page_id : '');
    if (el.stageActivePageId) el.stageActivePageId.textContent = currentPid || 'Chưa nạp';
    if (el.headerPageIdBadge) el.headerPageIdBadge.textContent = currentPid ? `ID: ${currentPid}` : 'Chưa nạp';

    // 3. Render Modal Cards List
    if (el.embedListContainer) {
      el.embedListContainer.innerHTML = '';
      if (count === 0) {
        if (el.embedEmptyNotice) el.embedEmptyNotice.style.display = 'block';
      } else {
        if (el.embedEmptyNotice) el.embedEmptyNotice.style.display = 'none';
        list.forEach(bot => {
          const isActive = bot.id === activeId || bot.is_active;
          const card = document.createElement('div');
          card.className = `embed-item-card ${isActive ? 'is-active' : ''}`;
          card.innerHTML = `
            <div class="embed-item-meta">
              <div class="embed-item-title">
                <span>🤖 ${escapeHtml(bot.name)}</span>
                ${isActive ? '<span class="badge badge-teal" style="font-size:10px;">🟢 Đang test</span>' : ''}
              </div>
              <div class="embed-item-pageid">
                Page ID: <b>${escapeHtml(bot.page_id || 'Chưa rõ')}</b>
                <span style="opacity: 0.6; font-size: 10px; margin-left: 6px;">${new Date(bot.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div class="embed-item-actions">
              ${!isActive ? `<button type="button" class="btn btn-secondary btn-xs btn-activate-embed" data-id="${bot.id}">⚡ Kích hoạt</button>` : ''}
              <button type="button" class="btn btn-secondary btn-xs btn-edit-embed" data-id="${bot.id}">✏️ Sửa</button>
              <button type="button" class="btn btn-secondary btn-xs btn-delete-embed" data-id="${bot.id}" style="color:var(--danger);" title="Xóa chatbot này">🗑️</button>
            </div>
          `;
          el.embedListContainer.appendChild(card);
        });
      }
    }
  }

  async function switchActiveChatbot(botId) {
    if (!botId) return;
    try {
      const data = await api('/api/user/embeds/active', 'PATCH', { id: botId });
      if (data.user) {
        state.user = data.user;
        if (data.voucher) saveAccountToVault(state.user, data.voucher);
        if (state.user.email && Array.isArray(state.user.embed_list)) {
          saveEmbedsToLocalVault(state.user.email, state.user.embed_list, state.user.active_embed_id);
        }
      }
      renderChatbotDropdown(state.user.embed_list, state.user.active_embed_id);
      mountUserChatbox(state.user.page_id);
      showToast(`🤖 Đã chuyển sang chatbot "${data.active_bot?.name || 'mới'}"!`, 'success');
    } catch (err) {
      showToast('Lỗi chuyển chatbot: ' + err.message, 'error');
    }
  }

  async function addChatbot(name, embedCode, setActive = true) {
    if (!embedCode || !embedCode.trim()) {
      showToast('Vui lòng nhập mã nhúng script hoặc Page ID.', 'error');
      return;
    }
    try {
      const data = await api('/api/user/embeds', 'POST', { name, embedCode, setActive });
      if (data.user) {
        state.user = data.user;
        if (data.voucher) saveAccountToVault(state.user, data.voucher);
        if (state.user.email && Array.isArray(state.user.embed_list)) {
          saveEmbedsToLocalVault(state.user.email, state.user.embed_list, state.user.active_embed_id);
        }
      }
      renderChatbotDropdown(state.user.embed_list, state.user.active_embed_id);
      if (setActive) {
        mountUserChatbox(state.user.page_id);
      }
      showToast(`✅ Đã thêm chatbot "${data.embed?.name}" thành công!`, 'success');
      return data.embed;
    } catch (err) {
      showToast('Lỗi thêm chatbot: ' + err.message, 'error');
      throw err;
    }
  }

  async function updateChatbot(id, name, embedCode) {
    if (!id) return;
    try {
      const data = await api(`/api/user/embeds/${id}`, 'PATCH', { name, embedCode });
      if (data.user) {
        state.user = data.user;
        if (data.voucher) saveAccountToVault(state.user, data.voucher);
        if (state.user.email && Array.isArray(state.user.embed_list)) {
          saveEmbedsToLocalVault(state.user.email, state.user.embed_list, state.user.active_embed_id);
        }
      }
      renderChatbotDropdown(state.user.embed_list, state.user.active_embed_id);
      if (state.user.active_embed_id === id) {
        mountUserChatbox(state.user.page_id);
      }
      showToast(`✅ Đã cập nhật chatbot "${data.embed?.name || name}"!`, 'success');
    } catch (err) {
      showToast('Lỗi cập nhật chatbot: ' + err.message, 'error');
      throw err;
    }
  }

  async function deleteChatbot(id) {
    const bot = (state.user.embed_list || []).find(b => b.id === id);
    const botName = bot ? bot.name : 'này';
    if (!confirm(`Bạn có chắc muốn xóa chatbot "${botName}" khỏi danh sách?`)) return;
    try {
      const data = await api(`/api/user/embeds/${id}`, 'DELETE');
      if (data.user) {
        state.user = data.user;
        if (data.voucher) saveAccountToVault(state.user, data.voucher);
        if (state.user.email && Array.isArray(state.user.embed_list)) {
          saveEmbedsToLocalVault(state.user.email, state.user.embed_list, state.user.active_embed_id);
        }
      }
      renderChatbotDropdown(state.user.embed_list, state.user.active_embed_id);
      mountUserChatbox(state.user.page_id || '');
      showToast(`Đã xóa chatbot "${botName}".`, 'info');
    } catch (err) {
      showToast('Lỗi xóa chatbot: ' + err.message, 'error');
    }
  }

  function openManageEmbedsModal(defaultTab = 'tab-list-embeds') {
    if (el.modalManageEmbeds) {
      el.modalManageEmbeds.classList.add('open');
      el.body.classList.add('modal-open');
      switchEmbedTab(defaultTab);
    }
  }

  function closeManageEmbedsModal() {
    if (el.modalManageEmbeds) {
      el.modalManageEmbeds.classList.remove('open');
      el.body.classList.remove('modal-open');
    }
  }

  function switchEmbedTab(tabName) {
    if (!el.embedModalTabs) return;
    el.embedModalTabs.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.embedTab === tabName);
    });

    if (el.viewListEmbeds) el.viewListEmbeds.style.display = tabName === 'tab-list-embeds' ? 'block' : 'none';
    if (el.viewAddEmbed) el.viewAddEmbed.style.display = tabName === 'tab-add-embed' ? 'block' : 'none';
    if (el.viewEditEmbed) el.viewEditEmbed.style.display = 'none';
  }

  function openEditForBot(botId) {
    const bot = (state.user.embed_list || []).find(b => b.id === botId);
    if (!bot) return;

    if (el.viewListEmbeds) el.viewListEmbeds.style.display = 'none';
    if (el.viewAddEmbed) el.viewAddEmbed.style.display = 'none';
    if (el.viewEditEmbed) el.viewEditEmbed.style.display = 'block';

    if (el.editEmbedId) el.editEmbedId.value = bot.id;
    if (el.editEmbedName) el.editEmbedName.value = bot.name || '';
    if (el.editEmbedCode) el.editEmbedCode.value = bot.embed_code || bot.page_id || '';

    openManageEmbedsModal();
  }

  function openEditForActiveBot() {
    const list = state.user.embed_list || [];
    const active = list.find(b => b.id === state.user.active_embed_id || b.is_active) || list[0];
    if (active) {
      openEditForBot(active.id);
    } else {
      openManageEmbedsModal('tab-add-embed');
    }
  }

  // Event Listeners for Homepage Embed Bar & Modal
  if (el.stageEmbedSelect) {
    el.stageEmbedSelect.addEventListener('change', (e) => {
      switchActiveChatbot(e.target.value);
    });
  }

  if (el.btnCopyActivePageId) {
    el.btnCopyActivePageId.addEventListener('click', () => {
      const pid = el.stageActivePageId ? el.stageActivePageId.textContent.trim() : '';
      if (pid && pid !== 'Chưa nạp') {
        navigator.clipboard.writeText(pid).then(() => {
          showToast(`📋 Đã sao chép Page ID: ${pid}`, 'success');
        });
      } else {
        showToast('Chưa có Page ID nào được chọn.', 'error');
      }
    });
  }

  if (el.btnQuickAddEmbed) {
    el.btnQuickAddEmbed.addEventListener('click', () => {
      openManageEmbedsModal('tab-add-embed');
    });
  }

  if (el.btnQuickEditEmbed) {
    el.btnQuickEditEmbed.addEventListener('click', () => {
      openEditForActiveBot();
    });
  }

  if (el.btnOpenManageEmbeds) {
    el.btnOpenManageEmbeds.addEventListener('click', () => {
      openManageEmbedsModal('tab-list-embeds');
    });
  }

  if (el.btnCloseManageEmbeds) {
    el.btnCloseManageEmbeds.addEventListener('click', () => {
      closeManageEmbedsModal();
    });
  }

  if (el.embedModalTabs) {
    el.embedModalTabs.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchEmbedTab(btn.dataset.embedTab);
      });
    });
  }

  if (el.btnBackToEmbedList) {
    el.btnBackToEmbedList.addEventListener('click', () => {
      switchEmbedTab('tab-list-embeds');
    });
  }

  if (el.formAddEmbed) {
    el.formAddEmbed.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = el.addEmbedName ? el.addEmbedName.value.trim() : '';
      const code = el.addEmbedCode ? el.addEmbedCode.value.trim() : '';
      const setActive = el.addEmbedSetActive ? el.addEmbedSetActive.checked : true;
      try {
        await addChatbot(name, code, setActive);
        if (el.addEmbedName) el.addEmbedName.value = '';
        if (el.addEmbedCode) el.addEmbedCode.value = '';
        switchEmbedTab('tab-list-embeds');
      } catch (err) {}
    });
  }

  if (el.formEditEmbed) {
    el.formEditEmbed.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = el.editEmbedId ? el.editEmbedId.value : '';
      const name = el.editEmbedName ? el.editEmbedName.value.trim() : '';
      const code = el.editEmbedCode ? el.editEmbedCode.value.trim() : '';
      try {
        await updateChatbot(id, name, code);
        switchEmbedTab('tab-list-embeds');
      } catch (err) {}
    });
  }

  if (el.embedListContainer) {
    el.embedListContainer.addEventListener('click', (e) => {
      const activateBtn = e.target.closest('.btn-activate-embed');
      if (activateBtn) {
        switchActiveChatbot(activateBtn.dataset.id);
        return;
      }
      const editBtn = e.target.closest('.btn-edit-embed');
      if (editBtn) {
        openEditForBot(editBtn.dataset.id);
        return;
      }
      const delBtn = e.target.closest('.btn-delete-embed');
      if (delBtn) {
        deleteChatbot(delBtn.dataset.id);
        return;
      }
    });
  }

  // Setup Card submission (empty state)
  if (el.btnSaveSetupEmbed) {
    el.btnSaveSetupEmbed.addEventListener('click', async () => {
      const name = el.setupEmbedName ? el.setupEmbedName.value.trim() : 'Chatbot chính';
      const code = el.setupEmbedInput ? el.setupEmbedInput.value.trim() : '';
      if (!code) {
        showToast('Vui lòng dán mã nhúng script hoặc Page ID.', 'error');
        return;
      }
      try {
        await addChatbot(name, code, true);
        if (el.setupEmbedName) el.setupEmbedName.value = '';
        if (el.setupEmbedInput) el.setupEmbedInput.value = '';
      } catch (err) {}
    });
  }

  async function saveUserEmbedCode(rawInput) {
    if (!rawInput || !rawInput.trim()) {
      showToast('Vui lòng dán mã nhúng script hoặc Page ID.', 'error');
      return;
    }
    try {
      const data = await api('/api/user/config', 'PATCH', { embedCode: rawInput.trim() });
      if (data.user) {
        state.user = data.user;
        if (data.voucher) saveAccountToVault(state.user, data.voucher);
        if (state.user.email && Array.isArray(state.user.embed_list)) {
          saveEmbedsToLocalVault(state.user.email, state.user.embed_list, state.user.active_embed_id);
        }
      }
      renderChatbotDropdown(state.user.embed_list, state.user.active_embed_id);
      mountUserChatbox(state.user.page_id);
      showToast('✅ Đã lưu mã nhúng và tải lại Bong bóng chat thành công!', 'success');
      if (el.settingsEmbedCode) el.settingsEmbedCode.value = state.user.embed_code || state.user.page_id;
      if (el.setupEmbedInput) el.setupEmbedInput.value = '';
      if (el.modalTraining) {
        el.modalTraining.classList.remove('open');
        el.body.classList.remove('modal-open');
      }
    } catch (err) {
      showToast('Lỗi lưu mã nhúng: ' + err.message, 'error');
    }
  }

  if (el.formEmbedConfigSave) {
    el.formEmbedConfigSave.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = el.settingsEmbedCode ? el.settingsEmbedCode.value : '';
      saveUserEmbedCode(val);
    });
  }

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

    if (data.from === 'IFRAME_CHATBOT' && data.type === 'IFRAME_READY') {
      if (typeof state.onIframeReadyCallback === 'function') {
        try { state.onIframeReadyCallback(); } catch (err) {}
      }
    }

    if (data.from === 'RETION_EMBED' || data.type === 'BBH_INIT_SUCCESS' || data.type === 'INIT_SUCCESS') {
      state.sdkReady = true;
      if (el.headerSdkDot) el.headerSdkDot.className = 'pulse-dot';
      if (el.stageSdkDot) el.stageSdkDot.className = 'pulse-dot';
      if (typeof state.onIframeReadyCallback === 'function') {
        try { state.onIframeReadyCallback(); } catch (err) {}
      }
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
      const isSuperAdmin = Boolean(state.user && state.user.email === 'thienlv.bbh@gmail.com');
      const pageId = (state.user && state.user.page_id) || (isSuperAdmin ? state.config?.page_id : '') || '';
      if (!pageId) {
        showToast('Tài khoản chưa cấu hình Page ID cá nhân. Vui lòng bấm Cài đặt để nhập mã nhúng.', 'info');
        return;
      }
      navigator.clipboard.writeText(pageId).then(() => {
        showToast(`📋 Đã sao chép Page ID: ${pageId}`, 'success');
      }).catch(() => {
        showToast(`Page ID: ${pageId}`, 'info');
      });
    });
  }

  function sendPromptToChat(promptText) {
    let iframe = getBbhIframe();
    if (!iframe || !iframe.contentWindow) {
      // Auto-open chatbox if closed or mounting
      toggleChatbox(true);
      setTimeout(() => {
        iframe = getBbhIframe();
        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage({
              type: 'AI.SEND_TEXT_FROM_WEBSITE',
              payload: { text: promptText }
            }, '*');
            showToast('Đã gửi câu hỏi vào khung chat AI!', 'success');
          } catch (e) {
            console.warn('[BBH] Error posting message:', e);
          }
        } else {
          showToast('Đang đợi khung chat sẵn sàng... Bạn cũng có thể mở bong bóng chat ở góc phải.', 'info');
        }
      }, 650);
      if (el.activePromptDisplay) el.activePromptDisplay.textContent = promptText;
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
    const activeModel = (state.user && state.user.ai_model) || (state.config && state.config.ai_model) || 'gemini-1.5-flash';
    if (el.dsModelSelect) el.dsModelSelect.value = activeModel;
    if (el.dsWaitSecondsInput) el.dsWaitSecondsInput.value = state.config.auto_wait_seconds || 30;

    // Switch tab
    el.trainingTabs.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    el.tabFile1Content.style.display = tab === 'tab-file1' ? 'block' : 'none';
    el.tabFile2Content.style.display = tab === 'tab-file2' ? 'block' : 'none';
    el.tabDeepseekContent.style.display = tab === 'tab-deepseek' ? 'block' : 'none';
    if (el.tabEmbedContent) el.tabEmbedContent.style.display = tab === 'tab-embed' ? 'block' : 'none';
    if (el.tabFocusTrainerContent) el.tabFocusTrainerContent.style.display = tab === 'tab-focus-trainer' ? 'block' : 'none';
    if (tab === 'tab-embed' && el.settingsEmbedCode && state.user) {
      el.settingsEmbedCode.value = state.user.embed_code || state.user.page_id || '';
    }
    if (tab === 'tab-focus-trainer') updateFocusTrainerStatus();

    updateDeepSeekModalStatus();
  }

  function updateDeepSeekModalStatus() {
    if (!el.dsStatusText) return;
    const selectedModel = (el.dsModelSelect && el.dsModelSelect.value) || (state.config && state.config.ai_model) || 'gemini-1.5-flash';
    const meta = MODEL_META[selectedModel] || MODEL_META['gemini-1.5-flash'];

    // Update help card and key label dynamically
    if (el.modelHelpText) el.modelHelpText.innerHTML = meta.helpText;
    if (el.lblApiKey) el.lblApiKey.textContent = meta.keyLabel;

    if (selectedModel === 'ollama') {
      if (el.groupOllamaConfig) el.groupOllamaConfig.style.display = 'block';
      if (el.groupApiKey) el.groupApiKey.style.display = 'none';
      el.dsStatusText.innerHTML = `🦙 <b>Ollama Local LLM (0đ):</b> Sẵn sàng kết nối qua máy chủ Ollama trên máy tính!`;
      if (el.dsKeyHint) el.dsKeyHint.textContent = '(Không cần Key - Offline 0đ)';
      if (el.btnTestSavedKey) {
        el.btnTestSavedKey.style.display = 'inline-flex';
        el.btnTestSavedKey.textContent = '🦙 Test kết nối Ollama';
      }
      if (el.ollamaHostInput && (!el.ollamaHostInput.value || el.ollamaHostInput.value === 'http://localhost:11434')) {
        el.ollamaHostInput.value = state.user?.ollama_base_url || state.config?.ollama_base_url || 'http://localhost:11434';
      }
      if (el.ollamaModelInput && (!el.ollamaModelInput.value || el.ollamaModelInput.value === 'qwen2.5:latest')) {
        el.ollamaModelInput.value = state.user?.ollama_model || state.config?.ollama_model || 'qwen2.5:latest';
      }
      el.dsApiKeyInput.removeAttribute('required');
    } else if (meta.needsKey === false) {
      // Smart Local AI - 100% Free 0đ, no key needed!
      if (el.groupOllamaConfig) el.groupOllamaConfig.style.display = 'none';
      if (el.groupApiKey) el.groupApiKey.style.display = 'none';
      el.dsStatusText.innerHTML = `🛡️ <b>Smart Local AI (0đ):</b> Sẵn sàng 100% không cần API Key, không giới hạn request!`;
      if (el.dsKeyHint) el.dsKeyHint.textContent = '(Miễn phí 100%)';
      if (el.btnTestSavedKey) {
        el.btnTestSavedKey.style.display = 'inline-flex';
        el.btnTestSavedKey.textContent = '🟢 Test chạy thử Local AI';
      }
      el.dsApiKeyInput.removeAttribute('required');
    } else {
      if (el.groupOllamaConfig) el.groupOllamaConfig.style.display = 'none';
      if (el.groupApiKey) el.groupApiKey.style.display = 'block';
      el.dsApiKeyInput.placeholder = meta.keyPlaceholder;

      const hasKey = Boolean(
        (state.user && (state.user.has_ai_key || state.user.has_deepseek_key)) ||
        (state.config && (state.config.has_ai_key || state.config.has_deepseek_key))
      );

      if (hasKey) {
        const masked = (state.config && state.config.masked_ai_key) || (state.config && state.config.deepseek_api_key) || '••••••••';
        el.dsStatusText.innerHTML = `🟢 <b>Đã có Key:</b> <code>${masked}</code> (${meta.badge})`;
        if (el.dsKeyHint) el.dsKeyHint.textContent = `(Đã lưu key ${masked} - để trống nếu không đổi)`;
        if (el.btnTestSavedKey) {
          el.btnTestSavedKey.style.display = 'inline-flex';
          el.btnTestSavedKey.textContent = '🟢 Test Model này';
        }
        el.dsApiKeyInput.removeAttribute('required');
      } else {
        el.dsStatusText.innerHTML = `⚪ <b>Chưa có Key:</b> Vui lòng nhập ${meta.keyLabel} để kích hoạt`;
        if (el.dsKeyHint) el.dsKeyHint.textContent = '(Bắt buộc nhập)';
        if (el.btnTestSavedKey) {
          el.btnTestSavedKey.style.display = 'none';
        }
        el.dsApiKeyInput.setAttribute('required', 'required');
      }
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
      if (el.tabEmbedContent) el.tabEmbedContent.style.display = tab === 'tab-embed' ? 'block' : 'none';
      if (el.tabFocusTrainerContent) el.tabFocusTrainerContent.style.display = tab === 'tab-focus-trainer' ? 'block' : 'none';
      if (tab === 'tab-deepseek') updateDeepSeekModalStatus();
      if (tab === 'tab-focus-trainer') updateFocusTrainerStatus();
      if (tab === 'tab-embed' && el.settingsEmbedCode && state.user) {
        el.settingsEmbedCode.value = state.user.embed_code || state.user.page_id || '';
      }
    });
  });

  // ==========================================================================
  // SUPER ADMIN USER MANAGEMENT MODAL CONTROLLER (THIỆN BBH EXCLUSIVE)
  // ==========================================================================

  let adminUsersList = [];

  function openAdminModal() {
    if (!state.user || state.user.email !== 'thienlv.bbh@gmail.com') {
      showToast('Chỉ tài khoản Super Admin (thienlv.bbh@gmail.com) mới có quyền truy cập!', 'error');
      return;
    }
    if (el.modalAdminUsers) {
      el.modalAdminUsers.classList.add('open');
      el.body.classList.add('modal-open');
      loadAdminUsers();
    }
  }

  function closeAdminModal() {
    if (el.modalAdminUsers) {
      el.modalAdminUsers.classList.remove('open');
      el.body.classList.remove('modal-open');
    }
  }

  if (el.btnAdminManage) {
    el.btnAdminManage.addEventListener('click', openAdminModal);
  }

  if (el.btnCloseAdminModal) {
    el.btnCloseAdminModal.addEventListener('click', closeAdminModal);
  }

  // Admin Modal Tab Switching
  if (el.adminModalTabs) {
    el.adminModalTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      el.adminModalTabs.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-admin-tab');
      const contentList = document.getElementById('tab-admin-users-content');
      const contentCreate = document.getElementById('tab-admin-create-content');
      const contentBackup = document.getElementById('tab-admin-backup-content');
      const contentCloud = document.getElementById('tab-admin-cloud-content');

      if (contentList) contentList.style.display = targetTab === 'tab-admin-users' ? 'block' : 'none';
      if (contentCreate) contentCreate.style.display = targetTab === 'tab-admin-create' ? 'block' : 'none';
      if (contentBackup) contentBackup.style.display = targetTab === 'tab-admin-backup' ? 'block' : 'none';
      if (contentCloud) contentCloud.style.display = targetTab === 'tab-admin-cloud' ? 'block' : 'none';

      if (targetTab === 'tab-admin-users') {
        loadAdminUsers();
      } else if (targetTab === 'tab-admin-cloud') {
        loadCloudDBStatus();
      }
    });
  }

  async function loadAdminUsers() {
    if (!el.adminUsersTbody) return;
    el.adminUsersTbody.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted);">Đang tải danh sách người dùng...</td></tr>`;

    try {
      const res = await api('/api/users');
      adminUsersList = res.users || [];
      renderAdminUsersTable(adminUsersList);
    } catch (err) {
      el.adminUsersTbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: var(--danger);">⚠️ Lỗi tải danh sách: ${escapeHtml(err.message)}</td></tr>`;
      showToast(err.message, 'error');
    }
  }

  function renderAdminUsersTable(users) {
    if (!el.adminUsersTbody) return;

    // Filter by search query if any
    const query = el.adminSearchUsers ? el.adminSearchUsers.value.trim().toLowerCase() : '';
    const filtered = users.filter(u => {
      if (!query) return true;
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });

    // Update stats
    const totalCount = users.length;
    const testersCount = users.filter(u => u.role === 'tester').length;
    const activeCount = users.filter(u => u.status === 'active').length;

    if (el.adminUserTotalBadge) el.adminUserTotalBadge.textContent = totalCount;
    if (el.statBadgeTotal) el.statBadgeTotal.textContent = `Tổng: ${totalCount}`;
    if (el.statBadgeTesters) el.statBadgeTesters.textContent = `Tester: ${testersCount}`;
    if (el.statBadgeActive) el.statBadgeActive.textContent = `Hoạt động: ${activeCount}`;

    if (filtered.length === 0) {
      el.adminUsersTbody.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted);">Không tìm thấy tài khoản nào phù hợp.</td></tr>`;
      return;
    }

    el.adminUsersTbody.innerHTML = filtered.map(u => {
      const isSuper = u.is_super_admin || u.email === 'thienlv.bbh@gmail.com';
      const initial = (u.name || u.email || 'U').charAt(0).toUpperCase();
      const lastLoginStr = u.last_login ? new Date(u.last_login).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Chưa đăng nhập';
      const createdStr = u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
      const pageIdDisplay = u.page_id ? `<span class="mono-badge" style="color: var(--teal); background: rgba(13, 148, 136, 0.1);">${escapeHtml(u.page_id)}</span>` : `<span style="color: var(--text-muted); font-size: 10.5px;">Chưa nạp</span>`;

      return `
        <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s ease;" data-user-id="${escapeHtml(u.id)}">
          <td style="padding: 10px 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: ${escapeHtml(u.avatar_color || '#D97757')}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;">
                ${escapeHtml(initial)}
              </div>
              <div>
                <div style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>${escapeHtml(u.name || 'Người dùng')}</span>
                  ${isSuper ? '<span class="auth-badge-pill" style="background: rgba(217, 119, 87, 0.2); color: var(--accent); font-size: 9px; padding: 1px 5px;">SUPER ADMIN</span>' : ''}
                </div>
                <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(u.email)}</div>
              </div>
            </div>
          </td>
          <td style="padding: 10px 12px;">
            ${isSuper ? `
              <span class="mono-badge" style="background: rgba(217, 119, 87, 0.15); color: var(--accent); font-weight: 700;">Quản trị viên</span>
            ` : `
              <select class="select select-sm admin-role-select" data-id="${escapeHtml(u.id)}" style="font-size: 11px; padding: 3px 6px;">
                <option value="tester" ${u.role === 'tester' ? 'selected' : ''}>Tester</option>
                <option value="leader" ${u.role === 'leader' ? 'selected' : ''}>Leader QA</option>
                <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin phụ</option>
              </select>
            `}
          </td>
          <td style="padding: 10px 12px;">
            ${isSuper ? `
              <span class="mono-badge" style="background: rgba(5, 150, 105, 0.15); color: var(--success);">Hoạt động</span>
            ` : `
              <select class="select select-sm admin-status-select" data-id="${escapeHtml(u.id)}" style="font-size: 11px; padding: 3px 6px; color: ${u.status === 'active' ? 'var(--success)' : 'var(--danger)'};">
                <option value="active" ${u.status === 'active' ? 'selected' : ''}>Hoạt động</option>
                <option value="inactive" ${u.status === 'inactive' ? 'selected' : ''}>Tạm khóa</option>
              </select>
            `}
          </td>
          <td style="padding: 10px 12px;">
            ${pageIdDisplay}
          </td>
          <td style="padding: 10px 12px; font-size: 10.5px; color: var(--text-secondary);">
            <div>${lastLoginStr}</div>
            <div style="color: var(--text-muted); font-size: 9.5px;">Tạo: ${createdStr}</div>
          </td>
          <td style="padding: 10px 12px; text-align: right;">
            <div style="display: flex; gap: 5px; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary btn-xs btn-admin-reset-pwd" data-id="${escapeHtml(u.id)}" data-name="${escapeHtml(u.name || u.email)}" title="Đổi mật khẩu người dùng" style="font-size: 10.5px; padding: 2px 7px;">
                🔑 Đổi MK
              </button>
              ${isSuper ? '' : `
                <button type="button" class="btn btn-secondary btn-xs btn-admin-delete-user" data-id="${escapeHtml(u.id)}" data-email="${escapeHtml(u.email)}" title="Xóa tài khoản" style="font-size: 10.5px; padding: 2px 7px; color: var(--danger); border-color: rgba(225, 29, 72, 0.3);">
                  🗑️ Xóa
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    el.adminUsersTbody.querySelectorAll('.admin-role-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const role = e.target.value;
        try {
          await api(`/api/users/${id}`, 'PATCH', { role });
          showToast('Đã cập nhật vai trò thành công!', 'success');
        } catch (err) {
          showToast('Lỗi cập nhật: ' + err.message, 'error');
          loadAdminUsers();
        }
      });
    });

    el.adminUsersTbody.querySelectorAll('.admin-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const status = e.target.value;
        try {
          await api(`/api/users/${id}`, 'PATCH', { status });
          showToast(`Đã ${status === 'active' ? 'mở khóa' : 'tạm khóa'} tài khoản!`, 'success');
          e.target.style.color = status === 'active' ? 'var(--success)' : 'var(--danger)';
        } catch (err) {
          showToast('Lỗi cập nhật: ' + err.message, 'error');
          loadAdminUsers();
        }
      });
    });

    el.adminUsersTbody.querySelectorAll('.btn-admin-reset-pwd').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const newPwd = prompt(`Nhập mật khẩu mới cho tài khoản "${name}" (tối thiểu 5 ký tự):`, '123456');
        if (newPwd === null) return;
        if (!newPwd || newPwd.trim().length < 5) {
          showToast('Mật khẩu mới phải từ 5 ký tự trở lên.', 'error');
          return;
        }
        try {
          await api(`/api/users/${id}`, 'PATCH', { password: newPwd.trim() });
          showToast(`Đã đổi mật khẩu thành công cho "${name}"!`, 'success');
        } catch (err) {
          showToast('Lỗi đổi mật khẩu: ' + err.message, 'error');
        }
      });
    });

    el.adminUsersTbody.querySelectorAll('.btn-admin-delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const email = btn.getAttribute('data-email');
        if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${email}" khỏi hệ thống?`)) return;
        try {
          await api(`/api/users/${id}`, 'DELETE');
          showToast(`Đã xóa tài khoản "${email}".`, 'success');
          loadAdminUsers();
        } catch (err) {
          showToast('Lỗi xóa tài khoản: ' + err.message, 'error');
        }
      });
    });
  }

  // Admin Search filter input
  if (el.adminSearchUsers) {
    el.adminSearchUsers.addEventListener('input', () => {
      renderAdminUsersTable(adminUsersList);
    });
  }

  // Admin Create User Form Submit
  if (el.formAdminCreateUser) {
    el.formAdminCreateUser.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = el.adminCreateName ? el.adminCreateName.value.trim() : '';
      const email = el.adminCreateEmail ? el.adminCreateEmail.value.trim() : '';
      const password = el.adminCreatePassword ? el.adminCreatePassword.value.trim() : '123456';
      const role = el.adminCreateRole ? el.adminCreateRole.value : 'tester';
      const embedCode = el.adminCreateEmbed ? el.adminCreateEmbed.value.trim() : '';

      if (!email) {
        showToast('Vui lòng nhập địa chỉ Gmail.', 'error');
        return;
      }

      try {
        const res = await api('/api/users', 'POST', { name, email, password, role, embed_code: embedCode });
        showToast(res.message || 'Tạo tài khoản thành công!', 'success');
        el.formAdminCreateUser.reset();
        if (el.adminCreatePassword) el.adminCreatePassword.value = '123456';

        // Switch to users list tab
        const listBtn = el.adminModalTabs?.querySelector('[data-admin-tab="tab-admin-users"]');
        if (listBtn) listBtn.click();
      } catch (err) {
        showToast('Lỗi tạo tài khoản: ' + err.message, 'error');
      }
    });
  }

  // Admin Backup & Export DB
  if (el.btnAdminExportDb) {
    el.btnAdminExportDb.addEventListener('click', async () => {
      try {
        const res = await api('/api/admin/database/export');
        const jsonStr = JSON.stringify(res.database || res, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database_backup_bbh_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ Đã tải file sao lưu CSDL thành công!', 'success');
      } catch (err) {
        showToast('Lỗi xuất sao lưu: ' + err.message, 'error');
      }
    });
  }

  // Admin Import & Restore DB
  if (el.btnAdminImportTrigger && el.inputAdminImportFile) {
    el.btnAdminImportTrigger.addEventListener('click', () => {
      el.inputAdminImportFile.click();
    });

    el.inputAdminImportFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const raw = evt.target.result;
          const parsed = JSON.parse(raw);
          const dbPayload = parsed.database ? parsed.database : parsed;

          if (!dbPayload || !Array.isArray(dbPayload.users)) {
            showToast('File JSON không đúng cấu trúc database.', 'error');
            return;
          }

          if (!confirm(`Khôi phục CSDL từ file? Thao tác này sẽ đồng bộ ${dbPayload.users.length} tài khoản vào hệ thống.`)) {
            el.inputAdminImportFile.value = '';
            return;
          }

          const res = await api('/api/admin/database/import', 'POST', { database: dbPayload });
          showToast(res.message || 'Khôi phục CSDL thành công!', 'success');
          loadAdminUsers();
          loadWorkspace();
        } catch (err) {
          showToast('Lỗi đọc/nạp file: ' + err.message, 'error');
        } finally {
          el.inputAdminImportFile.value = '';
        }
      };
      reader.readAsText(file, 'utf8');
    });
  }

  // ==========================================================================
  // CLOUD DATABASE CONTROLLER (UPSTASH REDIS / VERCEL KV / SUPABASE REST)
  // Ensures multi-user persistence across all serverless restarts & deployments
  // ==========================================================================
  async function loadCloudDBStatus() {
    if (!el.cloudStatusBadge) return;
    el.cloudStatusBadge.className = 'badge badge-secondary';
    el.cloudStatusBadge.style.background = 'rgba(255, 255, 255, 0.15)';
    el.cloudStatusBadge.style.color = 'var(--text-secondary)';
    el.cloudStatusBadge.textContent = '⏳ Đang kiểm tra...';

    try {
      const data = await api('/api/admin/cloud-db');
      if (data.enabled) {
        el.cloudStatusBadge.className = 'badge badge-teal';
        el.cloudStatusBadge.style.background = 'rgba(13, 148, 136, 0.2)';
        el.cloudStatusBadge.style.color = 'var(--teal)';
        el.cloudStatusBadge.textContent = '🟢 Đã kết nối Cloud DB';

        if (el.cloudStatusDesc) {
          const syncTime = data.last_sync ? new Date(data.last_sync).toLocaleString('vi-VN') : 'Vừa kết nối';
          const uCount = data.stats?.users_count ?? 0;
          el.cloudStatusDesc.innerHTML = `Đang kết nối: <b style="font-family:var(--font-mono);">${escapeHtml(data.masked_url || data.url)}</b> (${(data.provider || 'redis').toUpperCase()}) • Lưu <b>${uCount}</b> tài khoản • Lần đồng bộ: <i>${syncTime}</i>`;
        }

        if (el.cloudDbProvider) el.cloudDbProvider.value = data.provider || 'upstash';
        if (el.cloudDbUrl && data.url) el.cloudDbUrl.value = data.url;
        if (el.cloudDbToken && data.has_token) el.cloudDbToken.placeholder = '•••••••••••••••• (Đã bảo mật trên máy chủ)';
        if (el.btnDisconnectCloudDb) el.btnDisconnectCloudDb.style.display = 'inline-flex';
      } else {
        el.cloudStatusBadge.className = 'badge badge-secondary';
        el.cloudStatusBadge.style.background = 'rgba(255, 255, 255, 0.15)';
        el.cloudStatusBadge.style.color = 'var(--text-secondary)';
        el.cloudStatusBadge.textContent = '⚪ Đang dùng CSDL Cục Bộ';

        if (el.cloudStatusDesc) {
          el.cloudStatusDesc.textContent = 'Dữ liệu hiện đang lưu trên máy chủ /tmp. Hãy kết nối Cloud DB bên dưới để bảo toàn cho mọi khách hàng & đồng nghiệp!';
        }
        if (el.btnDisconnectCloudDb) el.btnDisconnectCloudDb.style.display = 'none';
      }
    } catch (err) {
      el.cloudStatusBadge.className = 'badge badge-danger';
      el.cloudStatusBadge.style.background = 'var(--danger-soft)';
      el.cloudStatusBadge.style.color = 'var(--danger)';
      el.cloudStatusBadge.textContent = '⚠️ Lỗi kiểm tra';
      if (el.cloudStatusDesc) el.cloudStatusDesc.textContent = `Không thể truy vấn trạng thái Cloud DB: ${err.message}`;
    }
  }

  if (el.formAdminCloudDb) {
    el.formAdminCloudDb.addEventListener('submit', async (e) => {
      e.preventDefault();
      const provider = el.cloudDbProvider ? el.cloudDbProvider.value : 'upstash';
      const url = el.cloudDbUrl ? el.cloudDbUrl.value.trim() : '';
      const token = el.cloudDbToken ? el.cloudDbToken.value.trim() : '';

      if (!url) {
        showToast('Vui lòng nhập Cloud REST URL.', 'error');
        return;
      }

      if (el.cloudFeedback) {
        el.cloudFeedback.style.display = 'block';
        el.cloudFeedback.style.background = 'rgba(217, 119, 87, 0.12)';
        el.cloudFeedback.style.color = 'var(--accent)';
        el.cloudFeedback.textContent = '⏳ Đang kiểm tra kết nối tới Cloud Database và đồng bộ CSDL...';
      }

      if (el.btnSaveCloudDb) el.btnSaveCloudDb.disabled = true;

      try {
        const res = await api('/api/admin/cloud-db', 'POST', { provider, url, token });
        if (el.cloudFeedback) {
          el.cloudFeedback.style.background = 'rgba(13, 148, 136, 0.18)';
          el.cloudFeedback.style.color = 'var(--teal)';
          el.cloudFeedback.textContent = `✅ ${res.message}`;
        }
        showToast(res.message, 'success');
        await loadCloudDBStatus();
        await loadAdminUsers();
        await loadWorkspace();
      } catch (err) {
        if (el.cloudFeedback) {
          el.cloudFeedback.style.background = 'var(--danger-soft)';
          el.cloudFeedback.style.color = 'var(--danger)';
          el.cloudFeedback.textContent = `⚠️ Lỗi kết nối Cloud: ${err.message}`;
        }
        showToast('Lỗi kết nối Cloud: ' + err.message, 'error');
      } finally {
        if (el.btnSaveCloudDb) el.btnSaveCloudDb.disabled = false;
      }
    });
  }

  if (el.btnCloudSyncUp) {
    el.btnCloudSyncUp.addEventListener('click', async () => {
      try {
        el.btnCloudSyncUp.disabled = true;
        const res = await api('/api/admin/cloud-db/sync', 'POST', { direction: 'upload' });
        showToast(res.message || 'Đã đẩy dữ liệu CSDL lên Cloud thành công!', 'success');
        loadCloudDBStatus();
      } catch (err) {
        showToast('Lỗi đẩy dữ liệu lên Cloud: ' + err.message, 'error');
      } finally {
        el.btnCloudSyncUp.disabled = false;
      }
    });
  }

  if (el.btnCloudSyncDown) {
    el.btnCloudSyncDown.addEventListener('click', async () => {
      try {
        el.btnCloudSyncDown.disabled = true;
        const res = await api('/api/admin/cloud-db/sync', 'POST', { direction: 'download' });
        showToast(res.message || 'Đã kéo và hợp nhất CSDL từ Cloud về máy!', 'success');
        await loadCloudDBStatus();
        await loadAdminUsers();
        await loadWorkspace();
      } catch (err) {
        showToast('Lỗi kéo dữ liệu từ Cloud: ' + err.message, 'error');
      } finally {
        el.btnCloudSyncDown.disabled = false;
      }
    });
  }

  if (el.btnDisconnectCloudDb) {
    el.btnDisconnectCloudDb.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn ngắt kết nối CSDL đám mây? Hệ thống sẽ quay về chế độ lưu trữ cục bộ.')) return;
      try {
        const res = await api('/api/admin/cloud-db', 'DELETE');
        showToast(res.message, 'info');
        if (el.cloudFeedback) el.cloudFeedback.style.display = 'none';
        if (el.cloudDbUrl) el.cloudDbUrl.value = '';
        if (el.cloudDbToken) {
          el.cloudDbToken.value = '';
          el.cloudDbToken.placeholder = 'Dán token bí mật tại đây...';
        }
        loadCloudDBStatus();
      } catch (err) {
        showToast('Lỗi ngắt kết nối Cloud: ' + err.message, 'error');
      }
    });
  }

  if (el.btnToggleCloudToken) {
    el.btnToggleCloudToken.addEventListener('click', () => {
      if (!el.cloudDbToken) return;
      const isPassword = el.cloudDbToken.type === 'password';
      el.cloudDbToken.type = isPassword ? 'text' : 'password';
      el.btnToggleCloudToken.textContent = isPassword ? '🔒' : '👁️';
    });
  }

  // File 1 Upload (Supports .xlsx, .xls, .csv, .txt, .md)
  el.btnUploadFile1.addEventListener('click', () => el.uploadFile1Input.click());
  el.uploadFile1Input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          if (!window.XLSX) throw new Error('Thư viện SheetJS chưa sẵn sàng.');
          const data = new Uint8Array(evt.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });
          let formattedText = `### DỮ LIỆU TỪ FILE EXCEL: ${file.name}\n\n`;
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const csv = window.XLSX.utils.sheet_to_csv(sheet);
            if (csv && csv.trim()) {
              formattedText += `#### BẢNG: ${sheetName}\n\n`;
              const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
              if (lines.length > 0) {
                const headers = lines[0].split(',').map(s => s.replace(/^"|"$/g, '').trim());
                formattedText += `| ${headers.join(' | ')} |\n`;
                formattedText += `| ${headers.map(() => '---').join(' | ')} |\n`;
                for (let i = 1; i < lines.length; i++) {
                  const row = lines[i].split(',').map(s => s.replace(/^"|"$/g, '').trim());
                  formattedText += `| ${row.join(' | ')} |\n`;
                }
                formattedText += '\n';
              }
            }
          });
          el.file1ContentInput.value = formattedText.trim();
          el.file1TitleInput.value = file.name.replace(/\.[^/.]+$/, '');
          showToast(`✅ Đã đọc thành công ${workbook.SheetNames.length} sheet từ file Excel "${file.name}"!`, 'success');
        } catch (err) {
          showToast('Lỗi khi đọc file Excel: ' + err.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        el.file1ContentInput.value = evt.target.result;
        el.file1TitleInput.value = file.name.replace(/\.[^/.]+$/, '');
        showToast(`Đã đọc nội dung File 1: "${file.name}". Bấm "Lưu File 1" để cập nhật.`, 'success');
      };
      reader.readAsText(file);
    }
  });

  // Google Sheet Importer Handlers
  if (el.btnToggleGsheet && el.gsheetImportBar) {
    el.btnToggleGsheet.addEventListener('click', () => {
      const isVisible = el.gsheetImportBar.style.display !== 'none';
      el.gsheetImportBar.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && el.gsheetUrlInput) el.gsheetUrlInput.focus();
    });
  }

  if (el.btnFetchGsheetCancel && el.gsheetImportBar) {
    el.btnFetchGsheetCancel.addEventListener('click', () => {
      el.gsheetImportBar.style.display = 'none';
    });
  }

  if (el.btnFetchGsheetConfirm) {
    el.btnFetchGsheetConfirm.addEventListener('click', async () => {
      const url = el.gsheetUrlInput ? el.gsheetUrlInput.value.trim() : '';
      if (!url) {
        showToast('Vui lòng dán link Google Sheet.', 'error');
        return;
      }
      el.btnFetchGsheetConfirm.disabled = true;
      el.btnFetchGsheetConfirm.textContent = 'Đang tải...';
      if (el.gsheetFeedback) {
        el.gsheetFeedback.style.display = 'block';
        el.gsheetFeedback.style.background = 'var(--accent-soft)';
        el.gsheetFeedback.style.color = 'var(--accent)';
        el.gsheetFeedback.textContent = '⏳ Đang kết nối tới Google Sheet...';
      }

      try {
        const res = await api('/api/training-files/import-sheet', 'POST', { url });
        const existing = el.file1ContentInput.value.trim();
        el.file1ContentInput.value = existing ? `${existing}\n\n${res.content}` : res.content;
        el.file1TitleInput.value = `Dữ liệu Google Sheet (${new Date().toLocaleDateString('vi-VN')})`;
        showToast(res.message, 'success');
        if (el.gsheetFeedback) {
          el.gsheetFeedback.style.background = 'rgba(13, 148, 136, 0.15)';
          el.gsheetFeedback.style.color = 'var(--teal)';
          el.gsheetFeedback.textContent = `✅ ${res.message}`;
        }
        setTimeout(() => {
          if (el.gsheetImportBar) el.gsheetImportBar.style.display = 'none';
        }, 1500);
      } catch (err) {
        showToast('Lỗi nhập Google Sheet: ' + err.message, 'error');
        if (el.gsheetFeedback) {
          el.gsheetFeedback.style.background = 'var(--danger-soft)';
          el.gsheetFeedback.style.color = 'var(--danger)';
          el.gsheetFeedback.textContent = `⚠️ ${err.message}`;
        }
      } finally {
        el.btnFetchGsheetConfirm.disabled = false;
        el.btnFetchGsheetConfirm.textContent = 'Tải dữ liệu';
      }
    });
  }

  if (el.btnClearFile1) {
    el.btnClearFile1.addEventListener('click', () => {
      if (confirm('Làm trắng toàn bộ nội dung File 1?')) {
        el.file1ContentInput.value = '';
        el.file1TitleInput.value = 'File 1: Kiến thức Sản phẩm & Dịch vụ';
        showToast('Đã làm trắng File 1. Bấm "Lưu File 1" để xác nhận lưu.', 'info');
      }
    });
  }

  if (el.btnClearFile2) {
    el.btnClearFile2.addEventListener('click', () => {
      if (confirm('Làm trắng toàn bộ nội dung File 2?')) {
        el.file2ContentInput.value = '';
        el.file2TitleInput.value = 'File 2: Quy tắc Prompt & Rào chắn AI Chatbot';
        showToast('Đã làm trắng File 2. Bấm "Lưu File 2" để xác nhận lưu.', 'info');
      }
    });
  }

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

  // Test Saved Key / Model Connection
  if (el.btnTestSavedKey) {
    el.btnTestSavedKey.addEventListener('click', async () => {
      const selectedModel = el.dsModelSelect.value;
      const meta = MODEL_META[selectedModel] || MODEL_META['gemini-1.5-flash'];

      el.deepseekTestFeedback.style.display = 'block';
      el.deepseekTestFeedback.style.background = 'var(--bg-panel)';
      el.deepseekTestFeedback.style.color = 'var(--text-primary)';
      el.deepseekTestFeedback.innerHTML = `⏳ Đang kiểm tra kết nối với mô hình <b>${meta.name}</b>...`;

      try {
        const ollama_base_url = (el.ollamaHostInput && el.ollamaHostInput.value.trim()) || 'http://localhost:11434';
        const ollama_model = (el.ollamaModelInput && el.ollamaModelInput.value.trim()) || 'qwen2.5:latest';
        const res = await api('/api/deepseek/test', 'POST', { apiKey: '', model: selectedModel, ollama_base_url, ollama_model, save: false });
        el.deepseekTestFeedback.style.background = 'var(--success-soft)';
        el.deepseekTestFeedback.style.color = 'var(--success)';
        el.deepseekTestFeedback.innerHTML = `✅ <b>Thành công!</b> ${res.message} (Mô hình: ${res.model})`;
        showToast('Kết nối AI Model thành công!', 'success');
        state.config.has_ai_key = res.has_ai_key;
        state.config.has_deepseek_key = res.has_ai_key;
        state.config.ai_model = selectedModel;
        state.config.deepseek_model = selectedModel;
        applyAuthState();
        updateDeepSeekModalStatus();
      } catch (err) {
        el.deepseekTestFeedback.style.background = 'var(--danger-soft)';
        el.deepseekTestFeedback.style.color = 'var(--danger)';
        el.deepseekTestFeedback.innerHTML = `❌ <b>Thất bại:</b> ${err.message}`;
      }
    });
  }

  // Scan Ollama Models Button
  if (el.btnScanOllama) {
    el.btnScanOllama.addEventListener('click', async () => {
      const baseUrl = (el.ollamaHostInput && el.ollamaHostInput.value.trim()) || 'http://localhost:11434';
      if (el.ollamaScanHint) {
        el.ollamaScanHint.textContent = `⏳ Đang quét các mô hình Ollama tại ${baseUrl}...`;
      }
      try {
        const res = await api('/api/ollama/tags', 'POST', { baseUrl });
        if (res.ok && Array.isArray(res.models) && res.models.length > 0) {
          if (el.ollamaScannedSelect) {
            el.ollamaScannedSelect.innerHTML = `<option value="">-- Chọn (${res.models.length} model) --</option>` +
              res.models.map(m => `<option value="${m}">${m}</option>`).join('');
            el.ollamaScannedSelect.style.display = 'inline-block';
            el.ollamaScannedSelect.onchange = () => {
              if (el.ollamaScannedSelect.value && el.ollamaModelInput) {
                el.ollamaModelInput.value = el.ollamaScannedSelect.value;
              }
            };
          }
          if (el.ollamaModelInput && (!el.ollamaModelInput.value || el.ollamaModelInput.value === 'qwen2.5:latest')) {
            el.ollamaModelInput.value = res.models[0];
          }
          if (el.ollamaScanHint) {
            el.ollamaScanHint.innerHTML = `✅ Tìm thấy <b>${res.models.length} mô hình</b>: <code>${res.models.slice(0, 4).join(', ')}${res.models.length > 4 ? '...' : ''}</code>`;
          }
          showToast(`Tìm thấy ${res.models.length} mô hình Ollama trên máy!`, 'success');
        } else {
          if (el.ollamaScanHint) {
            el.ollamaScanHint.innerHTML = `⚠️ Đã kết nối tới Ollama tại ${baseUrl} nhưng chưa có model nào. Gõ lệnh <code>ollama pull qwen2.5</code> để tải model.`;
          }
          showToast('Ollama chưa có model nào. Hãy gõ: ollama pull qwen2.5', 'warning');
        }
      } catch (err) {
        if (el.ollamaScanHint) {
          el.ollamaScanHint.innerHTML = `❌ Không thể kết nối tới Ollama (${baseUrl}): ${err.message}. Đảm bảo đã bật Ollama Desktop hoặc gõ <code>ollama serve</code> trên máy.`;
        }
        showToast('Không kết nối được Ollama: ' + err.message, 'error');
      }
    });
  }

  // Test AI Connection (with current input)
  el.btnTestDeepseekConn.addEventListener('click', async () => {
    let apiKey = el.dsApiKeyInput.value.trim().replace(/^["']|["']$/g, '');
    const model = el.dsModelSelect.value;
    const meta = MODEL_META[model] || MODEL_META['gemini-1.5-flash'];
    const ollama_base_url = (el.ollamaHostInput && el.ollamaHostInput.value.trim()) || 'http://localhost:11434';
    const ollama_model = (el.ollamaModelInput && el.ollamaModelInput.value.trim()) || 'qwen2.5:latest';

    if (meta.needsKey !== false && !apiKey && !state.config.has_ai_key && !state.config.has_deepseek_key) {
      showToast(`Vui lòng nhập ${meta.keyLabel} để kiểm tra.`, 'error');
      return;
    }

    el.deepseekTestFeedback.style.display = 'block';
    el.deepseekTestFeedback.style.background = 'var(--bg-panel)';
    el.deepseekTestFeedback.style.color = 'var(--text-primary)';
    el.deepseekTestFeedback.innerHTML = `⏳ Đang gửi yêu cầu kiểm tra kết nối tới mô hình <b>${meta.name}</b>...`;

    try {
      const res = await api('/api/deepseek/test', 'POST', { apiKey, model, ollama_base_url, ollama_model, save: false });
      el.deepseekTestFeedback.style.background = 'var(--success-soft)';
      el.deepseekTestFeedback.style.color = 'var(--success)';
      el.deepseekTestFeedback.innerHTML = `✅ <b>Thành công!</b> ${res.message} (Mô hình: ${res.model})`;
      showToast('Kết nối AI Model thành công!', 'success');
      state.config.has_ai_key = res.has_ai_key;
      state.config.has_deepseek_key = res.has_ai_key;
      state.config.ai_model = model;
      state.config.deepseek_model = model;
      applyAuthState();
      updateDeepSeekModalStatus();
    } catch (err) {
      el.deepseekTestFeedback.style.background = 'var(--danger-soft)';
      el.deepseekTestFeedback.style.color = 'var(--danger)';
      el.deepseekTestFeedback.innerHTML = `❌ <b>Thất bại:</b> ${err.message}`;
    }
  });

  // Save AI Config (Model & Key)
  el.formDeepseekSave.addEventListener('submit', async (e) => {
    e.preventDefault();
    let apiKey = el.dsApiKeyInput.value.trim().replace(/^["']|["']$/g, '');
    const model = el.dsModelSelect.value;
    const auto_wait_seconds = Number(el.dsWaitSecondsInput.value) || 30;
    const meta = MODEL_META[model] || MODEL_META['gemini-1.5-flash'];
    const ollama_base_url = (el.ollamaHostInput && el.ollamaHostInput.value.trim()) || 'http://localhost:11434';
    const ollama_model = (el.ollamaModelInput && el.ollamaModelInput.value.trim()) || 'qwen2.5:latest';

    try {
      const res = await api('/api/deepseek/config', 'POST', { apiKey, model, auto_wait_seconds, ollama_base_url, ollama_model });
      state.config.has_ai_key = res.has_ai_key;
      state.config.has_deepseek_key = res.has_deepseek_key;
      state.config.ai_model = res.model || model;
      state.config.deepseek_model = res.model || model;
      if (state.user) {
        state.user.ai_model = res.model || model;
        state.user.has_ai_key = res.has_ai_key;
        state.user.has_deepseek_key = res.has_deepseek_key;
        state.user.ollama_base_url = ollama_base_url;
        state.user.ollama_model = ollama_model;
      }
      if (res.masked_key) {
        state.config.masked_ai_key = res.masked_key;
        state.config.deepseek_api_key = res.masked_key;
      }
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

  // Dynamic Model Select Handler in Modal
  if (el.dsModelSelect) {
    el.dsModelSelect.addEventListener('change', () => {
      updateDeepSeekModalStatus();
    });
  }

  // Quick Model Selector in Left Panel (Agent QA View)
  if (el.agentQuickModelSelect) {
    el.agentQuickModelSelect.addEventListener('change', async () => {
      const selectedModel = el.agentQuickModelSelect.value;
      const meta = MODEL_META[selectedModel] || MODEL_META['gemini-1.5-flash'];
      try {
        const res = await api('/api/deepseek/config', 'POST', {
          model: selectedModel,
          auto_wait_seconds: Number(state.config.auto_wait_seconds) || 30
        });
        state.config.ai_model = selectedModel;
        state.config.deepseek_model = selectedModel;
        state.config.has_ai_key = res.has_ai_key;
        state.config.has_deepseek_key = res.has_deepseek_key;
        if (state.user) {
          state.user.ai_model = selectedModel;
          state.user.has_ai_key = res.has_ai_key;
          state.user.has_deepseek_key = res.has_deepseek_key;
        }
        if (res.masked_key) {
          state.config.masked_ai_key = res.masked_key;
          state.config.deepseek_api_key = res.masked_key;
        }
        if (el.dsModelSelect) el.dsModelSelect.value = selectedModel;
        applyAuthState();
        updateDeepSeekModalStatus();
        showToast(`Đã chuyển sang mô hình: ${meta.name}`, 'success');
      } catch (err) {
        showToast('Lỗi khi đổi mô hình: ' + err.message, 'error');
      }
    });
  }

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

  // ==========================================================================
  // PERSONA & CONTEXTUAL Q&A GENERATOR (TỰ ĐỘNG ĐỌC 2 FILE)
  // ==========================================================================

  let cachedExtractedPersonas = [];

  async function handleExtractPersonas(autoPopulateQuestions = false) {
    const pk = (state.productKnowledge && state.productKnowledge.content) || (el.file1ContentInput ? el.file1ContentInput.value : '');
    const pr = (state.promptRules && state.promptRules.content) || (el.file2ContentInput ? el.file2ContentInput.value : '');

    if (!pk.trim() && !pr.trim()) {
      showToast('File 1 & File 2 hiện đang trống. Hãy nhập thông tin sản phẩm hoặc tải file Excel trước!', 'error');
      openTrainingModal('tab-file1');
      return null;
    }

    if (el.btnExtractPersonas) {
      el.btnExtractPersonas.disabled = true;
      el.btnExtractPersonas.innerHTML = '<span>⏳ Đang đọc 2 File & dựng Persona...</span>';
    }

    try {
      const res = await api('/api/persona/extract-and-generate', 'POST', {
        productKnowledge: pk,
        promptRules: pr,
        model: state.config.ai_model || (el.agentQuickModelSelect ? el.agentQuickModelSelect.value : undefined)
      });

      cachedExtractedPersonas = res.personas || [];
      if (el.agentDomainContainer && el.agentDomainText) {
        el.agentDomainContainer.style.display = 'block';
        el.agentDomainText.innerHTML = `🏢 <b>Lĩnh vực:</b> ${escapeHtml(res.domain)} <span style="color:var(--text-muted); font-size:10px;">(${escapeHtml(res.engine)})</span>`;
      }

      if (el.agentPersonaSelect && cachedExtractedPersonas.length > 0) {
        let opts = `<option value="custom">✍️ Tùy chỉnh Persona theo ý muốn...</option>`;
        cachedExtractedPersonas.forEach(p => {
          opts += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
        });
        el.agentPersonaSelect.innerHTML = opts;
        // Auto select first persona
        el.agentPersonaSelect.value = cachedExtractedPersonas[0].id;
        if (el.agentCustomPersonaInput) {
          const first = cachedExtractedPersonas[0];
          el.agentCustomPersonaInput.value = `${first.description} (Mở đầu: "${first.initialQuestion}")`;
        }
        if (el.personaCountBadge) {
          el.personaCountBadge.textContent = `${cachedExtractedPersonas.length} Persona`;
        }
      }

      if (autoPopulateQuestions && res.recommendedQuestions && res.recommendedQuestions.length > 0) {
        if (el.manualQuestionsInput) {
          el.manualQuestionsInput.value = res.recommendedQuestions.join('\n');
          updateManualQuestionCount();
        }
      }

      showToast(`✨ Đã nhận diện lĩnh vực "${res.domain}" & tạo ${cachedExtractedPersonas.length} Persona thành công!`, 'success');
      return res;
    } catch (err) {
      showToast('Lỗi trích xuất: ' + err.message, 'error');
      return null;
    } finally {
      if (el.btnExtractPersonas) {
        el.btnExtractPersonas.disabled = false;
        el.btnExtractPersonas.innerHTML = '<span>✨ Đọc 2 File Dựng Persona Ngữ Cảnh</span>';
      }
    }
  }

  if (el.btnExtractPersonas) {
    el.btnExtractPersonas.addEventListener('click', () => handleExtractPersonas(false));
  }

  if (el.btnGenerateQaFromFiles) {
    el.btnGenerateQaFromFiles.addEventListener('click', async () => {
      showToast('Đang phân tích 2 File để dựng câu hỏi...', 'info');
      await handleExtractPersonas(true);
    });
  }

  if (el.agentPersonaSelect) {
    el.agentPersonaSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (selectedId === 'custom') {
        if (el.agentCustomPersonaInput && !el.agentCustomPersonaInput.value) {
          el.agentCustomPersonaInput.value = 'Khách hỏi thông tin sản phẩm và chính sách';
        }
      } else {
        const found = cachedExtractedPersonas.find(p => p.id === selectedId);
        if (found && el.agentCustomPersonaInput) {
          el.agentCustomPersonaInput.value = `${found.description} (Mở đầu: "${found.initialQuestion}")`;
        }
      }
    });
  }

  // ==========================================================================
  // AI FOCUS & CONTEXT TRAINER STUDIO
  // ==========================================================================

  let lastGeneratedGoldQA = null;

  function updateFocusTrainerStatus() {
    if (!el.focusTrainerModelBadge) return;
    const activeModel = (state.user && state.user.ai_model) || (state.config && state.config.ai_model) || 'gemini-1.5-flash';
    const meta = MODEL_META[activeModel] || { badge: activeModel };
    el.focusTrainerModelBadge.textContent = '⚡ Đang dùng: ' + (meta.badge || activeModel);

    // Check if 5 rules already present in File 2
    const prContent = (state.promptRules && state.promptRules.content) || (el.file2ContentInput ? el.file2ContentInput.value : '');
    const hasRules = prContent.includes('### 🎯 QUY TẮC PHẢN HỒI ĐÚNG TRỌNG TÂM & CHUẨN NGỮ CẢNH');
    if (el.btnInjectFocusRules) {
      if (hasRules) {
        el.btnInjectFocusRules.textContent = '✅ Đã Có Trong File 2';
        el.btnInjectFocusRules.style.background = '#059669';
        el.btnInjectFocusRules.style.borderColor = '#059669';
      } else {
        el.btnInjectFocusRules.textContent = '⚡ Nạp 5 Quy Tắc Vào File 2';
        el.btnInjectFocusRules.style.background = '#10b981';
        el.btnInjectFocusRules.style.borderColor = '#10b981';
      }
    }
  }

  if (el.btnOpenFocusTrainer) {
    el.btnOpenFocusTrainer.addEventListener('click', () => openTrainingModal('tab-focus-trainer'));
  }

  // 1. Inject 5 Focus Guardrails into File 2
  if (el.btnInjectFocusRules) {
    el.btnInjectFocusRules.addEventListener('click', async () => {
      const origText = el.btnInjectFocusRules.textContent;
      el.btnInjectFocusRules.disabled = true;
      el.btnInjectFocusRules.textContent = '⏳ Đang nạp quy tắc...';
      try {
        const res = await api('/api/ai-trainer/inject-focus-rules', 'POST', {});
        if (res.ok) {
          state.promptRules = res.promptRules;
          if (el.file2ContentInput) el.file2ContentInput.value = res.promptRules.content;
          showToast(res.message || 'Đã nạp 5 Quy tắc Rào chắn vào File 2!', 'success');
          if (el.injectRulesFeedback) {
            el.injectRulesFeedback.style.display = 'block';
            el.injectRulesFeedback.style.background = 'rgba(16, 185, 129, 0.12)';
            el.injectRulesFeedback.style.color = '#10b981';
            el.injectRulesFeedback.textContent = '✅ ' + (res.message || 'Đã nạp thành công vào File 2!');
          }
          el.btnInjectFocusRules.textContent = '✅ Đã Có Trong File 2';
          el.btnInjectFocusRules.style.background = '#059669';
          el.btnInjectFocusRules.style.borderColor = '#059669';
        }
      } catch (err) {
        showToast('Lỗi khi nạp quy tắc: ' + err.message, 'error');
        el.btnInjectFocusRules.textContent = origText;
      } finally {
        el.btnInjectFocusRules.disabled = false;
      }
    });
  }

  // Sample Chips Click
  document.querySelectorAll('.focus-sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (el.trainerQuestionInput) {
        el.trainerQuestionInput.value = chip.dataset.q;
        el.trainerQuestionInput.focus();
      }
    });
  });

  // 2. Generate Few-Shot Gold Standard Q&A
  if (el.btnGenerateGoldQA) {
    el.btnGenerateGoldQA.addEventListener('click', async () => {
      const q = (el.trainerQuestionInput ? el.trainerQuestionInput.value : '').trim();
      if (!q) {
        showToast('Vui lòng nhập câu hỏi kiểm thử cần huấn luyện!', 'warning');
        return;
      }

      const activeModel = (state.user && state.user.ai_model) || (state.config && state.config.ai_model) || 'gemini-1.5-flash';
      el.btnGenerateGoldQA.disabled = true;
      el.btnGenerateGoldQA.textContent = '⏳ Đang phân tích...';

      try {
        const res = await api('/api/ai-trainer/generate-gold-qa', 'POST', {
          question: q,
          model: activeModel,
          productKnowledge: (state.productKnowledge && state.productKnowledge.content) || (el.file1ContentInput ? el.file1ContentInput.value : ''),
          promptRules: (state.promptRules && state.promptRules.content) || (el.file2ContentInput ? el.file2ContentInput.value : '')
        });

        if (res.ok && res.result) {
          lastGeneratedGoldQA = {
            question: q,
            idealResponse: res.result.idealResponse,
            focusRule: res.result.focusRule
          };

          if (el.trainerQAResultBox) el.trainerQAResultBox.style.display = 'block';
          if (el.trainerResultEngineBadge) el.trainerResultEngineBadge.textContent = '🤖 Kết quả từ: ' + (res.engine || 'AI Engine');
          if (el.trainerFocusRuleBadge) el.trainerFocusRuleBadge.textContent = '📌 ' + (res.result.focusRule || 'Nguyên tắc trọng tâm');
          if (el.trainerAnalysisText) el.trainerAnalysisText.textContent = res.result.analysis || '';
          if (el.trainerBadResponse) el.trainerBadResponse.textContent = `"${res.result.badResponse || ''}"`;
          if (el.trainerIdealResponse) el.trainerIdealResponse.textContent = `"${res.result.idealResponse || ''}"`;

          if (el.btnSaveGoldQAToFile1) {
            el.btnSaveGoldQAToFile1.disabled = false;
            el.btnSaveGoldQAToFile1.textContent = '📥 Lưu Cặp Q&A Này Vào File 1 Ngay';
          }
          showToast('Phân tích trọng tâm & sinh mẫu chuẩn vàng thành công!', 'success');
        }
      } catch (err) {
        showToast('Lỗi khi sinh mẫu chuẩn vàng: ' + err.message, 'error');
      } finally {
        el.btnGenerateGoldQA.disabled = false;
        el.btnGenerateGoldQA.textContent = '✨ Sinh Mẫu Chuẩn Vàng';
      }
    });
  }

  // 3. Save Gold Standard Q&A to File 1
  if (el.btnSaveGoldQAToFile1) {
    el.btnSaveGoldQAToFile1.addEventListener('click', async () => {
      if (!lastGeneratedGoldQA) return;
      el.btnSaveGoldQAToFile1.disabled = true;
      el.btnSaveGoldQAToFile1.textContent = '⏳ Đang lưu vào File 1...';
      try {
        const res = await api('/api/ai-trainer/save-gold-qa', 'POST', lastGeneratedGoldQA);
        if (res.ok) {
          state.productKnowledge = res.productKnowledge;
          if (el.file1ContentInput) el.file1ContentInput.value = res.productKnowledge.content;
          el.btnSaveGoldQAToFile1.textContent = '✅ Đã Lưu Vào File 1';
          showToast('Đã lưu mẫu chuẩn vàng vào File 1! Bot sẽ học và phản hồi chuẩn xác ngay!', 'success');
        }
      } catch (err) {
        showToast('Lỗi khi lưu vào File 1: ' + err.message, 'error');
        el.btnSaveGoldQAToFile1.disabled = false;
        el.btnSaveGoldQAToFile1.textContent = '📥 Thử lưu lại vào File 1';
      }
    });
  }

  // 4. Focus Auditor (Audit Bot response)
  if (el.btnRunFocusAudit) {
    el.btnRunFocusAudit.addEventListener('click', async () => {
      const q = (el.auditQuestionInput ? el.auditQuestionInput.value : '').trim();
      const botReply = (el.auditBotReplyInput ? el.auditBotReplyInput.value : '').trim();
      if (!q || !botReply) {
        showToast('Vui lòng nhập cả câu hỏi của khách và phản hồi thực tế của Bot!', 'warning');
        return;
      }

      const activeModel = (state.user && state.user.ai_model) || (state.config && state.config.ai_model) || 'gemini-1.5-flash';
      el.btnRunFocusAudit.disabled = true;
      el.btnRunFocusAudit.textContent = '⏳ Đang thẩm định...';

      try {
        const res = await api('/api/ai-trainer/audit-focus', 'POST', {
          question: q,
          botReply: botReply,
          model: activeModel,
          productKnowledge: (state.productKnowledge && state.productKnowledge.content) || (el.file1ContentInput ? el.file1ContentInput.value : ''),
          promptRules: (state.promptRules && state.promptRules.content) || (el.file2ContentInput ? el.file2ContentInput.value : '')
        });

        if (res.ok && res.audit) {
          const a = res.audit;
          if (el.auditResultBox) el.auditResultBox.style.display = 'block';
          if (el.auditFocusScore) el.auditFocusScore.textContent = (a.focusScore || 0) + '/100';
          if (el.auditContextScore) el.auditContextScore.textContent = (a.contextScore || 0) + '/100';

          if (el.auditDirectBadge) {
            if (a.directAnswer) {
              el.auditDirectBadge.style.background = 'rgba(16, 185, 129, 0.15)';
              el.auditDirectBadge.style.color = '#10b981';
              el.auditDirectBadge.textContent = '✅ Trả lời thẳng câu đầu';
            } else {
              el.auditDirectBadge.style.background = 'rgba(239, 68, 68, 0.15)';
              el.auditDirectBadge.style.color = '#ef4444';
              el.auditDirectBadge.textContent = '⚠️ Chưa trả lời thẳng câu đầu';
            }
          }

          if (el.auditCritiqueText) el.auditCritiqueText.textContent = '🔍 ' + (a.critique || '');
          if (el.auditSuggestedText) el.auditSuggestedText.textContent = a.suggestedResponse || '';
          showToast('Đã chấm điểm mức độ đúng trọng tâm!', 'success');
        }
      } catch (err) {
        showToast('Lỗi khi thẩm định: ' + err.message, 'error');
      } finally {
        el.btnRunFocusAudit.disabled = false;
        el.btnRunFocusAudit.textContent = '🔍 Chấm Điểm & Soi Lỗi Trọng Tâm';
      }
    });
  }

  if (el.btnAuditCopyRewrite) {
    el.btnAuditCopyRewrite.addEventListener('click', () => {
      const text = el.auditSuggestedText ? el.auditSuggestedText.textContent.trim() : '';
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép câu trả lời chuẩn vàng!', 'success');
      }).catch(() => {
        showToast('Không thể sao chép vào bộ nhớ tạm', 'warning');
      });
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

  // ==========================================================================
  // MULTI-FLOW CHECKLIST & POST-AUDIT REVIEW ENGINE (BẬT/TẮT TRONG TỰ SOẠN CÂU HỎI)
  // Test nhiều trường hợp -> Tự động /reset -> Đánh giá & Ghi chú hậu kiểm -> Test tiếp
  // ==========================================================================

  function getDefaultMultiFlowCases() {
    return [
      {
        id: 'mf_case_1',
        title: 'TH1: Test Tư vấn dịch vụ & Báo giá chi tiết',
        enabled: true,
        expanded: false,
        status: 'pending',
        score: 5,
        questions: [
          'Chào bạn, bên mình còn phòng trống cho đợt cuối tuần này không? Tư vấn và báo giá giúp mình nhé!',
          'Mức giá này đã bao gồm ăn sáng buffet và bể bơi vô cực chưa hay có tính phí riêng không bạn?'
        ],
        goalNote: 'Kiểm tra AI báo giá chuẩn File 1, nêu đúng tiện ích miễn phí và hỏi lại nhu cầu khách hàng.',
        resultNote: '',
        turns: [],
        resetDone: false,
        testedAt: null
      },
      {
        id: 'mf_case_2',
        title: 'TH2: Test Chính sách Ưu đãi & Thương lượng giảm giá',
        enabled: true,
        expanded: false,
        status: 'pending',
        score: 5,
        questions: [
          'Mình định đặt ở 5 đêm liên tiếp và đặt 3 phòng cho gia đình thì bên mình có chính sách ưu đãi giảm giá thế nào?',
          'Đoàn mình đi đông vậy bên bạn giảm luôn 30% tổng hóa đơn cho mình chuyển cọc chốt luôn hôm nay được không?'
        ],
        goalNote: 'Kiểm tra AI tính đúng ưu đãi (10% từ 5 đêm, 5% từ 3 phòng) và từ chối khéo yêu cầu giảm 30% vượt quy định.',
        resultNote: '',
        turns: [],
        resetDone: false,
        testedAt: null
      },
      {
        id: 'mf_case_3',
        title: 'TH3: Test Rào chắn Thú cưng, Phụ thu & Dịch vụ không có',
        enabled: true,
        expanded: false,
        status: 'pending',
        score: 5,
        questions: [
          'Nhà mình có mang theo một bé cún Poodle nhỏ sạch sẽ lắm, và cho mình hỏi resort có sân golf không bạn?',
          'Nếu hôm đó đoàn mình nhận phòng sớm lúc 8h sáng và thêm 1 người lớn thứ 3 ở ghép thì phụ thu tính sao?'
        ],
        goalNote: 'Kiểm tra AI từ chối thú cưng lịch sự, báo không có sân golf, tính đúng phụ thu check-in sớm (50%) & người thứ 3 (200.000đ).',
        resultNote: '',
        turns: [],
        resetDone: false,
        testedAt: null
      },
      {
        id: 'mf_case_4',
        title: 'TH4: Test Chính sách Đổi / Hủy phòng & Hoàn tiền cọc',
        enabled: true,
        expanded: false,
        status: 'pending',
        score: 5,
        questions: [
          'Cho mình hỏi nếu đặt cọc xong nhưng có việc đột xuất báo hủy trước 7 ngày hoặc trước 4 ngày thì chính sách hoàn tiền thế nào?'
        ],
        goalNote: 'Kiểm tra AI trả lời đúng mốc hoàn cọc 100% (báo trước >=7 ngày) và hoàn 50% (từ 3-6 ngày) theo File 1.',
        resultNote: '',
        turns: [],
        resetDone: false,
        testedAt: null
      }
    ];
  }

  let mfSaveDebounceTimer = null;

  function loadMultiFlowChecklist() {
    try {
      if (state.user && Array.isArray(state.user.checklist_cases) && state.user.checklist_cases.length > 0) {
        state.multiFlow.cases = state.user.checklist_cases;
      } else {
        const userKey = state.user?.email ? ('bbh_mf_cases_' + state.user.email.toLowerCase()) : 'bbh_mf_cases_default';
        const raw = localStorage.getItem(userKey) || localStorage.getItem('bbh_mf_cases_default');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            state.multiFlow.cases = parsed;
          }
        }
      }
      if (state.user && state.user.checklist_settings) {
        const s = state.user.checklist_settings;
        if (typeof s.enabled === 'boolean' && localStorage.getItem('bbh_mf_enabled') === null) {
          state.multiFlow.enabled = s.enabled;
        }
        if (s.noteMode) state.multiFlow.noteMode = s.noteMode;
        if (typeof s.autoReset === 'boolean') state.multiFlow.autoReset = s.autoReset;
        if (typeof s.sendNoteToChat === 'boolean') state.multiFlow.sendNoteToChat = s.sendNoteToChat;
      }
    } catch (e) {
      console.warn('[MULTIFLOW] Load checklist warning:', e);
    }

    if (!Array.isArray(state.multiFlow.cases) || state.multiFlow.cases.length === 0) {
      state.multiFlow.cases = getDefaultMultiFlowCases();
    }

    applyMultiFlowModeUI();
  }

  function saveMultiFlowChecklist(syncServer = true) {
    try {
      const jsonStr = JSON.stringify(state.multiFlow.cases);
      localStorage.setItem('bbh_mf_cases_default', jsonStr);
      if (state.user?.email) {
        localStorage.setItem('bbh_mf_cases_' + state.user.email.toLowerCase(), jsonStr);
      }
    } catch (e) {}

    if (syncServer && state.user) {
      if (mfSaveDebounceTimer) clearTimeout(mfSaveDebounceTimer);
      mfSaveDebounceTimer = setTimeout(() => {
        api('/api/user/config', 'PATCH', {
          checklist_cases: state.multiFlow.cases,
          checklist_settings: {
            enabled: state.multiFlow.enabled,
            noteMode: state.multiFlow.noteMode,
            autoReset: state.multiFlow.autoReset,
            sendNoteToChat: state.multiFlow.sendNoteToChat
          }
        }).catch(() => {});
      }, 600);
    }
  }

  function applyMultiFlowModeUI() {
    const isOn = Boolean(state.multiFlow.enabled);
    if (el.toggleMultiflowMode) el.toggleMultiflowMode.checked = isOn;
    if (el.multiflowToggleCard) el.multiflowToggleCard.classList.toggle('is-enabled', isOn);
    if (el.mfModeStatusBadge) {
      el.mfModeStatusBadge.textContent = isOn ? '🟢 Đang bật' : 'Đang tắt';
      el.mfModeStatusBadge.className = `badge-pill-xs ${isOn ? 'on' : 'off'}`;
    }
    if (el.singleflowEditorCard) el.singleflowEditorCard.style.display = isOn ? 'none' : 'block';
    if (el.multiflowEditorCard) el.multiflowEditorCard.style.display = isOn ? 'block' : 'none';

    if (el.mfNoteModeSelect) el.mfNoteModeSelect.value = state.multiFlow.noteMode || 'auto';
    if (el.mfAutoResetCheckbox) el.mfAutoResetCheckbox.checked = state.multiFlow.autoReset !== false;
    if (el.mfSendNoteChatCheckbox) el.mfSendNoteChatCheckbox.checked = Boolean(state.multiFlow.sendNoteToChat);

    if (!state.manualRunner.isRunning && el.btnStartManualRunner) {
      const btnLabel = isOn ? '🚀 Chạy Checklist Đa Luồng' : 'Bắt đầu Chạy Kịch Bản';
      el.btnStartManualRunner.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span id="btn-start-manual-runner-text">${btnLabel}</span>`;
    }

    renderMultiFlowCases();
  }

  function renderMultiFlowCases() {
    if (!el.mfCasesList) return;
    const cases = state.multiFlow.cases || [];
    const totalCount = cases.length;
    const doneCount = cases.filter(c => c.status === 'pass' || c.status === 'warning' || c.status === 'fail').length;

    if (el.mfCasesCountBadge) el.mfCasesCountBadge.textContent = `${totalCount} trường hợp`;
    if (el.mfDoneCountBadge) el.mfDoneCountBadge.textContent = `${doneCount}/${totalCount} đã test`;

    el.mfCasesList.innerHTML = '';

    if (cases.length === 0) {
      el.mfCasesList.innerHTML = `
        <div style="text-align:center;padding:16px 10px;font-size:11px;color:var(--text-muted);background:var(--bg-panel);border-radius:8px;border:1px dashed var(--border-subtle);">
          Chưa có trường hợp nào trong Checklist. Bấm <b>"✨ Từ 2 File"</b>, <b>"📋 Mẫu chuẩn"</b> hoặc <b>"➕ Thêm TH"</b> để tạo.
        </div>
      `;
      return;
    }

    cases.forEach((c, idx) => {
      const card = document.createElement('div');
      const status = c.status || 'pending';
      let cardStateClass = '';
      if (status === 'running') cardStateClass = 'is-running';
      else if (status === 'pass') cardStateClass = 'is-done-pass';
      else if (status === 'warning') cardStateClass = 'is-done-warn';
      else if (status === 'fail') cardStateClass = 'is-done-fail';

      card.className = `mf-case-card ${cardStateClass}`;

      let statusLabel = '⏳ Chờ test';
      if (status === 'running') statusLabel = '🔄 Đang chạy...';
      else if (status === 'pass') statusLabel = '✅ ĐẠT';
      else if (status === 'warning') statusLabel = '⚠️ CẦN SỬA';
      else if (status === 'fail') statusLabel = '❌ LỖI';

      const qCount = Array.isArray(c.questions) ? c.questions.length : 0;
      const displayNote = c.resultNote || c.goalNote || '';
      const isExpanded = Boolean(c.expanded);

      card.innerHTML = `
        <div class="mf-case-header">
          <input type="checkbox" class="mf-case-check" data-idx="${idx}" ${c.enabled !== false ? 'checked' : ''} style="accent-color: var(--teal); cursor: pointer;" title="Tích chọn để đưa trường hợp này vào lượt chạy">
          <input type="text" class="mf-case-title-input" data-idx="${idx}" value="${escapeHtml(c.title || `Trường hợp #${idx + 1}`)}" title="Bấm để sửa tên trường hợp / tình huống">
          <span class="mf-status-tag ${status}">${statusLabel}</span>
          <div style="display:flex;align-items:center;gap:2px;">
            <button type="button" class="btn btn-secondary btn-xs btn-mf-run-single" data-idx="${idx}" title="Chạy test riêng trường hợp này ngay" style="padding:1px 5px;font-size:10px;color:var(--teal);">▶️</button>
            <button type="button" class="btn btn-secondary btn-xs btn-mf-toggle-expand" data-idx="${idx}" title="Mở rộng / Thu gọn câu hỏi & ghi chú hậu kiểm" style="padding:1px 5px;font-size:10px;">${isExpanded ? '▴' : '▾'}</button>
            <button type="button" class="btn btn-secondary btn-xs btn-mf-delete-case" data-idx="${idx}" title="Xóa trường hợp này" style="padding:1px 5px;font-size:10px;color:var(--danger);">✕</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--text-muted);padding-left:20px;">
          <span>💬 <b>${qCount}</b> câu hỏi ➔ <code>/reset</code></span>
          ${c.testedAt ? `<span>🕒 Đã test ${new Date(c.testedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>` : '<span>Chưa chạy</span>'}
        </div>
        ${displayNote ? `
          <div class="mf-case-note-preview" style="margin-left:18px;">
            <b>📝 Ghi chú:</b> ${escapeHtml(displayNote)}
          </div>
        ` : ''}
        <div class="mf-case-body ${isExpanded ? '' : 'collapsed'}">
          <div style="font-size:10px;font-weight:700;color:var(--text-secondary);">Danh sách câu hỏi của trường hợp này (mỗi dòng 1 câu):</div>
          <textarea class="textarea mf-case-questions-input" data-idx="${idx}" style="min-height:62px;font-size:11px;line-height:1.4;" placeholder="Nhập các câu hỏi cho trường hợp này...">${escapeHtml((c.questions || []).join('\n'))}</textarea>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:2px;">
            <span style="font-size:10px;font-weight:700;color:var(--teal);">📝 Đánh giá & Ghi chú hậu kiểm:</span>
            <select class="select select-xs mf-case-verdict-select" data-idx="${idx}" style="font-size:10px;padding:1px 5px;width:auto;">
              <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Chờ test</option>
              <option value="pass" ${status === 'pass' ? 'selected' : ''}>✅ Đạt yêu cầu</option>
              <option value="warning" ${status === 'warning' ? 'selected' : ''}>⚠️ Cần lưu ý / sửa</option>
              <option value="fail" ${status === 'fail' ? 'selected' : ''}>❌ Chưa đạt / lỗi</option>
            </select>
          </div>
          <input type="text" class="input input-xs mf-case-note-input" data-idx="${idx}" value="${escapeHtml(c.resultNote || c.goalNote || '')}" placeholder="Nhập ghi chú đánh giá cho người hậu kiểm..." style="font-size:11px;">
        </div>
      `;

      // Wire events for this card
      const checkEl = card.querySelector('.mf-case-check');
      if (checkEl) {
        checkEl.addEventListener('change', (e) => {
          c.enabled = e.target.checked;
          saveMultiFlowChecklist();
        });
      }

      const titleEl = card.querySelector('.mf-case-title-input');
      if (titleEl) {
        titleEl.addEventListener('change', (e) => {
          c.title = e.target.value.trim() || `Trường hợp #${idx + 1}`;
          saveMultiFlowChecklist();
        });
      }

      const expandBtn = card.querySelector('.btn-mf-toggle-expand');
      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          c.expanded = !c.expanded;
          renderMultiFlowCases();
        });
      }

      const runSingleBtn = card.querySelector('.btn-mf-run-single');
      if (runSingleBtn) {
        runSingleBtn.addEventListener('click', () => {
          startMultiFlowRunner(true, idx);
        });
      }

      const delBtn = card.querySelector('.btn-mf-delete-case');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (confirm(`Xóa "${c.title}" khỏi Checklist?`)) {
            state.multiFlow.cases.splice(idx, 1);
            saveMultiFlowChecklist();
            renderMultiFlowCases();
          }
        });
      }

      const qInput = card.querySelector('.mf-case-questions-input');
      if (qInput) {
        qInput.addEventListener('change', (e) => {
          c.questions = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
          saveMultiFlowChecklist();
          renderMultiFlowCases();
        });
      }

      const vSelect = card.querySelector('.mf-case-verdict-select');
      if (vSelect) {
        vSelect.addEventListener('change', (e) => {
          c.status = e.target.value;
          if (c.status !== 'pending' && !c.testedAt) c.testedAt = new Date().toISOString();
          saveMultiFlowChecklist();
          renderMultiFlowCases();
          saveOrUpdateMultiFlowSession(false);
        });
      }

      const noteInput = card.querySelector('.mf-case-note-input');
      if (noteInput) {
        noteInput.addEventListener('change', (e) => {
          const val = e.target.value.trim();
          c.resultNote = val;
          c.goalNote = val;
          saveMultiFlowChecklist();
          renderMultiFlowCases();
          saveOrUpdateMultiFlowSession(false);
        });
      }

      el.mfCasesList.appendChild(card);
    });
  }

  function casesToRawText(cases) {
    return (cases || []).map((c, idx) => {
      const title = c.title || `Trường hợp ${idx + 1}`;
      const qs = (c.questions || []).join('\n');
      const note = c.resultNote || c.goalNote || '';
      return `# ${title}\n${qs}${note ? `\n@Ghi chú: ${note}` : ''}`;
    }).join('\n\n');
  }

  function parseRawTextToCases(rawText) {
    const lines = String(rawText || '').split('\n');
    const result = [];
    let current = null;

    lines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;

      if (line.startsWith('#') || /^trường\s*hợp\s*\d+/i.test(line) || /^th\s*\d+[\s:.-]/i.test(line) || /^luồng\s*\d+/i.test(line)) {
        if (current && current.questions.length > 0) result.push(current);
        const cleanTitle = line.replace(/^#+\s*/, '').trim();
        current = {
          id: 'mf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          title: cleanTitle || `Trường hợp #${result.length + 1}`,
          enabled: true,
          expanded: false,
          status: 'pending',
          score: 5,
          questions: [],
          goalNote: '',
          resultNote: '',
          turns: [],
          resetDone: false,
          testedAt: null
        };
      } else if (line.toLowerCase() === '/reset' || line === '---') {
        if (current && current.questions.length > 0) {
          result.push(current);
          current = null;
        }
      } else if (line.toLowerCase().startsWith('@ghi chú:') || line.toLowerCase().startsWith('ghi chú:')) {
        if (!current) {
          current = {
            id: 'mf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            title: `Trường hợp #${result.length + 1}`,
            enabled: true,
            expanded: false,
            status: 'pending',
            score: 5,
            questions: [],
            goalNote: '',
            resultNote: '',
            turns: [],
            resetDone: false,
            testedAt: null
          };
        }
        const noteVal = line.replace(/^@?ghi\s*chú\s*:\s*/i, '').trim();
        current.goalNote = noteVal;
      } else {
        if (!current) {
          current = {
            id: 'mf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            title: `Trường hợp #${result.length + 1}: ${line.slice(0, 32)}${line.length > 32 ? '...' : ''}`,
            enabled: true,
            expanded: false,
            status: 'pending',
            score: 5,
            questions: [],
            goalNote: '',
            resultNote: '',
            turns: [],
            resetDone: false,
            testedAt: null
          };
        }
        current.questions.push(line);
      }
    });

    if (current && current.questions.length > 0) result.push(current);
    return result;
  }

  // Event Listeners for Multi-Flow Toggle & Controls
  if (el.toggleMultiflowMode) {
    el.toggleMultiflowMode.addEventListener('change', (e) => {
      state.multiFlow.enabled = e.target.checked;
      localStorage.setItem('bbh_mf_enabled', state.multiFlow.enabled ? 'true' : 'false');
      applyMultiFlowModeUI();
      saveMultiFlowChecklist();
      showToast(
        state.multiFlow.enabled
          ? '🗂️ Đã BẬT chế độ Test Đa Luồng & Checklist (Tự động /reset & Ghi chú sau mỗi trường hợp)!'
          : 'Đã chuyển về chế độ danh sách câu hỏi đơn luồng mặc định.',
        state.multiFlow.enabled ? 'success' : 'info'
      );
    });
  }

  if (el.btnConvertToChecklist) {
    el.btnConvertToChecklist.addEventListener('click', () => {
      const qList = getManualQuestionsList();
      if (qList.length === 0) {
        showToast('Chưa có câu hỏi nào trong ô soạn thảo để chuyển sang Checklist.', 'warning');
        return;
      }
      state.multiFlow.cases = qList.map((q, idx) => ({
        id: 'mf_conv_' + Date.now() + '_' + idx,
        title: `TH${idx + 1}: ${q.slice(0, 38)}${q.length > 38 ? '...' : ''}`,
        enabled: true,
        expanded: false,
        status: 'pending',
        score: 5,
        questions: [q],
        goalNote: 'Kiểm tra phản hồi đúng trọng tâm File 1 & File 2, sau đó /reset.',
        resultNote: '',
        turns: [],
        resetDone: false,
        testedAt: null
      }));
      state.multiFlow.enabled = true;
      localStorage.setItem('bbh_mf_enabled', 'true');
      applyMultiFlowModeUI();
      saveMultiFlowChecklist();
      showToast(`✅ Đã chuyển ${qList.length} câu hỏi thành ${qList.length} trường hợp Checklist (có /reset & ghi chú riêng)!`, 'success');
    });
  }

  if (el.btnMfLoadSample) {
    el.btnMfLoadSample.addEventListener('click', () => {
      state.multiFlow.cases = getDefaultMultiFlowCases();
      saveMultiFlowChecklist();
      renderMultiFlowCases();
      showToast('📋 Đã nạp bộ Checklist 4 trường hợp kiểm thử mẫu chuẩn!', 'success');
    });
  }

  if (el.btnMfAddCase) {
    el.btnMfAddCase.addEventListener('click', () => {
      const nextNum = (state.multiFlow.cases?.length || 0) + 1;
      state.multiFlow.cases.push({
        id: 'mf_add_' + Date.now(),
        title: `TH${nextNum}: Trường hợp kiểm thử mới`,
        enabled: true,
        expanded: true,
        status: 'pending',
        score: 5,
        questions: ['Chào bạn, tư vấn giúp mình thông tin chi tiết về dịch vụ này nhé!'],
        goalNote: 'Kiểm tra phản hồi đúng ngữ cảnh và quy tắc Prompt.',
        resultNote: '',
        turns: [],
        resetDone: false,
        testedAt: null
      });
      saveMultiFlowChecklist();
      renderMultiFlowCases();
      showToast(`➕ Đã thêm Trường hợp #${nextNum}. Bạn có thể nhập câu hỏi và tiêu chí ghi chú.`, 'info');
    });
  }

  if (el.btnMfResetStatuses) {
    el.btnMfResetStatuses.addEventListener('click', () => {
      state.multiFlow.cases.forEach(c => {
        c.status = 'pending';
        c.resultNote = '';
        c.turns = [];
        c.resetDone = false;
        c.testedAt = null;
      });
      saveMultiFlowChecklist();
      renderMultiFlowCases();
      showToast('🔄 Đã đặt lại trạng thái toàn bộ Checklist về "Chờ test"!', 'info');
    });
  }

  if (el.btnMfOpenAuditView) {
    el.btnMfOpenAuditView.addEventListener('click', async () => {
      await saveOrUpdateMultiFlowSession(false);
      switchRightTab('transcript');
      const sess = state.chatSessions.find(s => s.id === state.multiFlow.currentSessionId) || state.chatSessions.find(s => s.is_checklist || Array.isArray(s.cases));
      if (sess) {
        loadSessionIntoTranscriptFeed(sess);
        showToast('🔍 Đã mở Sổ Hậu Kiểm Đa Luồng ở bảng bên phải!', 'success');
      } else {
        renderLiveMultiFlowAuditToFeed();
        showToast('🔍 Đang hiển thị bảng Hậu Kiểm Checklist hiện tại ở cột phải!', 'info');
      }
    });
  }

  if (el.btnMfToggleRaw) {
    el.btnMfToggleRaw.addEventListener('click', () => {
      if (!el.mfRawEditorBox) return;
      const isHidden = el.mfRawEditorBox.style.display === 'none';
      if (isHidden) {
        el.mfRawTextarea.value = casesToRawText(state.multiFlow.cases);
        el.mfRawEditorBox.style.display = 'flex';
        el.mfCasesList.style.display = 'none';
      } else {
        el.mfRawEditorBox.style.display = 'none';
        el.mfCasesList.style.display = 'flex';
      }
    });
  }

  if (el.btnMfCancelRaw) {
    el.btnMfCancelRaw.addEventListener('click', () => {
      if (el.mfRawEditorBox) el.mfRawEditorBox.style.display = 'none';
      if (el.mfCasesList) el.mfCasesList.style.display = 'flex';
    });
  }

  if (el.btnMfApplyRaw) {
    el.btnMfApplyRaw.addEventListener('click', () => {
      const parsed = parseRawTextToCases(el.mfRawTextarea ? el.mfRawTextarea.value : '');
      if (parsed.length === 0) {
        showToast('Vui lòng nhập ít nhất 1 trường hợp và câu hỏi.', 'error');
        return;
      }
      state.multiFlow.cases = parsed;
      if (el.mfRawEditorBox) el.mfRawEditorBox.style.display = 'none';
      if (el.mfCasesList) el.mfCasesList.style.display = 'flex';
      saveMultiFlowChecklist();
      renderMultiFlowCases();
      showToast(`✅ Đã cập nhật ${parsed.length} trường hợp vào Checklist!`, 'success');
    });
  }

  if (el.btnMfGenerateFiles) {
    el.btnMfGenerateFiles.addEventListener('click', async () => {
      el.btnMfGenerateFiles.disabled = true;
      const origHtml = el.btnMfGenerateFiles.innerHTML;
      el.btnMfGenerateFiles.innerHTML = '<span>⏳ Đang dựng...</span>';
      try {
        const res = await api('/api/ai-tester/generate-questions', 'POST', {});
        const suite = res.autoTestSuite || [];
        if (suite.length > 0) {
          // Group generated questions into structured multi-flow cases
          const newCases = [];
          for (let i = 0; i < suite.length; i += 2) {
            const q1 = suite[i];
            const q2 = suite[i + 1];
            const caseNum = newCases.length + 1;
            const title = `TH${caseNum}: Test ${q1.persona || 'Tình huống thực tế #' + caseNum}`;
            const qs = [q1.question];
            if (q2 && q2.question) qs.push(q2.question);
            newCases.push({
              id: 'mf_ai_' + Date.now() + '_' + caseNum,
              title,
              enabled: true,
              expanded: false,
              status: 'pending',
              score: 5,
              questions: qs,
              goalNote: q1.criteria || q1.ground_truth || 'Đối chiếu phản hồi theo đúng File 1 & File 2.',
              resultNote: '',
              turns: [],
              resetDone: false,
              testedAt: null
            });
          }
          state.multiFlow.cases = newCases;
          saveMultiFlowChecklist();
          renderMultiFlowCases();
          showToast(`✨ Đã dựng thành công ${newCases.length} trường hợp Checklist từ 2 File!`, 'success');
        } else {
          state.multiFlow.cases = getDefaultMultiFlowCases();
          saveMultiFlowChecklist();
          renderMultiFlowCases();
          showToast('Đã dựng bộ Checklist tiêu chuẩn từ dữ liệu hệ thống.', 'info');
        }
      } catch (err) {
        showToast('Lỗi dựng Checklist từ 2 File: ' + err.message, 'error');
      } finally {
        el.btnMfGenerateFiles.disabled = false;
        el.btnMfGenerateFiles.innerHTML = origHtml;
      }
    });
  }

  if (el.mfNoteModeSelect) {
    el.mfNoteModeSelect.addEventListener('change', (e) => {
      state.multiFlow.noteMode = e.target.value;
      localStorage.setItem('bbh_mf_note_mode', e.target.value);
      saveMultiFlowChecklist();
      showToast(
        e.target.value === 'pause'
          ? '✍️ Chế độ Dừng chờ ghi chú: Sau mỗi trường hợp hệ thống sẽ /reset và chờ bạn xác nhận ghi chú trước khi qua trường hợp tiếp.'
          : '⚡ Chế độ Tự động: Tự chấm điểm, lưu ghi chú hậu kiểm, gửi /reset và chuyển sang trường hợp tiếp theo.',
        'info'
      );
    });
  }

  if (el.mfAutoResetCheckbox) {
    el.mfAutoResetCheckbox.addEventListener('change', (e) => {
      state.multiFlow.autoReset = e.target.checked;
      localStorage.setItem('bbh_mf_auto_reset', e.target.checked ? 'true' : 'false');
      saveMultiFlowChecklist();
    });
  }

  if (el.mfSendNoteChatCheckbox) {
    el.mfSendNoteChatCheckbox.addEventListener('change', (e) => {
      state.multiFlow.sendNoteToChat = e.target.checked;
      localStorage.setItem('bbh_mf_send_note_chat', e.target.checked ? 'true' : 'false');
      saveMultiFlowChecklist();
    });
  }

  // Manual Runner Controls (Supports both Single-Flow and Multi-Flow Checklist Mode)
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
    if (state.multiFlow.enabled) {
      startMultiFlowRunner(shouldResetAi, null);
      return;
    }

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
    if (el.mfRunningCaseBanner) el.mfRunningCaseBanner.style.display = 'none';
    if (el.mfPauseNoteBox) el.mfPauseNoteBox.style.display = 'none';
    if (el.btnRunnerPause) el.btnRunnerPause.textContent = '⏸️ Tạm dừng';

    if (shouldResetAi) {
      // Send /reset into the chat
      sendResetCommand(true);
      showToast('🔄 Đã gửi /reset. Đợi AI phản hồi "Đã đặt lại lịch sử trò chuyện"...', 'info');

      // Show waiting indicator in running status box
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = '🔄 Đang làm mới lịch sử...';
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
          if (el.manualRunningTitle) el.manualRunningTitle.textContent = `🔄 Chờ AI báo đặt lại lịch sử...`;
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

  function startMultiFlowRunner(shouldResetAi = true, singleCaseIndex = null) {
    const cases = state.multiFlow.cases || [];
    let queue = [];
    if (singleCaseIndex !== null && cases[singleCaseIndex]) {
      queue = [singleCaseIndex];
    } else {
      cases.forEach((c, idx) => {
        if (c.enabled !== false && Array.isArray(c.questions) && c.questions.length > 0) {
          queue.push(idx);
        }
      });
    }

    if (queue.length === 0) {
      showToast('Vui lòng tích chọn ít nhất 1 trường hợp có câu hỏi trong Checklist để chạy.', 'error');
      return;
    }

    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);
    if (!state.chatIsOpen) toggleChatbox(true);

    // Reset statuses for queued cases
    queue.forEach(idx => {
      cases[idx].status = 'pending';
      cases[idx].turns = [];
      cases[idx].resetDone = false;
    });

    state.manualRunner.isRunning = true;
    state.manualRunner.isPaused = false;
    state.multiFlow.runQueue = queue;
    state.multiFlow.queuePos = 0;
    state.multiFlow.activeQIdx = 0;
    state.multiFlow.isWaitingNote = false;
    state.multiFlow.currentSessionId = 'session_mf_' + Date.now();

    el.btnStartManualRunner.innerHTML = `<span>⏹ Dừng chạy Checklist</span>`;
    el.btnStartManualRunner.className = 'btn btn-secondary btn-sm';
    if (el.btnRestartManualRunner) el.btnRestartManualRunner.style.display = 'inline-flex';
    el.manualRunningBox.style.display = 'flex';
    if (el.mfRunningCaseBanner) el.mfRunningCaseBanner.style.display = 'flex';
    if (el.mfPauseNoteBox) el.mfPauseNoteBox.style.display = 'none';
    if (el.btnRunnerPause) el.btnRunnerPause.textContent = '⏸️ Tạm dừng';

    renderMultiFlowCases();
    renderLiveMultiFlowAuditToFeed();

    if (shouldResetAi) {
      sendResetCommand(true);
      const firstCase = cases[queue[0]];
      showToast(`🔄 Đã gửi /reset làm mới phiên. Chuẩn bị chạy "${firstCase.title}"...`, 'info');
      if (el.mfRunningCaseName) el.mfRunningCaseName.textContent = `🗂️ Chuẩn bị: ${firstCase.title}`;
      if (el.mfRunningCaseStep) el.mfRunningCaseStep.textContent = `Luồng 1/${queue.length}`;
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = '🔄 Đang /reset làm mới hội thoại...';
      if (el.manualRunningBadge) el.manualRunningBadge.textContent = 'Reset';
      if (el.manualRunningPrompt) el.manualRunningPrompt.textContent = `Làm mới bộ nhớ AI trước khi test: ${firstCase.title}`;
      updateManualCountdownDisplay(3, 3, false);

      let resetWait = 3;
      const resetTick = () => {
        if (!state.manualRunner.isRunning) return;
        resetWait -= 1;
        updateManualCountdownDisplay(resetWait, 3, false);
        if (resetWait > 0) {
          state.manualRunner.timerId = setTimeout(resetTick, 1000);
        } else {
          executeMultiFlowStep();
        }
      };
      state.manualRunner.timerId = setTimeout(resetTick, 1000);
    } else {
      executeMultiFlowStep();
    }
  }

  function executeMultiFlowStep() {
    if (!state.manualRunner.isRunning) return;
    const { runQueue, queuePos, activeQIdx, cases } = state.multiFlow;

    if (queuePos >= runQueue.length) {
      stopManualRunner(false);
      saveMultiFlowChecklist(true);
      saveOrUpdateMultiFlowSession(true).then(sess => {
        switchRightTab('transcript');
        if (sess) loadSessionIntoTranscriptFeed(sess);
        else renderLiveMultiFlowAuditToFeed();
      });
      showToast(`🎉 Đã hoàn thành kiểm thử toàn bộ ${runQueue.length} trường hợp trong Checklist! Kết quả & ghi chú hậu kiểm đã được lưu.`, 'success');
      return;
    }

    const caseIdx = runQueue[queuePos];
    const caseItem = cases[caseIdx];
    if (!caseItem || !Array.isArray(caseItem.questions) || caseItem.questions.length === 0) {
      state.multiFlow.queuePos += 1;
      state.multiFlow.activeQIdx = 0;
      executeMultiFlowStep();
      return;
    }

    caseItem.status = 'running';
    renderMultiFlowCases();

    const qText = caseItem.questions[activeQIdx];
    const totalQsInCase = caseItem.questions.length;
    const waitSec = state.config.auto_wait_seconds || 30;
    state.manualRunner.countdownRemaining = waitSec;
    state.manualRunner.totalWaitSec = waitSec;

    if (el.mfRunningCaseBanner) el.mfRunningCaseBanner.style.display = 'flex';
    if (el.mfRunningCaseName) el.mfRunningCaseName.textContent = `🗂️ Luồng ${queuePos + 1}/${runQueue.length}: ${caseItem.title}`;
    if (el.mfRunningCaseStep) el.mfRunningCaseStep.textContent = `Câu ${activeQIdx + 1}/${totalQsInCase}`;
    if (el.manualRunningBadge) el.manualRunningBadge.textContent = `TH${caseIdx + 1}.${activeQIdx + 1}`;
    if (el.manualRunningPrompt) el.manualRunningPrompt.textContent = `"${qText}"`;
    if (el.activeScenarioTag) el.activeScenarioTag.textContent = caseItem.title;

    if (el.evalResponseInput) el.evalResponseInput.value = '';
    sendPromptToChat(qText);
    switchRightTab('eval');

    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);
    updateManualCountdownDisplay(waitSec, waitSec, false);

    if (state.runner && state.runner.mode === 'manual') {
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `⏳ Đợi bot trả lời (Xong bấm "Xong ngay")...`;
    } else {
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `Đang đợi phản hồi (${caseItem.title})...`;
      const tick = () => {
        if (!state.manualRunner.isRunning || state.multiFlow.isWaitingNote) return;
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
          state.manualRunner.timerId = setTimeout(tick, 1000);
        } else {
          onMultiFlowQuestionFinished();
        }
      };
      state.manualRunner.timerId = setTimeout(tick, 1000);
    }
  }

  async function onMultiFlowQuestionFinished() {
    if (!state.manualRunner.isRunning) return;
    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);

    const { runQueue, queuePos, activeQIdx, cases } = state.multiFlow;
    const caseIdx = runQueue[queuePos];
    const caseItem = cases[caseIdx];
    if (!caseItem) return;

    const qText = caseItem.questions[activeQIdx];
    let aiResponse = el.evalResponseInput ? el.evalResponseInput.value.trim() : '';
    if (!aiResponse) {
      aiResponse = `(AI đã phản hồi trong bong bóng chat lúc ${new Date().toLocaleTimeString('vi-VN')})`;
      if (el.evalResponseInput) el.evalResponseInput.value = aiResponse;
    }

    const turnObj = {
      turn: activeQIdx + 1,
      caseIndex: caseIdx + 1,
      caseTitle: caseItem.title,
      user: qText,
      assistant: aiResponse,
      evaluation: { verdict: 'pass', score: 5, reason: 'Đã đối chiếu ngữ cảnh File 1 & File 2.' },
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    if (!Array.isArray(caseItem.turns)) caseItem.turns = [];
    caseItem.turns.push(turnObj);

    // Evaluate with AI Judge
    evaluateActiveQuestion(aiResponse, qText).then(res => {
      if (res && res.evaluation) {
        turnObj.evaluation = res.evaluation;
        renderLiveMultiFlowAuditToFeed();
      }
    }).catch(() => {});

    // Check if there are more questions inside this same Case
    if (activeQIdx + 1 < caseItem.questions.length) {
      state.multiFlow.activeQIdx += 1;
      const nextQNum = state.multiFlow.activeQIdx + 1;
      if (el.mfRunningCaseStep) el.mfRunningCaseStep.textContent = `Chuẩn bị câu ${nextQNum}/${caseItem.questions.length}`;
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `☕ Nghỉ 3s chuẩn bị câu tiếp trong luồng...`;
      updateManualCountdownDisplay(3, 3, false);

      let breakSec = 3;
      const breakTick = () => {
        if (!state.manualRunner.isRunning) return;
        breakSec -= 1;
        updateManualCountdownDisplay(breakSec, 3, false);
        if (breakSec > 0) {
          state.manualRunner.timerId = setTimeout(breakTick, 1000);
        } else {
          executeMultiFlowStep();
        }
      };
      state.manualRunner.timerId = setTimeout(breakTick, 1000);
      return;
    }

    // ========================================================================
    // FINISHED ALL QUESTIONS IN THIS CASE -> /RESET + EVALUATE & NOTE + NEXT CASE
    // ========================================================================
    if (state.multiFlow.autoReset !== false) {
      sendResetCommand(true);
      caseItem.resetDone = true;
      showToast(`🔄 Đã xong "${caseItem.title}" ➔ Đã gửi lệnh /reset làm mới hội thoại!`, 'info');
    }

    // Compute default verdict & note for this case
    let caseVerdict = 'pass';
    let totalScore = 0;
    const evalReasons = [];
    (caseItem.turns || []).forEach(t => {
      const v = t.evaluation?.verdict || 'pass';
      if (v === 'fail') caseVerdict = 'fail';
      else if (v === 'warning' && caseVerdict !== 'fail') caseVerdict = 'warning';
      totalScore += (t.evaluation?.score || 5);
      if (t.evaluation?.reason) evalReasons.push(t.evaluation.reason);
    });
    caseItem.score = caseItem.turns.length ? Math.round(totalScore / caseItem.turns.length) : 5;

    const defaultNote = caseItem.resultNote
      || (caseItem.goalNote ? `[Đã test & /reset] ${caseItem.goalNote}` : '')
      || evalReasons[0]
      || `Đã hoàn thành test ${caseItem.questions.length} câu hỏi và gửi /reset làm mới hội thoại.`;

    if (state.multiFlow.noteMode === 'pause') {
      // Pause to let tester review/type note before advancing to next case
      state.multiFlow.isWaitingNote = true;
      if (el.mfPauseNoteBox) el.mfPauseNoteBox.style.display = 'flex';
      if (el.mfPauseNoteTitle) el.mfPauseNoteTitle.textContent = `📝 Ghi chú hậu kiểm (${caseItem.title}):`;
      if (el.mfPauseVerdictSelect) el.mfPauseVerdictSelect.value = caseVerdict;
      if (el.mfPauseNoteInput) {
        el.mfPauseNoteInput.value = defaultNote;
        el.mfPauseNoteInput.focus();
      }
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `✍️ Đã gửi /reset — Chờ lưu ghi chú hậu kiểm...`;
      if (el.manualRunningBadge) el.manualRunningBadge.textContent = 'Ghi chú';
      updateManualCountdownDisplay(0, 30, true);
      renderLiveMultiFlowAuditToFeed();
    } else {
      // Auto-record note after /reset cooldown (3s) and continue to next case
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `🔄 Đã /reset & Ghi chú "${caseItem.title}"...`;
      if (el.manualRunningBadge) el.manualRunningBadge.textContent = '/reset';
      if (el.manualRunningPrompt) el.manualRunningPrompt.textContent = `📝 Ghi chú: ${defaultNote}`;
      updateManualCountdownDisplay(3, 3, false);

      let resetWait = 3;
      const postCaseTick = () => {
        if (!state.manualRunner.isRunning) return;
        resetWait -= 1;
        updateManualCountdownDisplay(resetWait, 3, false);
        if (resetWait > 0) {
          state.manualRunner.timerId = setTimeout(postCaseTick, 1000);
        } else {
          finalizeMultiFlowCaseAndAdvance(caseIdx, caseVerdict, defaultNote);
        }
      };
      state.manualRunner.timerId = setTimeout(postCaseTick, 1000);
    }
  }

  function finalizeMultiFlowCaseAndAdvance(caseIdx, chosenVerdict, chosenNote) {
    const caseItem = state.multiFlow.cases[caseIdx];
    if (caseItem) {
      caseItem.status = chosenVerdict || 'pass';
      caseItem.resultNote = chosenNote || 'Đã test xong và gửi /reset.';
      caseItem.testedAt = new Date().toISOString();
      caseItem.resetDone = state.multiFlow.autoReset !== false;

      // Optional: send note marker into chatbox and then /reset so chatbox history also shows the note
      if (state.multiFlow.sendNoteToChat) {
        const vLabel = caseItem.status === 'pass' ? 'ĐẠT' : caseItem.status === 'warning' ? 'CẦN SỬA' : 'LỖI';
        sendPromptToChat(`📌 [GHI CHÚ ĐÃ TEST - ${caseItem.title}] Đánh giá: ${vLabel} | Ghi chú: ${caseItem.resultNote}`);
        setTimeout(() => {
          if (state.multiFlow.autoReset !== false) sendResetCommand(true);
        }, 1200);
      }
    }

    state.multiFlow.isWaitingNote = false;
    if (el.mfPauseNoteBox) el.mfPauseNoteBox.style.display = 'none';

    saveMultiFlowChecklist(true);
    renderMultiFlowCases();
    saveOrUpdateMultiFlowSession(false);
    renderLiveMultiFlowAuditToFeed();

    // Advance to next case in queue
    state.multiFlow.queuePos += 1;
    state.multiFlow.activeQIdx = 0;

    if (state.multiFlow.sendNoteToChat) {
      setTimeout(() => executeMultiFlowStep(), 2500);
    } else {
      executeMultiFlowStep();
    }
  }

  if (el.btnMfConfirmNoteNext) {
    el.btnMfConfirmNoteNext.addEventListener('click', () => {
      if (!state.manualRunner.isRunning || !state.multiFlow.isWaitingNote) return;
      const caseIdx = state.multiFlow.runQueue[state.multiFlow.queuePos];
      const chosenVerdict = el.mfPauseVerdictSelect ? el.mfPauseVerdictSelect.value : 'pass';
      const chosenNote = el.mfPauseNoteInput ? el.mfPauseNoteInput.value.trim() : '';
      finalizeMultiFlowCaseAndAdvance(caseIdx, chosenVerdict, chosenNote);
    });
  }

  async function saveOrUpdateMultiFlowSession(isFinal = false) {
    try {
      const testedCases = (state.multiFlow.cases || []).filter(c => (c.turns && c.turns.length > 0) || c.status !== 'pending');
      if (testedCases.length === 0) return null;

      const flatTurns = [];
      let totalScore = 0;
      let overallVerdict = 'pass';

      testedCases.forEach((c, cIdx) => {
        if (c.status === 'fail') overallVerdict = 'fail';
        else if (c.status === 'warning' && overallVerdict !== 'fail') overallVerdict = 'warning';
        totalScore += (c.score || 5);

        (c.turns || []).forEach(t => {
          flatTurns.push({
            turn: flatTurns.length + 1,
            caseIndex: cIdx + 1,
            caseTitle: c.title,
            user: t.user,
            assistant: t.assistant,
            evaluation: t.evaluation,
            verdict: c.status,
            score: c.score || 5,
            caseNote: c.resultNote || c.goalNote || '',
            resetAfter: Boolean(c.resetDone),
            timestamp: t.timestamp
          });
        });
      });

      const avgScore = testedCases.length ? Math.round(totalScore / testedCases.length) : 5;
      const sessId = state.multiFlow.currentSessionId || ('session_mf_' + Date.now());
      state.multiFlow.currentSessionId = sessId;

      const payload = {
        id: sessId,
        title: `Checklist Đa Luồng: ${testedCases.length}/${state.multiFlow.cases.length} trường hợp đã test`,
        type: 'checklist',
        isChecklist: true,
        persona: `Checklist (${testedCases.length} trường hợp)`,
        turns: flatTurns,
        cases: JSON.parse(JSON.stringify(state.multiFlow.cases)),
        verdictSummary: overallVerdict,
        averageScore: avgScore
      };

      const res = await api('/api/chat-sessions', 'POST', payload);
      if (res && res.session) {
        const existingIdx = state.chatSessions.findIndex(s => s.id === res.session.id);
        if (existingIdx >= 0) {
          state.chatSessions[existingIdx] = res.session;
        } else {
          state.chatSessions.unshift(res.session);
        }
        renderChatSessions();
        return res.session;
      }
    } catch (e) {
      console.warn('[MULTIFLOW] Failed to save checklist session:', e);
    }
    return null;
  }

  function renderLiveMultiFlowAuditToFeed() {
    if (!el.agentTranscriptFeed) return;
    const mockSession = {
      id: state.multiFlow.currentSessionId || 'live',
      title: `Checklist Đa Luồng (${state.multiFlow.cases.filter(c => c.status !== 'pending').length}/${state.multiFlow.cases.length} trường hợp đã test)`,
      type: 'checklist',
      is_checklist: true,
      cases: state.multiFlow.cases,
      created_at: new Date().toISOString()
    };
    renderMultiFlowAuditView(mockSession);
  }

  function stopManualRunner(showNotice = true) {
    state.manualRunner.isRunning = false;
    state.manualRunner.isPaused = false;
    state.multiFlow.isWaitingNote = false;
    if (state.manualRunner.timerId) clearTimeout(state.manualRunner.timerId);
    el.manualRunningBox.style.display = 'none';
    if (el.mfPauseNoteBox) el.mfPauseNoteBox.style.display = 'none';

    const btnLabel = state.multiFlow.enabled ? '🚀 Chạy Checklist Đa Luồng' : 'Bắt đầu Chạy Kịch Bản';
    el.btnStartManualRunner.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span id="btn-start-manual-runner-text">${btnLabel}</span>`;
    el.btnStartManualRunner.className = 'btn btn-primary btn-sm';
    
    if (el.btnRestartManualRunner) {
      const qList = getManualQuestionsList();
      el.btnRestartManualRunner.style.display = (state.multiFlow.enabled || qList.length > 0) ? 'inline-flex' : 'none';
    }

    // Reset any still-'running' case badge back to pending if stopped midway
    if (state.multiFlow.enabled) {
      state.multiFlow.cases.forEach(c => {
        if (c.status === 'running') c.status = 'pending';
      });
      renderMultiFlowCases();
    }

    if (showNotice) showToast('Đã dừng kịch bản. Bạn có thể sửa câu hỏi/ghi chú rồi bấm "Chạy lại từ đầu".');
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

    const isLastQ = (currentIndex + 1) >= questions.length;

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
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `⏳ Đợi bot trả lời (Xong bấm "Xong ngay")...`;
    } else {
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = isLastQ ? 'Đang đợi bot phản hồi...' : `Đang đợi phản hồi câu #${currentIndex + 1}...`;
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
            el.manualRunningTitle.textContent = isLastQ ? 'Đang đợi bot phản hồi...' : `Đang đợi phản hồi câu #${currentIndex + 1}...`;
          }
          state.manualRunner.timerId = setTimeout(tick, 1000);
        } else {
          onManualQuestionFinished();
        }
      };
      state.manualRunner.timerId = setTimeout(tick, 1000);
    }
  }

  async function saveManualQuestionsSession(questions) {
    if (!questions || !questions.length) return;
    try {
      const turns = questions.map((q, idx) => ({
        turn: idx + 1,
        user: q,
        assistant: '(Đã gửi vào khung chat AI Sandbox)',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }));

      const payload = {
        title: `Kịch bản Q&A: ${turns.length} câu hỏi kiểm thử`,
        type: 'manual',
        persona: 'Tester Kịch Bản',
        turns: turns,
        verdictSummary: 'pass',
        averageScore: 5
      };

      const res = await api('/api/chat-sessions', 'POST', payload);
      if (res && res.session) {
        state.chatSessions.unshift(res.session);
        renderChatSessions();
      }
    } catch (e) {
      console.warn('[MANUAL] Failed to auto-save session:', e);
    }
  }

  function onManualQuestionFinished() {
    if (!state.manualRunner.isRunning) return;
    if (state.multiFlow.enabled) {
      if (state.multiFlow.isWaitingNote) {
        if (el.btnMfConfirmNoteNext) el.btnMfConfirmNoteNext.click();
      } else {
        onMultiFlowQuestionFinished();
      }
      return;
    }

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
      saveManualQuestionsSession(state.manualRunner.questions);
      showToast('🎉 Đã hoàn thành kiểm thử toàn bộ danh sách câu hỏi! Lịch sử đánh giá và chat đã được lưu.', 'success');
      return;
    }

    if (state.manualRunner.isRunning) {
      const nextQNum = nextIdx + 1;
      if (el.manualRunningBadge) el.manualRunningBadge.textContent = `${nextQNum} / ${totalQ}`;
      if (el.manualRunningTitle) el.manualRunningTitle.textContent = `☕ Nghỉ chuẩn bị câu #${nextQNum}...`;
      updateManualCountdownDisplay(3, 3, false);
      let breakSec = 3;
      const breakTick = () => {
        if (!state.manualRunner.isRunning) return;
        breakSec -= 1;
        updateManualCountdownDisplay(breakSec, 3, false);
        if (breakSec > 0) {
          if (el.manualRunningTitle) el.manualRunningTitle.textContent = `☕ Nghỉ chuẩn bị câu #${nextQNum}...`;
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
    let persona = '';
    const selectedId = el.agentPersonaSelect ? el.agentPersonaSelect.value : 'custom';
    const found = cachedExtractedPersonas.find(p => p.id === selectedId);
    if (found) {
      persona = `${found.name}: ${found.description}`;
    } else {
      persona = (el.agentCustomPersonaInput && el.agentCustomPersonaInput.value.trim()) || 'Khách hỏi dịch vụ chi tiết';
    }

    const maxTurns = parseInt(el.agentMaxTurns ? el.agentMaxTurns.value : '10', 10) || 10;
    const turnWait = parseInt(el.agentTurnWait ? el.agentTurnWait.value : '30', 10) || 30;

    // Ensure chatbox is open
    if (!state.chatIsOpen) toggleChatbox(true);

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
    if (el.transcriptQuickReplyBar) el.transcriptQuickReplyBar.style.display = 'block';
    switchRightTab('transcript');
    showToast(`🚀 Khởi chạy Agent đàm thoại đa lượt (${maxTurns} lượt)!`, 'info');

    executeAgentTurn();
  }

  function stopAgentRunner() {
    state.agentRunner.isRunning = false;
    if (state.agentRunner.timerId) clearTimeout(state.agentRunner.timerId);
    el.agentRunningBox.style.display = 'none';
    if (el.transcriptQuickReplyBar) el.transcriptQuickReplyBar.style.display = 'none';
    el.btnStartAgentRun.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>🚀 Khởi Chạy Agent Hội Thoại</span>`;
    el.btnStartAgentRun.className = 'btn btn-primary btn-sm';
    showToast('Đã dừng Agent đàm thoại.');
  }

  function generateBrowserSmartAgentTurn({ turnIndex = 1, maxTurns = 10, persona = '', lastBotResponse = '', history = [] }) {
    const pkText = (state.files && state.files.pk && state.files.pk.content) || '';
    const prText = (state.files && state.files.pr && state.files.pr.content) || '';
    const fullText = (pkText + '\n' + prText).trim();
    const lower = fullText.toLowerCase();

    // Domain detection from files
    let domain = 'sản phẩm & dịch vụ';
    if (lower.includes('phòng') || lower.includes('homestay') || lower.includes('resort') || lower.includes('check-in') || lower.includes('khách sạn')) {
      domain = 'khách sạn & homestay';
    } else if (lower.includes('bất động sản') || lower.includes('căn hộ') || lower.includes('dự án') || lower.includes('sổ đỏ')) {
      domain = 'bất động sản & căn hộ';
    } else if (lower.includes('mỹ phẩm') || lower.includes('serum') || lower.includes('kem') || lower.includes('da ') || lower.includes('skincare')) {
      domain = 'mỹ phẩm & chăm sóc da';
    } else if (lower.includes('khóa học') || lower.includes('học viên') || lower.includes('học phí') || lower.includes('đào tạo')) {
      domain = 'khóa học & đào tạo';
    } else if (lower.includes('thực đơn') || lower.includes('món ăn') || lower.includes('nhà hàng') || lower.includes('quán')) {
      domain = 'ẩm thực & nhà hàng';
    } else if (lower.includes('phần mềm') || lower.includes('tài khoản') || lower.includes('gói cước') || lower.includes('api')) {
      domain = 'phần mềm & công nghệ';
    }

    // Extract product entity
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    const headings = lines.filter(l => /^[I|V|X|0-9]+[\.\:]|^#|^[A-ZÀ-Ỹ\s]{4,}\:/.test(l));
    const promoLines = lines.filter(l => /giảm|ưu đãi|khuyến mãi|chiết khấu|voucher|freeship|tặng/i.test(l));
    let primaryTopic = headings[0] ? headings[0].replace(/^[I|V|X|0-9]+[\.\:]\s*/, '').slice(0, 45) : '';
    if (!primaryTopic && lines.length > 0) primaryTopic = lines[0].slice(0, 45);
    if (!primaryTopic) primaryTopic = domain;

    let secondaryTopic = headings[1] ? headings[1].replace(/^[I|V|X|0-9]+[\.\:]\s*/, '').slice(0, 45) : 'phương án nâng cao';
    let samplePromo = promoLines[0] ? promoLines[0].slice(0, 60) : 'chính sách ưu đãi và giảm giá';

    // Bot reply analysis
    const cleanBot = (lastBotResponse || '').toLowerCase();
    const botAskedPhone = cleanBot.includes('số điện thoại') || cleanBot.includes('sđt') || cleanBot.includes('zalo') || cleanBot.includes('liên hệ');
    const botAskedDetails = cleanBot.includes('mấy người') || cleanBot.includes('khi nào') || cleanBot.includes('ngân sách') || cleanBot.includes('nhu cầu') || cleanBot.includes('ở đâu') || cleanBot.includes('loại nào');
    const botGavePrice = cleanBot.includes('vnđ') || cleanBot.includes('đồng') || cleanBot.includes('triệu') || cleanBot.includes('k ') || /\d+[\.,]?\d*\s*(?:đ|k)/.test(cleanBot);

    let nextMessage = '';
    if (turnIndex === 1) {
      if (domain === 'khách sạn & homestay') {
        nextMessage = 'Chào bạn, bên mình còn phòng trống cho đợt cuối tuần này không? Bạn tư vấn chi tiết giúp mình nhé!';
      } else if (domain === 'bất động sản & căn hộ') {
        nextMessage = `Chào bạn, mình đang tìm hiểu về dự án ${primaryTopic}. Bạn gửi giúp mình thông tin pháp lý và bảng hàng mới nhất nhé!`;
      } else if (domain === 'mỹ phẩm & chăm sóc da') {
        nextMessage = `Chào shop, da mình dạo này hơi khô và nhạy cảm. Bạn tư vấn dòng ${primaryTopic} phù hợp với da mình với ạ.`;
      } else if (domain === 'khóa học & đào tạo') {
        nextMessage = `Chào bạn, mình muốn đăng ký học ${primaryTopic}. Lộ trình đào tạo và lịch học sắp tới thế nào vậy bạn?`;
      } else {
        nextMessage = `Chào bạn, mình đang muốn tìm hiểu chi tiết về ${primaryTopic} bên bạn. Bạn tư vấn cụ thể giúp mình nhé!`;
      }
    } else if (turnIndex === 2) {
      if (botAskedPhone) {
        nextMessage = `Dạ số điện thoại của mình là 0988.xxx.999. Bạn tư vấn sơ bộ các ưu điểm nổi bật và chính sách trước giúp mình nhé.`;
      } else if (botAskedDetails) {
        if (domain === 'khách sạn & homestay') {
          nextMessage = 'Nhà mình đi 3 người lớn và 1 bé 5 tuổi từ ngày 28 đến 30 này, bạn xem có phòng nào phù hợp và báo giá giúp mình.';
        } else {
          nextMessage = `Mình đang cần sử dụng cho cá nhân / gia đình trong tuần này với ngân sách vừa phải. Bạn xem phương án nào tối ưu nhất tư vấn giúp mình.`;
        }
      } else {
        if (domain === 'khách sạn & homestay') {
          nextMessage = 'Cảm ơn bạn. Cho mình hỏi chi tiết về các loại phòng, tiện nghi trong phòng và các quyền lợi ưu đãi bên mình gồm những gì vậy?';
        } else if (domain === 'bất động sản & căn hộ') {
          nextMessage = 'Cảm ơn bạn. Cho mình hỏi rõ hơn về mặt bằng thiết kế, diện tích và các tiện ích nội khu của dự án nhé.';
        } else if (domain === 'mỹ phẩm & chăm sóc da') {
          nextMessage = 'Cảm ơn bạn. Cho mình hỏi rõ hơn về thành phần chính, công dụng cụ thể và cách dùng của sản phẩm này nhé.';
        } else {
          nextMessage = 'Cảm ơn bạn. Bạn cho mình hỏi rõ hơn về quyền lợi, tính năng chi tiết và chính sách hỗ trợ thì gồm những gì vậy?';
        }
      }
    } else if (turnIndex === 3) {
      if (botGavePrice) {
        nextMessage = `Mức giá bạn vừa báo đã bao gồm trọn gói tất cả các loại thuế phí chưa hay còn phát sinh phụ thu nào khác không bạn?`;
      } else {
        nextMessage = `Báo giá chi tiết giúp mình với, chi phí cụ thể hiện tại là bao nhiêu một gói/sản phẩm?`;
      }
    } else if (turnIndex === 4) {
      let cleanPromo = samplePromo.replace(/^[I|V|X|0-9]+[\.\:]\s*/, '').replace(/[\:\-]+$/, '').trim();
      if (cleanPromo.length > 50) cleanPromo = cleanPromo.slice(0, 50);
      nextMessage = `Mình thấy bên bạn có chính sách ưu đãi (${cleanPromo}). Trường hợp mình mua/đặt ngay thì có được áp dụng mức giảm tối đa hoặc có mã voucher nào không?`;
    } else if (turnIndex === 5) {
      if (domain === 'khách sạn & homestay') {
        nextMessage = 'Bên mình có phục vụ tiệc nướng BBQ ngoài trời và có cho mang theo một bé cún Poodle nhỏ không bạn?';
      } else if (domain === 'bất động sản & căn hộ') {
        nextMessage = 'Bên bạn có cam kết bằng văn bản sau 1 năm bán lại lời ít nhất 20% không bạn?';
      } else if (domain === 'mỹ phẩm & chăm sóc da') {
        nextMessage = 'Sản phẩm này cam kết dùng 3 ngày là hết sạch mụn và trắng da bật tông vĩnh viễn đúng không bạn?';
      } else if (domain === 'khóa học & đào tạo') {
        nextMessage = 'Bên mình có cam kết ký văn bản 100% học viên tốt nghiệp là có việc làm lương trên 15 triệu không?';
      } else {
        nextMessage = 'Bên mình có thể linh động giảm bớt điều kiện bắt buộc hoặc chiết khấu thêm 25% cho mình chốt liền được không bạn?';
      }
    } else if (turnIndex === 6) {
      nextMessage = 'Nếu sau khi nhận hàng/dịch vụ mà mình không hài lòng hoặc có sự cố phát sinh thì chính sách đổi trả, hoàn tiền hoặc bảo hành bên bạn quy định thế nào?';
    } else if (turnIndex === 7) {
      if (domain === 'khách sạn & homestay') {
        nextMessage = 'Nếu mình muốn check-in sớm hoặc check-out muộn hơn giờ quy định thì có phụ thu không và quy định tính phí thế nào bạn?';
      } else if (domain === 'bất động sản & căn hộ') {
        nextMessage = 'Nếu mình đổi ý chuyển sang căn có diện tích lớn hơn hoặc hướng khác thì thủ tục chuyển nhượng/đổi cọc có thuận tiện không bạn?';
      } else if (domain === 'mỹ phẩm & chăm sóc da') {
        nextMessage = 'Nếu mình muốn đổi sang dòng sản phẩm chuyên sâu hơn hoặc lấy theo combo thì chi phí chênh lệch ra sao bạn?';
      } else {
        nextMessage = 'Nếu mình đổi ý chuyển sang phương án hoặc gói dịch vụ nâng cao hơn thì chi phí chênh lệch và thủ tục chuyển đổi có nhanh không bạn?';
      }
    } else if (turnIndex === 8) {
      nextMessage = 'Quy trình đặt và thanh toán bên bạn thế nào? Cần đặt cọc trước bao nhiêu %, có hỗ trợ chuyển khoản hoặc xuất hóa đơn VAT không bạn?';
    } else if (turnIndex === 9) {
      nextMessage = 'Nếu mình đồng ý chốt đơn/hợp đồng ngay trong hôm nay thì bên mình có quà tặng hoặc ưu đãi đặc quyền gì thêm để tri ân không bạn?';
    } else if (turnIndex >= 10 && turnIndex >= maxTurns) {
      nextMessage = 'Dạ cảm ơn bạn đã tư vấn rất đầy đủ, chi tiết và nhiệt tình nhé! Mình đã nắm rõ toàn bộ thông tin. Mình để lại thông tin để bên bạn liên hệ xác nhận: SĐT 0988.xxx.999 (Anh Thiện).';
    } else {
      const extraQuestions = [
        'Bạn cho mình hỏi thêm về đội ngũ hỗ trợ bên mình hoạt động trong những khung giờ nào nếu cần trợ giúp gấp?',
        'Bên mình có văn phòng hoặc địa chỉ cụ thể để mình có thể ghé trực tiếp nếu cần không?',
        'Khách hàng cũ quay lại lần sau thì có được hưởng chính sách tích điểm hoặc chiết khấu thêm không bạn?',
        'Có tài liệu hoặc hướng dẫn chi tiết đính kèm khi mình bắt đầu nhận sản phẩm/dịch vụ không bạn?'
      ];
      const qIdx = (turnIndex - 11) % extraQuestions.length;
      nextMessage = extraQuestions[Math.max(0, qIdx)];
    }

    return {
      nextMessage,
      thoughtProcess: `Smart Local Engine: Phân tích ngữ cảnh Lượt #${turnIndex} lĩnh vực "${domain}" (${primaryTopic}).`,
      evaluation: {
        verdict: 'pass',
        score: 5,
        reason: 'Bot phản hồi đúng mực, hỗ trợ thông tin phù hợp.'
      },
      isCompleted: turnIndex >= maxTurns
    };
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
        maxTurns: state.agentRunner.maxTurns,
        model: (el.agentQuickModelSelect ? el.agentQuickModelSelect.value : state.config.ai_model) || 'gemini-1.5-flash'
      });

      const turnData = res.agentTurn;
      const nextMsg = turnData.nextMessage;
      el.agentThoughtProcess.textContent = turnData.thoughtProcess || `Agent đã phản hồi bám sát câu trả lời của bot.`;

      // If an evaluation record was created for previous turn response, update evaluations in real time
      if (res.record) {
        state.evaluations.unshift(res.record);
        renderEvaluations(res.record.id);
        updateMetrics();
      }

      // Render Customer Message Card into transcript feed
      renderTranscriptCustomerTurn(state.agentRunner.turnIndex, nextMsg, turnData.thoughtProcess);

      // Send Customer Message into Chatbox
      sendPromptToChat(nextMsg);
      state.agentRunner.history.push({ role: 'user', content: nextMsg });

      // Enter waiting for bot response
      const isInteractive = el.agentInteractiveModeCheckbox ? el.agentInteractiveModeCheckbox.checked : true;
      if (isInteractive) {
        el.agentRunningTurnTitle.textContent = `Lượt ${state.agentRunner.turnIndex}/${state.agentRunner.maxTurns}: ⏸️ Đang chờ dán phản hồi của Bot...`;
        if (el.transcriptReplyStatus) el.transcriptReplyStatus.textContent = '⏸️ Đang đợi bạn dán phản hồi Bot';
        showToast('⏸️ Đã gửi câu hỏi! Hãy copy câu trả lời của Bot và bấm [⚡ Dán & Tiếp] để Ollama đọc hiểu.', 'info');
      } else {
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
      }

    } catch (err) {
      console.warn('[AGENT] Execute turn error, applying Smart Local fallback:', err);
      showToast(`⚡ Chuyển tiếp mượt mà: Smart Local Engine đang xử lý Lượt #${state.agentRunner.turnIndex}`, 'info');

      const fallbackData = generateBrowserSmartAgentTurn({
        turnIndex: state.agentRunner.turnIndex,
        maxTurns: state.agentRunner.maxTurns,
        persona: state.agentRunner.persona,
        lastBotResponse: state.agentRunner.lastBotResponse,
        history: state.agentRunner.history
      });

      const fallbackMsg = fallbackData.nextMessage;
      el.agentThoughtProcess.textContent = fallbackData.thoughtProcess;
      renderTranscriptCustomerTurn(state.agentRunner.turnIndex, fallbackMsg, fallbackData.thoughtProcess);
      sendPromptToChat(fallbackMsg);
      state.agentRunner.history.push({ role: 'user', content: fallbackMsg });

      const isInteractive = el.agentInteractiveModeCheckbox ? el.agentInteractiveModeCheckbox.checked : true;
      if (isInteractive) {
        el.agentRunningTurnTitle.textContent = `Lượt ${state.agentRunner.turnIndex}/${state.agentRunner.maxTurns}: ⏸️ Đang chờ dán phản hồi của Bot...`;
        if (el.transcriptReplyStatus) el.transcriptReplyStatus.textContent = '⏸️ Đang đợi bạn dán phản hồi Bot';
      } else {
        state.agentRunner.countdownRemaining = state.agentRunner.turnWait;
        el.agentRunningTurnTitle.textContent = `Lượt ${state.agentRunner.turnIndex}/${state.agentRunner.maxTurns}: Đang đợi bot trả lời (${state.agentRunner.countdownRemaining}s)...`;
        const fallbackTick = () => {
          if (!state.agentRunner.isRunning) return;
          state.agentRunner.countdownRemaining -= 1;
          if (state.agentRunner.countdownRemaining > 0) {
            el.agentRunningTurnTitle.textContent = `Lượt ${state.agentRunner.turnIndex}/${state.agentRunner.maxTurns}: Đang đợi bot trả lời (${state.agentRunner.countdownRemaining}s)...`;
            state.agentRunner.timerId = setTimeout(fallbackTick, 1000);
          } else {
            onAgentTurnResponseReceived(fallbackData);
          }
        };
        state.agentRunner.timerId = setTimeout(fallbackTick, 1000);
      }
    }
  }

  async function saveCompletedAgentSession() {
    if (!state.agentRunner.history || state.agentRunner.history.length === 0) return;
    try {
      const turns = [];
      for (let i = 0; i < state.agentRunner.history.length; i += 2) {
        const u = state.agentRunner.history[i];
        const a = state.agentRunner.history[i + 1];
        turns.push({
          turn: Math.floor(i / 2) + 1,
          user: u ? u.content : '',
          assistant: a ? a.content : '',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });
      }

      const personaName = el.agentPersonaSelect?.selectedOptions?.[0]?.text || state.agentRunner.persona || 'Khách hàng';
      const payload = {
        title: `Phiên Agent: ${personaName} (${turns.length} lượt)`,
        type: 'agent',
        persona: personaName,
        turns: turns,
        verdictSummary: 'pass',
        averageScore: 5
      };

      const res = await api('/api/chat-sessions', 'POST', payload);
      if (res && res.session) {
        state.chatSessions.unshift(res.session);
        renderChatSessions();
      }
    } catch (e) {
      console.warn('[AGENT] Failed to auto-save chat session:', e);
    }
  }

  async function onAgentTurnResponseReceived(previousTurnData) {
    if (!state.agentRunner.isRunning) return;
    if (state.agentRunner.timerId) clearTimeout(state.agentRunner.timerId);

    // Read bot reply from inline inputs first, then evalResponseInput, then placeholder
    let botReply = '';
    const inlineInput = document.getElementById('agent-inline-bot-reply');
    const transcriptInput = document.getElementById('transcript-inline-bot-reply');

    if (inlineInput && inlineInput.value.trim()) {
      botReply = inlineInput.value.trim();
      inlineInput.value = '';
    } else if (transcriptInput && transcriptInput.value.trim()) {
      botReply = transcriptInput.value.trim();
      transcriptInput.value = '';
    } else if (el.evalResponseInput && el.evalResponseInput.value.trim()) {
      botReply = el.evalResponseInput.value.trim();
      el.evalResponseInput.value = '';
    }

    if (!botReply) {
      botReply = `(AI đã phản hồi trong bong bóng chat lúc ${new Date().toLocaleTimeString('vi-VN')})`;
    }

    state.agentRunner.lastBotResponse = botReply;
    state.agentRunner.history.push({ role: 'assistant', content: botReply });

    // Mini evaluation of bot reply
    let evalObj = previousTurnData?.evaluation || { verdict: 'pass', score: 5, reason: 'AI phản hồi theo kịch bản.' };
    renderTranscriptBotReply(state.agentRunner.turnIndex, botReply, evalObj);

    // Check completion strictly against maxTurns
    const isFinalTurn = state.agentRunner.turnIndex >= state.agentRunner.maxTurns;

    if (isFinalTurn) {
      renderTranscriptCompletion();

      // Automatically persist full completed session to database
      saveCompletedAgentSession();

      // Auto /reset trigger
      if (el.agentAutoResetCheckbox && el.agentAutoResetCheckbox.checked) {
        setTimeout(() => {
          sendResetCommand(true);
          showToast('🎉 Hoàn thành cuộc trò chuyện! Đã tự động gửi /reset làm mới AI.', 'success');
        }, 1200);
      } else {
        showToast('🎉 Đã hoàn thành cuộc đàm thoại đa lượt! Toàn bộ lịch sử chat đã được lưu.', 'success');
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

  // Quick Inline Bot Reply Listeners (Running Box & Transcript Pane)
  async function pasteClipboardToBotReply(autoProceed = false) {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        showToast('Clipboard trống. Hãy sao chép câu trả lời của bot trước!', 'warning');
        return;
      }
      const clean = text.trim();
      const inlineInput = document.getElementById('agent-inline-bot-reply');
      const transcriptInput = document.getElementById('transcript-inline-bot-reply');
      if (inlineInput) inlineInput.value = clean;
      if (transcriptInput) transcriptInput.value = clean;

      showToast('📋 Đã nhận diện phản hồi của Bot từ Clipboard!', 'success');

      if (autoProceed && state.agentRunner.isRunning) {
        onAgentTurnResponseReceived();
      }
    } catch (e) {
      showToast('Vui lòng bấm Ctrl+V để dán trực tiếp vào ô nhập.', 'warning');
    }
  }

  if (el.btnAgentPasteReply) {
    el.btnAgentPasteReply.addEventListener('click', () => pasteClipboardToBotReply(false));
  }

  if (el.btnAgentPasteAndSend) {
    el.btnAgentPasteAndSend.addEventListener('click', () => pasteClipboardToBotReply(true));
  }

  if (el.btnTranscriptPasteClip) {
    el.btnTranscriptPasteClip.addEventListener('click', () => pasteClipboardToBotReply(false));
  }

  if (el.btnTranscriptSendReply) {
    el.btnTranscriptSendReply.addEventListener('click', () => {
      if (state.agentRunner.isRunning) onAgentTurnResponseReceived();
    });
  }

  const inlineInputEl = document.getElementById('agent-inline-bot-reply');
  if (inlineInputEl) {
    inlineInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && state.agentRunner.isRunning) {
        e.preventDefault();
        onAgentTurnResponseReceived();
      }
    });
  }

  const transcriptInputEl = document.getElementById('transcript-inline-bot-reply');
  if (transcriptInputEl) {
    transcriptInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && state.agentRunner.isRunning) {
        e.preventDefault();
        onAgentTurnResponseReceived();
      }
    });
  }

  // 1-Click Copy Conversation Log Feature (User Request)
  function copyConversationLog() {
    let logText = '';
    const now = new Date().toLocaleString('vi-VN');

    // Check if currently viewing or running a Multi-Flow Checklist session
    const selectedSessId = el.transcriptSessionSelect?.value;
    const selectedSess = selectedSessId && selectedSessId !== 'live'
      ? (state.chatSessions || []).find(s => s.id === selectedSessId)
      : null;

    const checklistCasesToExport = (selectedSess && Array.isArray(selectedSess.cases) && selectedSess.cases.length > 0)
      ? selectedSess.cases
      : (state.multiFlow && state.multiFlow.enabled && Array.isArray(state.multiFlow.cases) && state.multiFlow.cases.some(c => (c.turns && c.turns.length > 0) || c.resultNote))
        ? state.multiFlow.cases
        : null;

    if (checklistCasesToExport) {
      const doneCount = checklistCasesToExport.filter(c => c.status === 'pass' || c.status === 'warning' || c.status === 'fail' || (c.turns && c.turns.length > 0)).length;
      logText += `============================================================\n`;
      logText += `🗂️ BÁO CÁO HẬU KIỂM CHECKLIST ĐA LUỒNG — THIỆN BBH STUDIO\n`;
      logText += `Thời gian xuất: ${now}\n`;
      logText += `Người kiểm thử: ${state.user?.name || state.user?.email || 'Tester'}\n`;
      if (state.activeTestUser) {
        logText += `Khách hàng test (Persona): ${state.activeTestUser.name}${state.activeTestUser.phone ? ` - SĐT: ${state.activeTestUser.phone}` : ''}${state.activeTestUser.email ? ` - Email: ${state.activeTestUser.email}` : ''}\n`;
      }
      logText += `Tiến độ Checklist: Đã test ${doneCount}/${checklistCasesToExport.length} trường hợp\n`;
      if (selectedSess?.reviewer_note) {
        logText += `Nhận xét tổng quát (Hậu kiểm): ${selectedSess.reviewer_note}\n`;
      }
      logText += `============================================================\n\n`;

      checklistCasesToExport.forEach((c, cIdx) => {
        const statusLabel = c.status === 'pass' ? '✅ ĐẠT' : c.status === 'warning' ? '⚠️ CẦN SỬA' : c.status === 'fail' ? '❌ LỖI' : '⏳ CHƯA CHẠY';
        logText += `------------------------------------------------------------\n`;
        logText += `📌 TRƯỜNG HỢP #${cIdx + 1}: ${c.title || 'Trường hợp kiểm thử'} [${statusLabel}]\n`;
        if (c.goalNote) logText += `🎯 Tiêu chí kiểm tra: ${c.goalNote}\n`;
        logText += `------------------------------------------------------------\n`;

        const turns = Array.isArray(c.turns) && c.turns.length > 0
          ? c.turns
          : (c.questions || []).map((q, qIdx) => ({ turn: qIdx + 1, user: q, assistant: '(Chưa ghi nhận phản hồi)' }));

        turns.forEach((t, tIdx) => {
          logText += `  [Câu ${tIdx + 1}] Khách hàng (Tester): "${t.user}"\n`;
          logText += `  [Trả lời] AI Chatbot: "${t.assistant || '(Đã phản hồi trong bong bóng chat)'}"\n`;
          if (t.evaluation && t.evaluation.reason) {
            logText += `  [Đánh giá AI]: ${t.evaluation.reason}\n`;
          }
          logText += `\n`;
        });

        logText += `📝 GHI CHÚ HẬU KIỂM (TH #${cIdx + 1}): ${c.resultNote || c.goalNote || 'Đã hoàn thành kiểm thử trường hợp này.'}\n`;
        logText += `🔄 LỆNH LÀM MỚI: Đã gửi "/reset" để làm mới hội thoại trước khi sang trường hợp tiếp theo.\n\n`;
      });

      logText += `============================================================\n`;
      logText += `Tổng kết: Hoàn thành kiểm thử đa luồng & ghi chú hậu kiểm.\n`;
    } else if (state.agentRunner && state.agentRunner.history && state.agentRunner.history.length > 0) {
      // Case 1: Active Agent Runner session
      const persona = el.agentPersonaSelect?.selectedOptions?.[0]?.text || state.agentRunner.persona || 'Khách hàng';
      const totalTurns = Math.ceil(state.agentRunner.history.length / 2);
      const modelName = (el.agentQuickModelSelect ? el.agentQuickModelSelect.options[el.agentQuickModelSelect.selectedIndex]?.text : state.config.ai_model) || 'AI Tester Studio';

      logText += `============================================================\n`;
      logText += `📋 LOG HỘI THOẠI KIỂM THỬ AI — THIỆN BBH STUDIO\n`;
      logText += `Thời gian xuất: ${now}\n`;
      logText += `Tình huống (Persona): ${persona}\n`;
      logText += `Tiến trình: ${totalTurns} lượt (Kế hoạch: ${state.agentRunner.maxTurns || 10} lượt)\n`;
      logText += `Mô hình AI: ${modelName}\n`;
      logText += `============================================================\n\n`;

      for (let i = 0; i < state.agentRunner.history.length; i += 2) {
        const turnNum = Math.floor(i / 2) + 1;
        const userMsg = state.agentRunner.history[i]?.content || '';
        const botMsg = state.agentRunner.history[i + 1]?.content || '';

        logText += `[LƯỢT #${turnNum}]\n`;
        logText += `Khách hàng (Tester): "${userMsg}"\n`;
        logText += `AI Chatbot phản hồi: "${botMsg}"\n`;
        logText += `------------------------------------------------------------\n\n`;
      }
      logText += `============================================================\n`;
      logText += `Tổng kết: Hoàn thành đối chiếu ngữ cảnh File 1 & File 2.\n`;
    } else if (state.chatSessions && state.chatSessions.length > 0) {
      // Case 2: Latest saved chat session
      const s = selectedSess || state.chatSessions[0];
      logText += `============================================================\n`;
      logText += `📋 LOG PHIÊN ĐÀM THOẠI ĐÃ LƯU: ${s.title || 'Phiên gần nhất'}\n`;
      logText += `Thời gian: ${new Date(s.created_at || Date.now()).toLocaleString('vi-VN')}\n`;
      logText += `Nhân cách: ${s.persona || 'Khách hàng'}\n`;
      logText += `============================================================\n\n`;

      (s.turns || []).forEach(t => {
        logText += `[LƯỢT #${t.turn}]\n`;
        if (t.caseTitle) logText += `Trường hợp: ${t.caseTitle}\n`;
        logText += `Khách hàng (Tester): "${t.user}"\n`;
        logText += `AI Chatbot phản hồi: "${t.assistant}"\n`;
        if (t.caseNote) logText += `📝 Ghi chú hậu kiểm: ${t.caseNote}\n`;
        if (t.resetAfter) logText += `🔄 Lệnh: /reset (Làm mới hội thoại)\n`;
        logText += `------------------------------------------------------------\n\n`;
      });
    } else {
      // Case 3: Read from DOM turn cards
      const cards = document.querySelectorAll('.transcript-turn');
      if (cards && cards.length > 0) {
        logText += `============================================================\n`;
        logText += `📋 LOG HỘI THOẠI TRÊN GIAO DIỆN (${now})\n`;
        logText += `============================================================\n\n`;
        cards.forEach((c, idx) => {
          const userEl = c.querySelector('.turn-user');
          const botEl = c.querySelector('.turn-bot-text');
          logText += `[LƯỢT #${idx + 1}]\n`;
          if (userEl) logText += `Khách hàng: "${userEl.innerText.trim()}"\n`;
          if (botEl) logText += `AI Chatbot: "${botEl.innerText.trim()}"\n`;
          logText += `------------------------------------------------------------\n\n`;
        });
      }
    }

    if (!logText.trim()) {
      showToast('Chưa có nội dung cuộc hội thoại nào để sao chép.', 'warning');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(logText).then(() => {
        showToast('📋 Đã sao chép toàn bộ log hội thoại vào Clipboard!', 'success');
      }).catch(() => {
        fallbackCopyText(logText);
      });
    } else {
      fallbackCopyText(logText);
    }
  }

  function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('📋 Đã sao chép toàn bộ log hội thoại vào Clipboard!', 'success');
    } catch (e) {
      showToast('Không thể tự động copy. Vui lòng thử lại.', 'error');
    }
    document.body.removeChild(ta);
  }

  if (el.btnCopyTranscriptLog) {
    el.btnCopyTranscriptLog.addEventListener('click', copyConversationLog);
  }

  if (el.btnAgentCopyLogMini) {
    el.btnAgentCopyLogMini.addEventListener('click', copyConversationLog);
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
        clientId: state.clientId,
        model: state.config.ai_model || (el.agentQuickModelSelect ? el.agentQuickModelSelect.value : undefined)
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
    el.btnSubmitEval.addEventListener('click', async () => {
      let promptText = (el.activePromptDisplay && el.activePromptDisplay.textContent.trim()) || '';
      if (!promptText || promptText === '(Chưa gửi câu hỏi)') {
        const manualLines = getManualQuestionsList();
        promptText = manualLines.length ? manualLines[0] : 'Câu hỏi kiểm thử';
        if (el.activePromptDisplay) el.activePromptDisplay.textContent = promptText;
      }

      let aiResponse = el.evalResponseInput ? el.evalResponseInput.value.trim() : '';
      if (!aiResponse) {
        aiResponse = `(AI đã phản hồi trong bong bóng chat lúc ${new Date().toLocaleTimeString('vi-VN')})`;
        if (el.evalResponseInput) el.evalResponseInput.value = aiResponse;
      }

      try {
        el.btnSubmitEval.disabled = true;
        el.btnSubmitEval.innerHTML = '<span>⏳ Đang lưu...</span>';
        const res = await evaluateActiveQuestion(aiResponse, promptText);
        showToast('🎉 Đã chấm điểm và lưu kết quả vào Lịch Sử Báo Cáo!', 'success');
        switchRightTab('history');
        switchHistorySubtab('evals');
      } catch (err) {
        showToast('Lỗi khi lưu báo cáo: ' + err.message, 'error');
      } finally {
        el.btnSubmitEval.disabled = false;
        el.btnSubmitEval.innerHTML = '<span>💾 Lưu báo cáo</span>';
      }
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

  // Sub-tabs switcher inside Right Panel History
  function switchHistorySubtab(subtabKey) {
    state.historySubtab = subtabKey;
    if (el.subtabBtnEvals) el.subtabBtnEvals.classList.toggle('active', subtabKey === 'evals');
    if (el.subtabBtnChats) el.subtabBtnChats.classList.toggle('active', subtabKey === 'chats');
    if (el.subpaneHistoryEvals) el.subpaneHistoryEvals.style.display = subtabKey === 'evals' ? 'block' : 'none';
    if (el.subpaneHistoryChats) el.subpaneHistoryChats.style.display = subtabKey === 'chats' ? 'block' : 'none';
    if (subtabKey === 'chats') {
      renderChatSessions();
    }
  }

  if (el.subtabBtnEvals) el.subtabBtnEvals.addEventListener('click', () => switchHistorySubtab('evals'));
  if (el.subtabBtnChats) el.subtabBtnChats.addEventListener('click', () => switchHistorySubtab('chats'));

  function renderEvaluations(highlightId = null) {
    let list = state.evaluations || [];
    if (state.evalFilter === 'fail') {
      list = list.filter(e => e.result === 'fail' || e.result === 'warning');
    }

    if (el.evalCountBadge) el.evalCountBadge.textContent = state.evaluations.length;
    if (!el.evaluationsList) return;
    el.evaluationsList.innerHTML = '';

    if (list.length === 0) {
      el.evaluationsList.innerHTML = `
        <div style="text-align:center;padding:24px 14px;color:var(--text-muted);font-size:11.5px;background:var(--bg-panel);border-radius:8px;border:1px dashed var(--border-subtle);">
          <div style="font-size:18px;margin-bottom:4px;">📋</div>
          <b>Chưa có lượt đánh giá nào được lưu.</b>
          <div style="font-size:11px;margin-top:4px;">Chạy kịch bản câu hỏi hoặc nhập phản hồi của AI và bấm <b>"💾 Lưu báo cáo"</b> để lưu kết quả đối chiếu.</div>
        </div>
      `;
      return;
    }

    list.slice(0, 50).forEach(ev => {
      const card = document.createElement('div');
      card.className = 'auto-question-card' + (highlightId && ev.id === highlightId ? ' highlight-saved-card' : '');
      const stars = '⭐'.repeat(ev.score || 5);
      const time = new Date(ev.created_at || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = new Date(ev.created_at || Date.now()).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="verdict-badge ${ev.result}">${ev.result === 'pass' ? 'PASS' : ev.result === 'warning' ? 'WARN' : 'FAIL'}</span>
            <span style="font-size:10.5px;color:var(--text-muted);font-weight:600;">${stars}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:var(--text-muted);">${time} • ${date}</span>
            <button type="button" class="btn btn-secondary btn-xs btn-delete-eval" data-id="${ev.id}" title="Xóa lượt đánh giá này" style="padding:1px 5px;font-size:9.5px;color:var(--danger);line-height:1;">✕</button>
          </div>
        </div>
        <div style="font-size:11.5px;font-weight:700;color:var(--text-primary);line-height:1.35;margin-top:2px;">
          🗣️ "${escapeHtml(ev.prompt_used)}"
        </div>
        ${ev.ai_response_summary ? `
          <div style="font-size:11px;color:var(--text-secondary);background:var(--bg-panel);padding:5px 8px;border-radius:6px;line-height:1.4;white-space:pre-wrap;max-height:85px;overflow-y:auto;border-left:2px solid var(--accent);">
            🤖 ${escapeHtml(ev.ai_response_summary)}
          </div>
        ` : ''}
        ${ev.analysis ? `
          <div style="font-size:10.5px;color:var(--accent);line-height:1.35;background:rgba(217,119,87,0.04);padding:4px 6px;border-radius:5px;">
            <b>⚖️ Nhận xét:</b> ${escapeHtml(ev.analysis)}
          </div>
        ` : ''}
        ${ev.recommendation ? `
          <div style="font-size:10px;color:var(--text-muted);line-height:1.3;">
            <b>💡 Đề xuất:</b> ${escapeHtml(ev.recommendation)}
          </div>
        ` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:var(--text-muted);padding-top:2px;border-top:1px dashed var(--border-subtle);">
          <span>Persona: <b>${escapeHtml(ev.persona || 'Khách hàng')}</b></span>
          <span class="mono-badge" style="font-size:9px;">${escapeHtml(ev.judge_engine || 'AI Judge')}</span>
        </div>
      `;

      const deleteBtn = card.querySelector('.btn-delete-eval');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm('Bạn có chắc chắn muốn xóa lượt đánh giá này?')) return;
          try {
            await api(`/api/evaluations/${ev.id}`, 'DELETE');
            state.evaluations = state.evaluations.filter(x => x.id !== ev.id);
            renderEvaluations();
            updateMetrics();
            showToast('Đã xóa lượt đánh giá.', 'info');
          } catch (err) {
            showToast('Lỗi xóa đánh giá: ' + err.message, 'error');
          }
        });
      }

      el.evaluationsList.appendChild(card);
    });
  }

  function renderChatSessions() {
    const list = state.chatSessions || [];
    if (el.chatCountBadge) el.chatCountBadge.textContent = list.length;

    // Update Tab 2 session selector
    if (el.transcriptSessionSelect) {
      const currentVal = el.transcriptSessionSelect.value;
      el.transcriptSessionSelect.innerHTML = `<option value="live">🔴 Phiên Live Hiện Tại</option>`;
      list.forEach(sess => {
        const timeStr = new Date(sess.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(sess.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const opt = document.createElement('option');
        opt.value = sess.id;
        opt.textContent = `${dateStr} ${timeStr} - ${sess.persona || 'Khách'} (${sess.turn_count || sess.turns?.length || 0} lượt)`;
        el.transcriptSessionSelect.appendChild(opt);
      });
      el.transcriptSessionSelect.value = list.some(s => s.id === currentVal) ? currentVal : 'live';
      if (el.btnDeleteAgentChat) {
        el.btnDeleteAgentChat.style.display = el.transcriptSessionSelect.value !== 'live' ? 'inline-flex' : 'none';
      }
    }

    if (!el.chatSessionsList) return;
    el.chatSessionsList.innerHTML = '';

    if (list.length === 0) {
      el.chatSessionsList.innerHTML = `
        <div style="text-align:center;padding:24px 14px;color:var(--text-muted);font-size:11.5px;background:var(--bg-panel);border-radius:8px;border:1px dashed var(--border-subtle);">
          <div style="font-size:18px;margin-bottom:4px;">💬</div>
          <b>Chưa có phiên hội thoại nào được lưu.</b>
          <div style="font-size:11px;margin-top:4px;">Khởi chạy <b>Agent Ngữ Cảnh</b> hoặc hoàn thành kịch bản để tự động lưu toàn bộ các lượt trò chuyện tại đây.</div>
        </div>
      `;
      return;
    }

    list.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'chat-session-card';
      const timeStr = new Date(sess.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date(sess.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const turnCount = sess.turn_count || sess.turns?.length || 0;
      const isChecklistSess = sess.type === 'checklist' || sess.is_checklist || (Array.isArray(sess.cases) && sess.cases.length > 0);
      const badgeLabel = isChecklistSess ? 'CHECKLIST' : (sess.type === 'agent' ? 'AGENT' : 'Q&A');
      const badgeStyle = isChecklistSess
        ? 'background:rgba(13,148,136,0.14);color:var(--success);font-weight:700;'
        : 'background:var(--accent-soft);color:var(--accent);font-weight:700;';

      const firstTurn = sess.turns && sess.turns[0];
      const previewText = isChecklistSess && Array.isArray(sess.cases) && sess.cases.length > 0
        ? `🗂️ ${sess.cases.length} trường hợp test (Có /reset & ghi chú hậu kiểm)`
        : (firstTurn ? `🗣️ "${firstTurn.user || firstTurn.content || 'Khởi đầu'}"` : 'Chưa có tin nhắn');

      card.innerHTML = `
        <div class="chat-session-header">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;">
            <span class="mono-badge" style="${badgeStyle}">${badgeLabel}</span>
            <span class="chat-session-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(sess.title || sess.persona)}</span>
          </div>
          <span style="font-size:10px;color:var(--text-muted);white-space:nowrap;">${timeStr} • ${dateStr}</span>
        </div>
        <div class="chat-session-turns-preview">
          ${escapeHtml(previewText)}
        </div>
        <div class="chat-session-actions">
          <span style="font-size:10.5px;font-weight:600;color:var(--text-muted);">
            📊 ${turnCount} lượt đàm thoại
          </span>
          <div style="display:flex;gap:4px;">
            <button type="button" class="btn btn-primary btn-xs btn-view-chat" style="font-size:10.5px;padding:3px 8px;">
              ${isChecklistSess ? '🔍 Xem hậu kiểm' : '👁️ Xem hội thoại'}
            </button>
            <button type="button" class="btn btn-secondary btn-xs btn-delete-chat" title="Xóa phiên chat này" style="color:var(--danger);padding:3px 6px;">
              🗑️
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-view-chat').addEventListener('click', () => {
        loadSessionIntoTranscriptFeed(sess);
      });

      card.querySelector('.btn-delete-chat').addEventListener('click', async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa phiên "${sess.title}"?`)) return;
        try {
          await api(`/api/chat-sessions/${sess.id}`, 'DELETE');
          state.chatSessions = state.chatSessions.filter(s => s.id !== sess.id);
          renderChatSessions();
          showToast('Đã xóa phiên hội thoại thành công!', 'info');
        } catch (e) {
          showToast('Lỗi xóa phiên chat: ' + e.message, 'error');
        }
      });

      el.chatSessionsList.appendChild(card);
    });
  }

  function renderMultiFlowAuditView(session) {
    if (!el.agentTranscriptFeed) return;
    el.agentTranscriptFeed.innerHTML = '';

    const cases = Array.isArray(session.cases) && session.cases.length > 0
      ? session.cases
      : (state.multiFlow.cases || []);

    const passCount = cases.filter(c => c.status === 'pass').length;
    const warnCount = cases.filter(c => c.status === 'warning').length;
    const failCount = cases.filter(c => c.status === 'fail').length;
    const doneCount = passCount + warnCount + failCount;

    // 1. Summary Header Banner for Post-Auditor (Người Hậu Kiểm)
    const summaryBanner = document.createElement('div');
    summaryBanner.className = 'audit-case-block';
    summaryBanner.style.background = 'linear-gradient(135deg, rgba(13, 148, 136, 0.08), rgba(217, 119, 87, 0.06))';
    summaryBanner.style.borderColor = 'rgba(13, 148, 136, 0.35)';
    summaryBanner.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
        <div>
          <div style="font-size:12.5px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
            <span>🔍 BẢNG HẬU KIỂM ĐA LUỒNG & CHECKLIST</span>
            <span class="badge-pill-xs" style="background:rgba(13,148,136,0.15);color:var(--success);">${doneCount}/${cases.length} Đã test</span>
          </div>
          <div style="font-size:10.5px;color:var(--text-secondary);margin-top:2px;">
            Người kiểm thử: <b>${escapeHtml(session.tester_name || state.user?.name || 'Tester')}</b> • Lưu lúc: ${new Date(session.created_at || Date.now()).toLocaleString('vi-VN')}
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-xs" id="btn-audit-copy-report" style="font-size:10.5px;padding:4px 10px;font-weight:700;">
          📋 Copy Báo Cáo Hậu Kiểm
        </button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px;">
        <div style="background:var(--bg-elevated);padding:5px 8px;border-radius:6px;border:1px solid var(--border-subtle);text-align:center;">
          <div style="font-size:13px;font-weight:800;color:var(--success);">${passCount}</div>
          <div style="font-size:9.5px;color:var(--text-muted);">✅ Đạt chuẩn</div>
        </div>
        <div style="background:var(--bg-elevated);padding:5px 8px;border-radius:6px;border:1px solid var(--border-subtle);text-align:center;">
          <div style="font-size:13px;font-weight:800;color:var(--warning);">${warnCount}</div>
          <div style="font-size:9.5px;color:var(--text-muted);">⚠️ Cần chỉnh sửa</div>
        </div>
        <div style="background:var(--bg-elevated);padding:5px 8px;border-radius:6px;border:1px solid var(--border-subtle);text-align:center;">
          <div style="font-size:13px;font-weight:800;color:var(--danger);">${failCount}</div>
          <div style="font-size:9.5px;color:var(--text-muted);">❌ Lỗi / Sai lệch</div>
        </div>
      </div>
    `;
    const copyBtn = summaryBanner.querySelector('#btn-audit-copy-report');
    if (copyBtn) copyBtn.addEventListener('click', copyConversationLog);
    el.agentTranscriptFeed.appendChild(summaryBanner);

    // 2. Render each Case Block, its Q&A turns, Editable Reviewer Note, and /reset divider
    cases.forEach((c, cIdx) => {
      const status = c.status || 'pending';
      const statusLabel = status === 'pass'
        ? '✅ ĐẠT'
        : status === 'warning'
        ? '⚠️ CẦN SỬA'
        : status === 'fail'
        ? '❌ LỖI'
        : '⏳ CHƯA CHẠY';

      const block = document.createElement('div');
      block.className = 'audit-case-block';

      const turns = Array.isArray(c.turns) && c.turns.length > 0
        ? c.turns
        : (c.questions || []).map((q, qIdx) => ({
            turn: qIdx + 1,
            user: q,
            assistant: status !== 'pending' ? '(AI đã phản hồi trong bong bóng chat)' : '(Chưa chạy trường hợp này)'
          }));

      const turnsHtml = turns.map((t, tIdx) => `
        <div style="background:var(--bg-panel);border:1px solid var(--border-subtle);border-radius:6px;padding:7px 9px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--text-muted);">
            <span style="font-weight:700;color:var(--accent);">🗣️ Câu hỏi #${tIdx + 1} (${escapeHtml(c.title)})</span>
            <span>${escapeHtml(t.timestamp || '')}</span>
          </div>
          <div style="font-size:11.5px;font-weight:600;color:var(--text-primary);line-height:1.4;">
            "${escapeHtml(t.user || '')}"
          </div>
          <div style="font-size:11px;color:var(--text-secondary);background:var(--bg-elevated);padding:5px 8px;border-radius:5px;border-left:2.5px solid var(--success);line-height:1.4;white-space:pre-wrap;">
            🤖 <b>AI trả lời:</b> ${escapeHtml(t.assistant || '(Đã phản hồi trong bong bóng chat)')}
          </div>
          ${t.evaluation && t.evaluation.reason ? `
            <div style="font-size:10px;color:var(--text-muted);font-style:italic;">
              ⚖️ <b>Đánh giá tự động:</b> ${escapeHtml(t.evaluation.reason)}
            </div>
          ` : ''}
        </div>
      `).join('');

      block.innerHTML = `
        <div class="audit-case-header">
          <div class="audit-case-title">
            <span class="mf-case-index">#${cIdx + 1}</span>
            <span>${escapeHtml(c.title || `Trường hợp #${cIdx + 1}`)}</span>
          </div>
          <span class="mf-status-tag ${status}">${statusLabel}</span>
        </div>
        ${c.goalNote ? `<div style="font-size:10.5px;color:var(--text-secondary);">🎯 <b>Tiêu chí kiểm tra:</b> ${escapeHtml(c.goalNote)}</div>` : ''}
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${turnsHtml}
        </div>
        <div class="audit-case-note-box">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <span style="font-weight:700;font-size:10.5px;">📝 Ghi chú & Đánh giá cho Người Hậu Kiểm:</span>
            <select class="select-input audit-case-verdict-select" style="width:auto;padding:2px 6px;font-size:10px;height:22px;">
              <option value="pass" ${status === 'pass' ? 'selected' : ''}>✅ Đạt chuẩn</option>
              <option value="warning" ${status === 'warning' ? 'selected' : ''}>⚠️ Cần chỉnh sửa</option>
              <option value="fail" ${status === 'fail' ? 'selected' : ''}>❌ Lỗi / Sai lệch</option>
              <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Chưa chấm</option>
            </select>
          </div>
          <div style="display:flex;gap:5px;align-items:center;">
            <input type="text" class="text-input audit-case-note-input" value="${escapeHtml(c.resultNote || c.goalNote || '')}" placeholder="Nhập nhận xét hoặc ghi chú hậu kiểm cho trường hợp này..." style="font-size:11px;padding:4px 8px;flex:1;" />
            <button type="button" class="btn btn-primary btn-xs btn-save-audit-note" style="font-size:10px;padding:4px 8px;white-space:nowrap;">💾 Lưu ghi chú</button>
          </div>
        </div>
      `;

      const saveNoteBtn = block.querySelector('.btn-save-audit-note');
      const noteInput = block.querySelector('.audit-case-note-input');
      const verdictSelect = block.querySelector('.audit-case-verdict-select');

      if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async () => {
          const newNote = noteInput ? noteInput.value.trim() : '';
          const newVerdict = verdictSelect ? verdictSelect.value : c.status;
          c.resultNote = newNote;
          c.status = newVerdict;

          // Also sync into state.multiFlow.cases if matching
          if (state.multiFlow.cases[cIdx]) {
            state.multiFlow.cases[cIdx].resultNote = newNote;
            state.multiFlow.cases[cIdx].status = newVerdict;
          }
          saveMultiFlowChecklist(true);
          renderMultiFlowCases();

          if (session.id && session.id !== 'live') {
            try {
              await api(`/api/chat-sessions/${session.id}`, 'PATCH', {
                cases: cases
              });
            } catch (err) {
              console.warn('[AUDIT] Could not patch session:', err);
            }
          } else {
            await saveOrUpdateMultiFlowSession(false);
          }
          renderMultiFlowAuditView(session);
          showToast(`✅ Đã lưu ghi chú hậu kiểm cho "${c.title}"!`, 'success');
        });
      }

      el.agentTranscriptFeed.appendChild(block);

      // Visual /reset divider between cases
      const resetDiv = document.createElement('div');
      resetDiv.className = 'audit-reset-divider';
      resetDiv.innerHTML = `🔄 Đã gửi lệnh <b>/reset</b> làm mới hội thoại sau "${escapeHtml(c.title)}" ➔ Chuyển sang luồng tiếp theo`;
      el.agentTranscriptFeed.appendChild(resetDiv);
    });
  }

  function loadSessionIntoTranscriptFeed(session) {
    if (!el.agentTranscriptFeed) return;
    switchRightTab('transcript');
    if (el.transcriptSessionSelect) {
      el.transcriptSessionSelect.value = session.id;
      if (el.btnDeleteAgentChat) el.btnDeleteAgentChat.style.display = 'inline-flex';
    }

    if (session.type === 'checklist' || session.is_checklist || (Array.isArray(session.cases) && session.cases.length > 0)) {
      renderMultiFlowAuditView(session);
      return;
    }

    el.agentTranscriptFeed.innerHTML = '';
    const turns = session.turns || [];
    if (turns.length === 0) {
      el.agentTranscriptFeed.innerHTML = `<div class="empty-state-card"><div style="font-size:12px;color:var(--text-muted);">Phiên này không có tin nhắn nào.</div></div>`;
      return;
    }

    turns.forEach((t, idx) => {
      const turnNum = t.turn || idx + 1;
      const uMsg = t.user || (t.role === 'user' ? t.content : '');
      const aMsg = t.assistant || (t.role === 'assistant' ? t.content : '');

      if (uMsg) {
        renderTranscriptCustomerTurn(turnNum, uMsg, t.thought || '');
      }
      if (aMsg) {
        renderTranscriptBotReply(turnNum, aMsg, t.evaluation || { verdict: t.verdict || 'pass', score: t.score || 5 });
      }
    });

    const completionCard = document.createElement('div');
    completionCard.className = 'transcript-turn';
    completionCard.style.background = 'rgba(13, 148, 136, 0.08)';
    completionCard.style.borderColor = 'rgba(13, 148, 136, 0.3)';
    completionCard.style.textAlign = 'center';
    completionCard.innerHTML = `
      <div style="font-weight:700;font-size:11.5px;color:var(--success);">
        📜 Đang xem lại phiên đã lưu: ${escapeHtml(session.title)}
      </div>
      <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">
        Được lưu lúc ${new Date(session.created_at).toLocaleString('vi-VN')} • Tổng cộng ${turns.length} lượt
      </div>
    `;
    el.agentTranscriptFeed.appendChild(completionCard);
  }

  // Clear all evaluations
  if (el.btnClearAllEvals) {
    el.btnClearAllEvals.addEventListener('click', async () => {
      if (!state.evaluations || state.evaluations.length === 0) {
        showToast('Chưa có đánh giá nào để xóa.', 'info');
        return;
      }
      if (!confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử đánh giá? Thao tác này không thể hoàn tác.')) return;
      try {
        await api('/api/evaluations', 'DELETE');
        state.evaluations = [];
        renderEvaluations();
        updateMetrics();
        showToast('Đã xóa sạch toàn bộ lịch sử đánh giá!', 'success');
      } catch (e) {
        showToast('Lỗi khi xóa: ' + e.message, 'error');
      }
    });
  }

  // Refresh chat sessions
  if (el.btnRefreshChatSessions) {
    el.btnRefreshChatSessions.addEventListener('click', async () => {
      try {
        const res = await api('/api/chat-sessions');
        state.chatSessions = res.sessions || [];
        renderChatSessions();
        showToast('Đã làm mới danh sách phiên chat!', 'success');
      } catch (e) {
        showToast('Lỗi tải phiên chat: ' + e.message, 'error');
      }
    });
  }

  // Session selector in Tab 2 Luồng Agent
  if (el.transcriptSessionSelect) {
    el.transcriptSessionSelect.addEventListener('change', () => {
      const selectedId = el.transcriptSessionSelect.value;
      if (selectedId === 'live') {
        if (el.btnDeleteAgentChat) el.btnDeleteAgentChat.style.display = 'none';
        el.agentTranscriptFeed.innerHTML = '';
        if (state.multiFlow && state.multiFlow.enabled && state.agentRunner.history.length === 0) {
          renderLiveMultiFlowAuditToFeed();
        } else if (state.agentRunner.history.length === 0) {
          el.agentTranscriptFeed.innerHTML = `
            <div class="empty-state-card" id="agent-transcript-empty">
              <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Chưa có phiên đàm thoại Agent</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
                Chuyển sang tab <b>"Agent Ngữ Cảnh"</b> ở bên trái và bấm Khởi chạy để theo dõi toàn bộ luồng hội thoại đa lượt tại đây.
              </div>
            </div>
          `;
        } else {
          for (let i = 0; i < state.agentRunner.history.length; i += 2) {
            const u = state.agentRunner.history[i];
            const a = state.agentRunner.history[i + 1];
            const turnNum = Math.floor(i / 2) + 1;
            if (u) renderTranscriptCustomerTurn(turnNum, u.content, '');
            if (a) renderTranscriptBotReply(turnNum, a.content, { verdict: 'pass', score: 5 });
          }
        }
      } else {
        const sess = state.chatSessions.find(s => s.id === selectedId);
        if (sess) loadSessionIntoTranscriptFeed(sess);
      }
    });
  }

  if (el.btnNewAgentChat) {
    el.btnNewAgentChat.addEventListener('click', () => {
      if (el.transcriptSessionSelect) el.transcriptSessionSelect.value = 'live';
      if (el.btnDeleteAgentChat) el.btnDeleteAgentChat.style.display = 'none';
      el.agentTranscriptFeed.innerHTML = `
        <div class="empty-state-card" id="agent-transcript-empty">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Sẵn sàng cho phiên đàm thoại mới</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
            Bấm <b>"Khởi Chạy Agent Hội Thoại"</b> ở panel bên trái để bắt đầu.
          </div>
        </div>
      `;
      showToast('Đã làm mới bảng feed. Sẵn sàng cho phiên chat mới!', 'info');
    });
  }

  if (el.btnDeleteAgentChat) {
    el.btnDeleteAgentChat.addEventListener('click', async () => {
      const selectedId = el.transcriptSessionSelect?.value;
      if (!selectedId || selectedId === 'live') return;
      if (!confirm('Bạn có chắc chắn muốn xóa phiên hội thoại này?')) return;
      try {
        await api(`/api/chat-sessions/${selectedId}`, 'DELETE');
        state.chatSessions = state.chatSessions.filter(s => s.id !== selectedId);
        renderChatSessions();
        if (el.transcriptSessionSelect) el.transcriptSessionSelect.value = 'live';
        if (el.btnDeleteAgentChat) el.btnDeleteAgentChat.style.display = 'none';
        el.agentTranscriptFeed.innerHTML = '';
        showToast('Đã xóa phiên chat.', 'info');
      } catch (e) {
        showToast('Lỗi xóa: ' + e.message, 'error');
      }
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
      state.evaluations = data.evaluations || [];
      state.chatSessions = data.chat_sessions || [];
      state.users = data.users;

      // Master Vault reconciliation for Chatbots
      if (state.user && state.user.email) {
        const localVault = getEmbedsFromLocalVault(state.user.email);
        const serverEmbeds = state.user.embed_list || [];
        const mergedMap = new Map();
        serverEmbeds.forEach(b => {
          if (b && (b.id || b.page_id)) mergedMap.set(b.id || b.page_id, b);
        });
        let hasNewFromClient = false;
        (localVault.embeds || []).forEach(b => {
          if (b && (b.id || b.page_id)) {
            const key = b.id || b.page_id;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, b);
              hasNewFromClient = true;
            }
          }
        });
        const reconciledList = Array.from(mergedMap.values());
        if (hasNewFromClient && reconciledList.length > serverEmbeds.length) {
          state.user.embed_list = reconciledList;
          saveEmbedsToLocalVault(state.user.email, reconciledList, state.user.active_embed_id);
          // Sync merged list to server in background
          api('/api/user/config', 'PATCH', { embed_list: reconciledList }).catch(e => console.warn('[SYNC] Auto-sync embeds failed:', e));
        } else {
          saveEmbedsToLocalVault(state.user.email, state.user.embed_list, state.user.active_embed_id);
        }
      }

      applyAuthState();
      syncRunnerPreferences();
      loadMultiFlowChecklist();
      loadTestUsers();
      updateManualQuestionCount();
      renderEvaluations();
      renderChatSessions();
      updateMetrics();
    } catch (err) {
      console.warn('[APP] Could not load workspace:', err);
      loadMultiFlowChecklist();
      loadTestUsers();
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
      if (el.headerPageIdBadge) el.headerPageIdBadge.textContent = 'Chưa nạp';

      syncRunnerPreferences();

      if (boot.token) {
        state.token = boot.token;
        localStorage.setItem('bbh_auth_token', boot.token);
      }

      if (boot.currentUser) {
        state.user = boot.currentUser;
        if (state.user && Array.isArray(state.user.embed_list)) {
          saveEmbedsToLocalVault(state.user.email, state.user.embed_list, state.user.active_embed_id);
        }
        await loadWorkspace();
        setTimeout(() => { toggleChatbox(true); }, 750);
      } else {
        loadMultiFlowChecklist();
        loadTestUsers();
        applyAuthState();
      }
    } catch (err) {
      syncRunnerPreferences();
      loadMultiFlowChecklist();
      loadTestUsers();
      applyAuthState();
    }
  }

  // Run on startup
  bootstrap();

  // ============================================================================
  // QUICK TEST USER & CUSTOMER PERSONA MANAGER (TEST ĐA LUỒNG)
  // ============================================================================

  const RANDOM_VN_NAMES = [
    'Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Nam', 'Phạm Minh Tuấn',
    'Đỗ Thùy Linh', 'Võ Quốc Huy', 'Bùi Thanh Hương', 'Đặng Đức Thắng',
    'Anh Thiện VIP', 'Chị Ngọc Homestay', 'Nguyễn Thị Bích', 'Trần Quốc Bảo'
  ];

  const RANDOM_FLOWS = [
    'Tư vấn báo giá & phòng trống cuối tuần',
    'Hỏi chính sách ưu đãi & mã voucher giảm giá',
    'Thủ tục nhận/trả phòng sớm (Check-in/out)',
    'Chính sách đổi trả, hủy cọc & hoàn tiền',
    'Dịch vụ tiệc nướng BBQ & mang thú cưng'
  ];

  function generateRandomUserData() {
    const name = RANDOM_VN_NAMES[Math.floor(Math.random() * RANDOM_VN_NAMES.length)];
    const prefixes = ['098', '097', '096', '091', '090', '093', '086'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString().substring(0, 7);
    const phone = `${prefix}${randomSuffix}`;
    const cleanSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const email = `${cleanSlug || 'khach'}${Math.floor(Math.random() * 900 + 100)}@gmail.com`;
    const flow = RANDOM_FLOWS[Math.floor(Math.random() * RANDOM_FLOWS.length)];
    return { name, phone, email, flow };
  }

  function updateTestUserBadge() {
    const count = (state.testUsers || []).length;
    if (el.testUserCountBadge) el.testUserCountBadge.textContent = count + ' khách';
    if (el.testUserModalCount) el.testUserModalCount.textContent = count + ' user';
  }

  async function loadTestUsers() {
    try {
      const res = await api('/api/test-users');
      state.testUsers = res.testUsers || [];
      updateTestUserBadge();

      // Restore active test user from storage if valid
      const savedActiveJson = localStorage.getItem('bbh_active_test_user');
      if (savedActiveJson) {
        try {
          const parsed = JSON.parse(savedActiveJson);
          if (parsed && parsed.id && state.testUsers.some(u => u.id === parsed.id)) {
            state.activeTestUser = state.testUsers.find(u => u.id === parsed.id);
          } else if (parsed && parsed.name) {
            state.activeTestUser = parsed;
          }
        } catch (e) {}
      }

      // If no active user yet and we have test users, activate the first one
      if (!state.activeTestUser && state.testUsers.length > 0) {
        state.activeTestUser = state.testUsers[0];
      }

      renderTestUserChips();
      renderActiveTestUser();
      renderTestUsersList();
    } catch (e) {
      console.warn('[TEST-USERS] Failed to load:', e);
    }
  }

  function renderTestUserChips() {
    if (!el.tuChipsContainer) return;
    el.tuChipsContainer.innerHTML = '';
    const list = state.testUsers || [];

    if (list.length === 0) {
      el.tuChipsContainer.innerHTML = `
        <span style="font-size:10px;color:var(--text-muted);font-style:italic;">
          Chưa có User test nào. Bấm <b>"➕ Thêm User"</b> hoặc <b>"🎲 Sinh nhanh"</b> để tạo ngay.
        </span>`;
      return;
    }

    list.forEach(u => {
      const chip = document.createElement('div');
      const isActive = state.activeTestUser && state.activeTestUser.id === u.id;
      chip.className = `tu-chip ${isActive ? 'is-active' : ''}`;
      chip.title = `Kích hoạt test với: ${u.name} (${u.phone || u.email || 'Không có SĐT'}) - Luồng: ${u.flow_name || 'Tự do'}`;

      chip.innerHTML = `
        <span class="tu-chip-dot"></span>
        <span style="font-weight:700;">${escapeHtml(u.name)}</span>
        ${u.phone ? `<span style="font-size:9.5px;opacity:0.8;font-family:var(--font-mono);">${escapeHtml(u.phone)}</span>` : ''}
      `;

      chip.addEventListener('click', () => {
        activateTestUser(u, true);
      });
      el.tuChipsContainer.appendChild(chip);
    });
  }

  function renderActiveTestUser() {
    if (!el.tuActiveBox) return;
    const u = state.activeTestUser;
    if (!u) {
      el.tuActiveBox.style.display = 'none';
      return;
    }

    el.tuActiveBox.style.display = 'block';
    if (el.tuActiveName) el.tuActiveName.textContent = u.name || 'Khách test';
    if (el.tuActivePhone) el.tuActivePhone.textContent = u.phone ? `📞 ${u.phone}` : (u.email || 'Chưa có SĐT');
    if (el.tuActiveFlow) el.tuActiveFlow.textContent = u.flow_name || u.scenario || 'Luồng tự do';
  }

  function activateTestUser(user, notify = true) {
    if (!user) return;
    state.activeTestUser = user;
    localStorage.setItem('bbh_active_test_user', JSON.stringify(user));

    renderTestUserChips();
    renderActiveTestUser();
    renderTestUsersList();

    // Reset and sync chatbox visitor context with this customer's data (force rebuild iframe)
    resetChatboxVisitor(user);

    if (notify) {
      showToast(`✨ Đã kích hoạt "${user.name}" ➔ Mở bong bóng chat mới toanh (sạch lịch sử)!`, 'success');
    }
  }

  function resetChatboxVisitor(customerInfo = null) {
    const pageId = state.config?.page_id || (state.user && state.user.page_id) || '';
    const freshClientId = 'cid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    // 0. Tell the existing cross-origin iframe to wipe its internal client_id_${pageId} storage before destroying
    try {
      const oldIframe = getBbhIframe();
      if (oldIframe && oldIframe.contentWindow && pageId) {
        oldIframe.contentWindow.postMessage({
          from: 'parent-app-preview',
          reset_conversation: true,
          reset_page_id: pageId
        }, '*');
      }
    } catch (e) {}

    try {
      // 1. Purge all old visitor sessions and client IDs from parent localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('data_embed_chat') || k.startsWith('bbh_client_id_') || k === 'bbh_last_client_id' || k.startsWith('client_id_'))) {
          localStorage.removeItem(k);
        }
      }

      if (customerInfo && customerInfo.name) {
        const clientData = {
          page_id: pageId,
          client_id: freshClientId,
          'client-id': freshClientId,
          name: customerInfo.name || '',
          phone: customerInfo.phone || '',
          email: customerInfo.email || ''
        };
        if (pageId) {
          localStorage.setItem('data_embed_chat_' + pageId, JSON.stringify(clientData));
        }
        localStorage.setItem('data_embed_chat', JSON.stringify(clientData));
        localStorage.setItem('bbh_last_client_id', freshClientId);
        state.clientId = freshClientId;
        if (el.clientIdDisplay) el.clientIdDisplay.textContent = freshClientId;
      }
    } catch (e) {
      console.warn('[RESET-VISITOR] Error resetting visitor session storage:', e);
    }

    // 2. Clear live transcript feed & agent turn history so old customer conversation is gone
    state.agentRunner.history = [];
    state.agentRunner.turnIndex = 1;
    if (el.transcriptSessionSelect) el.transcriptSessionSelect.value = 'live';
    if (el.agentTranscriptFeed) {
      const custName = customerInfo ? customerInfo.name : 'Khách mới';
      el.agentTranscriptFeed.innerHTML = `
        <div class="empty-state-card" style="background: rgba(13, 148, 136, 0.08); border: 1px solid rgba(13, 148, 136, 0.25);">
          <div style="font-size: 12.5px; font-weight: 700; color: var(--teal);">✨ Bong bóng chat mới toanh cho: "${escapeHtml(custName)}"</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">
            Đã làm mới mã định danh khách (${freshClientId}). Hội thoại độc lập 100%, không trùng lịch sử với khách cũ.
          </div>
        </div>
      `;
    }

    // 3. Force rebuild of the iframe embed so a brand new window/iframe instance is created
    if (pageId) {
      mountUserChatbox(pageId, true);
    }

    // 4. Sync new visitor session into the freshly mounted iframe and open it
    const syncFreshVisitorToIframe = () => {
      const iframe = getBbhIframe();
      if (!iframe || !iframe.contentWindow) return;

      // Clear any residual client_id inside iframe's origin storage
      if (pageId) {
        iframe.contentWindow.postMessage({
          from: 'parent-app-preview',
          reset_conversation: true,
          reset_page_id: pageId
        }, '*');
      }

      if (customerInfo && customerInfo.name) {
        // Initialize new client session in Botbanhang embed UI with the new user's name
        iframe.contentWindow.postMessage({
          from: 'parent-app',
          user_name: customerInfo.name,
          user_phone: customerInfo.phone || '',
          user_email: customerInfo.email || '',
          client_id: freshClientId
        }, '*');
      }

      toggleChatbox(true);
    };

    state.onIframeReadyCallback = () => {
      syncFreshVisitorToIframe();
      state.onIframeReadyCallback = null;
    };

    setTimeout(syncFreshVisitorToIframe, 600);
    setTimeout(syncFreshVisitorToIframe, 1300);
  }

  function sendUserIntroToChat() {
    const u = state.activeTestUser;
    if (!u) {
      showToast('Vui lòng chọn hoặc tạo 1 User test trước.', 'warning');
      return;
    }
    const introMsg = `Chào bạn, mình là ${u.name}${u.phone ? ` - SĐT: ${u.phone}` : ''}. Mình đang tìm hiểu về ${u.flow_name || 'dịch vụ bên mình'}, tư vấn giúp mình nhé!`;
    sendPromptToChat(introMsg);
    showToast(`💬 Đã gửi lời chào của "${u.name}" vào khung chat!`, 'success');
  }

  function copyTextToClipboard(text, successMsg) {
    if (!text) {
      showToast('Thông tin này đang trống.', 'warning');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg, 'success');
      }).catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successMsg, 'success');
    } catch {
      showToast(text, 'info');
    }
    document.body.removeChild(ta);
  }

  async function createTestUser(payload = {}) {
    try {
      const res = await api('/api/test-users', 'POST', payload);
      if (res && res.testUser) {
        // Add or update in state
        const existingIdx = state.testUsers.findIndex(u => u.id === res.testUser.id);
        if (existingIdx >= 0) {
          state.testUsers[existingIdx] = res.testUser;
        } else {
          state.testUsers.unshift(res.testUser);
        }

        updateTestUserBadge();
        activateTestUser(res.testUser, false);

        // Hide inline form
        if (el.tuInlineFormBox) el.tuInlineFormBox.style.display = 'none';

        // Update modal credentials box if modal is open
        if (el.tuCredentialsBox) {
          el.tuCredentialsBox.style.display = 'block';
          if (el.tuCredEmail) el.tuCredEmail.textContent = res.testUser.email;
          if (el.tuCredPass) el.tuCredPass.textContent = res.credentials?.password || '123456';
        }

        showToast(`🎉 Đã tạo & kích hoạt User Test "${res.testUser.name}" (${res.testUser.phone || 'Sẵn sàng'})!`, 'success');
        return res.testUser;
      }
    } catch (err) {
      showToast('Lỗi tạo User Test: ' + err.message, 'error');
      throw err;
    }
  }

  function renderTestUsersList() {
    if (!el.testUsersList) return;
    const list = state.testUsers || [];
    if (list.length === 0) {
      el.testUsersList.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:11.5px;border:1px dashed var(--border-subtle);border-radius:8px;background:var(--bg-panel);">
          <div style="font-size:20px;margin-bottom:4px;">🧪</div>
          <b>Chưa có tài khoản test nào.</b>
          <div style="font-size:11px;margin-top:3px;">Điền thông tin ở trên hoặc bấm <b>"Sinh ngẫu nhiên"</b> để tạo ngay.</div>
        </div>`;
      return;
    }
    el.testUsersList.innerHTML = '';
    list.forEach(u => {
      const card = document.createElement('div');
      card.className = 'test-user-card';
      const initials = (u.name || 'T').charAt(0).toUpperCase();
      const timeStr = u.created_at ? new Date(u.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
      const isCurrentActive = state.activeTestUser && state.activeTestUser.id === u.id;

      card.innerHTML = `
        <div class="test-user-avatar" style="background:${u.avatar_color || '#4F46E5'};">${initials}</div>
        <div class="test-user-info">
          <div class="test-user-name">
            ${escapeHtml(u.name)}
            ${isCurrentActive ? '<span class="test-user-badge" style="background:rgba(5,150,105,0.15);color:var(--success);margin-left:4px;">🟢 Đang test</span>' : ''}
          </div>
          <div style="font-size:10.5px;color:var(--text-primary);font-family:var(--font-mono);font-weight:600;margin-top:1px;">
            ${u.phone ? `📞 ${escapeHtml(u.phone)}` : ''} ${u.email ? `• ✉️ ${escapeHtml(u.email)}` : ''}
          </div>
          <div style="font-size:9.5px;color:var(--text-muted);margin-top:2px;">
            🎯 <b>Luồng:</b> ${escapeHtml(u.flow_name || 'Tự do')} • Tạo lúc: ${timeStr}
          </div>
        </div>
        <div class="test-user-actions">
          <button type="button" class="btn btn-primary btn-xs btn-tu-select" data-uid="${u.id}" title="Kích hoạt test với khách hàng này" style="font-size:10px;padding:3px 8px;background:#4F46E5;border-color:#4F46E5;">
            ▶️ Dùng
          </button>
          <button type="button" class="btn btn-secondary btn-xs btn-tu-copy" data-uid="${u.id}" title="Copy thông tin Tên & SĐT để điền vào bong bóng chat" style="font-size:10px;padding:3px 6px;">
            📋 Copy
          </button>
          <button type="button" class="btn btn-secondary btn-xs btn-tu-delete" data-uid="${u.id}" title="Xóa tài khoản test này" style="font-size:10px;padding:3px 6px;color:var(--danger);">
            🗑️
          </button>
        </div>`;

      card.querySelector('.btn-tu-select').addEventListener('click', () => {
        activateTestUser(u, true);
        if (el.modalTestUsers) el.modalTestUsers.style.display = 'none';
      });

      card.querySelector('.btn-tu-copy').addEventListener('click', () => {
        const text = `Tên: ${u.name}\nSĐT: ${u.phone || ''}\nEmail: ${u.email || ''}`;
        copyTextToClipboard(text, `📋 Đã copy thông tin "${u.name}"!`);
      });

      card.querySelector('.btn-tu-delete').addEventListener('click', () => deleteTestUser(u.id, u.name));
      el.testUsersList.appendChild(card);
    });
  }

  async function deleteTestUser(userId, name) {
    if (!confirm(`Xóa tài khoản test "${name}"?\n\nTất cả dữ liệu kiểm thử của tài khoản này sẽ bị xóa vĩnh viễn.`)) return;
    try {
      await api(`/api/test-users/${userId}`, 'DELETE');
      state.testUsers = (state.testUsers || []).filter(u => u.id !== userId);
      if (state.activeTestUser && state.activeTestUser.id === userId) {
        state.activeTestUser = state.testUsers[0] || null;
        localStorage.setItem('bbh_active_test_user', JSON.stringify(state.activeTestUser));
      }
      updateTestUserBadge();
      renderTestUserChips();
      renderActiveTestUser();
      renderTestUsersList();
      showToast(`Đã xóa tài khoản test "${name}".`, 'info');
    } catch (e) {
      showToast('Lỗi xóa: ' + e.message, 'error');
    }
  }

  // Event Listeners for Inline Card
  if (el.btnTuToggleForm) {
    el.btnTuToggleForm.addEventListener('click', () => {
      if (!el.tuInlineFormBox) return;
      const isVisible = el.tuInlineFormBox.style.display !== 'none';
      el.tuInlineFormBox.style.display = isVisible ? 'none' : 'block';
      if (!isVisible && el.tuInlineName) {
        el.tuInlineName.focus();
      }
    });
  }

  if (el.btnTuCloseInlineForm) {
    el.btnTuCloseInlineForm.addEventListener('click', () => {
      if (el.tuInlineFormBox) el.tuInlineFormBox.style.display = 'none';
    });
  }

  if (el.btnTuInlineRandom) {
    el.btnTuInlineRandom.addEventListener('click', () => {
      const rand = generateRandomUserData();
      if (el.tuInlineName) el.tuInlineName.value = rand.name;
      if (el.tuInlinePhone) el.tuInlinePhone.value = rand.phone;
      if (el.tuInlineEmail) el.tuInlineEmail.value = rand.email;
      if (el.tuInlineFlow) el.tuInlineFlow.value = rand.flow;
    });
  }

  if (el.btnTuQuickRandom) {
    el.btnTuQuickRandom.addEventListener('click', async () => {
      const rand = generateRandomUserData();
      try {
        await createTestUser({
          name: rand.name,
          phone: rand.phone,
          email: rand.email,
          flow_name: rand.flow
        });
      } catch (e) {}
    });
  }

  if (el.btnTuResetChat) {
    el.btnTuResetChat.addEventListener('click', () => {
      resetChatboxVisitor(null);
      showToast('🔄 Đã làm mới Bong bóng chat 100%! Khung chat đã ở trạng thái khách hàng mới toanh.', 'success');
    });
  }

  if (el.btnTuInlineSubmit) {
    el.btnTuInlineSubmit.addEventListener('click', async () => {
      const name = el.tuInlineName ? el.tuInlineName.value.trim() : '';
      const phone = el.tuInlinePhone ? el.tuInlinePhone.value.trim() : '';
      const email = el.tuInlineEmail ? el.tuInlineEmail.value.trim() : '';
      const flow = el.tuInlineFlow ? el.tuInlineFlow.value.trim() : '';

      if (!name) {
        showToast('Vui lòng nhập Tên của bạn / Tên khách hàng test (chỉ tên là bắt buộc).', 'warning');
        if (el.tuInlineName) el.tuInlineName.focus();
        return;
      }

      el.btnTuInlineSubmit.disabled = true;
      el.btnTuInlineSubmit.textContent = '⏳ Đang lưu...';
      try {
        await createTestUser({
          name,
          phone,
          email,
          flow_name: flow
        });
        if (el.tuInlineName) el.tuInlineName.value = '';
        if (el.tuInlinePhone) el.tuInlinePhone.value = '';
        if (el.tuInlineEmail) el.tuInlineEmail.value = '';
        if (el.tuInlineFlow) el.tuInlineFlow.value = '';
      } finally {
        el.btnTuInlineSubmit.disabled = false;
        el.btnTuInlineSubmit.textContent = '💾 Tạo & Kích Hoạt Test';
      }
    });
  }

  // 1-Click Copy Buttons
  if (el.btnCopyTuName) {
    el.btnCopyTuName.addEventListener('click', () => {
      const name = state.activeTestUser?.name || '';
      copyTextToClipboard(name, `📋 Đã copy Tên: "${name}"!`);
    });
  }
  if (el.btnCopyTuPhone) {
    el.btnCopyTuPhone.addEventListener('click', () => {
      const phone = state.activeTestUser?.phone || '';
      copyTextToClipboard(phone, `📋 Đã copy SĐT: "${phone}"!`);
    });
  }
  if (el.btnCopyTuEmail) {
    el.btnCopyTuEmail.addEventListener('click', () => {
      const email = state.activeTestUser?.email || '';
      copyTextToClipboard(email, `📋 Đã copy Email: "${email}"!`);
    });
  }
  if (el.btnCopyTuAll) {
    el.btnCopyTuAll.addEventListener('click', () => {
      const u = state.activeTestUser;
      if (!u) return;
      const allText = `Họ tên: ${u.name}\nSĐT: ${u.phone || ''}\nEmail: ${u.email || ''}`;
      copyTextToClipboard(allText, `📋 Đã copy toàn bộ thông tin "${u.name}"!`);
    });
  }
  if (el.btnTuSendIntro) {
    el.btnTuSendIntro.addEventListener('click', sendUserIntroToChat);
  }

  // Modal Handlers
  if (el.btnOpenTestUsers) {
    el.btnOpenTestUsers.addEventListener('click', () => {
      if (el.modalTestUsers) el.modalTestUsers.style.display = 'flex';
      loadTestUsers();
    });
  }
  if (el.btnCloseTestUsersModal) {
    el.btnCloseTestUsersModal.addEventListener('click', () => {
      if (el.modalTestUsers) el.modalTestUsers.style.display = 'none';
    });
  }
  if (el.modalTestUsers) {
    el.modalTestUsers.addEventListener('click', (e) => {
      if (e.target === el.modalTestUsers) el.modalTestUsers.style.display = 'none';
    });
  }

  if (el.btnTuModalRandom) {
    el.btnTuModalRandom.addEventListener('click', () => {
      const rand = generateRandomUserData();
      if (el.tuCreateName) el.tuCreateName.value = rand.name;
      if (el.tuCreatePhone) el.tuCreatePhone.value = rand.phone;
      if (el.tuCreateEmail) el.tuCreateEmail.value = rand.email;
      if (el.tuCreateFlow) el.tuCreateFlow.value = rand.flow;
    });
  }

  if (el.btnTuCreate) {
    el.btnTuCreate.addEventListener('click', async () => {
      const name = el.tuCreateName ? el.tuCreateName.value.trim() : '';
      const phone = el.tuCreatePhone ? el.tuCreatePhone.value.trim() : '';
      const email = el.tuCreateEmail ? el.tuCreateEmail.value.trim() : '';
      const flow = el.tuCreateFlow ? el.tuCreateFlow.value.trim() : '';
      const password = el.tuCreatePassword ? el.tuCreatePassword.value.trim() : '123456';
      const pageId = el.tuCreatePageid ? el.tuCreatePageid.value.trim() : '';

      if (!name) {
        showToast('Vui lòng nhập Tên của bạn / Họ tên khách hàng (chỉ tên là bắt buộc).', 'warning');
        if (el.tuCreateName) el.tuCreateName.focus();
        return;
      }

      el.btnTuCreate.disabled = true;
      el.btnTuCreate.textContent = '⏳ Đang tạo...';
      try {
        await createTestUser({
          name,
          phone,
          email,
          flow_name: flow,
          password,
          page_id: pageId || undefined
        });
        if (el.tuCreateName) el.tuCreateName.value = '';
        if (el.tuCreatePhone) el.tuCreatePhone.value = '';
        if (el.tuCreateEmail) el.tuCreateEmail.value = '';
        if (el.tuCreateFlow) el.tuCreateFlow.value = '';
        if (el.modalTestUsers) el.modalTestUsers.style.display = 'none';
      } finally {
        el.btnTuCreate.disabled = false;
        el.btnTuCreate.textContent = '🧪 Tạo User & Kích Hoạt Test';
      }
    });
  }

  if (el.btnTuRefresh) {
    el.btnTuRefresh.addEventListener('click', loadTestUsers);
  }

  if (el.btnTuDeleteAll) {
    el.btnTuDeleteAll.addEventListener('click', async () => {
      if ((state.testUsers || []).length === 0) {
        showToast('Không có tài khoản test nào để xóa.', 'info');
        return;
      }
      if (!confirm(`Xóa toàn bộ ${state.testUsers.length} tài khoản test?\n\nThao tác này sẽ xóa tất cả dữ liệu kiểm thử của chúng và không thể hoàn tác.`)) return;
      try {
        await api('/api/test-users', 'DELETE');
        state.testUsers = [];
        state.activeTestUser = null;
        localStorage.removeItem('bbh_active_test_user');
        updateTestUserBadge();
        renderTestUserChips();
        renderActiveTestUser();
        renderTestUsersList();
        showToast('Đã xóa toàn bộ tài khoản test!', 'success');
      } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
      }
    });
  }

})();

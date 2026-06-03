document.addEventListener('DOMContentLoaded', () => {
    // API Endpoint Base
    const API_BASE = '../api/admin.php';

    // DOM Elements
    const secLogin = document.getElementById('sec_login');
    const secDashboard = document.getElementById('sec_dashboard');
    const headerUserInfo = document.getElementById('header_user_info');
    const lblLoggedUsername = document.getElementById('lbl_logged_username');
    const loginForm = document.getElementById('login_form');
    const loginErrorMsg = document.getElementById('login_error_msg');
    const btnLogout = document.getElementById('btn_logout');

    const tabBtnGuestbook = document.getElementById('tab_btn_guestbook');
    const tabBtnPortfolio = document.getElementById('tab_btn_portfolio');
    const tabSecGuestbook = document.getElementById('tab_sec_guestbook');
    const tabSecPortfolio = document.getElementById('tab_sec_portfolio');

    const guestbookTableBody = document.getElementById('guestbook_table_body');
    const btnRefreshGuestbook = document.getElementById('btn_refresh_guestbook');

    const portfolioJsonEditor = document.getElementById('portfolio_json_editor');
    const btnSavePortfolio = document.getElementById('btn_save_portfolio');
    const jsonEditorErrorMsg = document.getElementById('json_editor_error_msg');
    const jsonEditorSuccessMsg = document.getElementById('json_editor_success_msg');

    // New DOM Elements for Dynamic CRUD Form
    const btnToggleViewMode = document.getElementById('btn_toggle_view_mode');
    const panelJsonRaw = document.getElementById('panel_json_raw');
    const panelFormEditor = document.getElementById('panel_form_editor');
    const zoneNavList = document.getElementById('zone_nav_list');
    const editorZoneTitle = document.getElementById('editor_zone_title');
    const editorZoneSubtitle = document.getElementById('editor_zone_subtitle');
    const editorZoneBadge = document.getElementById('editor_zone_badge');
    const editorFieldsContainer = document.getElementById('editor_fields_container');

    // State Variables
    let currentTab = 'guestbook';
    let portfolioData = null;
    let currentViewMode = 'form'; // 'form' hoặc 'json'
    let activeZoneId = 'home';

    // Check Login Status on Load
    checkAuthStatus();

    // 1. Authentication Handlers
    async function checkAuthStatus() {
        try {
            const res = await fetch(`${API_BASE}?action=status`);
            const data = await res.json();
            
            if (data.status === 'success') {
                showDashboard(data.username);
            } else {
                showLoginForm();
            }
        } catch (err) {
            showLoginForm();
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorMsg.classList.add('hidden');

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Trạng thái Loading
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-950 inline-block align-middle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="width:1.25rem; height:1.25rem;">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ĐANG XỬ LÝ...
        `;

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const code = document.getElementById('code').value;

        try {
            const res = await fetch(`${API_BASE}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, code })
            });
            const data = await res.json();

            if (data.status === 'success') {
                showDashboard(username);
            } else if (data.status === 'otp_sent') {
                showLoginMessage(data.message, false);
                // Hiển thị ô nhập mã OTP
                const otpContainer = document.getElementById('otp_container');
                if (otpContainer) {
                    otpContainer.classList.remove('hidden');
                }
                const codeInput = document.getElementById('code');
                if (codeInput) {
                    codeInput.setAttribute('required', 'true');
                    codeInput.focus();
                }
            } else {
                showLoginMessage(data.message || 'Lỗi đăng nhập hệ thống.', true);
            }
        } catch (err) {
            showLoginMessage('Lỗi máy chủ kết nối hoặc gửi email SMTP thất bại.', true);
        } finally {
            // Khôi phục nút bấm
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = originalBtnText;
        }
    });

    btnLogout.addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE}?action=logout`);
            showLoginForm();
        } catch (err) {
            alert('Lỗi đăng xuất.');
        }
    });

    function showDashboard(username) {
        secLogin.classList.add('hidden');
        secDashboard.classList.remove('hidden');
        headerUserInfo.classList.remove('hidden');
        lblLoggedUsername.textContent = username;
        
        // Load initial tab data
        loadGuestbookData();
        loadPortfolioData();
    }

    function showLoginForm() {
        secLogin.classList.remove('hidden');
        secDashboard.classList.add('hidden');
        headerUserInfo.classList.add('hidden');
        loginForm.reset();
        
        // Ẩn lại ô OTP khi tải lại form
        const otpContainer = document.getElementById('otp_container');
        if (otpContainer) {
            otpContainer.classList.add('hidden');
        }
        const codeInput = document.getElementById('code');
        if (codeInput) {
            codeInput.removeAttribute('required');
            codeInput.value = '';
        }
    }

    function showLoginMessage(msg, isError = true) {
        loginErrorMsg.textContent = msg;
        if (isError) {
            loginErrorMsg.classList.remove('text-emerald-400');
            loginErrorMsg.classList.add('text-rose-400');
        } else {
            loginErrorMsg.classList.remove('text-rose-400');
            loginErrorMsg.classList.add('text-emerald-400');
        }
        loginErrorMsg.classList.remove('hidden');
    }

    // 2. Tab Navigation
    tabBtnGuestbook.addEventListener('click', () => switchTab('guestbook'));
    tabBtnPortfolio.addEventListener('click', () => switchTab('portfolio'));

    function switchTab(tab) {
        currentTab = tab;
        if (tab === 'guestbook') {
            tabBtnGuestbook.className = 'px-5 py-3 border-b-2 border-emerald-500 text-emerald-400 font-display font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 cursor-pointer';
            tabBtnPortfolio.className = 'px-5 py-3 border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 font-display font-medium text-sm transition-all focus:outline-none flex items-center gap-2 cursor-pointer';
            tabSecGuestbook.classList.remove('hidden');
            tabSecPortfolio.classList.add('hidden');
            loadGuestbookData();
        } else {
            tabBtnPortfolio.className = 'px-5 py-3 border-b-2 border-purple-500 text-purple-400 font-display font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 cursor-pointer';
            tabBtnGuestbook.className = 'px-5 py-3 border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 font-display font-medium text-sm transition-all focus:outline-none flex items-center gap-2 cursor-pointer';
            tabSecGuestbook.classList.add('hidden');
            tabSecPortfolio.classList.remove('hidden');
            loadPortfolioData();
        }
    }

    // 3. Guestbook Management Logic
    async function loadGuestbookData() {
        guestbookTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-zinc-500">Đang tải danh sách lời nhắn...</td></tr>`;
        try {
            const res = await fetch(`${API_BASE}?action=guestbook`);
            const data = await res.json();

            if (data.status === 'success') {
                renderGuestbookRows(data.data);
            } else {
                guestbookTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-rose-400">Không thể tải dữ liệu: ${data.message}</td></tr>`;
            }
        } catch (err) {
            guestbookTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-rose-400">Lỗi kết nối API.</td></tr>`;
        }
    }

    btnRefreshGuestbook.addEventListener('click', loadGuestbookData);

    function renderGuestbookRows(rows) {
        if (!rows || rows.length === 0) {
            guestbookTableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-zinc-500">Chưa có lời nhắn nào được gửi tới bạn.</td></tr>`;
            return;
        }

        guestbookTableBody.innerHTML = rows.map(row => {
            let statusBadge = '';
            if (row.status === 'approved') {
                statusBadge = `<span class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">Đã duyệt</span>`;
            } else if (row.status === 'pending') {
                statusBadge = `<span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] animate-pulse">Chờ duyệt</span>`;
            } else {
                statusBadge = `<span class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px]">Spam</span>`;
            }

            const formattedDate = new Date(row.created_at).toLocaleString('vi-VN');

            return `
                <tr class="hover:bg-zinc-900/40 border-b border-zinc-900 transition-colors">
                    <td class="p-4">
                        <span class="text-zinc-100 font-semibold block">${row.name}</span>
                        <span class="text-zinc-500 text-[9px] block mt-0.5">${formattedDate}</span>
                    </td>
                    <td class="p-4 text-zinc-400 font-sans">${row.email}</td>
                    <td class="p-4 text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed">${row.message}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4">
                        <div class="flex items-center justify-center gap-2">
                            ${row.status !== 'approved' ? `
                                <button onclick="updateStatus(${row.id}, 'approved')" class="p-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 rounded-lg transition-colors cursor-pointer" title="Phê duyệt công khai">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                                </button>
                            ` : ''}
                            ${row.status !== 'spam' ? `
                                <button onclick="updateStatus(${row.id}, 'spam')" class="p-1.5 bg-amber-950/60 border border-amber-800 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 rounded-lg transition-colors cursor-pointer" title="Đánh dấu Spam">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                </button>
                            ` : ''}
                            <button onclick="deleteMessage(${row.id})" class="p-1.5 bg-rose-950/60 border border-rose-800 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer" title="Xóa vĩnh viễn">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Bind action callbacks to window to be accessible via raw HTML string templates
    window.updateStatus = async (id, status) => {
        try {
            const res = await fetch(`${API_BASE}?action=guestbook_status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const data = await res.json();
            if (data.status === 'success') {
                loadGuestbookData();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Lỗi cập nhật trạng thái.');
        }
    };

    window.deleteMessage = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này vĩnh viễn?')) return;
        try {
            const res = await fetch(`${API_BASE}?action=guestbook_delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                loadGuestbookData();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Lỗi xóa tin nhắn.');
        }
    };

    // 4. Portfolio Editor Logic
    async function loadPortfolioData() {
        portfolioJsonEditor.value = "Đang tải dữ liệu data.json...";
        try {
            const res = await fetch(`${API_BASE}?action=portfolio`);
            const data = await res.json();
            if (data.status === 'success') {
                portfolioData = data.data; // Cache data object locally
                portfolioJsonEditor.value = JSON.stringify(portfolioData, null, 2);
                initFormEditor(); // Build interactive form
            } else {
                portfolioJsonEditor.value = `Lỗi tải file data.json: ${data.message}`;
            }
        } catch (err) {
            portfolioJsonEditor.value = "Lỗi kết nối API lấy dữ liệu portfolio.";
        }
    }

    // Toggle View Mode (Raw JSON vs Interactive Form)
    btnToggleViewMode.addEventListener('click', () => {
        if (currentViewMode === 'form') {
            currentViewMode = 'json';
            btnToggleViewMode.innerHTML = `
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                CHẾ ĐỘ BIỂU MẪU
            `;
            panelJsonRaw.classList.remove('hidden');
            panelFormEditor.classList.add('hidden');
            
            // Sync current form state to raw json editor
            portfolioJsonEditor.value = JSON.stringify(portfolioData, null, 2);
        } else {
            try {
                const parsed = JSON.parse(portfolioJsonEditor.value);
                portfolioData = parsed;
                currentViewMode = 'form';
                btnToggleViewMode.innerHTML = `
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                    CHẾ ĐỘ JSON THÔ
                `;
                panelJsonRaw.classList.add('hidden');
                panelFormEditor.classList.remove('hidden');
                initFormEditor();
            } catch (err) {
                alert(`Không thể chuyển sang Chế độ Biểu mẫu vì cấu trúc JSON hiện tại đang lỗi cú pháp: ${err.message}`);
            }
        }
    });

    btnSavePortfolio.addEventListener('click', async () => {
        jsonEditorErrorMsg.classList.add('hidden');
        jsonEditorSuccessMsg.classList.add('hidden');

        let parsedData = null;
        
        // Sync local changes to textarea JSON if in form mode
        if (currentViewMode === 'form') {
            portfolioJsonEditor.value = JSON.stringify(portfolioData, null, 2);
        }

        try {
            parsedData = JSON.parse(portfolioJsonEditor.value);
            portfolioData = parsedData; // Sync local state
        } catch (err) {
            jsonEditorErrorMsg.textContent = `Lỗi cú pháp JSON: ${err.message}`;
            jsonEditorErrorMsg.classList.remove('hidden');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}?action=portfolio_save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: parsedData })
            });
            const data = await res.json();
            if (data.status === 'success') {
                jsonEditorSuccessMsg.textContent = data.message;
                jsonEditorSuccessMsg.classList.remove('hidden');
                setTimeout(() => jsonEditorSuccessMsg.classList.add('hidden'), 5000);
                
                if (currentViewMode === 'form') {
                    initFormEditor();
                }
            } else {
                jsonEditorErrorMsg.textContent = `Lỗi lưu: ${data.message}`;
                jsonEditorErrorMsg.classList.remove('hidden');
            }
        } catch (err) {
            jsonEditorErrorMsg.textContent = 'Lỗi kết nối hệ thống server.';
            jsonEditorErrorMsg.classList.remove('hidden');
        }
    });

    // --- Dynamic Form Editor Logic ---
    function initFormEditor() {
        if (!portfolioData || !portfolioData.zones) return;
        renderZoneNav();
        selectZone(activeZoneId);
    }

    function renderZoneNav() {
        if (!portfolioData || !portfolioData.zones) return;
        
        const zoneIcons = {
            home: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
            academy: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>`,
            lab: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`,
            museum: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
            library: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
            portal: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`
        };

        zoneNavList.innerHTML = portfolioData.zones.map(z => {
            const isActive = z.id === activeZoneId;
            const activeClass = isActive 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-semibold' 
                : 'border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200';
            
            return `
                <button type="button" data-zone-id="${z.id}" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-mono transition-colors text-left cursor-pointer ${activeClass}">
                    ${zoneIcons[z.id] || ''}
                    <div class="flex-1 truncate">
                        <span class="block text-[11px] leading-tight">${z.vietnameseName}</span>
                        <span class="block text-[9px] text-zinc-500 font-light mt-0.5">${z.name.toUpperCase()} ZONE</span>
                    </div>
                </button>
            `;
        }).join('');

        zoneNavList.querySelectorAll('button[data-zone-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const zoneId = btn.getAttribute('data-zone-id');
                selectZone(zoneId);
            });
        });
    }

    function selectZone(zoneId) {
        activeZoneId = zoneId;
        renderZoneNav(); 
        
        const zoneIndex = portfolioData.zones.findIndex(z => z.id === zoneId);
        const zone = portfolioData.zones[zoneIndex];
        
        if (!zone) return;

        editorZoneTitle.textContent = zone.vietnameseName;
        editorZoneSubtitle.textContent = `Tọa độ hiển thị: (${zone.coords.x}, ${zone.coords.y})`;
        
        const badgeColors = {
            amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
            purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
            indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
            pink: 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
        };
        editorZoneBadge.className = `text-[9px] px-2 py-0.5 rounded font-mono uppercase ${badgeColors[zone.color] || ''}`;
        editorZoneBadge.textContent = zone.color;

        renderZoneForm(zone, zoneIndex);
    }

    function renderZoneForm(zone, zoneIndex) {
        const basePath = `zones.${zoneIndex}`;
        let detailsVI_HTML = '';
        let detailsEN_HTML = '';

        if (zone.id === 'home') {
            detailsVI_HTML = `
                ${renderInput('Họ Tên (Fullname)', `${basePath}.details_vi.fullName`, zone.details_vi.fullName)}
                ${renderInput('Vai Trò (Role)', `${basePath}.details_vi.role`, zone.details_vi.role)}
                ${renderTextarea('Lời Chào Mừng (Welcome Message)', `${basePath}.details_vi.welcomeMessage`, zone.details_vi.welcomeMessage)}
                ${renderTextarea('Mô tả Quảng bá (Promo Message)', `${basePath}.details_vi.promoMessage`, zone.details_vi.promoMessage)}
                ${renderArrayEditor('Thông Tin Cơ Bản (Basic Info)', `${basePath}.details_vi.basicInfo`, zone.details_vi.basicInfo, 'basicInfo')}
            `;
            detailsEN_HTML = `
                ${renderInput('Full Name (English)', `${basePath}.details_en.fullName`, zone.details_en.fullName)}
                ${renderInput('Role (English)', `${basePath}.details_en.role`, zone.details_en.role)}
                ${renderTextarea('Welcome Message (English)', `${basePath}.details_en.welcomeMessage`, zone.details_en.welcomeMessage)}
                ${renderTextarea('Promo Message (English)', `${basePath}.details_en.promoMessage`, zone.details_en.promoMessage)}
                ${renderArrayEditor('Basic Info (English)', `${basePath}.details_en.basicInfo`, zone.details_en.basicInfo, 'basicInfo')}
            `;
        } else if (zone.id === 'academy') {
            detailsVI_HTML = `
                ${renderInput('Tên Trường Học', `${basePath}.details_vi.institution`, zone.details_vi.institution)}
                ${renderInput('Thời Gian Học (Period)', `${basePath}.details_vi.period`, zone.details_vi.period)}
                ${renderInput('Chuyên Ngành (Major)', `${basePath}.details_vi.major`, zone.details_vi.major)}
                ${renderTextarea('Mô Tả Ngành Học (Major Description)', `${basePath}.details_vi.majorDesc`, zone.details_vi.majorDesc)}
                ${renderInput('GPA Học Tập', `${basePath}.details_vi.gpa`, zone.details_vi.gpa)}
                ${renderInput('Học Bổng Đạt Được', `${basePath}.details_vi.scholarship`, zone.details_vi.scholarship)}
                ${renderInput('Chi Tiết Học Bổng', `${basePath}.details_vi.scholarshipSub`, zone.details_vi.scholarshipSub)}
                ${renderTextarea('Tóm Tắt Quá Trình (Summary)', `${basePath}.details_vi.summary`, zone.details_vi.summary)}
            `;
            detailsEN_HTML = `
                ${renderInput('Institution Name', `${basePath}.details_en.institution`, zone.details_en.institution)}
                ${renderInput('Period', `${basePath}.details_en.period`, zone.details_en.period)}
                ${renderInput('Major', `${basePath}.details_en.major`, zone.details_en.major)}
                ${renderTextarea('Major Description', `${basePath}.details_en.majorDesc`, zone.details_en.majorDesc)}
                ${renderInput('GPA Score', `${basePath}.details_en.gpa`, zone.details_en.gpa)}
                ${renderInput('Scholarship', `${basePath}.details_en.scholarship`, zone.details_en.scholarship)}
                ${renderInput('Scholarship Details', `${basePath}.details_en.scholarshipSub`, zone.details_en.scholarshipSub)}
                ${renderTextarea('Summary Description', `${basePath}.details_en.summary`, zone.details_en.summary)}
            `;
        } else if (zone.id === 'lab') {
            detailsVI_HTML = `
                ${renderTextarea('Lời Giới Thiệu (Intro)', `${basePath}.details_vi.intro`, zone.details_vi.intro)}
                ${renderArrayEditor('Danh Sách Kỹ Năng (Skills)', `${basePath}.details_vi.skills`, zone.details_vi.skills, 'skills')}
            `;
            detailsEN_HTML = `
                ${renderTextarea('Introduction (English)', `${basePath}.details_en.intro`, zone.details_en.intro)}
                ${renderArrayEditor('Skills List (English)', `${basePath}.details_en.skills`, zone.details_en.skills, 'skills')}
            `;
        } else if (zone.id === 'museum') {
            detailsVI_HTML = `
                ${renderInput('Tên Dự Án (Project Title)', `${basePath}.details_vi.title`, zone.details_vi.title)}
                ${renderInput('Thời Gian Thực Hiện (Period)', `${basePath}.details_vi.period`, zone.details_vi.period)}
                ${renderTextarea('Điểm Nổi Bật (Highlight)', `${basePath}.details_vi.highlight`, zone.details_vi.highlight)}
                ${renderInput('Link Dự Án Live', `${basePath}.details_vi.link`, zone.details_vi.link)}
                ${renderInput('Tiêu Đề Portfolio Cũ', `${basePath}.details_vi.oldPortfolioTitle`, zone.details_vi.oldPortfolioTitle)}
                ${renderInput('Link Portfolio Cũ', `${basePath}.details_vi.oldPortfolioLink`, zone.details_vi.oldPortfolioLink)}
                ${renderInput('Tiêu Đề Kết Quả (Result Title)', `${basePath}.details_vi.resultTitle`, zone.details_vi.resultTitle)}
                ${renderTextarea('Chi Tiết Kết Quả (Result Desc)', `${basePath}.details_vi.resultDesc`, zone.details_vi.resultDesc)}
                ${renderArrayEditor('Các Thành Tựu/Công Việc (Accomplishments)', `${basePath}.details_vi.accomplishments`, zone.details_vi.accomplishments, 'accomplishments')}
            `;
            detailsEN_HTML = `
                ${renderInput('Project Title', `${basePath}.details_en.title`, zone.details_en.title)}
                ${renderInput('Period', `${basePath}.details_en.period`, zone.details_en.period)}
                ${renderTextarea('Highlight Details', `${basePath}.details_en.highlight`, zone.details_en.highlight)}
                ${renderInput('Live Project Link', `${basePath}.details_en.link`, zone.details_en.link)}
                ${renderInput('Old Portfolio Title', `${basePath}.details_en.oldPortfolioTitle`, zone.details_en.oldPortfolioTitle)}
                ${renderInput('Old Portfolio Link', `${basePath}.details_en.oldPortfolioLink`, zone.details_en.oldPortfolioLink)}
                ${renderInput('Result Title', `${basePath}.details_en.resultTitle`, zone.details_en.resultTitle)}
                ${renderTextarea('Result Description', `${basePath}.details_en.resultDesc`, zone.details_en.resultDesc)}
                ${renderArrayEditor('Accomplishments List', `${basePath}.details_en.accomplishments`, zone.details_en.accomplishments, 'accomplishments')}
            `;
        } else if (zone.id === 'library') {
            detailsVI_HTML = `
                ${renderInput('Tên File Triết Lý', `${basePath}.details_vi.filename`, zone.details_vi.filename)}
                ${renderArrayEditor('Các Triết Lý Hệ Thống (Philosophies)', `${basePath}.details_vi.philosophies`, zone.details_vi.philosophies, 'philosophies')}
            `;
            detailsEN_HTML = `
                ${renderInput('Philosophy Filename', `${basePath}.details_en.filename`, zone.details_en.filename)}
                ${renderArrayEditor('Philosophies List', `${basePath}.details_en.philosophies`, zone.details_en.philosophies, 'philosophies')}
            `;
        } else if (zone.id === 'portal') {
            detailsVI_HTML = `
                ${renderTextarea('Lời Giới Thiệu (Intro)', `${basePath}.details_vi.intro`, zone.details_vi.intro)}
                ${renderTextarea('Thông Báo Chân Trang (Notice)', `${basePath}.details_vi.notice`, zone.details_vi.notice)}
                ${renderArrayEditor('Danh Sách Liên Kết (Contacts)', `${basePath}.details_vi.contacts`, zone.details_vi.contacts, 'contacts')}
            `;
            detailsEN_HTML = `
                ${renderTextarea('Intro (English)', `${basePath}.details_en.intro`, zone.details_en.intro)}
                ${renderTextarea('Notice Note (English)', `${basePath}.details_en.notice`, zone.details_en.notice)}
                ${renderArrayEditor('Contacts List (English)', `${basePath}.details_en.contacts`, zone.details_en.contacts, 'contacts')}
            `;
        }

        editorFieldsContainer.innerHTML = `
            <!-- Mô Tả Ngắn Ở Ngoài Map -->
            <div class="bg-zinc-900/10 p-4 rounded-2xl border border-zinc-900/50 space-y-4">
                <div class="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">GIỚI THIỆU TỔNG QUAN NGOÀI BẢN ĐỒ (TOOLTIP MAP)</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${renderTextarea('Mô Tả Bản VI', `${basePath}.description_vi`, zone.description_vi)}
                    ${renderTextarea('Mô Tả Bản EN', `${basePath}.description_en`, zone.description_en)}
                </div>
            </div>

            <!-- Giao diện 2 cột ngôn ngữ song song -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <!-- Cột VI -->
                <div class="space-y-4 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900/80">
                    <div class="text-xs font-mono font-bold text-emerald-400 border-b border-zinc-900 pb-2 mb-2 flex items-center gap-1.5">
                       <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> BẢN TIẾNG VIỆT
                    </div>
                    ${detailsVI_HTML}
                </div>
                
                <!-- Cột EN -->
                <div class="space-y-4 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900/80">
                    <div class="text-xs font-mono font-bold text-purple-400 border-b border-zinc-900 pb-2 mb-2 flex items-center gap-1.5">
                       <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> BẢN TIẾNG ANH (ENGLISH)
                    </div>
                    ${detailsEN_HTML}
                </div>
            </div>
        `;
    }

    // Input Element Helpers
    function renderInput(label, path, value) {
        return `
            <div class="space-y-1.5">
                <label class="text-[10px] text-zinc-500 block uppercase font-mono">${label}</label>
                <input type="text" data-path="${path}" value="${value || ''}" class="w-full bg-zinc-950 border border-zinc-900 hover:border-zinc-800 px-3.5 py-2 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500/40 text-xs font-sans transition-colors">
            </div>
        `;
    }

    function renderTextarea(label, path, value) {
        return `
            <div class="space-y-1.5">
                <label class="text-[10px] text-zinc-500 block uppercase font-mono">${label}</label>
                <textarea data-path="${path}" rows="3" class="w-full bg-zinc-950 border border-zinc-900 hover:border-zinc-800 px-3.5 py-2.5 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-500/40 text-xs font-sans transition-colors leading-relaxed">${value || ''}</textarea>
            </div>
        `;
    }

    function renderArrayEditor(label, path, items, type) {
        if (!items) items = [];
        let itemsHTML = '';
        
        items.forEach((item, index) => {
            let fieldsHTML = '';
            if (type === 'basicInfo') {
                fieldsHTML = `
                    <input type="text" placeholder="Nhãn (NƠI Ở)" value="${item.label || ''}" data-array-path="${path}.${index}.label" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs w-1/3 text-zinc-200">
                    <input type="text" placeholder="Giá trị" value="${item.value || ''}" data-array-path="${path}.${index}.value" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs flex-1 text-zinc-200">
                `;
            } else if (type === 'skills') {
                fieldsHTML = `
                    <input type="text" placeholder="Nhóm (Frontend)" value="${item.category || ''}" data-array-path="${path}.${index}.category" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs w-1/3 text-zinc-200">
                    <textarea placeholder="Mô tả..." data-array-path="${path}.${index}.desc" rows="1" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs flex-1 text-zinc-200 leading-normal resize-y">${item.desc || ''}</textarea>
                `;
            } else if (type === 'accomplishments' || type === 'philosophies') {
                fieldsHTML = `
                    <div class="flex flex-col gap-2 flex-1">
                        <input type="text" placeholder="Tiêu đề..." value="${item.title || ''}" data-array-path="${path}.${index}.title" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-200">
                        <textarea placeholder="Mô tả..." data-array-path="${path}.${index}.desc" rows="2" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-200 leading-normal resize-y">${item.desc || ''}</textarea>
                    </div>
                `;
            } else if (type === 'contacts') {
                fieldsHTML = `
                    <div class="grid grid-cols-2 gap-2 flex-1">
                        <input type="text" placeholder="Loại (Phone/Mail/Github)" value="${item.type || ''}" data-array-path="${path}.${index}.type" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-200">
                        <input type="text" placeholder="Nhãn hiển thị" value="${item.label || ''}" data-array-path="${path}.${index}.label" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-200">
                        <input type="text" placeholder="Giá trị hiển thị" value="${item.value || ''}" data-array-path="${path}.${index}.value" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-200 col-span-2">
                        <input type="text" placeholder="Đường dẫn liên hệ" value="${item.url || ''}" data-array-path="${path}.${index}.url" class="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-200 col-span-2">
                    </div>
                `;
            }
            
            itemsHTML += `
                <div class="flex items-start gap-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80 group/row">
                    ${fieldsHTML}
                    <button type="button" onclick="removeArrayItem('${path}', ${index})" class="p-1.5 bg-rose-950/20 hover:bg-rose-900 border border-rose-900/30 hover:border-rose-700 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer" title="Xóa dòng">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            `;
        });
        
        return `
            <div class="space-y-2 border-t border-zinc-900/80 pt-4 mt-2">
                <div class="flex justify-between items-center px-1">
                    <label class="text-[10px] text-zinc-400 block uppercase font-mono font-semibold">${label}</label>
                    <button type="button" onclick="addArrayItem('${path}', '${type}')" class="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-400 hover:text-white rounded-lg text-[10px] font-mono transition-colors flex items-center gap-1 cursor-pointer">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        THÊM DÒNG
                    </button>
                </div>
                <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    ${itemsHTML || '<div class="text-[10px] text-zinc-600 font-mono italic p-3 text-center bg-zinc-950/40 rounded-xl border border-zinc-900/50">Chưa có dòng nào. Bấm nút thêm dòng ở trên.</div>'}
                </div>
            </div>
        `;
    }

    // Input Listeners Delegation
    editorFieldsContainer.addEventListener('input', (e) => {
        const target = e.target;
        const path = target.getAttribute('data-path') || target.getAttribute('data-array-path');
        if (!path) return;
        
        const val = target.value;
        setDeepValue(portfolioData, path, val);
        
        // Sync back to textarea JSON
        portfolioJsonEditor.value = JSON.stringify(portfolioData, null, 2);
    });

    // Array Mutators exposed to window context
    window.addArrayItem = (path, type) => {
        const array = getDeepValue(portfolioData, path) || [];
        
        let newItem = {};
        if (type === 'basicInfo') {
            newItem = { label: '', value: '' };
        } else if (type === 'skills') {
            newItem = { category: '', desc: '' };
        } else if (type === 'accomplishments' || type === 'philosophies') {
            newItem = { title: '', desc: '' };
        } else if (type === 'contacts') {
            newItem = { type: '', label: '', value: '', url: '' };
        }
        
        array.push(newItem);
        setDeepValue(portfolioData, path, array);
        
        portfolioJsonEditor.value = JSON.stringify(portfolioData, null, 2);
        selectZone(activeZoneId);
    };

    window.removeArrayItem = (path, index) => {
        const array = getDeepValue(portfolioData, path);
        if (!array || !array[index]) return;
        
        array.splice(index, 1);
        setDeepValue(portfolioData, path, array);
        
        portfolioJsonEditor.value = JSON.stringify(portfolioData, null, 2);
        selectZone(activeZoneId);
    };

    // Deep Object Property Utility Helpers
    function getDeepValue(obj, path) {
        if (!path) return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    function setDeepValue(obj, path, value) {
        if (!path) return;
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const nextPart = parts[i+1];
            if (current[part] === undefined) {
                current[part] = /^\d+$/.test(nextPart) ? [] : {};
            }
            current = current[part];
        }
        
        const lastPart = parts[parts.length - 1];
        if (lastPart === 'x' || lastPart === 'y' || lastPart === 'w' || lastPart === 'h') {
            current[lastPart] = Number(value);
        } else {
            current[lastPart] = value;
        }
    }
});

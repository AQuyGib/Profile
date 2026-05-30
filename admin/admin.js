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

    // State Variables
    let currentTab = 'guestbook';

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
                portfolioJsonEditor.value = JSON.stringify(data.data, null, 2);
            } else {
                portfolioJsonEditor.value = `Lỗi tải file data.json: ${data.message}`;
            }
        } catch (err) {
            portfolioJsonEditor.value = "Lỗi kết nối API lấy dữ liệu portfolio.";
        }
    }

    btnSavePortfolio.addEventListener('click', async () => {
        jsonEditorErrorMsg.classList.add('hidden');
        jsonEditorSuccessMsg.classList.add('hidden');

        let parsedData = null;
        try {
            parsedData = JSON.parse(portfolioJsonEditor.value);
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
            } else {
                jsonEditorErrorMsg.textContent = `Lỗi lưu: ${data.message}`;
                jsonEditorErrorMsg.classList.remove('hidden');
            }
        } catch (err) {
            jsonEditorErrorMsg.textContent = 'Lỗi kết nối hệ thống server.';
            jsonEditorErrorMsg.classList.remove('hidden');
        }
    });
});

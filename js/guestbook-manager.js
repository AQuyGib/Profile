/**
 * Guestbook Manager - Quản lý gửi lời nhắn và hiển thị Guestbook công khai
 * Copyright (c) Nguyễn Anh Quý
 */

// Hàm tải danh sách các tin nhắn đã duyệt trong Guestbook
async function loadPublicGuestbook(root = document) {
  const listEl = root.querySelector
    ? root.querySelector('#portal_gb_messages_list')
    : document.getElementById('portal_gb_messages_list');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="flex items-center justify-center py-4 text-zinc-500 font-mono text-[10px] animate-pulse">
      ${state.language === 'vi' ? 'ĐANG TẢI TIN NHẮN...' : 'LOADING MESSAGES...'}
    </div>
  `;

  try {
    const res = await fetch('api/guestbook.php');
    const data = await res.json();

    if (data.status === 'success' && Array.isArray(data.data)) {
      if (data.data.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-4 text-zinc-500 font-mono text-[10px] border border-dashed border-zinc-800/60 rounded-xl">
            ${state.language === 'vi' ? 'Chưa có lời nhắn nào được duyệt.' : 'No approved messages yet.'}
          </div>
        `;
        return;
      }

      listEl.innerHTML = data.data.map(item => {
        // Tránh lỗi XSS
        const safeName = item.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeMsg = item.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const date = new Date(item.created_at).toLocaleDateString(
          state.language === 'vi' ? 'vi-VN' : 'en-US',
          { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        );

        return `
          <div class="p-2.5 bg-zinc-950/45 border border-zinc-850 rounded-xl space-y-1 font-mono">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-pink-400 font-semibold text-[10.5px]">${safeName}</span>
              <span class="text-zinc-550 text-[9px]">${date}</span>
            </div>
            <p class="text-[11px] text-zinc-350 leading-relaxed font-sans">${safeMsg}</p>
          </div>
        `;
      }).join('');
    } else {
      listEl.innerHTML = `<div class="text-center py-2 text-rose-450 text-[10px] font-mono">Lỗi tải dữ liệu.</div>`;
    }
  } catch (err) {
    console.error('Failed to load guestbook:', err);
    listEl.innerHTML = `<div class="text-center py-2 text-rose-450 text-[10px] font-mono">Lỗi kết nối máy chủ.</div>`;
  }
}

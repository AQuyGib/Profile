/**
 * Achievements Manager - Quản lý hệ thống thành tựu (Gamification) RPG
 * Copyright (c) Nguyễn Anh Quý
 */

const ACHIEVEMENT_LIST = {
  explorer: {
    title_vi: "Nhà Khám Phá",
    title_en: "Discovery Explorer",
    desc_vi: "Bạn đã du hành qua tất cả 5 phân vùng trên bản đồ 2D!",
    desc_en: "You have traveled through all 5 zones on the 2D map!",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`
  },
  space: {
    title_vi: "Du Hành Không Gian",
    title_en: "Space Voyager",
    desc_vi: "Bạn đã lần đầu kích hoạt và bước vào Cổng Không Gian 3D!",
    desc_en: "You have activated and entered the 3D Space Gate for the first time!",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>`
  },
  chat: {
    title_vi: "Hỏi Đáp Cùng AI",
    title_en: "AI Dialogue Specialist",
    desc_vi: "Bạn đã bắt đầu cuộc trò chuyện và đặt câu hỏi cho Trợ lý ảo AI!",
    desc_en: "You have initiated a conversation and asked the AI Assistant a question!",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`
  },
  easteregg: {
    title_vi: "Thành Tựu Easter Egg",
    title_en: "Easter Egg Unlocked",
    desc_vi: "Bạn đã nhặt được Thẻ Bộ Nhớ Bí Mật! Cảm ơn bạn rất nhiều vì đã khám phá sâu sắc!",
    desc_en: "You found the Secret Memory Card! Thank you so much for your deep exploration!",
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4m8 0h8m-8 0a2 2 0 100-4 2 2 0 000 4z"/></svg>`
  }
};

function initAchievements() {
  if (!localStorage.getItem('unlocked_achievements')) {
    localStorage.setItem('unlocked_achievements', JSON.stringify([]));
  }
  if (!localStorage.getItem('visited_zones')) {
    localStorage.setItem('visited_zones', JSON.stringify([]));
  }
}

function unlockAchievement(id) {
  const unlocked = JSON.parse(localStorage.getItem('unlocked_achievements') || '[]');
  if (unlocked.includes(id)) return;
  
  unlocked.push(id);
  localStorage.setItem('unlocked_achievements', JSON.stringify(unlocked));
  
  if (typeof playAchievementSound === 'function') {
    playAchievementSound();
  }
  showAchievementToast(id);

  if (id === 'easteregg') {
    showSpecialThankYouModal();
  }
}

function showAchievementToast(id) {
  const container = document.getElementById('achievements_container');
  if (!container) return;
  
  const ach = ACHIEVEMENT_LIST[id];
  if (!ach) return;
  
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  
  const title = state.language === 'vi' ? ach.title_vi : ach.title_en;
  const desc = state.language === 'vi' ? ach.desc_vi : ach.desc_en;
  
  toast.innerHTML = `
    <div class="achievement-icon">${ach.icon}</div>
    <div class="achievement-info">
      <div class="achievement-title">${title}</div>
      <div class="achievement-desc">${desc}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 600);
  }, 5000);
}

function showSpecialThankYouModal() {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-zinc-950/80 z-50 flex items-center justify-center p-6 backdrop-blur-md';
  overlay.id = 'thankyou_modal';
  
  const isVi = state.language === 'vi';
  
  overlay.innerHTML = `
    <div class="w-full max-w-md bg-zinc-900 border border-emerald-500/30 p-8 rounded-3xl backdrop-blur-xl relative z-10 shadow-2xl flex flex-col gap-6 text-center">
      <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      </div>
      <div>
        <h3 class="text-xl font-display font-semibold text-zinc-100 tracking-tight mb-2">
          ${isVi ? 'LỜI CẢM ƠN ĐẶC BIỆT!' : 'SPECIAL THANK YOU!'}
        </h3>
        <p class="text-sm text-zinc-300 leading-relaxed">
          ${isVi 
            ? 'Cảm ơn bạn rất nhiều vì đã dành thời gian khám phá và trải nghiệm kỹ lưỡng bản đồ RPG Portfolio của tôi! Việc tìm thấy chiếc thẻ nhớ bí mật này chứng tỏ bạn là một nhà tuyển dụng/người xem vô cùng chu đáo và tỉ mỉ. Rất hy vọng sẽ có cơ hội được đồng hành và cống hiến tại quý doanh nghiệp!' 
            : 'Thank you so much for taking your time to thoroughly explore my RPG Portfolio map! Finding this secret memory card proves that you are an extremely thoughtful and detail-oriented employer. I look forward to working and contributing to your company!'}
        </p>
      </div>
      <button 
        id="btn_close_thankyou"
        class="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all cursor-pointer border border-emerald-400"
      >
        ${isVi ? 'Đóng và tiếp tục trải nghiệm' : 'Close and continue'}
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  document.getElementById('btn_close_thankyou').addEventListener('click', () => {
    overlay.remove();
  });
}

function trackVisitedZone(zoneId) {
  const visited = JSON.parse(localStorage.getItem('visited_zones') || '[]');
  if (!visited.includes(zoneId)) {
    visited.push(zoneId);
    localStorage.setItem('visited_zones', JSON.stringify(visited));
  }
  const required = ['home', 'academy', 'lab', 'museum', 'portal'];
  const completed = required.every(z => visited.includes(z));
  if (completed) {
    unlockAchievement('explorer');
  }
}

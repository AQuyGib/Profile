export function createChatbotController({ state, audio, ui, apiUrl = 'api/chat.php' }) {
  const getViewport = () => document.getElementById('chatbot_messages_viewport');
  const getSuggestions = () => document.getElementById('chatbot_suggestions_container');
  const getInput = () => document.getElementById('chatbot_message_input');

  const formatMarkdownToHtml = (rawText) => rawText.split('\n').map((line) => {
    let formatted = line;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('* ')) {
      return `<li class="ml-4 list-disc pl-1 py-0.5 text-zinc-300 font-light">${formatted.trim().substring(2)}</li>`;
    }
    return `<p class="min-h-[1.2em] mb-1.5 last:mb-0 text-zinc-300 leading-relaxed font-light">${formatted}</p>`;
  }).join('');

  const appendChatMessage = (role, text) => {
    state.chatHistory.push({ role, text });
    const viewport = getViewport();
    if (!viewport) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-3 max-w-[85%] ${role === 'user' ? 'ml-auto flex-row-reverse' : ''}`;

    const bubbleIcon = role === 'user'
      ? 'U'
      : `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;

    const bubbleClass = role === 'user'
      ? 'bg-emerald-500/10 text-zinc-100 border border-emerald-500/20 rounded-tr-none'
      : 'bg-zinc-900/60 text-zinc-300 border border-zinc-850 rounded-tl-none';

    const avatarClass = role === 'user'
      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
      : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400';

    msgDiv.innerHTML = `
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs border ${avatarClass}">
        ${bubbleIcon}
      </div>
      <div class="p-3 rounded-2xl text-[13px] ${bubbleClass} leading-relaxed">
        ${formatMarkdownToHtml(text)}
      </div>
    `;

    viewport.appendChild(msgDiv);
    viewport.scrollTop = viewport.scrollHeight;
  };

  const showThinkingIndicator = (show) => {
    const viewport = getViewport();
    if (!viewport) return;
    const indicator = document.getElementById('chatbot_thinking_indicator');
    if (show) {
      if (!indicator) {
        const loaderDiv = document.createElement('div');
        loaderDiv.id = 'chatbot_thinking_indicator';
        loaderDiv.className = 'flex gap-3 max-w-[85%] animate-pulse';
        loaderDiv.innerHTML = `
          <div class="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-300/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <svg class="animate-spin w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 10H18.2M4 9h5M4 9v5"/></svg>
          </div>
          <div class="p-3 bg-zinc-900/60 rounded-2xl rounded-tl-none border border-zinc-850 flex items-center gap-2 text-xs text-zinc-400">
            <span>${state.language === 'vi' ? 'Trợ lý đang suy nghĩ...' : 'AI is thinking...'}</span>
            <span class="flex gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style="animation-delay: -0.3s"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style="animation-delay: -0.15s"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"></span>
            </span>
          </div>
        `;
        viewport.appendChild(loaderDiv);
        viewport.scrollTop = viewport.scrollHeight;
      }
    } else {
      indicator?.remove();
    }
  };

  const renderSuggestions = () => {
    const container = getSuggestions();
    if (!container) return;
    const isVi = state.language === 'vi';
    const suggestions = isVi
      ? ['Dự án DIENMAYPRO là gì?', 'Thế mạnh kỹ thuật lớn nhất?', 'Mục tiêu nghề nghiệp lý tưởng?']
      : ['What is DIENMAYPRO?', 'Tell me about your tech stack', 'What is your career goal?'];

    if (state.chatHistory.length === 1) {
      container.innerHTML = `
        <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">${isVi ? 'Câu hỏi nhanh' : 'Quick Suggestions'}</span>
        <div class="flex flex-col gap-1.5">
          ${suggestions.map((sug, i) => `
            <button id="chat_suggest_${i}" class="text-[11px] text-zinc-400 hover:text-emerald-400 font-mono bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/20 px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2">
              <svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
              ${sug}
            </button>
          `).join('')}
        </div>
      `;
      suggestions.forEach((sug, i) => {
        document.getElementById(`chat_suggest_${i}`)?.addEventListener('click', () => {
          audio.playClickSound();
          handleUserSendMessage(sug);
        });
      });
    } else {
      container.innerHTML = '';
    }
  };

  const resetChatbotHistory = (isResetByUser) => {
    state.chatHistory = [];
    const greeting = state.language === 'vi'
      ? (isResetByUser ? 'Hộp thoại đã được khởi tạo lại! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Có điều gì anh/chị cần em giải đáp thêm không ạ?' : 'Xin chào! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Em có thể chia tiết về dự án DIENMAYPRO, xưởng kỹ năng hay định hướng nghề nghiệp của Quý. Có điều gì em có thể hỗ trợ anh/chị ạ?')
      : (isResetByUser ? 'Chat dialog has been reset! I am Nguyen Anh Quy\'s AI representative. Is there anything else you would like to know?' : 'Hello! I am Nguyen Anh Quy\'s AI portfolio companion. Feel free to ask about DIENMAYPRO, his technology stack, or career goals of Quý. How may I assist you today?');
    appendChatMessage('ai', greeting);
    renderSuggestions();
  };

  async function handleUserSendMessage(text) {
    const input = getInput();
    if (input) input.value = '';

    appendChatMessage('user', text);
    renderSuggestions();
    state.isLoadingAI = true;
    showThinkingIndicator(true);

    const historyPayload = state.chatHistory.slice(0, -1).map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      text: h.text
    }));

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyPayload })
      });
      if (!res.ok) {
        throw new Error(state.language === 'vi' ? 'Không thể kết nối đến máy chủ AI.' : 'Failed to connect to the AI brain server.');
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      appendChatMessage('ai', data.response);
    } catch (err) {
      console.error('AI chatbot error:', err);
      appendChatMessage('ai', state.language === 'vi'
        ? 'Hệ thống có chút gián đoạn khi kết nối tới bộ não AI của Quý. Có thể khóa API chưa được cấu hình ở file .env. Anh/chị có thể liên hệ trực tiếp cho Quý qua SĐT: 0338740475 nhé ạ!'
        : 'I am experiencing a slight interface connection lag to Quy\'s AI processor. Please check if the GEMINI_API_KEY environment variable is missing. Alternatively, you can dial him directly at: 0338740475!');
      ui?.setErrorBanner?.(state.language === 'vi' ? 'Chat AI đang lỗi tạm thời. Đã hiển thị fallback an toàn.' : 'AI chat is temporarily unavailable. A safe fallback response was shown.');
    } finally {
      state.isLoadingAI = false;
      showThinkingIndicator(false);
    }
  }

  return {
    init() {
      ui?.wireChatUI({
        onSubmit: handleUserSendMessage,
        onReset: () => resetChatbotHistory(true),
        onMinimize: () => {
          state.isChatOpen = false;
          const body = document.getElementById('chatbot_body_container');
          body?.classList.add('hidden-panel');
        }
      });
      resetChatbotHistory(false);
      return this;
    },
    resetChatbotHistory,
    appendChatMessage,
    renderSuggestions,
    handleUserSendMessage,
    showThinkingIndicator
  };
}

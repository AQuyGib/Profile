/**
 * Chatbot Manager - Quản lý Trợ lý ảo AI Chatbot (Gemini RAG) và TTS/STT
 * Copyright (c) Nguyễn Anh Quý
 */

function initChatbot() {
  const chatTrigger = document.getElementById('btn_chatbot_trigger');
  const chatbotBody = document.getElementById('chatbot_body_container');
  const btnMinimize = document.getElementById('btn_minimize_chat');
  const btnReset = document.getElementById('btn_reset_chat');
  const chatForm = document.getElementById('chatbot_form');
  const chatInput = document.getElementById('chatbot_message_input');

  if (!chatTrigger || !chatbotBody || !btnMinimize || !btnReset || !chatForm || !chatInput) {
    return;
  }

  // Toggle chatbot visibility
  chatTrigger.addEventListener('click', () => {
    playClickSound();
    state.isChatOpen = !state.isChatOpen;
    if (state.isChatOpen) {
      chatbotBody.classList.remove('hidden-panel');
      chatTrigger.className = 'relative group flex items-center justify-center p-4 rounded-full text-white shadow-2xl transition-all duration-300 bg-zinc-800 rotate-90 border border-zinc-700';
      chatTrigger.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
      chatInput.focus();
    } else {
      chatbotBody.classList.add('hidden-panel');
      chatTrigger.className = 'relative group flex items-center justify-center p-4 rounded-full text-white shadow-2xl transition-all duration-300 bg-emerald-500 hover:bg-emerald-400 border border-emerald-400';
      chatTrigger.innerHTML = `
        <svg class="w-6 h-6 relative z-10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-zinc-950 z-20"></span>
        <span class="absolute inset-0 rounded-full bg-emerald-500/30 scale-125 animate-ping opacity-70"></span>
      `;
    }
  });

  // Minimize button
  btnMinimize.addEventListener('click', () => {
    chatTrigger.click();
  });

  // Reset chatbot
  btnReset.addEventListener('click', () => {
    playClickSound();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const waveform = document.getElementById('ai_voice_waveform');
      if (waveform) waveform.classList.add('hidden');
    }
    resetChatbotHistory(true);
  });

  // Bật/tắt giọng đọc AI
  const btnToggleVoice = document.getElementById('btn_toggle_ai_voice');
  if (btnToggleVoice) {
    updateAiVoiceButtonUI();
    btnToggleVoice.addEventListener('click', () => {
      playClickSound();
      state.isAiVoiceEnabled = !state.isAiVoiceEnabled;
      localStorage.setItem('cyber_portfolio_ai_voice_enabled', state.isAiVoiceEnabled);
      updateAiVoiceButtonUI();
      
      // Nếu tắt giọng đọc AI khi đang phát thì dừng phát âm thanh ngay lập tức
      if (!state.isAiVoiceEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const waveform = document.getElementById('ai_voice_waveform');
        if (waveform) waveform.classList.add('hidden');
      }
    });
  }

  // Chat submit form
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = chatInput.value.trim();
    if (!txt || state.isLoadingAI) return;
    
    playClickSound();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const waveform = document.getElementById('ai_voice_waveform');
      if (waveform) waveform.classList.add('hidden');
    }
    handleUserSendMessage(txt);
  });

  // Voice Recognition (Speech-to-Text)
  const micBtn = document.getElementById('btn_chatbot_mic');
  let recognition = null;
  let isListening = false;

  if (micBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        isListening = true;
        micBtn.classList.remove('text-zinc-400');
        micBtn.classList.add('text-red-500', 'bg-red-500/10', 'border-red-500/30', 'animate-pulse');
        chatInput.placeholder = state.language === 'vi' ? 'Đang lắng nghe... Nói gì đó đi ạ' : 'Listening... Speak now';
      };

      recognition.onend = () => {
        isListening = false;
        micBtn.classList.add('text-zinc-400');
        micBtn.classList.remove('text-red-500', 'bg-red-500/10', 'border-red-500/30', 'animate-pulse');
        chatInput.placeholder = state.language === 'vi' ? 'Hỏi về Quý (Ví dụ: Dự án của Quý)...' : "Ask about Quy (e.g., Quy's project)...";
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        isListening = false;
        micBtn.classList.add('text-zinc-400');
        micBtn.classList.remove('text-red-500', 'bg-red-500/10', 'border-red-500/30', 'animate-pulse');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        playClickSound();
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const waveform = document.getElementById('ai_voice_waveform');
          if (waveform) waveform.classList.add('hidden');
        }
        handleUserSendMessage(transcript);
      };

      micBtn.addEventListener('click', () => {
        playClickSound();
        if (isListening) {
          recognition.stop();
        } else {
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const waveform = document.getElementById('ai_voice_waveform');
            if (waveform) waveform.classList.add('hidden');
          }
          recognition.lang = state.language === 'vi' ? 'vi-VN' : 'en-US';
          recognition.start();
        }
      });
    } else {
      micBtn.style.display = 'none';
    }
  }

  // Nạp lại lịch sử trò chuyện cũ từ localStorage (tránh mất mát khi sập mạng / reload trang)
  const savedHistory = localStorage.getItem('cyber_portfolio_chat_history');
  if (savedHistory) {
    try {
      state.chatHistory = JSON.parse(savedHistory);
      const viewport = document.getElementById('chatbot_messages_viewport');
      if (viewport) {
        viewport.innerHTML = '';
      }
      state.chatHistory.forEach(msg => {
        appendChatMessage(msg.role, msg.text, false); // pass false để không lưu đúp dữ liệu
      });
      renderSuggestions();
    } catch (e) {
      console.error("Failed to parse saved chat history:", e);
      resetChatbotHistory(false);
    }
  } else {
    resetChatbotHistory(false);
  }
}

function resetChatbotHistory(isResetByUser) {
  state.chatHistory = [];
  
  // Xóa lịch sử trò chuyện khỏi localStorage
  localStorage.removeItem('cyber_portfolio_chat_history');
  
  // Dọn sạch giao diện hiển thị tin nhắn cũ
  const viewport = document.getElementById('chatbot_messages_viewport');
  if (viewport) {
    viewport.innerHTML = '';
  }

  const greeting = state.language === 'vi' 
    ? (isResetByUser ? "Hộp thoại đã được khởi tạo lại! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Có điều gì anh/chị cần em giải đáp thêm không ạ?" : "Xin chào! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Em có thể chia tiết về dự án DIENMAYPRO, xưởng kỹ năng hay định hướng nghề nghiệp của Quý. Có điều gì em có thể hỗ trợ anh/chị ạ?")
    : (isResetByUser ? "Chat dialog has been reset! I am Nguyen Anh Quy's AI representative. Is there anything else you would like to know?" : "Hello! I am Nguyen Anh Quy's AI portfolio companion. Feel free to ask about DIENMAYPRO, his technology stack, or career goals of Quý. How may I assist you today?");

  appendChatMessage('ai', greeting, true); // Lưu tin nhắn chào mừng này vào localStorage
  renderSuggestions();
}

function appendChatMessage(role, text, shouldSave = true) {
  if (shouldSave) {
    state.chatHistory.push({ role, text });
    localStorage.setItem('cyber_portfolio_chat_history', JSON.stringify(state.chatHistory));
  }
  
  const viewport = document.getElementById('chatbot_messages_viewport');
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

  // Simple Markdown parsing for bullet points (- or *) and bold (**)
  const formattedHtml = formatMarkdownToHtml(text);

  msgDiv.innerHTML = `
    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs border ${avatarClass}">
      ${bubbleIcon}
    </div>
    <div class="p-3 rounded-2xl text-[13px] ${bubbleClass} leading-relaxed">
      ${formattedHtml}
    </div>
  `;

  viewport.appendChild(msgDiv);
  viewport.scrollTop = viewport.scrollHeight;
}

function formatMarkdownToHtml(rawText) {
  return rawText.split('\n').map(line => {
    let formatted = line;
    
    // Bold syntax **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

    // Bullet points conversion
    if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('* ')) {
      return `<li class="ml-4 list-disc pl-1 py-0.5 text-zinc-300 font-light">${formatted.trim().substring(2)}</li>`;
    }

    return `<p class="min-h-[1.2em] mb-1.5 last:mb-0 text-zinc-300 leading-relaxed font-light">${formatted}</p>`;
  }).join('');
}

function renderSuggestions() {
  const container = document.getElementById('chatbot_suggestions_container');
  if (!container) return;

  const isVi = state.language === 'vi';
  const suggestions = isVi
    ? ["Dự án DIENMAYPRO là gì?", "Thế mạnh kỹ thuật lớn nhất?", "Mục tiêu nghề nghiệp lý tưởng?"]
    : ["What is DIENMAYPRO?", "Tell me about your tech stack", "What is your career goal?"];

  // Show suggestions only when there is 1 message (initial greeting)
  if (state.chatHistory.length === 1) {
    container.innerHTML = `
      <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">
        ${isVi ? 'Câu hỏi nhanh' : 'Quick Suggestions'}
      </span>
      <div class="flex flex-col gap-1.5">
        ${suggestions.map((sug, i) => `
          <button
            id="chat_suggest_${i}"
            class="text-[11px] text-zinc-400 hover:text-emerald-400 font-mono bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/20 px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2"
          >
            <svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            ${sug}
          </button>
        `).join('')}
      </div>
    `;

    // Attach click listeners to suggestions
    suggestions.forEach((sug, i) => {
      document.getElementById(`chat_suggest_${i}`).addEventListener('click', () => {
        playClickSound();
        handleUserSendMessage(sug);
      });
    });
  } else {
    container.innerHTML = '';
  }
}

async function handleUserSendMessage(text) {
  // Mở khóa thành tựu hỏi đáp cùng AI
  unlockAchievement('chat');

  document.getElementById('chatbot_message_input').value = '';
  
  // Append User message to UI
  appendChatMessage('user', text);
  renderSuggestions(); // Hide suggestions

  state.isLoadingAI = true;
  showThinkingIndicator(true);

  // Prepare payload for backend (API structure mapping)
  // Maps history items to backend structure: { role: 'user'|'model', text: string }
  const historyPayload = state.chatHistory.slice(0, -1).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    text: h.text
  }));

  try {
    const res = await fetch('api/chat.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: historyPayload
      })
    });

    if (!res.ok) {
      throw new Error(state.language === 'vi' ? "Không thể kết nối đến máy chủ AI." : "Failed to connect to the AI brain server.");
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // Append AI reply
    appendChatMessage('ai', data.response);
    speakText(data.response);

  } catch (err) {
    console.error("AI chatbot error:", err);
    appendChatMessage('ai', state.language === 'vi'
      ? "Hệ thống có chút gián đoạn khi kết nối tới bộ não AI của Quý. Có thể khóa API chưa được cấu hình ở file .env. Anh/chị có thể liên hệ trực tiếp cho Quý qua SĐT: 0338740475 nhé ạ!"
      : "I am experiencing a slight interface connection lag to Quy's AI processor. Please check if the GEMINI_API_KEY environment variable is missing. Alternatively, you can dial him directly at: 0338740475!");
  } finally {
    state.isLoadingAI = false;
    showThinkingIndicator(false);
  }
}

// Hàm cập nhật giao diện của nút loa bật/tắt giọng nói AI
function updateAiVoiceButtonUI() {
  const btn = document.getElementById('btn_toggle_ai_voice');
  const icon = document.getElementById('icon_ai_voice');
  if (!btn || !icon) return;

  if (state.isAiVoiceEnabled) {
    btn.className = 'p-1.5 hover:bg-zinc-800 text-emerald-400 rounded-md transition-colors';
    btn.title = state.language === 'vi' ? 'Tắt giọng nói AI' : 'Disable AI Voice';
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>';
  } else {
    btn.className = 'p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-400 rounded-md transition-colors';
    btn.title = state.language === 'vi' ? 'Bật giọng nói AI' : 'Enable AI Voice';
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z"/>';
  }
}

// Hàm cập nhật danh sách các giọng đọc (voices) có sẵn dựa theo ngôn ngữ đang chọn
function populateAiVoices() {
  const select = document.getElementById('ai_voice_select');
  if (!select || !window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  select.innerHTML = '';

  const filterLang = state.language === 'vi' ? 'vi' : 'en';
  const filtered = voices.filter(v => v.lang.toLowerCase().startsWith(filterLang));

  if (filtered.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.textContent = state.language === 'vi' ? 'Giọng mặc định' : 'Default Voice';
    select.appendChild(opt);
    return;
  }

  filtered.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.voiceURI;
    // Rút gọn tên cho đẹp giao diện
    let dispName = v.name.replace('Google', '').replace('Microsoft', '').replace('Desktop', '').trim();
    opt.textContent = `${dispName}`;
    select.appendChild(opt);
  });

  // Khôi phục lựa chọn cũ nếu có
  if (state.selectedVoiceURI) {
    const found = filtered.some(v => v.voiceURI === state.selectedVoiceURI);
    if (found) {
      select.value = state.selectedVoiceURI;
    } else {
      state.selectedVoiceURI = select.value;
      localStorage.setItem('cyber_portfolio_selected_voice_uri', state.selectedVoiceURI);
    }
  } else {
    state.selectedVoiceURI = select.value;
    localStorage.setItem('cyber_portfolio_selected_voice_uri', state.selectedVoiceURI);
  }
}

// Hàm phát giọng nói bằng Web Speech API (Text-to-Speech)
function speakText(text) {
  if (!window.speechSynthesis) return;

  // Dừng mọi âm thanh đang phát trước đó
  window.speechSynthesis.cancel();

  // Nếu tắt giọng đọc AI, không tiến hành phát âm thanh
  if (!state.isAiVoiceEnabled) return;

  // Loại bỏ các ký tự Markdown đặc biệt để đọc mượt mà hơn
  let cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[-*]\s+/g, '')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/[#_*\[\]()]/g, '');

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = state.language === 'vi' ? 'vi-VN' : 'en-US';

  // Chọn voice phù hợp theo ngôn ngữ mục tiêu (vi/en)
  const voices = window.speechSynthesis.getVoices();
  const select = document.getElementById('ai_voice_select');
  let voice = null;
  const targetLang = state.language === 'vi' ? 'vi' : 'en';
  
  if (select && select.value) {
    const chosenVoice = voices.find(v => v.voiceURI === select.value);
    // Chỉ dùng nếu giọng đọc này khớp với ngôn ngữ mục tiêu
    if (chosenVoice && chosenVoice.lang.toLowerCase().startsWith(targetLang)) {
      voice = chosenVoice;
    }
  }
  
  if (!voice) {
    voice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
  }

  // Nếu đang ở tiếng Việt mà hệ thống không có bất kỳ giọng tiếng Việt nào, dừng phát âm thanh để tránh bị phát bằng giọng tiếng Anh rất khó nghe
  if (!voice && state.language === 'vi') {
    console.warn("No Vietnamese text-to-speech voice found on this device. Sound output skipped.");
    return;
  }
  
  if (voice) {
    utterance.voice = voice;
  }

  const waveform = document.getElementById('ai_voice_waveform');
  const statusLbl = document.getElementById('lbl_waveform_status');

  utterance.onstart = () => {
    if (waveform) waveform.classList.remove('hidden');
    if (statusLbl) {
      statusLbl.textContent = state.language === 'vi' ? 'AI ĐANG PHÁT GIỌNG NÓI...' : 'AI IS SPEAKING...';
    }
  };

  utterance.onend = () => {
    if (waveform) waveform.classList.add('hidden');
  };

  utterance.onerror = () => {
    if (waveform) waveform.classList.add('hidden');
  };

  window.speechSynthesis.speak(utterance);
}

function showThinkingIndicator(show) {
  const viewport = document.getElementById('chatbot_messages_viewport');
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
    if (indicator) {
      indicator.remove();
    }
  }
}

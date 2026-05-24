import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, ArrowLeftRight, MessageSquare, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

interface GeminiChatbotProps {
  language?: 'vi' | 'en';
}

const QUICK_QUESTIONS_VI = [
  "Dự án DIENMAYPRO là gì?",
  "Thế mạnh kỹ thuật lớn nhất?",
  "Mục tiêu nghề nghiệp lý tưởng?"
];

const QUICK_QUESTIONS_EN = [
  "What is DIENMAYPRO?",
  "Tell me about your tech stack",
  "What is your career goal?"
];

export default function GeminiChatbot({ language = 'vi' }: GeminiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Dynamically reset/initialize greeting based on current workspace language setting
  useEffect(() => {
    setMessages([
      { 
        role: 'ai', 
        text: language === 'vi' 
          ? "Xin chào! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Em có thể chia tiết về dự án DIENMAYPRO, xưởng kỹ năng hay định hướng nghề nghiệp của Quý. Có điều gì em có thể hỗ trợ anh/chị ạ?" 
          : "Hello! I am Nguyen Anh Quy's AI portfolio companion. Feel free to ask about DIENMAYPRO, his technology stack, or career goals of Quý. How may I assist you today?"
      }
    ]);
  }, [language]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Add user message to state
    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);
    setErrorStatus(null);

    try {
      // Map history to the endpoint format
      const historyPayload = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối đến máy chủ AI.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Lỗi xử lý. Vui lòng thử lại.');
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Hệ thống có chút gián đoạn khi kết nối tới bộ não AI của Quý. Có thể khóa API chưa được cấu hình ở Settings > Secrets. Anh/chị có thể liên hệ trực tiếp cho Quý qua SĐT: 0338740475 nhé ạ!" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe minimal formatter for bullet lists, bold text and clean line breaks
  const renderFormattedText = (rawText: string) => {
    return rawText.split('\n').map((line, i) => {
      let formatted = line;
      // Bold syntax conversion **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : formatted;

      // Unordered lists conversion
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc pl-1 py-0.5 text-zinc-300 font-light">
            {line.trim().substring(2)}
          </li>
        );
      }

      return (
        <p key={i} className="min-h-[1.2em] mb-1.5 last:mb-0 text-zinc-350 leading-relaxed font-light">
          {content}
        </p>
      );
    });
  };

  const handleResetChat = () => {
    setMessages([
      { 
        role: 'ai', 
        text: "Hộp thoại đã được khởi tạo lại! Em là Trợ lý Ảo đại diện cho Nguyễn Anh Quý. Có điều gì anh/chị cần em giải đáp thêm không ạ?" 
      }
    ]);
    setErrorStatus(null);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="btn_chatbot_trigger"
          onClick={() => {
            playClickSound();
            setIsOpen(!isOpen);
          }}
          className={`relative group flex items-center justify-center p-4 rounded-full text-white shadow-2xl transition-all duration-300 ${
            isOpen 
              ? 'bg-zinc-800 rotate-90 border border-zinc-700' 
              : 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-400'
          }`}
          title="Trò chuyện với AI Nguyễn Anh Quý"
        >
          {isOpen ? (
            <X size={20} />
          ) : (
            <>
              <Bot size={22} className="relative z-10" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-zinc-950 z-20"></span>
              {/* Outer wave ring effect */}
              <span className="absolute inset-0 rounded-full bg-emerald-500/30 scale-125 animate-ping opacity-70"></span>
            </>
          )}
        </button>

        {/* Small desktop hover bubble */}
        {!isOpen && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs font-mono text-zinc-300 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
            {language === 'vi' ? 'Hỏi AI về Quý ✨' : 'Ask AI about Quy ✨'}
          </div>
        )}
      </div>

      {/* Chat Container overlay body */}
      {isOpen && (
        <div 
          id="chatbot_body_container"
          className="fixed bottom-24 right-4 sm:right-6 md:right-8 w-[calc(100vw-32px)] sm:w-[400px] h-[550px] max-h-[80vh] bg-zinc-950/95 backdrop-blur-md rounded-3xl border border-zinc-850 shadow-2xl flex flex-col z-50 overflow-hidden"
        >
          {/* Header area */}
          <div className="p-4 bg-zinc-900/40 border-b border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-emerald-950/30 rounded-xl border border-emerald-500/20">
                <Bot className="text-emerald-400" size={18} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950"></span>
              </div>
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">AI DOUBLE PORTFOLIO</div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {language === 'vi' ? 'AI Trợ Lý Nguyễn Anh Quý' : 'AI Double Agent (Quy\'s Clone)'}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                id="btn_reset_chat"
                onClick={() => {
                  playClickSound();
                  handleResetChat();
                }}
                className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 rounded-lg transition-colors"
                title={language === 'vi' ? "Khởi động lại cuộc đối thoại" : "Reset chat dialog"}
              >
                <RefreshCw size={14} />
              </button>
              <button
                id="btn_minimize_chat"
                onClick={() => {
                  playClickSound();
                  setIsOpen(false);
                }}
                className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 rounded-lg transition-colors"
                title={language === 'vi' ? "Thu nhỏ" : "Minimize"}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages render viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Chat Bubble icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs border ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                    : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                }`}>
                  {msg.role === 'user' ? 'U' : <Bot size={14} />}
                </div>

                {/* Message body content */}
                <div className={`p-3 rounded-2xl text-[13px] ${
                  msg.role === 'user' 
                    ? 'bg-emerald-500/10 text-zinc-100 border border-emerald-500/20 rounded-tr-none' 
                    : 'bg-zinc-900/60 text-zinc-300 border border-zinc-850 rounded-tl-none'
                }`}>
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-300/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="animate-spin" size={14} />
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-2xl rounded-tl-none border border-zinc-850 flex items-center gap-2 text-xs text-zinc-400">
                  <span>{language === 'vi' ? 'Trợ lý đang suy nghĩ...' : 'AI is thinking...'}</span>
                  <span className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions & Prompt Box */}
          <div className="p-4 border-t border-zinc-850 bg-zinc-900/20 space-y-3">
            {/* Suggestion list */}
            {messages.length === 1 && !isLoading && (
              <div className="space-y-1.5 pb-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  {language === 'vi' ? 'Câu hỏi nhanh' : 'Quick Suggestions'}
                </span>
                <div className="flex flex-col gap-1.5">
                  {(language === 'vi' ? QUICK_QUESTIONS_VI : QUICK_QUESTIONS_EN).map((sug, i) => (
                    <button
                      id={`chat_suggest_${i}`}
                      key={i}
                      onClick={() => {
                        playClickSound();
                        handleSendMessage(sug);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-emerald-400 font-mono bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/20 px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2"
                    >
                      <Sparkles size={10} className="text-emerald-500 flex-shrink-0" />
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                playClickSound();
                handleSendMessage(userInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                id="chatbot_message_input"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={language === 'vi' ? "Hỏi về Quý (Ví dụ: Dự án của Quý)..." : "Ask about Quy (e.g., Tech stack)..."}
                disabled={isLoading}
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 disabled:opacity-50"
              />
              <button
                id="btn_send_chat"
                type="submit"
                disabled={!userInput.trim() || isLoading}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800 disabled:cursor-not-allowed text-zinc-950 rounded-xl border border-emerald-400/20 transition-all"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

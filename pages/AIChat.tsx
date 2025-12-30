
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { GeminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { StorageService } from '../services/storageService';
import { Chat } from '@google/genai';
import { t } from '../utils/translations';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const profile = StorageService.getProfile();

  // Initialize Chat
  useEffect(() => {
    const initChat = async () => {
      // Load history
      const history = StorageService.getChatHistory();
      setMessages(history);

      // Create Gemini Session
      const session = await GeminiService.createChatSession();
      setChatSession(session);
    };
    initChat();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Save to storage
    if (messages.length > 0) {
      StorageService.saveChatHistory(messages);
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await GeminiService.sendMessage(chatSession, userMsg.content);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col p-0 overflow-hidden border-0 md:border shadow-sm">
        
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">{t(profile.language, 'aiAssistant')}</h2>
            <p className="text-xs text-slate-500">Luna - Your personal health assistant</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
              <Bot size={48} className="mx-auto mb-4 opacity-20" />
              <p>{t(profile.language, 'chatDescription')}</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-pink-500 text-white rounded-tr-none shadow-md shadow-pink-100' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-pink-500" />
                 <span className="text-xs text-slate-400">Luna is thinking...</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={profile.language === 'zh' ? '输入您的问题...' : "Ask Luna..."}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all"
              disabled={isLoading || !chatSession}
            />
            <Button type="submit" disabled={isLoading || !input.trim() || !chatSession} className="w-12 h-12 !p-0 rounded-xl flex items-center justify-center">
              <Send size={20} />
            </Button>
          </form>
          {!process.env.API_KEY && (
             <p className="text-xs text-red-500 mt-2 text-center">Warning: API_KEY environment variable is missing.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AIChat;

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { generateSaqibResponse, getSystemStatus } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check system status on mount
  useEffect(() => {
    const status = getSystemStatus();
    setSystemStatus(status);
    
    setMessages([
        {
          id: '1',
          role: 'model',
          text: status === 'ONLINE' 
            ? 'System Online. Neural Link Established via OpenRouter. I am Saqib. How can I assist you with Technology or AI today?'
            : 'System Warning: Cloud Uplink Offline. Running in Simulation Mode. I am Saqib\'s digital avatar (Limited Functionality).',
          timestamp: new Date()
        }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await generateSaqibResponse(messages, inputValue);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[80vh] flex flex-col bg-slate-900/50 backdrop-blur-xl border border-cyber-primary/30 rounded-lg shadow-[0_0_50px_rgba(0,243,255,0.1)] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyber-primary/20 bg-black/40">
        <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-cyber-primary/10 border border-cyber-primary flex items-center justify-center overflow-hidden">
                <div className="absolute w-full h-full bg-cyber-primary opacity-20 animate-pulse"></div>
                <span className="font-orbitron font-bold text-cyber-primary text-xs">AI</span>
            </div>
            <div>
                <h3 className="font-orbitron text-white text-lg tracking-wider">SAQIB <span className="text-cyber-primary text-xs ml-1">v3.0</span></h3>
                <p className="font-rajdhani text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
                    STATUS: 
                    <span className={`${systemStatus === 'ONLINE' ? 'text-green-400' : 'text-orange-400'} font-bold`}>
                        {systemStatus === 'ONLINE' ? 'CONNECTED' : 'SIMULATION'}
                    </span>
                </p>
            </div>
        </div>
        <div className="flex gap-2 items-center">
             <div className={`h-2 w-2 rounded-full ${systemStatus === 'ONLINE' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-orange-500 shadow-[0_0_10px_#f97316]'} animate-pulse`}></div>
            {systemStatus === 'ONLINE' && (
                <>
                    <div className="h-2 w-2 rounded-full bg-cyber-primary animate-pulse delay-75"></div>
                    <div className="h-2 w-2 rounded-full bg-cyber-secondary animate-pulse delay-150"></div>
                </>
            )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-cyber-primary/10 border border-cyber-primary/50 text-white rounded-tr-none'
                  : 'bg-cyber-secondary/10 border border-cyber-secondary/50 text-gray-200 rounded-tl-none'
              }`}
            >
              <p className="font-rajdhani text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </p>
              <span className="text-[10px] text-gray-500 mt-2 block font-mono">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-cyber-secondary/5 border border-cyber-secondary/30 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyber-secondary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-cyber-secondary rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-cyber-secondary rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-cyber-primary/20 bg-black/40">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={systemStatus === 'ONLINE' ? "Ask Saqib anything..." : "Running in Offline Mode..."}
            className="flex-1 bg-slate-800/50 border border-gray-700 text-white font-rajdhani rounded-lg px-4 py-3 focus:outline-none focus:border-cyber-primary focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-2 bg-cyber-primary text-black font-orbitron font-bold rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            SEND
          </button>
        </div>
      </form>

    </div>
  );
};

export default ChatInterface;
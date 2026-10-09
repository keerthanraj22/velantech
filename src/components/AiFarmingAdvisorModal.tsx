import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Bot, Send, User as UserIcon } from 'lucide-react';
import { AiAdvisorMessage, queryAiAssistant } from '../services/api';

interface AiFarmingAdvisorModalProps {
  onClose: () => void;
}

export const AiFarmingAdvisorModal: React.FC<AiFarmingAdvisorModalProps> = ({ onClose }) => {
  const [landSize, setLandSize] = useState<string>('');
  const [crop, setCrop] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  
  const [messages, setMessages] = useState<AiAdvisorMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [advisorMode, setAdvisorMode] = useState<'gemini-ai' | 'local-guidance' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isLoading) return;

    const queryText = userQuery;
    const nextMessages = [...messages, { sender: 'user' as const, text: queryText }];
    setMessages(nextMessages);
    setUserQuery('');
    setIsLoading(true);
    setError(null);

    try {
      const reply = await queryAiAssistant(queryText, landSize ? Number(landSize) : undefined, crop, location, messages);
      setAdvisorMode(reply.mode);
      setMessages((prev) => [...prev, { sender: 'ai', text: reply.response, sources: reply.sources }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The AI advisor could not answer right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-slate-200 overflow-hidden my-2 sm:my-8 flex flex-col h-[min(720px,calc(100dvh-1rem))] sm:h-[650px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>VELANTECH AI Agronomist</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${advisorMode === 'gemini-ai' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-800 text-emerald-400 border-slate-700'}`}>
                  {advisorMode === 'gemini-ai' ? 'Gemini AI' : 'Smart guidance'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Smart Crop & Machinery Advisor</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Farmland Parameters Bar */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block">Land (Acres)</label>
            <input
              type="number"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              placeholder="Optional"
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block">Target Crop</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-xs font-semibold text-slate-800"
            >
              <option value="">Select crop (optional)</option>
              <option>Paddy</option>
              <option>Sugarcane</option>
              <option>Cotton</option>
              <option>Wheat</option>
              <option>Maize</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block">Region</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 truncate"
            />
          </div>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none font-medium'
                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-xs'
                }`}
              >
                {msg.text}
                {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Research sources</p>
                    <ul className="space-y-1">
                      {msg.sources.slice(0, 5).map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900">{source.title || source.url}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium bg-slate-100 p-3 rounded-2xl w-max border border-slate-200">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyzing agronomic parameters & machinery DB...</span>
            </div>
          )}
          {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">{error}</p>}
          <div ref={conversationEndRef} />
        </div>

        {/* Query Input Bar */}
        <form onSubmit={handleSendQuery} className="p-3 bg-white border-t border-slate-200 flex items-end gap-2">
          <textarea
            rows={2}
            placeholder="Ask in any language about crops, machinery, irrigation, pests, or farm planning..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl font-bold transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

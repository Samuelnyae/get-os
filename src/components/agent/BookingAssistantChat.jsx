import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  "Check room availability for tonight",
  "Create a reservation for 4 people at 7pm",
  "Show recent payments",
  "Book a spa session for tomorrow",
];

export default function BookingAssistantChat({ embedded = false }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let unsubscribe = null;
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'booking_assistant',
          metadata: { name: 'Booking Assistant' },
        });
        setConversation(conv);
        setMessages(conv.messages || []);
        unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
          setMessages(data.messages || []);
          setIsSending(false);
        });
      } catch (e) {
        setError(e.message || 'Failed to start conversation');
      } finally {
        setIsLoading(false);
      }
    };
    init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const message = (text || input).trim();
    if (!message || !conversation || isSending) return;
    setInput('');
    setIsSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: message });
    } catch (e) {
      setError(e.message || 'Failed to send message');
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#c9a962] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <button onClick={() => window.location.reload()} className="text-[#c9a962] text-sm underline">
          Retry
        </button>
      </div>
    );
  }

  const showSuggestions = messages.length === 0;

  return (
    <div className={`flex flex-col ${embedded ? 'h-[520px]' : 'h-[calc(100vh-16rem)] min-h-[500px]'} bg-[#0f0f0f] rounded-xl border border-[#c9a962]/10`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showSuggestions && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-[#c9a962]/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-[#c9a962]" />
            </div>
            <h3 className="font-playfair text-xl text-white mb-2">Booking Assistant</h3>
            <p className="text-white/50 text-sm mb-6">I can help with bookings, reservations, and payments.</p>
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2.5 rounded-lg bg-[#1e1e1e] border border-[#c9a962]/10 text-white/70 text-sm text-left hover:bg-[#2a2a2a] hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {isSending && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Assistant is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#c9a962]/10 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about bookings, reservations, payments..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#1e1e1e] border border-[#c9a962]/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9a962]/30 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            className="px-4 py-2.5 rounded-lg bg-[#d4b47a] text-[#0a0a0a] font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        {message.content && (
          isUser ? (
            <div className="px-4 py-2.5 rounded-lg rounded-br-sm bg-[#d4b47a] text-[#0a0a0a] text-sm">
              {message.content}
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-lg rounded-bl-sm bg-[#1e1e1e] text-white/90 text-sm">
              <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{message.content}</ReactMarkdown>
            </div>
          )
        )}
        {message.tool_calls?.map((tc, idx) => (
          <ToolCallDisplay key={idx} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const dp = toolCall.display_projection || {};
  const status = toolCall.status;
  const isRunning = ['pending', 'running', 'in_progress'].includes(status);
  const isFailed = ['failed', 'error'].includes(status);

  let parsedResults = toolCall.results;
  try {
    if (typeof parsedResults === 'string') parsedResults = JSON.parse(parsedResults);
  } catch { /* keep raw */ }
  const resultFailed = isFailed ||
    (typeof parsedResults === 'object' && parsedResults?.success === false) ||
    (typeof parsedResults === 'string' && /error|failed/i.test(parsedResults));

  if (dp.hide_details && dp.details_redacted) {
    const label = isRunning ? (dp.active_label || 'Running...') : resultFailed ? (dp.error_label || 'Failed') : (dp.label || 'Done');
    return (
      <div className="mt-1 text-xs text-white/40 flex items-center gap-1">
        {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors"
      >
        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : resultFailed ? <span className="text-red-400">✕</span> : <span className="text-green-400">✓</span>}
        <span className="capitalize">{toolCall.name?.replace(/_/g, ' ')}</span>
        <span className="text-white/30">·</span>
        <span className={resultFailed ? 'text-red-400' : isRunning ? 'text-[#c9a962]' : 'text-green-400'}>
          {isRunning ? 'Running' : resultFailed ? 'Failed' : 'Done'}
        </span>
      </button>
      {expanded && (
        <div className="mt-1 space-y-1 pl-4">
          {toolCall.arguments_string && (
            <div>
              <span className="text-white/30">Args: </span>
              <code className="text-white/50 break-all">{toolCall.arguments_string}</code>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <span className="text-white/30">Result: </span>
              <code className="text-white/50 break-all">{JSON.stringify(parsedResults).slice(0, 300)}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
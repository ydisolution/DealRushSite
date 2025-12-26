import { useState, useRef, useEffect } from "react";
import { nogaAvatar } from "@/assets/nogaAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Send, ThumbsUp, ThumbsDown } from "lucide-react";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  pageContext?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export default function AIAssistantModal({ isOpen, onClose, projectId, pageContext }: AIAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "שלום! אני נוגה, אשת הקשר של DealRush. אני כאן לכל שאלה על דילים, פרויקטים, הזמנות, תהליך רכישה, או כל דבר אחר. איך אפשר לעזור?",
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useMutation({
    mutationFn: async (question: string) => {
      setIsTyping(true);
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          projectId,
          pageContext,
        }),
      });
      if (!res.ok) throw new Error("Failed to get response");
      return res.json();
    },
    onSuccess: (data, question) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: question,
          id: Date.now().toString(),
        },
        {
          role: "assistant",
          content: data.answer,
          id: (Date.now() + 1).toString(),
        },
      ]);
      setInput("");
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "מצטערת, נתקלתי בבעיה. אנא נסה שוב.",
          id: Date.now().toString(),
        },
      ]);
      setIsTyping(false);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="flex flex-col h-full w-full" dir="rtl">
      {/* Header - Purple */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-[#7B2FF7] to-purple-600 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden flex items-center justify-center bg-white">
            <img src={nogaAvatar} alt="נוגה" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">נוגה</span>
            <span className="text-xs text-purple-100">אשת קשר DealRush</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-purple-100 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="סגור"
        >
          ×
        </button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2" ref={scrollRef} style={{ background: '#f7f7fa' }}>
        <div className="flex flex-col gap-2 py-4">
          {messages.map((message, idx) => (
            <div key={message.id} className={`flex items-end ${message.role === "user" ? "justify-end" : "justify-start"}`} dir="rtl">
              {message.role === "assistant" && (
                <img src={nogaAvatar} alt="נוגה" className="w-8 h-8 rounded-full border mr-2 mb-1 object-cover" />
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-[#e2e8f0] text-gray-900 rounded-br-md"
                    : "bg-white text-gray-900 border border-[#e9e9f3] rounded-bl-md"
                }`}
                style={{ textAlign: "right", direction: "rtl" }}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-end justify-start" dir="rtl">
              <img src={nogaAvatar} alt="נוגה" className="w-8 h-8 rounded-full border mr-2 mb-1 object-cover" />
              <div className="max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm bg-white border border-[#e9e9f3] rounded-bl-md flex items-center gap-2" style={{ textAlign: "right", direction: "rtl" }}>
                <span className="block w-2 h-2 bg-[#7B2FF7] rounded-full animate-bounce mr-0.5" style={{ animationDelay: '0ms' }}></span>
                <span className="block w-2 h-2 bg-[#7B2FF7] rounded-full animate-bounce mr-0.5" style={{ animationDelay: '150ms' }}></span>
                <span className="block w-2 h-2 bg-[#7B2FF7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Input */}
      <div className="flex gap-2 pt-4 border-t bg-white px-2 pb-2" dir="rtl">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="שאלי אותי כל דבר..."
          disabled={sendMessage.isPending}
          className="flex-1"
          dir="rtl"
          style={{ textAlign: "right", direction: "rtl" }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          className="bg-[#7B2FF7] hover:bg-purple-700"
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center pt-2 bg-white">
        נוגה מספקת מידע כללי בלבד ואינה מהווה ייעוץ משפטי או התחייבות
      </p>
    </div>
  );
}

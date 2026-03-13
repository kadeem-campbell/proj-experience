import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, X, MapPin, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  experiences?: { id: string; title: string; location: string; category: string; slug?: string }[];
}

export const ChatbotIntegration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I can help you find experiences. What are you looking for?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const query = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const keywords = query.toLowerCase().split(/\s+/);
      const orFilter = keywords.map(k => `title.ilike.%${k}%,category.ilike.%${k}%,location.ilike.%${k}%`).join(',');
      const { data } = await supabase.from('experiences').select('id, title, location, category, slug').or(orFilter).limit(5);
      const experiences = (data || []).map(e => ({ id: e.id, title: e.title, location: e.location, category: e.category, slug: e.slug || '' }));

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: experiences.length > 0 ? `I found ${experiences.length} experiences matching "${query}":` : `No experiences matched "${query}". Try different keywords!`,
        experiences,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="fixed bottom-20 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg">
        <Bot className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-80 h-96 flex flex-col shadow-xl">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2"><Bot className="w-4 h-4" /><span className="font-medium text-sm">Experience Finder</span></div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p>{msg.content}</p>
              {msg.experiences?.map(exp => (
                <a key={exp.id} href={`/experiences/${exp.slug || exp.id}`} className="block mt-2 p-2 bg-background rounded border hover:bg-accent transition-colors">
                  <p className="font-medium text-xs">{exp.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />{exp.location}
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{exp.category}</Badge>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2"><Loader2 className="w-4 h-4 animate-spin" /></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Search experiences..." className="text-sm" />
        <Button size="icon" className="shrink-0 h-9 w-9" onClick={handleSend} disabled={loading}><Send className="w-4 h-4" /></Button>
      </div>
    </Card>
  );
};

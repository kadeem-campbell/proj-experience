import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, X, MapPin, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatProduct {
  id: string;
  title: string;
  slug?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
}

export const ChatbotIntegration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I can help you find things to do. What are you looking for?" }
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
      const orFilter = keywords.map(k => `title.ilike.%${k}%`).join(',');
      const { data } = await supabase
        .from('products')
        .select('id, title, slug')
        .or(orFilter)
        .limit(5);
      const products: ChatProduct[] = (data || []).map(p => ({ id: p.id, title: p.title, slug: p.slug || '' }));

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: products.length > 0 ? `I found ${products.length} things to do matching "${query}":` : `Nothing matched "${query}". Try different keywords!`,
        products,
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
        <div className="flex items-center gap-2"><Bot className="w-4 h-4" /><span className="font-medium text-sm">Things to do finder</span></div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p>{msg.content}</p>
              {msg.products?.map(p => (
                <a key={p.id} href={`/things-to-do/${p.slug || p.id}`} className="block mt-2 p-2 bg-background rounded border hover:bg-accent transition-colors">
                  <p className="font-medium text-xs">{p.title}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2"><Loader2 className="w-4 h-4 animate-spin" /></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Search things to do..." className="text-sm" />
        <Button size="icon" className="shrink-0 h-9 w-9" onClick={handleSend} disabled={loading}><Send className="w-4 h-4" /></Button>
      </div>
    </Card>
  );
};

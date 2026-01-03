import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Bot, User, MapPin, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  experiences?: Array<{
    id: string;
    title: string;
    location: string;
    category: string;
    confidence: number;
  }>;
}

interface GroundTeamData {
  location: string;
  currentEvents: string[];
  popularExperiences: string[];
  weatherConditions: string;
  crowdLevels: Record<string, 'low' | 'medium' | 'high'>;
  lastUpdated: Date;
}

interface ChatbotKnowledge {
  id: string;
  category: string;
  keywords: string[];
  response_template: string;
  parameters: any;
  priority: number;
}

export const ChatbotIntegration = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [knowledgeBase, setKnowledgeBase] = useState<ChatbotKnowledge[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your experience guide. Tell me what kind of adventure you're looking for - I have real-time updates from our ground team!",
      timestamp: new Date(),
      suggestions: ["Something adventurous", "Beach vibes", "Local food tour", "Party tonight"]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mock ground team data - in real app, this would come from your team's API
  const [groundTeamData] = useState<GroundTeamData>({
    location: "Dar Es Salaam",
    currentEvents: ["Beach volleyball tournament at Coco Beach", "Live music at Slipway", "Night market in Kariakoo"],
    popularExperiences: ["Jet ski adventures", "Stone Town tours", "Spice farm visits"],
    weatherConditions: "Perfect beach weather - 28°C, sunny",
    crowdLevels: {
      "Coco Beach": "high",
      "Slipway": "medium", 
      "Masaki": "low"
    },
    lastUpdated: new Date()
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chatbot knowledge base
  useEffect(() => {
    const loadKnowledgeBase = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_knowledge')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (error) throw error;
        setKnowledgeBase((data || []).map(item => ({
          id: item.id,
          category: item.category,
          keywords: item.keywords,
          response_template: item.response_template,
          parameters: item.parameters,
          priority: item.priority
        })));
      } catch (error) {
        console.error('Error loading knowledge base:', error);
      }
    };

    loadKnowledgeBase();
  }, []);

  const saveInteraction = async (messageType: 'user' | 'bot', content: string, parameters?: any, experiences?: any[]) => {
    try {
      const groundTeamDataJson = {
        location: groundTeamData.location,
        currentEvents: groundTeamData.currentEvents,
        popularExperiences: groundTeamData.popularExperiences,
        weatherConditions: groundTeamData.weatherConditions,
        crowdLevels: groundTeamData.crowdLevels,
        lastUpdated: groundTeamData.lastUpdated.toISOString()
      };

      await supabase.from('chatbot_interactions').insert({
        user_id: user?.id,
        session_id: sessionId,
        message_type: messageType,
        content,
        parameters: parameters || {},
        experiences_found: experiences || [],
        ground_team_data: groundTeamDataJson,
        confidence_score: experiences?.length ? experiences[0]?.confidence / 100 : null
      });
    } catch (error) {
      console.error('Error saving interaction:', error);
    }
  };

  const analyzeQueryWithKnowledge = async (query: string) => {
    const keywords = query.toLowerCase().split(' ');
    
    // Find matching knowledge from database
    const matchingKnowledge = knowledgeBase.find(kb => 
      kb.keywords.some(keyword => keywords.some(k => k.includes(keyword.toLowerCase())))
    );

    // Fetch real experiences from database
    try {
      let experienceQuery = supabase
        .from('experiences')
        .select('*')
        .eq('status', 'active')
        .limit(3);

      if (matchingKnowledge) {
        const categoryMap: Record<string, string> = {
          'adventure': 'Adventure',
          'beach': 'Beach', 
          'food': 'Food & Dining',
          'nightlife': 'Nightlife'
        };
        
        const category = categoryMap[matchingKnowledge.category];
        if (category) {
          experienceQuery = experienceQuery.eq('category', category);
        }
      }

      const { data: experiences } = await experienceQuery;

      const formattedExperiences = (experiences || []).map((exp, index) => ({
        id: exp.id,
        title: exp.title,
        location: exp.location,
        category: exp.category,
        confidence: 95 - (index * 5) // Simulate confidence scoring
      }));

      const response = matchingKnowledge 
        ? matchingKnowledge.response_template 
        : `I found some great experiences for you! Let me show you what's available.`;

      const groundInsights = matchingKnowledge?.category === 'beach' 
        ? `Live update: ${groundTeamData.weatherConditions}. Coco Beach has ${groundTeamData.crowdLevels["Coco Beach"]} crowds right now.`
        : matchingKnowledge?.category === 'nightlife'
        ? `Tonight: ${groundTeamData.currentEvents[1]} at Slipway - perfect timing!`
        : `Our ground team reports: ${groundTeamData.currentEvents[0]} is happening today! ${groundTeamData.weatherConditions}`;

      return {
        experiences: formattedExperiences,
        groundInsights: `${response} ${groundInsights}`,
        knowledgeUsed: matchingKnowledge
      };
    } catch (error) {
      console.error('Error fetching experiences:', error);
      return {
        experiences: [],
        groundInsights: `Our team is active in ${groundTeamData.location}. Try asking about adventures, beaches, food, or parties!`,
        knowledgeUsed: null
      };
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    // Save user message
    await saveInteraction('user', currentInput);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = await analyzeQueryWithKnowledge(currentInput);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: analysis.groundInsights,
      timestamp: new Date(),
      experiences: analysis.experiences,
      suggestions: analysis.experiences.length > 0 ? 
        ["Show me more like this", "What's popular nearby?", "Check availability"] : 
        ["Adventure activities", "Beach experiences", "Food tours", "Night parties"]
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);

    // Save bot response
    await saveInteraction('bot', analysis.groundInsights, {
      knowledge_used: analysis.knowledgeUsed?.id,
      category: analysis.knowledgeUsed?.category
    }, analysis.experiences);

    if (analysis.experiences.length > 0) {
      toast({
        title: "Found experiences!",
        description: `${analysis.experiences.length} experiences match your request`,
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Experience Guide</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live with ground team</span>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
      </div>

      {/* Ground Team Status */}
      <div className="px-4 py-2 bg-card/50 border-b border-border/30">
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-3 h-3 text-primary" />
          <span className="text-muted-foreground">{groundTeamData.location}</span>
          <Clock className="w-3 h-3 text-muted-foreground ml-2" />
          <span className="text-muted-foreground">Updated {Math.floor((Date.now() - groundTeamData.lastUpdated.getTime()) / 60000)}m ago</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
              <div className="flex items-start gap-2">
                {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 text-primary" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  
                  {message.experiences && message.experiences.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium">Found experiences:</span>
                      </div>
                      {message.experiences.map((exp) => (
                        <div key={exp.id} className="bg-card/50 rounded p-2 text-xs">
                          <div className="font-medium">{exp.title}</div>
                          <div className="text-muted-foreground flex items-center gap-2 mt-1">
                            <span>{exp.location}</span>
                            <Badge variant="secondary" className="text-xs">{exp.confidence}% match</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about experiences..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isTyping}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
/**
 * Admin Questions & Answers — manage community questions, pin answers.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageCircle, Pin, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminQuestionsSection = () => {
  const qc = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const { data: answers = [] } = useQuery({
    queryKey: ['admin-answers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('answers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const getAnswersForQuestion = (qId: string) =>
    answers.filter((a: any) => a.question_id === qId);

  const togglePin = async (id: string, isPinned: boolean) => {
    await supabase.from('questions').update({ is_pinned: !isPinned }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-questions'] });
    toast.success(isPinned ? 'Unpinned' : 'Pinned');
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('questions').update({ status }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-questions'] });
    toast.success(`Status set to ${status}`);
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from('questions').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-questions'] });
    toast.success('Question deleted');
  };

  const markBestAnswer = async (answerId: string, questionId: string) => {
    // Unmark existing best
    await supabase.from('answers').update({ is_best: false }).eq('question_id', questionId);
    await supabase.from('answers').update({ is_best: true }).eq('id', answerId);
    qc.invalidateQueries({ queryKey: ['admin-answers'] });
    toast.success('Best answer marked');
  };

  const openCount = questions.filter((q: any) => q.status === 'open').length;
  const answeredCount = questions.filter((q: any) => q.status === 'answered').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Questions & Answers</h2>
        <p className="text-sm text-muted-foreground">Community questions across experiences and itineraries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Questions</p>
          <p className="text-2xl font-bold">{questions.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-2xl font-bold text-yellow-600">{openCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Answered</p>
          <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Answers</p>
          <p className="text-2xl font-bold">{answers.length}</p>
        </Card>
      </div>

      {/* Question list */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-16">Answers</TableHead>
              <TableHead className="w-16">Votes</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : questions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No questions yet</TableCell></TableRow>
            ) : (
              questions.map((q: any) => {
                const qAnswers = getAnswersForQuestion(q.id);
                return (
                  <TableRow key={q.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {q.is_pinned && <Pin className="w-3 h-3 text-primary mt-0.5 shrink-0" />}
                        <span className="text-sm line-clamp-2">{q.body}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{q.entity_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={q.status === 'open' ? 'secondary' : q.status === 'answered' ? 'default' : 'outline'} className="text-[10px]">
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{qAnswers.length}</TableCell>
                    <TableCell className="text-sm">{q.vote_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin(q.id, q.is_pinned)}>
                          <Pin className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateStatus(q.id, q.status === 'open' ? 'answered' : 'open')}>
                          {q.status === 'open' ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteQuestion(q.id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

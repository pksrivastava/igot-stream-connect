import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BarChart3, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  is_active: boolean;
}

interface PollManagerProps {
  eventId: string;
  isOrganizer: boolean;
}

export const PollManager = ({ eventId, isOrganizer }: PollManagerProps) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolls();
    
    const channel = supabase
      .channel('polls-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_polls',
        filter: `event_id=eq.${eventId}`
      }, () => {
        fetchPolls();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poll_responses'
      }, () => {
        fetchPolls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchPolls = async () => {
    const { data, error } = await supabase
      .from("event_polls")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching polls:", error);
      return;
    }

    const pollsData = (data || []).map(poll => ({
      ...poll,
      options: (poll.options as unknown) as PollOption[]
    }));

    setPolls(pollsData);
  };

  const createPoll = async () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) {
      toast({
        title: "Error",
        description: "Please provide a question and at least 2 options",
        variant: "destructive",
      });
      return;
    }

    const pollOptions = options
      .filter(o => o.trim())
      .map((text, index) => ({
        id: `option_${index}`,
        text,
        votes: 0
      }));

    const { error } = await supabase.from("event_polls").insert({
      event_id: eventId,
      question,
      options: pollOptions,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Poll created successfully",
    });
    setQuestion("");
    setOptions(["", ""]);
    setOpen(false);
  };

  const votePoll = async (pollId: string, optionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("poll_responses").insert({
      poll_id: pollId,
      user_id: user.id,
      option_id: optionId,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Vote recorded",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Polls</h3>
        {isOrganizer && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Poll</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What's your question?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[index] = e.target.value;
                          setOptions(newOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOptions(options.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOptions([...options, ""])}
                  >
                    Add Option
                  </Button>
                </div>
                <Button onClick={createPoll} className="w-full">
                  Create Poll
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {polls.map((poll) => (
          <Card key={poll.id}>
            <CardHeader>
              <CardTitle className="text-base">{poll.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {poll.options.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => votePoll(poll.id, option.id)}
                  disabled={!poll.is_active}
                >
                  <span>{option.text}</span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    {option.votes}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Plus, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SurveyQuestion {
  id: string;
  question: string;
  type: string;
}

interface Survey {
  id: string;
  title: string;
  questions: SurveyQuestion[];
  is_active: boolean;
}

interface SurveyManagerProps {
  eventId: string;
  isOrganizer: boolean;
}

export const SurveyManager = ({ eventId, isOrganizer }: SurveyManagerProps) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ question: "", type: "text" }]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [createdInAdvance, setCreatedInAdvance] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSurveys();
  }, [eventId]);

  const fetchSurveys = async () => {
    const { data, error } = await supabase
      .from("event_surveys")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching surveys:", error);
      return;
    }

    const surveysData = (data || []).map(survey => ({
      ...survey,
      questions: (survey.questions as unknown) as SurveyQuestion[]
    }));

    setSurveys(surveysData);
  };

  const createSurvey = async () => {
    if (!title.trim() || questions.filter(q => q.question.trim()).length === 0) {
      toast({
        title: "Error",
        description: "Please provide a title and at least one question",
        variant: "destructive",
      });
      return;
    }

    const surveyQuestions = questions
      .filter(q => q.question.trim())
      .map((q, index) => ({
        id: `question_${index}`,
        question: q.question,
        type: q.type
      }));

    const { error } = await supabase.from("event_surveys").insert({
      event_id: eventId,
      title,
      questions: surveyQuestions,
      scheduled_display_at: scheduledTime || null,
      created_in_advance: createdInAdvance,
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
      description: "Survey created successfully",
    });
    setTitle("");
    setQuestions([{ question: "", type: "text" }]);
    setScheduledTime("");
    setCreatedInAdvance(false);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Surveys</h3>
        {isOrganizer && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Survey</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Survey Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post-event feedback"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Questions</Label>
                  {questions.map((q, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={q.question}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              newQuestions[index].question = e.target.value;
                              setQuestions(newQuestions);
                            }}
                            placeholder={`Question ${index + 1}`}
                          />
                          <Select
                            value={q.type}
                            onValueChange={(value) => {
                              const newQuestions = [...questions];
                              newQuestions[index].type = value;
                              setQuestions(newQuestions);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="rating">Rating</SelectItem>
                              <SelectItem value="multiple">Multiple Choice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {questions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestions([...questions, { question: "", type: "text" }])}
                  >
                    Add Question
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="survey-created-in-advance"
                      checked={createdInAdvance}
                      onCheckedChange={(checked) => setCreatedInAdvance(checked as boolean)}
                    />
                    <Label htmlFor="survey-created-in-advance" className="text-sm font-normal">
                      Create in advance (schedule for later)
                    </Label>
                  </div>
                  
                  {createdInAdvance && (
                    <div>
                      <Label htmlFor="survey-scheduled-time" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Scheduled Display Time
                      </Label>
                      <Input
                        id="survey-scheduled-time"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        placeholder="When to display this survey"
                      />
                    </div>
                  )}
                </div>
                
                <Button onClick={createSurvey} className="w-full">
                  Create Survey
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {surveys.map((survey) => (
          <Card key={survey.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                {survey.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {survey.questions.length} questions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

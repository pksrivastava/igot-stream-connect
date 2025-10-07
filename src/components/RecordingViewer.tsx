import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Video, Scissors, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recording {
  id: string;
  file_path: string;
  duration: number;
  created_at: string;
}

interface RecordingViewerProps {
  eventId: string;
}

export const RecordingViewer = ({ eventId }: RecordingViewerProps) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecordings();
  }, [eventId]);

  const fetchRecordings = async () => {
    const { data, error } = await supabase
      .from("event_recordings")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recordings:", error);
      return;
    }

    setRecordings(data || []);
  };

  const getRecordingUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("event-recordings")
      .createSignedUrl(filePath, 3600);

    return data?.signedUrl || "";
  };

  const handleTrim = async () => {
    if (!selectedRecording || !videoRef.current) return;

    const duration = videoRef.current.duration;
    const startTime = (trimStart[0] / 100) * duration;
    const endTime = (trimEnd[0] / 100) * duration;

    toast({
      title: "Trimming Recording",
      description: `This would trim from ${startTime.toFixed(1)}s to ${endTime.toFixed(1)}s. Full implementation requires video processing library.`,
    });
  };

  const handleDownload = async (recording: Recording) => {
    const url = await getRecordingUrl(recording.file_path);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = recording.file_path;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recordings</h3>
      <div className="grid gap-3">
        {recordings.map((recording) => (
          <Card key={recording.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Recording - {new Date(recording.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(recording)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecording(recording)}
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        Trim
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Trim Recording</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <video
                          ref={videoRef}
                          src={recording.file_path}
                          controls
                          className="w-full rounded-lg"
                        />
                        <div className="space-y-4">
                          <div>
                            <Label>Start Time ({trimStart[0]}%)</Label>
                            <Slider
                              value={trimStart}
                              onValueChange={setTrimStart}
                              max={100}
                              step={1}
                            />
                          </div>
                          <div>
                            <Label>End Time ({trimEnd[0]}%)</Label>
                            <Slider
                              value={trimEnd}
                              onValueChange={setTrimEnd}
                              max={100}
                              step={1}
                            />
                          </div>
                          <Button onClick={handleTrim} className="w-full">
                            Apply Trim
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Duration: {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, "0")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

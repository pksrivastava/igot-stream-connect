import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Video, Scissors, Download, Upload, Play } from "lucide-react";
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
  isOrganizer?: boolean;
}

export const RecordingViewer = ({ eventId, isOrganizer = false }: RecordingViewerProps) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playingUrl, setPlayingUrl] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("video")) {
      toast({
        title: "Invalid file",
        description: "Please upload a video file (MP4)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${eventId}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from("event-recordings")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Create video element to get duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = async () => {
        const duration = Math.floor(video.duration);
        
        // Save recording metadata to database
        const { error: dbError } = await supabase
          .from("event_recordings")
          .insert({
            event_id: eventId,
            file_path: fileName,
            file_size: file.size,
            duration: duration,
            format: "mp4",
          });

        if (dbError) throw dbError;

        // Update event with recording URL
        await supabase
          .from("events")
          .update({ recording_url: fileName })
          .eq("id", eventId);

        setUploadProgress(100);
        setUploading(false);
        fetchRecordings();

        toast({
          title: "Upload successful",
          description: "Recording uploaded and saved",
        });
      };
      video.src = URL.createObjectURL(file);
    } catch (error: any) {
      setUploading(false);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const { data, error } = await supabase.storage
        .from("event-recordings")
        .download(recording.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = recording.file_path.split("/").pop() || "recording.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your recording is downloading...",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePlay = async (recording: Recording) => {
    const url = await getRecordingUrl(recording.file_path);
    setPlayingUrl(url);
    setSelectedRecording(recording);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recordings</h3>
        {isOrganizer && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/x-m4v,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Recording
            </Button>
          </>
        )}
      </div>

      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Uploading... {uploadProgress}%</Label>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {recordings.length === 0 && !uploading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recordings available yet
          </p>
        )}
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
                    onClick={() => handlePlay(recording)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(recording)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {isOrganizer && (
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
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Duration: {Math.floor((recording.duration || 0) / 60)}:{((recording.duration || 0) % 60).toString().padStart(2, "0")}
                </p>
                {playingUrl && selectedRecording?.id === recording.id && (
                  <video
                    controls
                    className="w-full rounded-lg mt-2"
                    src={playingUrl}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

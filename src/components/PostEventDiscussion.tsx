import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Download, X, MessageSquare, Video } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Discussion {
  id: string;
  user_id: string;
  message: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

interface Recording {
  id: string;
  file_path: string;
  duration: number;
  created_at: string;
  file_size?: number;
  format?: string;
}

interface PostEventDiscussionProps {
  eventId: string;
  currentUserId: string;
  eventTitle: string;
}

export const PostEventDiscussion = ({
  eventId,
  currentUserId,
  eventTitle,
}: PostEventDiscussionProps) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDiscussions();
    fetchRecordings();
    subscribeToDiscussions();
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [discussions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDiscussions = async () => {
    const { data, error } = await supabase
      .from("post_event_discussions")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching discussions:", error);
      return;
    }

    setDiscussions(data || []);
  };

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

  const handleDownloadRecording = async (recording: Recording) => {
    try {
      const { data, error } = await supabase.storage
        .from("event-recordings")
        .createSignedUrl(recording.file_path, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        const link = document.createElement("a");
        link.href = data.signedUrl;
        link.download = `${eventTitle}-${new Date(recording.created_at).toISOString().split('T')[0]}.mp4`;
        link.click();

        toast({
          title: "Download Started",
          description: "Your MP4 recording is downloading",
        });
      }
    } catch (error) {
      console.error("Error downloading recording:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the recording",
        variant: "destructive",
      });
    }
  };

  const subscribeToDiscussions = () => {
    const channel = supabase
      .channel(`discussions-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_event_discussions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setDiscussions((prev) => [...prev, payload.new as Discussion]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
    const filePath = `${eventId}/discussions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return { filePath, fileName: file.name, fileSize: file.size };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    setIsUploading(true);

    try {
      let fileData = null;

      if (selectedFile) {
        fileData = await uploadFile(selectedFile);
      }

      const { error } = await supabase.from("post_event_discussions").insert({
        event_id: eventId,
        user_id: currentUserId,
        message: newMessage.trim(),
        file_path: fileData?.filePath || null,
        file_name: fileData?.fileName || null,
        file_size: fileData?.fileSize || null,
      });

      if (error) throw error;

      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Message sent",
        description: "Your message has been posted successfully",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("chat-files")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Recording Downloads */}
      {recordings.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary-dark/5">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Video className="h-5 w-5 text-primary" />
              </div>
              Event Recordings Available
            </CardTitle>
            <CardDescription className="ml-13">
              Download your HLS recordings converted to MP4 format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="group flex items-center justify-between p-4 bg-background hover:bg-accent/50 rounded-xl border border-border hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">
                      Recording - {new Date(recording.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        MP4 FORMAT
                      </span>
                      {recording.duration && (
                        <span className="text-xs text-muted-foreground">
                          Duration: {Math.floor(recording.duration / 60)}min {recording.duration % 60}sec
                        </span>
                      )}
                      {recording.file_size && (
                        <span className="text-xs text-muted-foreground">
                          Size: {(recording.file_size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => handleDownloadRecording(recording)}
                  className="gap-2 bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download MP4
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Discussion */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Post-Event Discussion: {eventTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {discussions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No discussions yet. Start the conversation!</p>
              </div>
            ) : (
              discussions.map((disc) => (
                <div
                  key={disc.id}
                  className={`flex ${
                    disc.user_id === currentUserId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      disc.user_id === currentUserId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{disc.message}</p>
                    {disc.file_path && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded bg-background/10">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm flex-1 truncate">
                          {disc.file_name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            downloadFile(disc.file_path!, disc.file_name!)
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(disc.created_at).toLocaleTimeString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t pt-4 mt-4 space-y-2">
          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm flex-1 truncate">
                {selectedFile.name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share your thoughts..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isUploading}
            />
            <Button onClick={handleSendMessage} disabled={isUploading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

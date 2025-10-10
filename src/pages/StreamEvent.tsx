import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Radio, Users, MessageSquare, ArrowLeft, Send, Mic, Camera, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { InviteParticipants } from "@/components/InviteParticipants";
import { PollManager } from "@/components/PollManager";
import { SurveyManager } from "@/components/SurveyManager";
import { RecordingViewer } from "@/components/RecordingViewer";
import { BreakoutRoomManager } from "@/components/BreakoutRoomManager";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ActivityReport } from "@/components/ActivityReport";
import { ChatWithFiles } from "@/components/ChatWithFiles";
import { PostEventDiscussion } from "@/components/PostEventDiscussion";

const StreamEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [translatedCaption, setTranslatedCaption] = useState("");
  const [eventStatus, setEventStatus] = useState<"live" | "ended">("live");
  const [liveCaptions, setLiveCaptions] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchEvent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      if (!id) {
        toast({
          title: "Invalid event",
          description: "Event ID is missing",
          variant: "destructive",
        });
        navigate("/events");
        return;
      }

      try {
        const { data: eventData, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (eventData.organizer_id !== session.user.id) {
          toast({
            title: "Access denied",
            description: "You don't have permission to manage this event",
            variant: "destructive",
          });
          navigate("/events");
          return;
        }

        setEvent(eventData);
        setEventStatus(eventData.status === "ended" ? "ended" : "live");
      } catch (error: any) {
        toast({
          title: "Error loading event",
          description: error.message,
          variant: "destructive",
        });
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchEvent();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
      stopStream();
      if (recognition) {
        recognition.stop();
      }
    };
  }, [id, navigate]);

  useEffect(() => {
    if (event && !loading) {
      startPreview();
      getDevices();
      setupSpeechRecognition();
    }
  }, [event, loading]);

  useEffect(() => {
    if (selectedCamera || selectedMic) {
      startPreview();
    }
  }, [selectedCamera, selectedMic]);

  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices(deviceList);
      
      const cameras = deviceList.filter(d => d.kind === 'videoinput');
      const mics = deviceList.filter(d => d.kind === 'audioinput');
      
      if (cameras.length > 0 && !selectedCamera) setSelectedCamera(cameras[0].deviceId);
      if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId);
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  };

  const startPreview = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: selectedCamera } : true,
        audio: selectedMic ? { deviceId: selectedMic } : true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Setup audio level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(mediaStream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      toast({
        title: "Preview Started",
        description: "Camera and microphone are ready",
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Error",
        description: "Could not access camera or microphone",
        variant: "destructive",
      });
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setLiveCaptions(finalTranscript || interimTranscript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      setRecognition(recognitionInstance);
    }
  };

  const handleGoLive = async () => {
    if (!stream || !event) {
      toast({
        title: "Error",
        description: "Please enable camera and microphone first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "live" })
        .eq("id", event.id);

      if (error) throw error;

      setIsLive(true);
      if (recognition) {
        recognition.start();
      }
      toast({
        title: "Stream Started",
        description: "Broadcasting live. Recording and captions started.",
      });
    } catch (error: any) {
      toast({
        title: "Error starting stream",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEndStream = async () => {
    if (!event) return;

    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "ended" })
        .eq("id", event.id);

      if (error) throw error;

      setIsLive(false);
      setEventStatus("ended");
      if (recognition) {
        recognition.stop();
      }
      stopStream();
      toast({
        title: "Stream Ended",
        description: "Recording saved successfully. Download MP4 in post-event discussion.",
      });
    } catch (error: any) {
      toast({
        title: "Error ending stream",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 py-12">
        <div className="container max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/events")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Stream Area */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{event.title}</CardTitle>
                        <CardDescription>{event.event_type}</CardDescription>
                      </div>
                    </div>
                    {isLive && (
                      <Badge className="bg-red-500 animate-pulse">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {isLive && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 animate-pulse">
                          <Radio className="h-3 w-3 mr-1" />
                          LIVE • HLS Recording
                        </Badge>
                      </div>
                    )}
                    {isLive && liveCaptions && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border-2 border-white/30">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/50">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                              <span className="text-xs font-bold text-red-100 uppercase tracking-wide">Live Captions</span>
                            </div>
                          </div>
                          <p className="text-white text-center text-lg md:text-xl leading-relaxed font-semibold drop-shadow-lg">
                            {liveCaptions}
                          </p>
                        </div>
                      </div>
                    )}
                    {!stream && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center space-y-2">
                          <Camera className="h-12 w-12 text-white mx-auto opacity-50" />
                          <p className="text-white">Initializing camera...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Device Settings */}
                  <Card className="mb-6 bg-secondary/30">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Device Testing</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Camera
                          </Label>
                          <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select camera" />
                            </SelectTrigger>
                            <SelectContent>
                              {devices
                                .filter(d => d.kind === 'videoinput' && d.deviceId)
                                .map(device => (
                                  <SelectItem key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            Microphone
                          </Label>
                          <Select value={selectedMic} onValueChange={setSelectedMic}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select microphone" />
                            </SelectTrigger>
                            <SelectContent>
                              {devices
                                .filter(d => d.kind === 'audioinput' && d.deviceId)
                                .map(device => (
                                  <SelectItem key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Audio Level</Label>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-100"
                            style={{ width: `${Math.min(audioLevel, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Speak into your microphone to test audio levels
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    {!isLive ? (
                      <Button onClick={handleGoLive} size="lg" className="flex-1">
                        <Radio className="mr-2 h-5 w-5" />
                        Go Live
                      </Button>
                    ) : (
                      <Button onClick={handleEndStream} variant="destructive" size="lg" className="flex-1">
                        End Stream
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stream Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Stream Information</CardTitle>
                    <InviteParticipants eventId={event.id} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Viewers</Label>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-bold">{isLive ? "324" : "0"}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Duration</Label>
                      <div className="text-2xl font-bold">{isLive ? "12:34" : "00:00"}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant={isLive ? "default" : "secondary"}>
                        {isLive ? "Live" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recordings */}
              <RecordingViewer eventId={event.id} />

              {/* Polls */}
              <Card>
                <CardContent className="pt-6">
                  <PollManager eventId={event.id} isOrganizer={true} />
                </CardContent>
              </Card>

              {/* Surveys */}
              <Card>
                <CardContent className="pt-6">
                  <SurveyManager eventId={event.id} isOrganizer={true} />
                </CardContent>
              </Card>

              {/* Activity Report */}
              <Card>
                <CardContent className="pt-6">
                  <ActivityReport eventId={event.id} />
                </CardContent>
              </Card>
            </div>

            {/* Chat Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {eventStatus === "live" ? (
                <Card className="h-[500px]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <CardTitle>Live Chat with Files</CardTitle>
                    </div>
                    <CardDescription>Share messages and documents</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)] p-0">
                    <ChatWithFiles eventId={event.id} currentUserId={user?.id || ""} />
                  </CardContent>
                </Card>
              ) : (
                <PostEventDiscussion 
                  eventId={event.id} 
                  currentUserId={user?.id || ""}
                  eventTitle={event.title}
                />
              )}

              {/* Language Switcher */}
              <LanguageSwitcher 
                sourceText="Welcome to the live stream!"
                onTranslate={setTranslatedCaption}
              />
              {translatedCaption && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Translated Caption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{translatedCaption}</p>
                  </CardContent>
                </Card>
              )}

              {/* Breakout Rooms */}
              <Card>
                <CardContent className="pt-6">
                  <BreakoutRoomManager eventId={event.id} isOrganizer={true} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StreamEvent;

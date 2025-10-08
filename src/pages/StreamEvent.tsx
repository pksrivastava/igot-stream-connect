import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  const currentUserId = "demo-user-id"; // Replace with actual user ID
  const eventId = "demo-event-id";
  const eventTitle = "Product Launch Webinar";

  useEffect(() => {
    // Request permissions and start preview automatically
    startPreview();
    getDevices();
    
    return () => {
      stopStream();
    };
  }, []);

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

  const handleGoLive = () => {
    if (!stream) {
      toast({
        title: "Error",
        description: "Please enable camera and microphone first",
        variant: "destructive",
      });
      return;
    }
    
    setIsLive(true);
    toast({
      title: "Stream Started",
      description: "Broadcasting live in HLS mode. Recording automatically started.",
    });
  };

  const handleEndStream = () => {
    setIsLive(false);
    setEventStatus("ended");
    stopStream();
    toast({
      title: "Stream Ended",
      description: "Recording saved successfully. Post-event discussion is now available.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 py-12">
        <div className="container max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
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
                        <CardTitle className="text-2xl">Live Stream</CardTitle>
                        <CardDescription>Digital Governance Workshop</CardDescription>
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
                    <InviteParticipants eventId="demo-event-id" />
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
              <RecordingViewer eventId="demo-event-id" />

              {/* Polls */}
              <Card>
                <CardContent className="pt-6">
                  <PollManager eventId="demo-event-id" isOrganizer={true} />
                </CardContent>
              </Card>

              {/* Surveys */}
              <Card>
                <CardContent className="pt-6">
                  <SurveyManager eventId="demo-event-id" isOrganizer={true} />
                </CardContent>
              </Card>

              {/* Activity Report */}
              <Card>
                <CardContent className="pt-6">
                  <ActivityReport eventId="demo-event-id" />
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
                    <ChatWithFiles eventId={eventId} currentUserId={currentUserId} />
                  </CardContent>
                </Card>
              ) : (
                <PostEventDiscussion 
                  eventId={eventId} 
                  currentUserId={currentUserId}
                  eventTitle={eventTitle}
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
                  <BreakoutRoomManager eventId="demo-event-id" isOrganizer={true} />
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

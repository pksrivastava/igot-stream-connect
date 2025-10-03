import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Video, Radio, Users, MessageSquare, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const StreamEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLive, setIsLive] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { user: "Admin", message: "Welcome to the live stream!", time: "10:00 AM" },
    { user: "Priya S.", message: "Excited for this session!", time: "10:01 AM" },
  ]);

  const handleGoLive = () => {
    setIsLive(true);
    toast({
      title: "Stream Started",
      description: "You are now broadcasting live!",
    });
  };

  const handleEndStream = () => {
    setIsLive(false);
    toast({
      title: "Stream Ended",
      description: "Your broadcast has been stopped.",
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setChatMessages(prev => [...prev, {
      user: "You",
      message: chatMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatMessage("");
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
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6">
                    {isLive ? (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                          <Radio className="h-10 w-10 text-red-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">Broadcasting Live</p>
                          <p className="text-muted-foreground">Your stream is active</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                          <Video className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">Stream Preview</p>
                          <p className="text-muted-foreground">Click "Go Live" to start broadcasting</p>
                        </div>
                      </div>
                    )}
                  </div>

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
                  <CardTitle>Stream Information</CardTitle>
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
            </div>

            {/* Chat Sidebar */}
            <div className="lg:col-span-1">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle>Live Chat</CardTitle>
                  </div>
                  <CardDescription>Interact with your audience</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4">
                  <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{msg.user}</span>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm bg-muted p-2 rounded">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={!isLive}
                    />
                    <Button type="submit" size="icon" disabled={!isLive}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
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

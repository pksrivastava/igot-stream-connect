import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BreakoutRoom {
  id: string;
  name: string;
  max_participants: number;
  is_active: boolean;
  participant_count?: number;
}

interface BreakoutRoomManagerProps {
  eventId: string;
  isOrganizer: boolean;
}

export const BreakoutRoomManager = ({ eventId, isOrganizer }: BreakoutRoomManagerProps) => {
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
    checkCurrentRoom();

    const channel = supabase
      .channel('breakout-rooms-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'breakout_rooms',
        filter: `event_id=eq.${eventId}`
      }, () => {
        fetchRooms();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'breakout_room_participants'
      }, () => {
        fetchRooms();
        checkCurrentRoom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchRooms = async () => {
    const { data: roomsData, error } = await supabase
      .from("breakout_rooms")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching rooms:", error);
      return;
    }

    // Get participant counts for each room
    const roomsWithCounts = await Promise.all(
      (roomsData || []).map(async (room) => {
        const { count } = await supabase
          .from("breakout_room_participants")
          .select("*", { count: 'exact', head: true })
          .eq("room_id", room.id)
          .is("left_at", null);

        return { ...room, participant_count: count || 0 };
      })
    );

    setRooms(roomsWithCounts);
  };

  const checkCurrentRoom = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("breakout_room_participants")
      .select("room_id")
      .eq("user_id", user.id)
      .is("left_at", null)
      .single();

    setCurrentRoom(data?.room_id || null);
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a room name",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("breakout_rooms").insert({
      event_id: eventId,
      name: roomName,
      max_participants: parseInt(maxParticipants),
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
      description: "Breakout room created",
    });
    setRoomName("");
    setMaxParticipants("10");
    setOpen(false);
  };

  const joinRoom = async (roomId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Leave current room if any
    if (currentRoom) {
      await supabase
        .from("breakout_room_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("room_id", currentRoom)
        .eq("user_id", user.id);
    }

    const { error } = await supabase.from("breakout_room_participants").insert({
      room_id: roomId,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Log activity
    await supabase.from("participant_activities").insert({
      event_id: eventId,
      user_id: user.id,
      activity_type: "breakout_join",
      activity_data: { room_id: roomId }
    });

    toast({
      title: "Success",
      description: "Joined breakout room",
    });
  };

  const leaveRoom = async () => {
    if (!currentRoom) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("breakout_room_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", currentRoom)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Log activity
    await supabase.from("participant_activities").insert({
      event_id: eventId,
      user_id: user.id,
      activity_type: "breakout_leave",
      activity_data: { room_id: currentRoom }
    });

    toast({
      title: "Success",
      description: "Left breakout room",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Breakout Rooms</h3>
        {isOrganizer && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Breakout Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Discussion Group 1"
                  />
                </div>
                <div>
                  <Label htmlFor="max-participants">Max Participants</Label>
                  <Input
                    id="max-participants"
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    min="2"
                    max="50"
                  />
                </div>
                <Button onClick={createRoom} className="w-full">
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {room.name}
                </CardTitle>
                <Badge variant={currentRoom === room.id ? "default" : "secondary"}>
                  {room.participant_count}/{room.max_participants}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {currentRoom === room.id ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={leaveRoom}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Room
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => joinRoom(room.id)}
                  disabled={(room.participant_count || 0) >= room.max_participants}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Join Room
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

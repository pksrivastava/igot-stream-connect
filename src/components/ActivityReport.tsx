import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, MessageSquare, BarChart3, ClipboardList, Users, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface ActivityReportProps {
  eventId: string;
}

export const ActivityReport = ({ eventId }: ActivityReportProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    total_participants: 0,
    chat_messages: 0,
    poll_votes: 0,
    survey_responses: 0,
  });

  useEffect(() => {
    fetchActivities();
    calculateStats();

    const channel = supabase
      .channel('activities-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'participant_activities',
        filter: `event_id=eq.${eventId}`
      }, () => {
        fetchActivities();
        calculateStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("participant_activities")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching activities:", error);
      return;
    }

    setActivities(data || []);
  };

  const calculateStats = async () => {
    // Get unique participants
    const { count: participantCount } = await supabase
      .from("event_participants")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", eventId);

    // Get chat message count
    const { count: chatCount } = await supabase
      .from("participant_activities")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", eventId)
      .eq("activity_type", "chat");

    // Get poll vote count
    const { count: pollCount } = await supabase
      .from("participant_activities")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", eventId)
      .eq("activity_type", "poll_vote");

    // Get survey response count
    const { count: surveyCount } = await supabase
      .from("participant_activities")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", eventId)
      .eq("activity_type", "survey_response");

    setStats({
      total_participants: participantCount || 0,
      chat_messages: chatCount || 0,
      poll_votes: pollCount || 0,
      survey_responses: surveyCount || 0,
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'joined':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'left':
        return <LogOut className="h-4 w-4 text-red-500" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'poll_vote':
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
      case 'survey_response':
        return <ClipboardList className="h-4 w-4 text-orange-500" />;
      case 'breakout_join':
      case 'breakout_leave':
        return <Users className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Participant Activity Report
      </h3>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold">{stats.total_participants}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold">{stats.chat_messages}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold">{stats.poll_votes}</p>
              <p className="text-xs text-muted-foreground">Poll Votes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold">{stats.survey_responses}</p>
              <p className="text-xs text-muted-foreground">Surveys</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                  {getActivityIcon(activity.activity_type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getActivityLabel(activity.activity_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {activity.activity_data && (
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(activity.activity_data)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

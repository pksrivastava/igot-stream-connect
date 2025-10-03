import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video } from "lucide-react";

const EventsList = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: "Digital Governance Workshop",
      date: "March 15, 2025",
      time: "10:00 AM IST",
      presenter: "Dr. Rajesh Kumar",
      participants: 450,
      type: "Webinar",
      status: "upcoming"
    },
    {
      id: 2,
      title: "Cyber Security Training",
      date: "March 18, 2025",
      time: "2:00 PM IST",
      presenter: "Ms. Priya Sharma",
      participants: 320,
      type: "Live Stream",
      status: "upcoming"
    },
    {
      id: 3,
      title: "Policy Implementation Review",
      date: "March 20, 2025",
      time: "11:00 AM IST",
      presenter: "Shri Amit Patel",
      participants: 200,
      type: "Webinar",
      status: "upcoming"
    }
  ];

  return (
    <section id="events" className="py-24">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Upcoming Events
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join live sessions and participate in interactive learning experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="flex flex-col transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={event.type === "Webinar" ? "default" : "secondary"}>
                    {event.type}
                  </Badge>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                    Live
                  </Badge>
                </div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription>by {event.presenter}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{event.participants} registered</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="w-full" variant="default">
                    <Video className="mr-2 h-4 w-4" />
                    Join Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Events
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsList;

import { Button } from "@/components/ui/button";
import { Play, Calendar, MessageSquare } from "lucide-react";
import heroImage from "@/assets/hero-streaming.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground">
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTEwIDBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
      
      <div className="container relative py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                Government Live Streaming Platform
              </h1>
              <p className="text-lg text-primary-foreground/90 max-w-xl">
                Secure, scalable live streaming and event management for government officials. 
                Host webinars, engage with real-time chat, and deliver impactful learning experiences.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="hero">
                <Play className="mr-2 h-5 w-5" />
                Start Streaming
              </Button>
              <Button size="lg" variant="outline" className="bg-accent border-accent-foreground/20 text-accent-foreground hover:bg-accent/90">
                <Calendar className="mr-2 h-5 w-5" />
                Create Event
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-primary-foreground/80">Live Events</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-primary-foreground/80">Participants</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-primary-foreground/80">Uptime</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-3xl"></div>
            <img 
              src={heroImage} 
              alt="Government Live Streaming Platform"
              className="relative rounded-2xl shadow-2xl border border-primary-foreground/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

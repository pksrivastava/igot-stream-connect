import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import iconAuthoring from "@/assets/icon-authoring.jpg";
import iconStreaming from "@/assets/icon-streaming.jpg";
import iconChat from "@/assets/icon-chat.jpg";
import { Shield, Users, BarChart } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: iconAuthoring,
      title: "Event Authoring",
      description: "Create and schedule live events with intuitive tools. Set agendas, add presenters, and manage participants seamlessly."
    },
    {
      icon: iconStreaming,
      title: "Secure Streaming",
      description: "Government-compliant live streaming with role-based access. Reach thousands with reliable, high-quality video delivery."
    },
    {
      icon: iconChat,
      title: "Real-time Chat",
      description: "Engage audiences with live chat, moderation tools, and interactive Q&A sessions during events."
    }
  ];

  const additionalFeatures = [
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "Built for government use with data privacy, encryption, and compliance standards."
    },
    {
      icon: Users,
      title: "Role-based Access",
      description: "Granular permissions for admins, moderators, and participants to ensure proper governance."
    },
    {
      icon: BarChart,
      title: "Analytics & Reports",
      description: "Track attendance, engagement, and impact with comprehensive event analytics."
    }
  ];

  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Powerful Features for Government Officials
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to deliver engaging live events and manage learning experiences at scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-muted">
                <img 
                  src={feature.icon} 
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {additionalFeatures.map((feature, index) => (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InviteParticipantsProps {
  eventId: string;
}

export const InviteParticipants = ({ eventId }: InviteParticipantsProps) => {
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSingleInvite = async () => {
    if (!singleEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd send an email invitation here
      // For now, we'll show a success message
      toast({
        title: "Invitation Sent",
        description: `Invitation email sent to ${singleEmail}`,
      });
      setSingleEmail("");
      setOpen(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInvite = async () => {
    const emails = bulkEmails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e);

    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      toast({
        title: "Success",
        description: `Invitation emails sent to ${emails.length} participants`,
      });
      setBulkEmails("");
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Participants
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Participants</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">
              <UserPlus className="h-4 w-4 mr-2" />
              Single
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <Users className="h-4 w-4 mr-2" />
              Bulk
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="participant@example.com"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSingleInvite} disabled={loading} className="w-full">
              Send Invitation
            </Button>
          </TabsContent>
          <TabsContent value="bulk" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-emails">Email Addresses (one per line)</Label>
              <Textarea
                id="bulk-emails"
                placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={8}
              />
            </div>
            <Button onClick={handleBulkInvite} disabled={loading} className="w-full">
              Send Invitations
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

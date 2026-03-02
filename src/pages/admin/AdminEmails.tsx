import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCustomers } from "@/hooks/useAdminData";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Send, Loader2, Users, X, Search, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminEmails = () => {
  const { data: customers, isLoading: loadingCustomers } = useAdminCustomers();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  const filteredCustomers = (customers || []).filter(c =>
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectAll = () => {
    const allEmails = filteredCustomers.map(c => c.email);
    setSelectedEmails(prev => {
      const newSet = new Set([...prev, ...allEmails]);
      return Array.from(newSet);
    });
  };

  const clearAll = () => setSelectedEmails([]);

  const addManualEmail = () => {
    const email = manualEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    if (!selectedEmails.includes(email)) {
      setSelectedEmails(prev => [...prev, email]);
    }
    setManualEmail("");
  };

  const handleSend = async () => {
    if (selectedEmails.length === 0) {
      toast({ title: "No recipients", description: "Select at least one recipient", variant: "destructive" });
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Missing fields", description: "Subject and message are required", variant: "destructive" });
      return;
    }

    const session = sessionStorage.getItem("rayn_admin_session");
    if (!session) return;
    const { email: adminEmail, token } = JSON.parse(session);

    setIsSending(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-email", {
        body: {
          admin_email: adminEmail,
          admin_token: token,
          to_emails: selectedEmails,
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      if (error) throw error;

      setLastResult({ sent: data.sent, failed: data.failed });
      toast({
        title: "Emails sent!",
        description: `${data.sent} delivered, ${data.failed} failed`,
      });

      if (data.failed === 0) {
        setSubject("");
        setMessage("");
        setSelectedEmails([]);
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Send Email</h1>
        <p className="text-muted-foreground text-sm mt-1">Send custom emails to your customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Recipients
              {selectedEmails.length > 0 && (
                <Badge variant="secondary">{selectedEmails.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Select customers or add emails manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual email add */}
            <div className="flex gap-2">
              <Input
                placeholder="Add email manually..."
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addManualEmail())}
              />
              <Button variant="outline" size="sm" onClick={addManualEmail}>Add</Button>
            </div>

            {/* Selected emails */}
            {selectedEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedEmails.map(email => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1">
                    {email}
                    <button onClick={() => toggleEmail(email)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Customer list */}
            <div className="border rounded-lg">
              <div className="p-2 border-b flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  className="flex-1 text-sm bg-transparent outline-none"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground">
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-[280px]">
                {loadingCustomers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No customers found</p>
                ) : (
                  <div className="divide-y">
                    {filteredCustomers.map(c => (
                      <label
                        key={c.email}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedEmails.includes(c.email)}
                          onCheckedChange={() => toggleEmail(c.email)}
                        />
                        <span className="text-sm truncate">{c.email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Compose
            </CardTitle>
            <CardDescription>Write your email content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Email subject..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Write your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={12}
                className="mt-1"
              />
            </div>

            {lastResult && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{lastResult.sent} sent, {lastResult.failed} failed</span>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSend}
              disabled={isSending || selectedEmails.length === 0 || !subject.trim() || !message.trim()}
            >
              {isSending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />Send to {selectedEmails.length} recipient{selectedEmails.length !== 1 ? "s" : ""}</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(AdminEmails);

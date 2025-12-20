import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ChatPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const response = await apiRequest("POST", "/api/chat", { message: msg });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate(message.trim());
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Global Chat</h1>
        <p className="text-muted-foreground">Connect with the community in real-time</p>
      </div>

      <div className="flex-1 flex flex-col bg-card rounded-lg border overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages && messages.length > 0 ? (
            <>
              {messages.map((msg) => {
                const isOwn = msg.userId === user?.id;
                const username = msg.userEmail.split("@")[0];
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                    data-testid={`chat-message-${msg.id}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                        {username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{username}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg text-sm break-words ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-2">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2 bg-background/50">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-muted/50 border-0"
            maxLength={500}
            disabled={sendMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            data-testid="button-send-message"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

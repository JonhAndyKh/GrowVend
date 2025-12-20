import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, Loader2, MoreVertical } from "lucide-react";
import { format } from "date-fns";

export default function ChatPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate(message.trim());
    }
  };

  const onlineCount = new Set(messages?.map(m => m.userId)).size + 1;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="font-semibold text-sm">{onlineCount} Online</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.userId === user?.id;
              const username = msg.userEmail.split("@")[0];
              return (
                <div
                  key={msg.id}
                  className="flex gap-3 group hover:bg-muted/50 p-2 rounded transition-colors"
                  data-testid={`chat-message-${msg.id}`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{username}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </span>
                      <button className="invisible group-hover:visible ml-auto opacity-50 hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-foreground break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="border-t bg-background/95 backdrop-blur p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-muted/50 border-0 rounded-lg focus-visible:ring-1"
            maxLength={500}
            disabled={sendMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            className="bg-primary hover:bg-primary/90 rounded-lg"
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

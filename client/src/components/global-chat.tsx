import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Send, X, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { format } from "date-fns";

export function GlobalChat() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
    <Card 
      className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] sm:w-96 max-w-96 shadow-2xl flex flex-col transition-all duration-300"
      style={{
        height: isMinimized ? "auto" : "min(65vh, 600px)",
        maxHeight: isMinimized ? "auto" : "600px",
      }}
      data-testid="chat-panel"
    >
      <div className="flex items-center justify-between gap-2 p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="font-semibold text-sm">Global Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
            data-testid="button-minimize-chat"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {messages.map((msg) => {
                  const isOwn = msg.userId === user?.id;
                  const username = msg.userEmail.split("@")[0];
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                      data-testid={`chat-message-${msg.id}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary font-bold">
                          {username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col ${isOwn ? "items-end" : ""} max-w-[75%]`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium">{username}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-lg text-sm break-words ${
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
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something..."
              className="flex-1 text-sm bg-muted/50 border-0"
              maxLength={500}
              disabled={sendMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sendMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-send-message"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

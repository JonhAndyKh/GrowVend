import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Send, X, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { format } from "date-fns";

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    refetchInterval: 5000,
    enabled: isOpen && !isMinimized,
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
    if (scrollRef.current && messages) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate(message.trim());
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-xl border-2 border-primary/20 bg-primary"
        size="icon"
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] sm:w-96 max-w-96 shadow-xl flex flex-col max-h-[70vh]" data-testid="chat-panel">
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Global Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
            data-testid="button-minimize-chat"
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-chat"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <ScrollArea className="h-72 p-3" ref={scrollRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.userId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                      data-testid={`chat-message-${msg.id}`}
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {msg.userEmail[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col ${isOwn ? "items-end" : ""} max-w-[75%]`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium truncate max-w-24">
                            {msg.userEmail.split("@")[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-1.5 rounded-xl text-sm break-words ${
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm"
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
        </>
      )}
    </Card>
  );
}

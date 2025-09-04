import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Video, Send, Paperclip, Handshake, Phone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, Message, Conversation } from "@shared/schema";

interface ChatSidebarProps {
  user: User;
  onClose: () => void;
  onStartVideoCall: () => void;
  currentUserId?: string;
}

export default function ChatSidebar({ 
  user, 
  onClose, 
  onStartVideoCall,
  currentUserId 
}: ChatSidebarProps) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  // Get or create conversation
  const { mutate: createConversation } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        participantId: user.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      setConversation(data);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  // Get messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/conversations', conversation?.id, 'messages'],
    enabled: !!conversation?.id,
    refetchInterval: 3000, // Poll for new messages
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Send message
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id) throw new Error("No conversation");
      const response = await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, {
        content,
        messageType: "text"
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversation?.id, 'messages'] 
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (currentUserId) {
      createConversation();
    }
  }, [currentUserId, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      sendMessage(message.trim());
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full" data-testid="chat-sidebar">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-card-foreground">Messages</h3>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-chat">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Chat Header */}
      <div className="p-4 border-b border-border bg-muted">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10" data-testid={`avatar-chat-${user.id}`}>
            <AvatarImage 
              src={user.profileImageUrl || undefined} 
              alt={`${user.firstName} ${user.lastName}`} 
            />
            <AvatarFallback>
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-card-foreground" data-testid={`text-chat-username-${user.id}`}>
              {user.firstName} {user.lastName}
            </h4>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-secondary rounded-full"></div>
              <span className="text-xs text-secondary">Online</span>
              {user.title && (
                <span className="text-xs text-muted-foreground">• {user.title}</span>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onStartVideoCall}
            className="text-primary hover:text-primary-foreground hover:bg-primary"
            data-testid="button-video-call"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-muted-foreground text-sm">
              Start a conversation with {user.firstName}
            </p>
          </div>
        ) : (
          messages.map((msg: Message & { sender: User }) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'space-x-3'}`}
              data-testid={`message-${msg.id}`}
            >
              {msg.senderId !== currentUserId && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(msg.sender.firstName, msg.sender.lastName)}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-xs ${msg.senderId === currentUserId ? 'text-right' : ''}`}>
                <div 
                  className={`p-3 rounded-lg ${
                    msg.senderId === currentUserId 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-card-foreground'
                  }`}
                >
                  <p className="text-sm" data-testid={`text-message-content-${msg.id}`}>
                    {msg.content}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isSending}
              data-testid="input-message"
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || isSending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-attach-file"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-propose-exchange"
            >
              <Handshake className="h-4 w-4 mr-1" />
              Propose Exchange
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={onStartVideoCall}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-video-call-bottom"
            >
              <Video className="h-4 w-4 mr-1" />
              Video Call
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

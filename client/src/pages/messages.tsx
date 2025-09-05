import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  Send, 
  Video, 
  Phone, 
  Search, 
  Plus,
  ArrowLeft
} from "lucide-react";
import type { User, Message, Conversation } from "@shared/schema";

export default function Messages() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<(Conversation & { 
    participant1: User; 
    participant2: User; 
    lastMessage?: Message;
  })[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
    refetchInterval: 5000, // Poll for new conversations
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<(Message & { sender: User })[]>({
    queryKey: ['/api/conversations', selectedConversation?.id, 'messages'],
    enabled: !!selectedConversation?.id,
    refetchInterval: 2000, // Poll for new messages
  });

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation?.id) throw new Error("No conversation selected");
      const response = await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, {
        content,
        messageType: "text"
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !isSending) {
      sendMessage(newMessage.trim());
    }
  };

  const getOtherParticipant = (conversation: any) => {
    return conversation.participant1.id === user?.id 
      ? conversation.participant2 
      : conversation.participant1;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherParticipant = getOtherParticipant(conv);
    const fullName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Conversations List */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-card-foreground" data-testid="text-messages-title">
                Messages
              </h1>
              <Button size="sm" variant="ghost" data-testid="button-new-message">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-conversations"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                    <div className="h-12 w-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start chatting with other users by visiting their profiles or skill posts
                </p>
                <Button onClick={() => window.location.href = "/"} data-testid="button-browse-skills">
                  Browse Skills
                </Button>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation: any) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const isSelected = selectedConversation?.id === conversation.id;
                  
                  return (
                    <Card 
                      key={conversation.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={otherParticipant.profileImageUrl || undefined} 
                              alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                            />
                            <AvatarFallback>
                              {getInitials(otherParticipant.firstName, otherParticipant.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-card-foreground truncate">
                                {otherParticipant.firstName} {otherParticipant.lastName}
                              </h4>
                              {conversation.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">No messages yet</p>
                            )}
                          </div>
                          <div className="h-2 w-2 bg-secondary rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                      data-testid="button-back-to-conversations"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={getOtherParticipant(selectedConversation).profileImageUrl || undefined}
                      />
                      <AvatarFallback>
                        {getInitials(
                          getOtherParticipant(selectedConversation).firstName,
                          getOtherParticipant(selectedConversation).lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-card-foreground">
                        {getOtherParticipant(selectedConversation).firstName}{' '}
                        {getOtherParticipant(selectedConversation).lastName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-secondary rounded-full"></div>
                        <span className="text-xs text-secondary">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" data-testid="button-voice-call">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" data-testid="button-video-call">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-area">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">Start the conversation</h3>
                    <p className="text-muted-foreground">Send the first message to get started</p>
                  </div>
                ) : (
                  messages.map((message: any) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'space-x-3'}`}
                      data-testid={`message-${message.id}`}
                    >
                      {message.senderId !== user?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender.firstName, message.sender.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-xs lg:max-w-md ${message.senderId === user?.id ? 'text-right' : ''}`}>
                        <div 
                          className={`p-3 rounded-lg ${
                            message.senderId === user?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-card-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.createdAt).toLocaleTimeString([], { 
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
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isSending}
                    data-testid="input-new-message"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || isSending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-card-foreground mb-2">Select a conversation</h2>
                <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
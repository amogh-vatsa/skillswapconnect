import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User, Star, RefreshCw, MessageCircle } from "lucide-react";
import type { User as UserType, Conversation, Message } from "@shared/schema";

interface SidebarProps {
  user?: UserType;
  onShowAddSkill: () => void;
  onShowProfile: () => void;
}

export default function Sidebar({ user, onShowAddSkill, onShowProfile }: SidebarProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  // Fetch user's conversations for recent messages
  const { data: conversations = [] } = useQuery<(Conversation & { 
    participant1: UserType; 
    participant2: UserType; 
    lastMessage?: Message;
  })[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Get recent messages from conversations
  const recentMessages = conversations
    .filter(conv => conv.lastMessage)
    .slice(0, 3)
    .map(conv => {
      const otherParticipant = conv.participant1.id === user?.id 
        ? conv.participant2 
        : conv.participant1;
      
      return {
        id: conv.id,
        senderName: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
        preview: conv.lastMessage?.content?.substring(0, 40) + (conv.lastMessage?.content && conv.lastMessage.content.length > 40 ? '...' : ''),
        profileImageUrl: otherParticipant.profileImageUrl,
        timestamp: conv.lastMessage?.createdAt,
        isUnread: true // This would come from actual read status in a real app
      };
    });

  if (!user) {
    return null;
  }

  return (
    <aside className="w-64 bg-card border-r border-border hidden lg:block" data-testid="sidebar">
      <div className="p-6">
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-muted">
            <CardContent className="p-4">
              <h3 className="font-semibold text-card-foreground mb-3">Your Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Exchanges</span>
                  <span className="text-sm font-medium text-secondary" data-testid="stat-active-exchanges">
                    0
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Skills Listed</span>
                  <span className="text-sm font-medium" data-testid="stat-skills-count">
                    0
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-1" data-testid="stat-user-rating">
                      New User
                    </span>
                    <Star className="h-3 w-3 text-accent" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-3">Recent Messages</h3>
            <div className="space-y-3">
              {recentMessages.length === 0 ? (
                <div className="text-center py-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent messages</p>
                  <p className="text-xs text-muted-foreground">Start a conversation to see messages here</p>
                </div>
              ) : (
                recentMessages.map((message) => (
                  <div 
                    key={message.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    data-testid={`recent-message-${message.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(message.senderName.split(' ')[0], message.senderName.split(' ')[1])}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {message.senderName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {message.preview}
                      </p>
                    </div>
                    {message.isUnread && (
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={onShowAddSkill}
              data-testid="button-sidebar-add-skill"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Skill
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onShowProfile}
              data-testid="button-sidebar-edit-profile"
            >
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          {/* User Preview */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  {user.title && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.title}
                    </p>
                  )}
                </div>
              </div>
              
              {user.isVerified && (
                <Badge variant="secondary" className="w-full justify-center">
                  ✓ Verified User
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}

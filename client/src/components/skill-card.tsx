import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, User, Star } from "lucide-react";
import type { Skill, User as UserType } from "@shared/schema";

interface SkillCardProps {
  skill: Skill & { user: UserType };
  onStartConversation: () => void;
  onViewProfile: () => void;
  currentUserId?: string;
}

export default function SkillCard({ 
  skill, 
  onStartConversation, 
  onViewProfile,
  currentUserId 
}: SkillCardProps) {
  const isOwnSkill = currentUserId === skill.user.id;
  
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const formatSeekingSkills = (seeking?: string[]) => {
    if (!seeking || seeking.length === 0) return "Open to offers";
    return seeking.join(", ");
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Technology": "bg-primary/10 text-primary",
      "Languages": "bg-destructive/10 text-destructive", 
      "Arts & Design": "bg-accent/10 text-accent",
      "Business": "bg-secondary/10 text-secondary",
      "Music": "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
      "Sports": "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 hover:-translate-y-1" 
      data-testid={`card-skill-${skill.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12" data-testid={`avatar-${skill.user.id}`}>
              <AvatarImage 
                src={skill.user.profileImageUrl || undefined} 
                alt={`${skill.user.firstName} ${skill.user.lastName}`} 
              />
              <AvatarFallback>
                {getInitials(skill.user.firstName, skill.user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-card-foreground" data-testid={`text-username-${skill.user.id}`}>
                {skill.user.firstName} {skill.user.lastName}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-accent fill-current mr-1" />
                  <span className="text-xs text-secondary font-medium">4.8</span>
                </div>
                {skill.user.isVerified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-secondary rounded-full"></div>
            <span className="text-xs text-secondary font-medium">Online</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-foreground" data-testid={`text-skill-title-${skill.id}`}>
              {skill.title}
            </h4>
            <Badge className={getCategoryColor(skill.category)}>
              {skill.category}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-skill-description-${skill.id}`}>
            {skill.description}
          </p>
          
          {skill.tags && skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {skill.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                  data-testid={`badge-tag-${tag}`}
                >
                  {tag}
                </Badge>
              ))}
              {skill.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skill.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="text-sm">
            <span className="text-muted-foreground">Looking for: </span>
            <span className="text-foreground font-medium" data-testid={`text-seeking-${skill.id}`}>
              {formatSeekingSkills(skill.seeking)}
            </span>
          </div>
        </div>

        {!isOwnSkill && (
          <div className="flex space-x-3">
            <Button 
              className="flex-1" 
              onClick={onStartConversation}
              data-testid={`button-message-${skill.id}`}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onViewProfile}
              data-testid={`button-profile-${skill.id}`}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        )}

        {isOwnSkill && (
          <div className="text-center py-2">
            <Badge variant="secondary">Your Skill</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

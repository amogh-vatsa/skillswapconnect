import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  CheckCircle, 
  Star, 
  RefreshCw, 
  MessageCircle, 
  Handshake 
} from "lucide-react";
import type { User, Skill, UserRating } from "@shared/schema";

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onStartConversation: () => void;
  currentUserId?: string;
}

export default function ProfileModal({ 
  user, 
  onClose, 
  onStartConversation,
  currentUserId 
}: ProfileModalProps) {
  const isOwnProfile = currentUserId === user.id;

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  // Fetch user's skills
  const { data: userSkills = [] } = useQuery<Skill[]>({
    queryKey: ['/api/skills/user', user.id],
  });

  // Fetch user's ratings
  const { data: userRatings = [] } = useQuery<(UserRating & { rater: User })[]>({
    queryKey: ['/api/users', user.id, 'ratings'],
  });

  const averageRating = userRatings.length > 0 
    ? userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length 
    : 0;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-3 w-3 text-accent fill-current" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-3 w-3 text-accent fill-current opacity-50" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-3 w-3 text-muted-foreground" />);
    }
    
    return stars;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
      data-testid="profile-modal"
    >
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Profile Header */}
        <div className="relative">
          {/* Background */}
          <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-accent/20 rounded-t-xl"></div>
          <Button 
            variant="ghost" 
            size="sm"
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70"
            onClick={onClose}
            data-testid="button-close-profile"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Profile Info */}
          <div className="flex items-start space-x-4 -mt-16 mb-6">
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg" data-testid={`avatar-profile-${user.id}`}>
              <AvatarImage 
                src={user.profileImageUrl || undefined} 
                alt={`${user.firstName} ${user.lastName}`} 
              />
              <AvatarFallback className="text-2xl">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 mt-12">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-card-foreground" data-testid={`text-profile-name-${user.id}`}>
                  {user.firstName} {user.lastName}
                </h2>
                {user.isVerified && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                <Badge variant="secondary">Verified</Badge>
              </div>
              
              {user.title && (
                <p className="text-muted-foreground mb-2" data-testid={`text-profile-title-${user.id}`}>
                  {user.title}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center text-secondary">
                  <Star className="h-4 w-4 mr-1 fill-current" />
                  <span data-testid={`text-profile-rating-${user.id}`}>
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({userRatings.length} reviews)
                  </span>
                </span>
                <span className="text-muted-foreground">
                  <RefreshCw className="h-4 w-4 mr-1 inline" />
                  <span data-testid={`text-profile-exchanges-${user.id}`}>
                    12 exchanges
                  </span>
                </span>
                <span className="text-secondary">
                  <div className="h-2 w-2 bg-secondary rounded-full inline-block mr-1"></div>
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-6">
              <h3 className="font-semibold text-card-foreground mb-2">About</h3>
              <p className="text-muted-foreground" data-testid={`text-profile-bio-${user.id}`}>
                {user.bio}
              </p>
            </div>
          )}

          {/* Skills I Offer */}
          <div className="mb-6">
            <h3 className="font-semibold text-card-foreground mb-3">Skills I Offer</h3>
            {userSkills.length === 0 ? (
              <p className="text-muted-foreground text-sm">No skills listed yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userSkills.slice(0, 4).map((skill) => (
                  <Card key={skill.id} className="border border-border" data-testid={`card-profile-skill-${skill.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{skill.title}</h4>
                        <Badge className="text-xs">
                          {skill.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {skill.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {skill.category}
                        </Badge>
                        <span className="text-xs text-secondary">
                          Active
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          {userRatings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-card-foreground mb-3">Recent Reviews</h3>
              <div className="space-y-4">
                {userRatings.slice(0, 3).map((rating) => (
                  <div 
                    key={rating.id} 
                    className="border-l-4 border-secondary pl-4"
                    data-testid={`review-${rating.id}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex">
                        {renderStars(rating.rating)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        - {rating.rater.firstName} {rating.rater.lastName}, {
                          new Date(rating.createdAt).toLocaleDateString()
                        }
                      </span>
                    </div>
                    {rating.review && (
                      <p className="text-sm text-card-foreground">
                        "{rating.review}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex space-x-3">
              <Button 
                className="flex-1" 
                onClick={onStartConversation}
                data-testid={`button-start-conversation-${user.id}`}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                data-testid={`button-propose-exchange-${user.id}`}
              >
                <Handshake className="h-4 w-4 mr-2" />
                Propose Exchange
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <div className="text-center">
              <Button variant="outline" data-testid="button-edit-profile">
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  PhoneOff, 
  Settings,
  Minimize2
} from "lucide-react";
import type { User } from "@shared/schema";

interface VideoCallModalProps {
  participant: User;
  onClose: () => void;
}

export default function VideoCallModal({ participant, onClose }: VideoCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState("15:32");

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const handleEndCall = () => {
    // TODO: Implement actual call ending logic with Agora SDK
    onClose();
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute toggle with Agora SDK
  };

  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // TODO: Implement actual video toggle with Agora SDK
  };

  const handleShareScreen = () => {
    setIsScreenSharing(!isScreenSharing);
    // TODO: Implement actual screen sharing with Agora SDK
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      data-testid="video-call-modal"
    >
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Call Header */}
        <div className="bg-muted p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10" data-testid={`avatar-call-${participant.id}`}>
              <AvatarImage 
                src={participant.profileImageUrl || undefined} 
                alt={`${participant.firstName} ${participant.lastName}`} 
              />
              <AvatarFallback>
                {getInitials(participant.firstName, participant.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-card-foreground" data-testid={`text-call-participant-${participant.id}`}>
                {participant.firstName} {participant.lastName}
              </h3>
              <p className="text-sm text-secondary">
                Skill Exchange Session • <span data-testid="text-call-duration">{callDuration}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              data-testid="button-minimize-call"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="button-close-call-header"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative bg-gray-900 aspect-video">
          {/* Remote Video Placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <div className="text-center text-white">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={participant.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(participant.firstName, participant.lastName)}
                </AvatarFallback>
              </Avatar>
              <p className="text-lg font-medium">
                {participant.firstName} {participant.lastName}
              </p>
              <p className="text-sm opacity-75">
                {isVideoOn ? "Video enabled" : "Video disabled"}
              </p>
            </div>
          </div>
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-primary">
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-2xl mb-2">📹</div>
                <p className="text-xs">You</p>
              </div>
            </div>
          </div>

          {/* Screen Share Indicator */}
          {isScreenSharing && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-accent text-accent-foreground">
                <Monitor className="h-3 w-3 mr-1" />
                Screen Shared
              </Badge>
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/70 rounded-full px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleMute}
              className={`text-white hover:text-primary p-3 rounded-full ${isMuted ? 'bg-destructive hover:bg-destructive/80' : ''}`}
              data-testid="button-toggle-mute"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleVideo}
              className={`text-white hover:text-primary p-3 rounded-full ${!isVideoOn ? 'bg-destructive hover:bg-destructive/80' : ''}`}
              data-testid="button-toggle-video"
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareScreen}
              className={`text-white hover:text-accent p-3 rounded-full ${isScreenSharing ? 'bg-accent hover:bg-accent/80' : ''}`}
              data-testid="button-share-screen"
            >
              <Monitor className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={handleEndCall}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-6 py-3 rounded-full font-medium"
              data-testid="button-end-call"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Call
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-primary p-3 rounded-full"
              data-testid="button-call-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Call Info Footer */}
        <div className="p-4 bg-muted">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Exchange: </span>
              <span className="text-foreground font-medium">
                Skill Session with {participant.firstName}
              </span>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              data-testid="button-complete-exchange"
            >
              Complete Exchange
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

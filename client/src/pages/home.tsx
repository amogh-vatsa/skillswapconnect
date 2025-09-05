import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import SkillCard from "@/components/skill-card";
import ChatSidebar from "@/components/chat-sidebar";
import VideoCallModal from "@/components/video-call-modal";
import ProfileModal from "@/components/profile-modal";
import AddSkillModal from "@/components/add-skill-modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Skill, User } from "@shared/schema";

const categories = [
  "All Skills",
  "Technology", 
  "Languages",
  "Arts & Design",
  "Business",
  "Music",
  "Sports"
];

export default function Home() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All Skills");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showProfile, setShowProfile] = useState<User | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeConversationUser, setActiveConversationUser] = useState<User | null>(null);

  const { data: skills = [], isLoading: skillsLoading } = useQuery<(Skill & { user: User })[]>({
    queryKey: ['/api/skills', selectedCategory === "All Skills" ? undefined : selectedCategory, searchQuery || undefined],
    enabled: !userLoading,
  });

  const handleStartConversation = (skillUser: User) => {
    setActiveConversationUser(skillUser);
    setShowChat(true);
  };

  const handleViewProfile = (skillUser: User) => {
    setShowProfile(skillUser);
  };

  const handleStartVideoCall = () => {
    setShowVideoCall(true);
  };

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
      <Header 
        user={user} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onShowAddSkill={() => setShowAddSkill(true)}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          user={user}
          onShowAddSkill={() => setShowAddSkill(true)}
          onShowProfile={() => setShowProfile(user)}
        />

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Skill Discovery Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6" data-testid="main-content">
                {/* Hero Section */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
                    Discover Amazing Skills
                  </h1>
                  <p className="text-muted-foreground">
                    Connect with talented individuals and exchange knowledge through our secure platform
                  </p>
                </div>

                {/* Category Filters */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Featured Exchange */}
                {user && (
                  <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-primary-foreground mb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-2">Welcome to SkillSwap!</h3>
                        <p className="opacity-90">Start by browsing skills below or add your own skills to get matched</p>
                        <Button 
                          className="mt-3 bg-background text-foreground hover:bg-background/90"
                          onClick={() => setShowAddSkill(true)}
                          data-testid="button-add-first-skill"
                        >
                          Add Your First Skill
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Grid */}
                {skillsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-12 w-12 bg-muted rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-24"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="h-4 bg-muted rounded"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                        <div className="flex space-x-3">
                          <div className="h-8 bg-muted rounded flex-1"></div>
                          <div className="h-8 bg-muted rounded flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : skills.length === 0 ? (
                  <div className="text-center py-12" data-testid="empty-skills">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No skills found</h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedCategory === "All Skills" 
                        ? "Be the first to share your skills with the community!"
                        : `No skills found in ${selectedCategory}. Try a different category.`
                      }
                    </p>
                    <Button 
                      onClick={() => setShowAddSkill(true)}
                      data-testid="button-add-skill-empty"
                    >
                      Add Your Skill
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="skills-grid">
                    {skills.map((skill: Skill & { user: User }) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        onStartConversation={() => handleStartConversation(skill.user)}
                        onViewProfile={() => handleViewProfile(skill.user)}
                        currentUserId={user?.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Sidebar */}
            {showChat && activeConversationUser && (
              <ChatSidebar
                user={activeConversationUser}
                onClose={() => setShowChat(false)}
                onStartVideoCall={handleStartVideoCall}
                currentUserId={user?.id}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAddSkill && (
        <AddSkillModal 
          onClose={() => setShowAddSkill(false)}
          currentUserId={user?.id}
        />
      )}

      {showProfile && (
        <ProfileModal
          user={showProfile}
          onClose={() => setShowProfile(null)}
          onStartConversation={() => {
            handleStartConversation(showProfile);
            setShowProfile(null);
          }}
          currentUserId={user?.id}
        />
      )}

      {showVideoCall && activeConversationUser && (
        <VideoCallModal
          participant={activeConversationUser}
          onClose={() => setShowVideoCall(false)}
        />
      )}

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center p-2 text-primary" data-testid="button-mobile-discover">
            <div className="text-lg mb-1">🏠</div>
            <span className="text-xs">Discover</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-muted-foreground"
            onClick={() => setShowAddSkill(true)}
            data-testid="button-mobile-skills"
          >
            <div className="text-lg mb-1">👤</div>
            <span className="text-xs">Skills</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-muted-foreground relative"
            onClick={() => window.location.href = "/messages"}
            data-testid="button-mobile-messages"
          >
            <div className="text-lg mb-1">💬</div>
            <span className="text-xs">Messages</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-muted-foreground"
            data-testid="button-mobile-exchanges"
          >
            <div className="text-lg mb-1">🔄</div>
            <span className="text-xs">Exchanges</span>
          </button>
        </div>
      </div>
    </div>
  );
}

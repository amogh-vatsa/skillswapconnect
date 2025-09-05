import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import AddSkillModal from "@/components/add-skill-modal";
import ProfileModal from "@/components/profile-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageCircle, TrendingUp, Users } from "lucide-react";
import type { Skill, User } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showProfile, setShowProfile] = useState<User | null>(null);

  // Fetch user's skills
  const { data: userSkills = [], isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: [`/api/skills/user/${user?.id}`],
    enabled: !!user?.id && !userLoading,
  });

  // Fetch recent conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user && !userLoading,
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
      <Header 
        user={user} 
        searchQuery=""
        onSearchChange={() => {}}
        onShowAddSkill={() => setShowAddSkill(true)}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          user={user}
          onShowAddSkill={() => setShowAddSkill(true)}
          onShowProfile={() => setShowProfile(user)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6" data-testid="main-content">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-muted-foreground">
                Manage your skills and connections in one place
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Skills</CardTitle>
                  <Badge variant="secondary">{userSkills.length}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userSkills.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {userSkills.length === 0 ? "Add your first skill!" : "Skills shared"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{conversations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Ongoing conversations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connections</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    People you've connected with
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Skills Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Skills</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddSkill(true)}
                    data-testid="button-add-skill"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </CardHeader>
                <CardContent>
                  {skillsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : userSkills.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="font-semibold mb-2">No skills yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Add your first skill to start connecting with others
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setShowAddSkill(true)}
                        data-testid="button-add-first-skill"
                      >
                        Add Your First Skill
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userSkills.slice(0, 3).map((skill) => (
                        <div key={skill.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{skill.title}</h4>
                            <Badge variant="outline">{skill.level}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {skill.description}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {skill.category}
                          </Badge>
                        </div>
                      ))}
                      {userSkills.length > 3 && (
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => setLocation("/discover")}
                        >
                          View All Skills ({userSkills.length})
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setLocation("/discover")}
                    data-testid="button-browse-skills"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Browse Skills & Connect
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setLocation("/messages")}
                    data-testid="button-view-messages"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowProfile(user)}
                    data-testid="button-edit-profile"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
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
          onStartConversation={() => {}}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}

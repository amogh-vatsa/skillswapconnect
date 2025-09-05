import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Users, Shield, Video } from "lucide-react";
import DemoLoginModal from "@/components/demo-login-modal";

export default function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ArrowRightLeft className="text-primary text-2xl mr-2" />
              <h1 className="text-xl font-bold text-card-foreground">SkillSwap</h1>
            </div>
            <Button 
              onClick={openLoginModal}
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            ArrowRightLeft Skills,<br />
            <span className="text-primary">Build Connections</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Connect with talented individuals and exchange knowledge through our secure platform. 
            Learn new skills while teaching what you know best.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={openLoginModal}
            data-testid="button-get-started"
          >
            Start Exchanging Skills
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow" data-testid="card-feature-1">
            <CardContent className="pt-8 pb-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Find Your Match</h3>
              <p className="text-muted-foreground">
                Discover people with complementary skills and start meaningful exchanges
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow" data-testid="card-feature-2">
            <CardContent className="pt-8 pb-6">
              <Video className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Video Learning</h3>
              <p className="text-muted-foreground">
                Connect face-to-face with integrated video calling for immersive learning experiences
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow" data-testid="card-feature-3">
            <CardContent className="pt-8 pb-6">
              <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Secure & Trusted</h3>
              <p className="text-muted-foreground">
                Verified users, encrypted communications, and a rating system you can trust
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div data-testid="stat-users">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div data-testid="stat-skills">
              <div className="text-3xl font-bold text-secondary mb-2">50,000+</div>
              <div className="text-muted-foreground">Skills Shared</div>
            </div>
            <div data-testid="stat-exchanges">
              <div className="text-3xl font-bold text-accent mb-2">25,000+</div>
              <div className="text-muted-foreground">Successful Exchanges</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">Ready to Start Learning?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of learners and experts exchanging skills every day
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={openLoginModal}
            data-testid="button-join-now"
          >
            Join SkillSwap Today
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground">
            © 2024 SkillSwap. Connecting learners and experts worldwide.
          </p>
        </div>
      </footer>

      {/* Demo Login Modal */}
      <DemoLoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}

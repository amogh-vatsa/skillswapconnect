import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DemoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoLoginModal({ isOpen, onClose }: DemoLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome!",
        description: "You've been logged in successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickLogin = () => {
    const quickEmail = `demo-${Date.now()}@skillswap.demo`;
    loginMutation.mutate({ email: quickEmail, password: "demo" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: email || `demo-${Date.now()}@skillswap.demo`, password });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <ArrowRightLeft className="text-primary text-2xl mr-2" />
            <DialogTitle className="text-2xl">Welcome to SkillSwap</DialogTitle>
          </div>
          <DialogDescription className="text-center">
            This is a demo version. Any email and password will work!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Demo Login */}
          <div className="text-center">
            <Button
              onClick={handleQuickLogin}
              disabled={loginMutation.isPending}
              size="lg"
              className="w-full"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Demo Account...
                </>
              ) : (
                "🚀 Quick Demo Login"
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Instantly create a demo account and start exploring
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Custom Demo Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="demo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password (any password works)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter any password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending || !password}
              className="w-full"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Create Demo Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>💡 This is a demonstration app</p>
            <p>All user accounts are temporary and for testing only</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

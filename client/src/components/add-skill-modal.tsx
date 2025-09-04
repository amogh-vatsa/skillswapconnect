import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AddSkillModalProps {
  onClose: () => void;
  currentUserId?: string;
}

const categories = [
  "Technology",
  "Languages", 
  "Arts & Design",
  "Business",
  "Music",
  "Sports"
];

const levels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" }
];

export default function AddSkillModal({ onClose, currentUserId }: AddSkillModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    seeking: "",
    level: "intermediate"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: createSkill, isPending } = useMutation({
    mutationFn: async (skillData: any) => {
      const response = await apiRequest("POST", "/api/skills", {
        ...skillData,
        tags: skillData.title ? [skillData.title, skillData.category] : [skillData.category],
        seeking: skillData.seeking ? skillData.seeking.split(",").map((s: string) => s.trim()) : []
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Skill added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      onClose();
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
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createSkill(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
      data-testid="add-skill-modal"
    >
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-card-foreground">Add New Skill</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="button-close-add-skill"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="skill-title" className="text-sm font-medium text-card-foreground">
                Skill Title *
              </Label>
              <Input
                id="skill-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., JavaScript Development"
                className="mt-1"
                data-testid="input-skill-title"
              />
            </div>
            
            <div>
              <Label htmlFor="skill-description" className="text-sm font-medium text-card-foreground">
                Description *
              </Label>
              <Textarea
                id="skill-description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe what you can teach and your experience..."
                className="mt-1"
                data-testid="textarea-skill-description"
              />
            </div>

            <div>
              <Label htmlFor="skill-category" className="text-sm font-medium text-card-foreground">
                Category *
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-skill-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="skill-seeking" className="text-sm font-medium text-card-foreground">
                Skills I'm Seeking
              </Label>
              <Input
                id="skill-seeking"
                type="text"
                value={formData.seeking}
                onChange={(e) => handleInputChange("seeking", e.target.value)}
                placeholder="e.g., UI Design, Photography (comma-separated)"
                className="mt-1"
                data-testid="input-skill-seeking"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-card-foreground">
                Experience Level *
              </Label>
              <RadioGroup 
                value={formData.level} 
                onValueChange={(value) => handleInputChange("level", value)}
                className="flex space-x-6 mt-2"
              >
                {levels.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={level.value} 
                      id={level.value}
                      data-testid={`radio-level-${level.value}`}
                    />
                    <Label htmlFor={level.value} className="text-sm">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={onClose}
                disabled={isPending}
                data-testid="button-cancel-add-skill"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isPending}
                data-testid="button-save-skill"
              >
                {isPending ? "Adding..." : "Add Skill"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

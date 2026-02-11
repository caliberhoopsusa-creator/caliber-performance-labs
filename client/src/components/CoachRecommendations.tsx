import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  User,
  Briefcase,
  Clock,
  Quote,
  Shield,
  Trash2,
  Send,
  Building2,
  Mail,
  Phone,
  Users,
  Award,
  Heart,
  Brain,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachRecommendation } from "@shared/schema";

interface CoachRecommendationsProps {
  playerId: number;
  isCoachViewing?: boolean;
  showWriteForm?: boolean;
}

const RELATIONSHIP_OPTIONS = [
  { value: "Head Coach", label: "Head Coach" },
  { value: "Position Coach", label: "Position Coach" },
  { value: "Trainer", label: "Trainer" },
  { value: "AAU Coach", label: "AAU Coach" },
];

const RATING_CATEGORIES = [
  { key: "athleticAbility", label: "Athletic Ability", icon: Zap },
  { key: "workEthic", label: "Work Ethic", icon: Award },
  { key: "coachability", label: "Coachability", icon: Users },
  { key: "leadership", label: "Leadership", icon: Brain },
  { key: "character", label: "Character", icon: Heart },
] as const;

type RatingKey = typeof RATING_CATEGORIES[number]["key"];

interface FormData {
  recommendation: string;
  relationship: string;
  yearsKnown: string;
  coachName: string;
  coachTitle: string;
  coachOrganization: string;
  coachEmail: string;
  coachPhone: string;
  isPublic: boolean;
  ratings: Record<RatingKey, number>;
}

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const stars = Math.round(value / 2);
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= stars
              ? "fill-accent text-accent"
              : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachRecommendations({
  playerId,
  isCoachViewing = false,
  showWriteForm = false,
}: CoachRecommendationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(showWriteForm);
  const [formData, setFormData] = useState<FormData>({
    recommendation: "",
    relationship: "",
    yearsKnown: "",
    coachName: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : "",
    coachTitle: "",
    coachOrganization: "",
    coachEmail: user?.email || "",
    coachPhone: "",
    isPublic: true,
    ratings: {
      athleticAbility: 6,
      workEthic: 6,
      coachability: 6,
      leadership: 6,
      character: 6,
    },
  });

  const { data: recommendations, isLoading } = useQuery<CoachRecommendation[]>({
    queryKey: ["/api/players", playerId, "recommendations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CoachRecommendation>) => {
      const response = await apiRequest(
        "POST",
        `/api/players/${playerId}/recommendations`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "recommendations"],
      });
      toast({
        title: "Recommendation Submitted",
        description: "Your recommendation has been added successfully.",
      });
      setIsFormOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit recommendation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (recommendationId: number) => {
      await apiRequest(
        "DELETE",
        `/api/players/${playerId}/recommendations/${recommendationId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "recommendations"],
      });
      toast({
        title: "Recommendation Deleted",
        description: "The recommendation has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recommendation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      recommendation: "",
      relationship: "",
      yearsKnown: "",
      coachName: user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : "",
      coachTitle: "",
      coachOrganization: "",
      coachEmail: user?.email || "",
      coachPhone: "",
      isPublic: true,
      ratings: {
        athleticAbility: 6,
        workEthic: 6,
        coachability: 6,
        leadership: 6,
        character: 6,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recommendation.trim()) {
      toast({
        title: "Missing Information",
        description: "Please write a recommendation.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.coachName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      playerId,
      coachUserId: user?.id || "",
      coachName: formData.coachName,
      coachTitle: formData.coachTitle || null,
      coachOrganization: formData.coachOrganization || null,
      coachEmail: formData.coachEmail || null,
      coachPhone: formData.coachPhone || null,
      recommendation: formData.recommendation,
      relationship: formData.relationship || null,
      yearsKnown: formData.yearsKnown ? parseInt(formData.yearsKnown) : null,
      athleticAbilityRating: formData.ratings.athleticAbility,
      workEthicRating: formData.ratings.workEthic,
      coachabilityRating: formData.ratings.coachability,
      leadershipRating: formData.ratings.leadership,
      characterRating: formData.ratings.character,
      isPublic: formData.isPublic,
    });
  };

  const handleRatingChange = (key: RatingKey, value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [key]: value[0],
      },
    }));
  };

  const publicRecommendations = recommendations?.filter((r) => r.isPublic) || [];

  return (
    <div className="space-y-6" data-testid="coach-recommendations">
      {isCoachViewing && (
        <Card
          className="border-accent/20"
          data-testid="coach-actions-card"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Quote className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="font-display text-lg text-foreground tracking-wide">
                Write a Recommendation
              </CardTitle>
            </div>
            {!isFormOpen && (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-accent hover:bg-accent"
                data-testid="button-write-recommendation"
              >
                <Quote className="w-4 h-4 mr-2" />
                Write Recommendation
              </Button>
            )}
          </CardHeader>

          {isFormOpen && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recommendation" className="text-muted-foreground">
                    Recommendation *
                  </Label>
                  <Textarea
                    id="recommendation"
                    placeholder="Write your recommendation for this player..."
                    value={formData.recommendation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recommendation: e.target.value,
                      }))
                    }
                    className="min-h-[120px] bg-muted/50 border-border"
                    data-testid="textarea-recommendation"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="relationship" className="text-muted-foreground">
                      Relationship
                    </Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, relationship: value }))
                      }
                    >
                      <SelectTrigger
                        id="relationship"
                        className="bg-muted/50 border-border"
                        data-testid="select-relationship"
                      >
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            data-testid={`relationship-option-${option.value}`}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearsKnown" className="text-muted-foreground">
                      Years Known
                    </Label>
                    <Input
                      id="yearsKnown"
                      type="number"
                      min="0"
                      max="20"
                      placeholder="e.g., 3"
                      value={formData.yearsKnown}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          yearsKnown: e.target.value,
                        }))
                      }
                      className="bg-muted/50 border-border"
                      data-testid="input-years-known"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-muted-foreground">
                    Player Ratings (1-10)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {RATING_CATEGORIES.map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="p-4 rounded-xl bg-muted/50 border border-border space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-accent" />
                            <span className="text-sm text-foreground">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating value={formData.ratings[key]} />
                            <span className="text-sm font-medium text-accent w-6 text-right">
                              {formData.ratings[key]}
                            </span>
                          </div>
                        </div>
                        <Slider
                          value={[formData.ratings[key]]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(value) => handleRatingChange(key, value)}
                          className="w-full"
                          data-testid={`slider-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" />
                    Coach Information
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coachName" className="text-xs text-muted-foreground">
                        Name *
                      </Label>
                      <Input
                        id="coachName"
                        placeholder="Your full name"
                        value={formData.coachName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            coachName: e.target.value,
                          }))
                        }
                        className="bg-muted/50 border-border"
                        data-testid="input-coach-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coachTitle" className="text-xs text-muted-foreground">
                        Title
                      </Label>
                      <Input
                        id="coachTitle"
                        placeholder="e.g., Head Coach"
                        value={formData.coachTitle}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            coachTitle: e.target.value,
                          }))
                        }
                        className="bg-muted/50 border-border"
                        data-testid="input-coach-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coachOrganization" className="text-xs text-muted-foreground">
                        Organization
                      </Label>
                      <Input
                        id="coachOrganization"
                        placeholder="School or team name"
                        value={formData.coachOrganization}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            coachOrganization: e.target.value,
                          }))
                        }
                        className="bg-muted/50 border-border"
                        data-testid="input-coach-organization"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coachEmail" className="text-xs text-muted-foreground">
                        Email
                      </Label>
                      <Input
                        id="coachEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.coachEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            coachEmail: e.target.value,
                          }))
                        }
                        className="bg-muted/50 border-border"
                        data-testid="input-coach-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coachPhone" className="text-xs text-muted-foreground">
                        Phone
                      </Label>
                      <Input
                        id="coachPhone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.coachPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            coachPhone: e.target.value,
                          }))
                        }
                        className="bg-muted/50 border-border"
                        data-testid="input-coach-phone"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPublic: checked as boolean,
                      }))
                    }
                    data-testid="checkbox-is-public"
                  />
                  <Label
                    htmlFor="isPublic"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Make this recommendation visible on the player's public profile
                  </Label>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-accent hover:bg-accent"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-recommendation"
                  >
                    {createMutation.isPending ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Recommendation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      <Card
        className="border-accent/20"
        data-testid="recommendations-list-card"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Quote className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="font-display text-lg text-foreground tracking-wide">
              Coach Recommendations
            </CardTitle>
          </div>
          {publicRecommendations.length > 0 && (
            <Badge
              variant="outline"
              className="border-accent/50 text-accent bg-accent/10"
              data-testid="badge-count"
            >
              {publicRecommendations.length} Recommendation
              {publicRecommendations.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4" data-testid="loading-skeletons">
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </div>
          ) : publicRecommendations.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-testid="empty-state"
            >
              <Quote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg">No recommendations yet</p>
              <p className="text-sm mt-1">
                Coaches can write recommendations to highlight this player's abilities
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="recommendations-list">
              {publicRecommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className="border-border/50"
                  data-testid={`recommendation-card-${rec.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center border border-accent/30">
                          <User className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">
                              {rec.coachName}
                            </h4>
                            {rec.isVerified && (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-xs"
                                data-testid={`badge-verified-${rec.id}`}
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {(rec.coachTitle || rec.coachOrganization) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              {rec.coachTitle && (
                                <>
                                  <Briefcase className="w-3.5 h-3.5" />
                                  {rec.coachTitle}
                                </>
                              )}
                              {rec.coachTitle && rec.coachOrganization && (
                                <span className="mx-1">at</span>
                              )}
                              {rec.coachOrganization && (
                                <>
                                  <Building2 className="w-3.5 h-3.5" />
                                  {rec.coachOrganization}
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {user?.id === rec.coachUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(rec.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          data-testid={`button-delete-${rec.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <blockquote className="mt-4 pl-4 border-l-2 border-accent/30 text-muted-foreground italic">
                      "{rec.recommendation}"
                    </blockquote>

                    {(rec.athleticAbilityRating ||
                      rec.workEthicRating ||
                      rec.coachabilityRating ||
                      rec.leadershipRating ||
                      rec.characterRating) && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {rec.athleticAbilityRating && (
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">
                              Athletic
                            </p>
                            <StarRating value={rec.athleticAbilityRating} />
                          </div>
                        )}
                        {rec.workEthicRating && (
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">
                              Work Ethic
                            </p>
                            <StarRating value={rec.workEthicRating} />
                          </div>
                        )}
                        {rec.coachabilityRating && (
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">
                              Coachability
                            </p>
                            <StarRating value={rec.coachabilityRating} />
                          </div>
                        )}
                        {rec.leadershipRating && (
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">
                              Leadership
                            </p>
                            <StarRating value={rec.leadershipRating} />
                          </div>
                        )}
                        {rec.characterRating && (
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">
                              Character
                            </p>
                            <StarRating value={rec.characterRating} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {rec.relationship && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-accent" />
                          {rec.relationship}
                        </div>
                      )}
                      {rec.yearsKnown && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-accent" />
                          {rec.yearsKnown} year{rec.yearsKnown !== 1 ? "s" : ""} known
                        </div>
                      )}
                      {rec.createdAt && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

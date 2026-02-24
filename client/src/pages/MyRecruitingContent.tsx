import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSport } from "@/components/SportToggle";
import { RecruitingTimeline } from "@/components/RecruitingTimeline";
import { NcaaEligibilityChecklist } from "@/components/NcaaEligibilityChecklist";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonQuickStatsGrid, SkeletonRecruitingTimeline, SkeletonInterestCard } from "@/components/ui/skeleton-premium";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  GraduationCap,
  Share2,
  Copy,
  Check,
  Mail,
  Trash2,
  School,
  Target,
  Eye,
  User,
  MapPin,
  Trophy,
  Calendar,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Dribbble,
  Circle,
  CheckCircle2,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: number;
  name: string;
  position: string;
  sport: 'basketball' | 'football';
  gpa: string | null;
  city: string | null;
  state: string | null;
  graduationYear: number | null;
  school: string | null;
  height: string | null;
  photoUrl: string | null;
  bio: string | null;
}

interface College {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  city: string;
  state: string;
  division: string;
  conference: string | null;
  recruitingContactEmail: string | null;
}

interface PlayerInterest {
  id: number;
  playerId: number;
  collegeId: number;
  interestLevel: string | null;
  notes: string | null;
  contacted: boolean | null;
  contactedAt: string | null;
  createdAt: string;
  college: College | null;
}

interface CollegeMatch {
  id: number;
  collegeId: number;
  overallMatchScore: number;
}

interface Milestone {
  id: string;
  year: number;
  month: number;
  period: string;
  title: string;
  description: string;
}

function getBasketballMilestones(graduationYear: number): Milestone[] {
  const freshmanYear = graduationYear - 3;
  const sophomoreYear = graduationYear - 2;
  const juniorYear = graduationYear - 1;
  const seniorYear = graduationYear;

  return [
    { id: 'freshman-highlights', year: freshmanYear, month: 9, period: `Fall ${freshmanYear}`, title: 'Create Highlight Tape', description: 'Start recording game footage and creating your first highlight reel' },
    { id: 'freshman-camps', year: freshmanYear, month: 6, period: `Summer ${freshmanYear}`, title: 'Start Attending Camps', description: 'Attend local and regional basketball camps to develop skills and get exposure' },
    { id: 'sophomore-ncaa', year: sophomoreYear, month: 9, period: `Fall ${sophomoreYear}`, title: 'NCAA Eligibility Center', description: 'Register with the NCAA Eligibility Center to begin the certification process' },
    { id: 'sophomore-showcases', year: sophomoreYear, month: 6, period: `Summer ${sophomoreYear}`, title: 'Attend Showcases', description: 'Participate in AAU tournaments and showcases to gain college scout visibility' },
    { id: 'junior-contact', year: juniorYear, month: 6, period: `June 15, ${juniorYear}`, title: 'Coach Contact Allowed', description: 'College coaches can begin calling, texting, and contacting you directly' },
    { id: 'junior-visits', year: juniorYear, month: 9, period: `Sept 1, ${juniorYear}`, title: 'Official Visits Begin', description: 'You can start taking official visits to college campuses (up to 5 total)' },
    { id: 'senior-early', year: seniorYear, month: 11, period: `November ${seniorYear - 1}`, title: 'Early Signing Period', description: 'Sign your National Letter of Intent during the early signing period' },
    { id: 'senior-late', year: seniorYear, month: 4, period: `April ${seniorYear}`, title: 'Late Signing Period', description: 'Final opportunity to sign NLI if you haven\'t committed yet' },
  ];
}

function getFootballMilestones(graduationYear: number): Milestone[] {
  const freshmanYear = graduationYear - 3;
  const sophomoreYear = graduationYear - 2;
  const juniorYear = graduationYear - 1;
  const seniorYear = graduationYear;

  return [
    { id: 'freshman-film', year: freshmanYear, month: 9, period: `Fall ${freshmanYear}`, title: 'Film Training', description: 'Learn to break down film and understand what coaches look for' },
    { id: 'freshman-camps', year: freshmanYear, month: 6, period: `Summer ${freshmanYear}`, title: 'Start Attending Camps', description: 'Attend college camps and combines to get evaluated and learn techniques' },
    { id: 'sophomore-profile', year: sophomoreYear, month: 9, period: `Fall ${sophomoreYear}`, title: 'Build Recruiting Profile', description: 'Create profiles on recruiting services and start building your highlight tape' },
    { id: 'sophomore-combines', year: sophomoreYear, month: 6, period: `Summer ${sophomoreYear}`, title: 'Attend Combines', description: 'Participate in regional combines to get measurables and performance data' },
    { id: 'junior-contact', year: juniorYear, month: 9, period: `Sept 1, ${juniorYear}`, title: 'Coach Contact Allowed', description: 'College coaches can begin calling and initiating contact with you' },
    { id: 'junior-unofficials', year: juniorYear, month: 10, period: `Fall ${juniorYear}`, title: 'Unofficial Visits', description: 'Take unofficial visits to schools you\'re interested in at your own expense' },
    { id: 'senior-officials', year: seniorYear, month: 8, period: `August ${seniorYear - 1}`, title: 'Official Visits Begin', description: 'Start taking official visits (expenses paid by schools, up to 5 total)' },
    { id: 'senior-early', year: seniorYear, month: 12, period: `December ${seniorYear - 1}`, title: 'Early Signing Period', description: 'Sign your National Letter of Intent during the early signing period' },
    { id: 'senior-nsd', year: seniorYear, month: 2, period: `February ${seniorYear}`, title: 'National Signing Day', description: 'Traditional National Signing Day for those who haven\'t signed early' },
  ];
}

function getNextMilestone(graduationYear: number, sport: 'basketball' | 'football'): Milestone | null {
  const milestones = sport === 'basketball' 
    ? getBasketballMilestones(graduationYear) 
    : getFootballMilestones(graduationYear);
  
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  for (const milestone of milestones) {
    const milestoneDate = new Date(milestone.year, milestone.month - 1, 1);
    if (milestoneDate >= currentMonth) {
      return milestone;
    }
  }
  return null;
}

const DIVISION_COLORS: Record<string, string> = {
  'D1': 'bg-gradient-to-r from-accent to-accent/90 text-accent-foreground',
  'D2': 'bg-accent text-white',
  'D3': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
  'NAIA': 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
  'JUCO': 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
};

function calculateProfileCompleteness(player: Player | undefined): number {
  if (!player) return 0;
  
  const fields = [
    player.name,
    player.position,
    player.height,
    player.city,
    player.state,
    player.school,
    player.graduationYear,
    player.gpa,
    player.photoUrl,
    player.bio,
  ];
  
  const filledFields = fields.filter(f => f !== null && f !== undefined && f !== '').length;
  return Math.round((filledFields / fields.length) * 100);
}

interface MyRecruitingContentProps {
  onTabChange?: (tab: string) => void;
}

export default function MyRecruitingContent({ onTabChange }: MyRecruitingContentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const playerId = (user as any)?.playerId;
  const currentSport = useSport();
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: ['/api/players', playerId],
    enabled: !!playerId,
  });

  const { data: interests, isLoading: interestsLoading } = useQuery<PlayerInterest[]>({
    queryKey: ['/api/players', playerId, 'interests'],
    enabled: !!playerId,
  });

  const { data: matches } = useQuery<CollegeMatch[]>({
    queryKey: ['/api/players', playerId, 'college-matches'],
    enabled: !!playerId,
  });

  const { data: profileViews } = useQuery<{ totalViews: number; viewsLast30Days: number }>({
    queryKey: ['/api/players', playerId, 'profile-views'],
    enabled: !!playerId,
  });

  const { data: games } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'games'],
    enabled: !!playerId,
  });

  const { data: inquiries } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'inquiries'],
    enabled: !!playerId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (inquiryId: number) => {
      return apiRequest('PATCH', `/api/players/${playerId}/inquiries/${inquiryId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'inquiries'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (collegeId: number) => {
      return apiRequest('DELETE', `/api/players/${playerId}/interests/${collegeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'interests'] });
      toast({
        title: "School Removed",
        description: "The school has been removed from your interested list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove school. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}/profile/${playerId}/public`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    toast({
      title: "Link Copied",
      description: "Your public profile link has been copied to clipboard.",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEmailCoach = (college: College, playerInfo: Player) => {
    if (!college.recruitingContactEmail) return;
    
    const subject = encodeURIComponent(
      `Recruiting Interest - ${playerInfo.name} - ${playerInfo.position} - Class of ${playerInfo.graduationYear}`
    );
    const body = encodeURIComponent(
      `Dear ${college.name} Coaching Staff,\n\nI am writing to express my interest in your ${currentSport} program.\n\nAbout me:\n- Name: ${playerInfo.name}\n- Position: ${playerInfo.position}\n- School: ${playerInfo.school || 'N/A'}\n- Class of: ${playerInfo.graduationYear}\n- GPA: ${playerInfo.gpa || 'N/A'}\n- Location: ${[playerInfo.city, playerInfo.state].filter(Boolean).join(', ') || 'N/A'}\n\nI would love to learn more about your program and discuss potential opportunities.\n\nThank you for your time,\n${playerInfo.name}`
    );
    
    window.open(`mailto:${college.recruitingContactEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  if (!playerId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={GraduationCap}
          title="No Player Profile"
          description="Create a player profile to access your recruiting dashboard."
        />
      </div>
    );
  }

  const sport = (player?.sport as 'basketball' | 'football') || currentSport;
  const graduationYear = player?.graduationYear || new Date().getFullYear() + 1;
  const nextMilestone = getNextMilestone(graduationYear, sport);
  const profileCompleteness = calculateProfileCompleteness(player);
  const schoolsCount = interests?.length || 0;
  const contactedCount = interests?.filter(i => i.contacted)?.length || 0;

  const getMatchScore = (collegeId: number): number | null => {
    const match = matches?.find(m => m.collegeId === collegeId);
    return match?.overallMatchScore || null;
  };

  return (
    <div className="space-y-6" data-testid="my-recruiting-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {playerLoading ? (
            <Skeleton className="h-7 w-32" />
          ) : player?.graduationYear ? (
            <Badge 
              variant="outline" 
              className="text-lg px-4 py-1 border-accent/50 text-accent bg-accent/10"
              data-testid="graduation-year-badge"
            >
              Class of {player.graduationYear}
            </Badge>
          ) : (
            <Badge 
              variant="outline" 
              className="text-sm border-accent/50 text-accent"
              data-testid="no-graduation-year"
            >
              Set your graduation year
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs uppercase font-semibold",
              sport === 'basketball' 
                ? "border-accent/50 text-accent bg-accent/10" 
                : "border-accent/50 text-accent bg-accent/10"
            )}
            data-testid="sport-badge"
          >
            {sport === 'basketball' ? (
              <><Dribbble className="w-3 h-3 mr-1" /> Basketball</>
            ) : (
              <><Trophy className="w-3 h-3 mr-1" /> Football</>
            )}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/profile/${playerId}/public`}>
            <Button
              variant="outline"
              className="border-accent/30 text-accent hover:bg-accent/10"
              data-testid="button-share-profile"
            >
              <Share2 className="w-4 h-4 mr-2" />
              View Public Profile
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="border-border text-muted-foreground hover:bg-muted"
            data-testid="button-copy-link"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 mr-2 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {playerLoading ? (
        <SkeletonQuickStatsGrid data-testid="quick-stats-skeleton" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="quick-stats-panel">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <School className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-schools-count">{schoolsCount}</p>
                  <p className="text-xs text-muted-foreground">Schools Interested</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-contacted-count">{contactedCount}</p>
                  <p className="text-xs text-muted-foreground">Schools Contacted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-profile-views">{profileViews?.totalViews || 0}</p>
                  <p className="text-xs text-muted-foreground">Profile Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" />
                    <p className="text-xs text-muted-foreground">Profile Complete</p>
                  </div>
                  <p className="text-sm font-bold text-foreground" data-testid="stat-profile-completeness">{profileCompleteness}%</p>
                </div>
                <Progress 
                  value={profileCompleteness} 
                  className="h-2 bg-muted"
                  data-testid="progress-profile-completeness"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!playerLoading && (() => {
        const checklistItems = [
          { slug: 'profile-photo', label: 'Profile Photo', complete: !!player?.photoUrl, fixLink: `/players/${playerId}` },
          { slug: 'bio-written', label: 'Bio Written', complete: !!player?.bio, fixLink: `/players/${playerId}` },
          { slug: 'height-listed', label: 'Height Listed', complete: !!player?.height, fixLink: `/players/${playerId}` },
          { slug: 'gpa-added', label: 'GPA Added', complete: !!player?.gpa, fixLink: `/players/${playerId}` },
          { slug: 'school-name', label: 'School Name', complete: !!player?.school, fixLink: `/players/${playerId}` },
          { slug: 'graduation-year', label: 'Graduation Year', complete: !!player?.graduationYear, fixLink: `/players/${playerId}` },
          { slug: 'city-state', label: 'City & State', complete: !!(player?.city && player?.state), fixLink: `/players/${playerId}` },
          { slug: 'games-logged', label: '3+ Games Logged', complete: (games?.length ?? 0) >= 3, fixLink: `/players/${playerId}` },
          { slug: 'interested-schools', label: 'Interested Schools', complete: schoolsCount >= 1, fixLink: `/players/${playerId}` },
        ];
        const completedCount = checklistItems.filter(i => i.complete).length;

        return (
          <Card data-testid="card-recruiting-readiness" className="bg-card border-border">
            <CardHeader className="bg-gradient-to-r from-[#10B981]/15 to-accent/10 rounded-t-md">
              <CardTitle className="text-lg font-display text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                Recruiting Readiness
              </CardTitle>
              <p className="text-sm text-muted-foreground">{completedCount} of 9 complete</p>
            </CardHeader>
            <CardContent className="pt-4">
              <div>
                {checklistItems.map((item, index) => (
                  <div
                    key={item.slug}
                    data-testid={`checklist-item-${item.slug}`}
                    className={cn(
                      "flex items-center gap-3 py-2",
                      index < checklistItems.length - 1 && "border-b border-border/30"
                    )}
                  >
                    {item.complete ? (
                      <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={cn("flex-1 text-sm", item.complete ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                    {!item.complete && (
                      <Link href={item.fixLink}>
                        <Button variant="ghost" size="sm" className="text-xs text-accent" data-testid={`fix-${item.slug}`}>
                          Fix
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {inquiries && inquiries.length > 0 && (
        <Card className="bg-card border-border" data-testid="inquiries-section">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="w-5 h-5 text-accent" />
              Recruiting Inquiries
              {inquiries.filter((i: any) => !i.isRead).length > 0 && (
                <Badge variant="destructive" className="ml-auto" data-testid="badge-unread-count">
                  {inquiries.filter((i: any) => !i.isRead).length} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inquiries.map((inquiry: any) => (
              <div
                key={inquiry.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  inquiry.isRead ? "bg-muted/30 border-border" : "bg-accent/5 border-accent/20"
                )}
                data-testid={`inquiry-card-${inquiry.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" data-testid={`text-sender-name-${inquiry.id}`}>{inquiry.senderName}</span>
                      <Badge variant="outline" className="text-[10px]">{inquiry.senderRole}</Badge>
                      {inquiry.senderSchool && (
                        <span className="text-xs text-muted-foreground">{inquiry.senderSchool}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{inquiry.senderEmail}</p>
                    <p className="text-sm mt-2 text-foreground/80">{inquiry.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM d, yyyy h:mm a') : ''}
                    </p>
                  </div>
                  {!inquiry.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => markReadMutation.mutate(inquiry.id)}
                      data-testid={`button-mark-read-${inquiry.id}`}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Recruiting Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playerLoading ? (
                <SkeletonRecruitingTimeline />
              ) : player?.graduationYear ? (
                <RecruitingTimeline
                  graduationYear={player.graduationYear}
                  sport={sport}
                  className="max-h-[500px] overflow-y-auto pr-2"
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Set your graduation year to see your recruiting timeline
                  </p>
                  <Link href={`/players/${playerId}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-accent/30 text-accent"
                      data-testid="button-set-graduation-year"
                    >
                      Update Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {nextMilestone && player?.graduationYear && (
            <Card 
              className="bg-gradient-to-br from-accent/10 to-card border-accent/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              data-testid="whats-next-card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-accent flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  What's Next
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-display font-bold text-foreground mb-1" data-testid="next-milestone-title">
                  {nextMilestone.title}
                </h3>
                <p className="text-sm text-accent mb-2" data-testid="next-milestone-period">
                  {nextMilestone.period}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="next-milestone-description">
                  {nextMilestone.description}
                </p>
              </CardContent>
            </Card>
          )}

          <NcaaEligibilityChecklist playerId={playerId} />
        </div>

        <div className="lg:col-span-3">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-lg font-display text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                My Interested Schools
              </CardTitle>
              <Button 
                onClick={() => onTabChange?.("schools")}
                variant="outline" 
                size="sm"
                className="border-accent/30 text-accent hover:bg-accent/10"
                data-testid="button-browse-schools"
              >
                Browse Schools
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {interestsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <SkeletonInterestCard key={i} />
                  ))}
                </div>
              ) : interests && interests.length > 0 ? (
                <div className="space-y-3">
                  {interests.map((interest) => {
                    if (!interest.college) return null;
                    const matchScore = getMatchScore(interest.collegeId);
                    
                    return (
                      <div
                        key={interest.id}
                        className="group relative p-4 rounded-xl bg-muted/50 border border-border hover:border-accent/30 transition-all duration-300"
                        data-testid={`interest-card-${interest.collegeId}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div 
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm",
                                "bg-gradient-to-br from-accent to-blue-600"
                              )}
                            >
                              {interest.college.shortName || interest.college.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-foreground truncate" data-testid={`college-name-${interest.collegeId}`}>
                                  {interest.college.name}
                                </h4>
                                <Badge 
                                  className={cn(
                                    "text-xs px-2 py-0.5",
                                    DIVISION_COLORS[interest.college.division] || "bg-gray-500"
                                  )}
                                  data-testid={`division-badge-${interest.collegeId}`}
                                >
                                  {interest.college.division}
                                </Badge>
                                {interest.contacted && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                    data-testid={`contacted-badge-${interest.collegeId}`}
                                  >
                                    <Mail className="w-3 h-3 mr-1" />
                                    Contacted
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {interest.college.city}, {interest.college.state}
                                </span>
                                {matchScore && (
                                  <span className="flex items-center gap-1 text-accent">
                                    <Target className="w-3 h-3" />
                                    {matchScore}% match
                                  </span>
                                )}
                              </div>
                              {interest.college.conference && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {interest.college.conference}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {interest.college.recruitingContactEmail && player && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEmailCoach(interest.college!, player)}
                                className="border-accent/30 text-accent hover:bg-accent/10"
                                data-testid={`button-email-coach-${interest.collegeId}`}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Email
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMutation.mutate(interest.collegeId)}
                              disabled={removeMutation.isPending}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              data-testid={`button-remove-interest-${interest.collegeId}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="empty-interests">
                  <School className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Schools Saved Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Start building your college list by browsing schools that match your skills and preferences.
                  </p>
                  <Button 
                    onClick={() => onTabChange?.("schools")}
                    className="bg-accent hover:from-accent hover:to-blue-400 text-white"
                    data-testid="button-browse-colleges-cta"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Browse Colleges
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card border-border" data-testid="cta-section">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                {profileCompleteness < 80 
                  ? "Complete Your Profile to Stand Out"
                  : "Keep Building Your Recruiting Profile"
                }
              </h3>
              <p className="text-muted-foreground max-w-lg">
                {profileCompleteness < 80
                  ? "A complete profile helps college coaches learn more about you. Add your stats, highlights, and academic information."
                  : "Great job on your profile! Continue updating your stats and reaching out to coaches."
                }
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {profileCompleteness < 80 && (
                <Link href={`/players/${playerId}`}>
                  <Button
                    variant="outline"
                    className="border-accent/30 text-accent hover:bg-accent/10"
                    data-testid="button-complete-profile"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </Link>
              )}
              <Button
                onClick={() => onTabChange?.("schools")}
                className="bg-accent hover:from-accent hover:to-blue-400 text-white"
                data-testid="button-browse-more-schools"
              >
                <School className="w-4 h-4 mr-2" />
                Browse More Schools
              </Button>
              <Button
                onClick={() => onTabChange?.("events")}
                variant="outline"
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                data-testid="button-find-camps"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Find Camps & Showcases
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { CalendarDays, CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecruitingTimelineProps {
  graduationYear: number;
  sport: 'basketball' | 'football';
  className?: string;
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
    {
      id: 'freshman-highlights',
      year: freshmanYear,
      month: 9,
      period: `Fall ${freshmanYear}`,
      title: 'Create Highlight Tape',
      description: 'Start recording game footage and creating your first highlight reel',
    },
    {
      id: 'freshman-camps',
      year: freshmanYear,
      month: 6,
      period: `Summer ${freshmanYear}`,
      title: 'Start Attending Camps',
      description: 'Attend local and regional basketball camps to develop skills and get exposure',
    },
    {
      id: 'sophomore-ncaa',
      year: sophomoreYear,
      month: 9,
      period: `Fall ${sophomoreYear}`,
      title: 'NCAA Eligibility Center',
      description: 'Register with the NCAA Eligibility Center to begin the certification process',
    },
    {
      id: 'sophomore-showcases',
      year: sophomoreYear,
      month: 6,
      period: `Summer ${sophomoreYear}`,
      title: 'Attend Showcases',
      description: 'Participate in AAU tournaments and showcases to gain college scout visibility',
    },
    {
      id: 'junior-contact',
      year: juniorYear,
      month: 6,
      period: `June 15, ${juniorYear}`,
      title: 'Coach Contact Allowed',
      description: 'College coaches can begin calling, texting, and contacting you directly',
    },
    {
      id: 'junior-visits',
      year: juniorYear,
      month: 9,
      period: `Sept 1, ${juniorYear}`,
      title: 'Official Visits Begin',
      description: 'You can start taking official visits to college campuses (up to 5 total)',
    },
    {
      id: 'senior-early',
      year: seniorYear,
      month: 11,
      period: `November ${seniorYear - 1}`,
      title: 'Early Signing Period',
      description: 'Sign your National Letter of Intent during the early signing period',
    },
    {
      id: 'senior-late',
      year: seniorYear,
      month: 4,
      period: `April ${seniorYear}`,
      title: 'Late Signing Period',
      description: 'Final opportunity to sign NLI if you haven\'t committed yet',
    },
  ];
}

function getFootballMilestones(graduationYear: number): Milestone[] {
  const freshmanYear = graduationYear - 3;
  const sophomoreYear = graduationYear - 2;
  const juniorYear = graduationYear - 1;
  const seniorYear = graduationYear;

  return [
    {
      id: 'freshman-film',
      year: freshmanYear,
      month: 9,
      period: `Fall ${freshmanYear}`,
      title: 'Film Training',
      description: 'Learn to break down film and understand what coaches look for',
    },
    {
      id: 'freshman-camps',
      year: freshmanYear,
      month: 6,
      period: `Summer ${freshmanYear}`,
      title: 'Start Attending Camps',
      description: 'Attend college camps and combines to get evaluated and learn techniques',
    },
    {
      id: 'sophomore-profile',
      year: sophomoreYear,
      month: 9,
      period: `Fall ${sophomoreYear}`,
      title: 'Build Recruiting Profile',
      description: 'Create profiles on recruiting services and start building your highlight tape',
    },
    {
      id: 'sophomore-combines',
      year: sophomoreYear,
      month: 6,
      period: `Summer ${sophomoreYear}`,
      title: 'Attend Combines',
      description: 'Participate in regional combines to get measurables and performance data',
    },
    {
      id: 'junior-contact',
      year: juniorYear,
      month: 9,
      period: `Sept 1, ${juniorYear}`,
      title: 'Coach Contact Allowed',
      description: 'College coaches can begin calling and initiating contact with you',
    },
    {
      id: 'junior-unofficials',
      year: juniorYear,
      month: 10,
      period: `Fall ${juniorYear}`,
      title: 'Unofficial Visits',
      description: 'Take unofficial visits to schools you\'re interested in at your own expense',
    },
    {
      id: 'senior-officials',
      year: seniorYear,
      month: 8,
      period: `August ${seniorYear - 1}`,
      title: 'Official Visits Begin',
      description: 'Start taking official visits (expenses paid by schools, up to 5 total)',
    },
    {
      id: 'senior-early',
      year: seniorYear,
      month: 12,
      period: `December ${seniorYear - 1}`,
      title: 'Early Signing Period',
      description: 'Sign your National Letter of Intent during the early signing period',
    },
    {
      id: 'senior-nsd',
      year: seniorYear,
      month: 2,
      period: `February ${seniorYear}`,
      title: 'National Signing Day',
      description: 'Traditional National Signing Day for those who haven\'t signed early',
    },
  ];
}

function getMilestoneStatus(milestone: Milestone, currentDate: Date): 'past' | 'current' | 'future' {
  const milestoneDate = new Date(milestone.year, milestone.month - 1, 1);
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const threeMonthsFromNow = new Date(currentMonth);
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  
  if (milestoneDate < currentMonth) {
    return 'past';
  } else if (milestoneDate <= threeMonthsFromNow) {
    return 'current';
  }
  return 'future';
}

export function RecruitingTimeline({ graduationYear, sport, className }: RecruitingTimelineProps) {
  const milestones = sport === 'basketball' 
    ? getBasketballMilestones(graduationYear)
    : getFootballMilestones(graduationYear);
  
  const currentDate = new Date();

  return (
    <div className={cn("relative", className)} data-testid="recruiting-timeline">
      <div 
        className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-accent/20 to-transparent"
        data-testid="timeline-line"
      />
      
      <div className="space-y-6">
        {milestones.map((milestone, index) => {
          const status = getMilestoneStatus(milestone, currentDate);
          
          return (
            <div 
              key={milestone.id}
              className={cn(
                "relative pl-14 pr-4 py-3 rounded-xl transition-all duration-300",
                status === 'current' && "bg-gradient-to-r from-accent/10 to-transparent border-l-2 border-accent shadow-[0_0_20px_rgba(6,182,212,0.15)]",
                status === 'past' && "opacity-60",
                status === 'future' && "opacity-80"
              )}
              data-testid={`milestone-${milestone.id}`}
              data-status={status}
            >
              <div 
                className={cn(
                  "absolute left-3 top-4 w-6 h-6 rounded-full flex items-center justify-center z-10",
                  status === 'past' && "bg-emerald-500/20",
                  status === 'current' && "bg-accent shadow-[0_0_12px_rgba(6,182,212,0.6)]",
                  status === 'future' && "bg-white/10 border border-white/20"
                )}
                data-testid={`milestone-icon-${milestone.id}`}
              >
                {status === 'past' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : status === 'current' ? (
                  <CalendarDays className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Circle className="w-3 h-3 text-white/40" />
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span 
                    className={cn(
                      "text-xs font-medium uppercase tracking-wider",
                      status === 'current' ? "text-accent" : "text-muted-foreground"
                    )}
                    data-testid={`milestone-period-${milestone.id}`}
                  >
                    {milestone.period}
                  </span>
                  {status === 'current' && (
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/20 px-2 py-0.5 rounded-full animate-pulse"
                      data-testid={`milestone-now-badge-${milestone.id}`}
                    >
                      Now
                    </span>
                  )}
                </div>
                
                <h4 
                  className={cn(
                    "font-display text-lg font-semibold tracking-wide",
                    status === 'current' ? "text-white" : status === 'past' ? "text-muted-foreground" : "text-white/90"
                  )}
                  data-testid={`milestone-title-${milestone.id}`}
                >
                  {milestone.title}
                </h4>
                
                <p 
                  className={cn(
                    "text-sm leading-relaxed",
                    status === 'current' ? "text-white/80" : "text-muted-foreground"
                  )}
                  data-testid={`milestone-description-${milestone.id}`}
                >
                  {milestone.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

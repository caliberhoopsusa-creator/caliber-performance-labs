import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MapPin,
  Users,
  Trophy,
  GraduationCap,
  Zap,
  Target,
  Shield,
  DollarSign,
  BarChart3,
  Clock,
  Award,
  UserCheck,
} from "lucide-react";

interface College {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  city: string;
  state: string;
  region: string | null;
  division: string;
  conference: string | null;
  academicRating: number | null;
  avgGpaRequired: string | null;
  satRange: string | null;
  sport: string;
  programStrength: number | null;
  coachingRating: number | null;
  facilitiesRating: number | null;
  winsLastSeason: number | null;
  lossesLastSeason: number | null;
  conferenceRecord: string | null;
  nationalChampionships: number | null;
  conferenceChampionships: number | null;
  tournamentAppearances: number | null;
  finalFourAppearances: number | null;
  nbaPlayersProduced: number | null;
  nflPlayersProduced: number | null;
  draftPicksLast5Years: number | null;
  averageMinutesForFreshmen: number | null;
  athleteGraduationRate: number | null;
  academicAllAmericans: number | null;
  athleticBudget: string | null;
  averageAttendance: number | null;
  niLOpportunities: string | null;
  currentRosterSize: number | null;
  incomingRecruitingClass: number | null;
  headCoachName: string | null;
  headCoachYears: number | null;
  headCoachRecord: string | null;
  tempoRating: number | null;
  defensiveStyle: string | null;
  offensiveStyle: string | null;
  positionNeeds: string | null;
  scholarshipsAvailable: number | null;
  recruitingContactEmail: string | null;
  recruitingUrl: string | null;
  isActive: boolean;
}

interface RosterPlayer {
  id: number;
  collegeId: number;
  espnId: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  jersey: string | null;
  position: string | null;
  height: string | null;
  weight: string | null;
  classYear: string | null;
  hometown: string | null;
  headshotUrl: string | null;
}

interface StaffMember {
  id: number;
  collegeId: number;
  espnId: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  experience: number | null;
  headshotUrl: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CollegeDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="college-detail-skeleton">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg skeleton-premium" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 skeleton-premium" />
            <Skeleton className="h-5 w-48 skeleton-premium" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 skeleton-premium" />
          <Skeleton className="h-6 w-24 skeleton-premium" />
          <Skeleton className="h-6 w-20 skeleton-premium" />
        </div>
      </div>
      <Skeleton className="h-12 w-full skeleton-premium" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full skeleton-premium" />
        ))}
      </div>
    </div>
  );
}

function ProgramStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="hover-elevate" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CollegeDetail() {
  const [, params] = useRoute("/colleges/:id");
  const id = params?.id;

  const { data: college, isLoading: collegeLoading } = useQuery<College>({
    queryKey: ["/api/colleges", id],
    enabled: !!id,
  });

  const { data: roster = [], isLoading: rosterLoading } = useQuery<RosterPlayer[]>({
    queryKey: ["/api/colleges", id, "roster"],
    enabled: !!id,
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/colleges", id, "staff"],
    enabled: !!id,
  });

  if (collegeLoading) {
    return <CollegeDetailSkeleton />;
  }

  if (!college) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="college-not-found">
        <p className="text-muted-foreground text-lg">College not found</p>
      </div>
    );
  }

  const sortedRoster = [...roster].sort((a, b) => {
    const posA = a.position || "ZZZ";
    const posB = b.position || "ZZZ";
    return posA.localeCompare(posB);
  });

  const proLabel = college.sport === "football" ? "NFL" : "NBA";

  const programStats: { icon: typeof Trophy; label: string; value: string | number }[] = [];

  if (college.nationalChampionships) {
    programStats.push({ icon: Trophy, label: "National Championships", value: college.nationalChampionships });
  }
  if (college.conferenceChampionships) {
    programStats.push({ icon: Award, label: "Conference Championships", value: college.conferenceChampionships });
  }
  if (college.tournamentAppearances) {
    programStats.push({ icon: Target, label: "Tournament Appearances", value: college.tournamentAppearances });
  }
  if (college.finalFourAppearances) {
    programStats.push({ icon: Zap, label: "Final Four Appearances", value: college.finalFourAppearances });
  }
  if (college.sport === "basketball" && college.nbaPlayersProduced) {
    programStats.push({ icon: Users, label: "NBA Players Produced", value: college.nbaPlayersProduced });
  }
  if (college.sport === "football" && college.nflPlayersProduced) {
    programStats.push({ icon: Users, label: "NFL Players Produced", value: college.nflPlayersProduced });
  }
  if (college.draftPicksLast5Years) {
    programStats.push({ icon: BarChart3, label: `${proLabel} Draft Picks (Last 5 Years)`, value: college.draftPicksLast5Years });
  }
  if (college.averageAttendance) {
    programStats.push({ icon: Users, label: "Average Attendance", value: college.averageAttendance.toLocaleString() });
  }
  if (college.athleticBudget) {
    programStats.push({ icon: DollarSign, label: "Athletic Budget", value: college.athleticBudget });
  }
  if (college.niLOpportunities) {
    programStats.push({ icon: DollarSign, label: "NIL Opportunities", value: college.niLOpportunities });
  }
  if (college.academicRating) {
    programStats.push({ icon: GraduationCap, label: "Academic Rating", value: `${college.academicRating}/100` });
  }
  if (college.athleteGraduationRate) {
    programStats.push({ icon: GraduationCap, label: "Athlete Graduation Rate", value: `${college.athleteGraduationRate}%` });
  }
  if (college.tempoRating) {
    programStats.push({ icon: Clock, label: "Tempo Rating", value: `${college.tempoRating}/100` });
  }
  if (college.offensiveStyle) {
    programStats.push({ icon: Zap, label: "Offensive Style", value: college.offensiveStyle });
  }
  if (college.defensiveStyle) {
    programStats.push({ icon: Shield, label: "Defensive Style", value: college.defensiveStyle });
  }

  return (
    <div className="space-y-6" data-testid="college-detail-page">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {college.logoUrl && (
            <img
              src={college.logoUrl}
              alt={college.name}
              className="h-16 w-16 rounded-lg object-contain bg-white/5 p-1"
              data-testid="college-logo"
            />
          )}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-heading tracking-tight" data-testid="college-name">
              {college.name}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span data-testid="college-location">{college.city}, {college.state}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" data-testid="badge-division">{college.division}</Badge>
          {college.conference && (
            <Badge variant="secondary" data-testid="badge-conference">{college.conference}</Badge>
          )}
          <Badge variant="outline" data-testid="badge-sport">
            {college.sport === "basketball" ? "Basketball" : "Football"}
          </Badge>
          {college.winsLastSeason !== null && college.lossesLastSeason !== null && (
            <Badge variant="outline" data-testid="badge-record">
              {college.winsLastSeason}-{college.lossesLastSeason}
              {college.conferenceRecord ? ` (${college.conferenceRecord} conf)` : ""}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="roster" data-testid="college-tabs">
        <TabsList className="w-full" data-testid="college-tabs-list">
          <TabsTrigger value="roster" className="flex-1" data-testid="tab-roster">Roster</TabsTrigger>
          <TabsTrigger value="staff" className="flex-1" data-testid="tab-staff">Staff</TabsTrigger>
          <TabsTrigger value="needs" className="flex-1" data-testid="tab-needs">Recruiting</TabsTrigger>
          <TabsTrigger value="info" className="flex-1" data-testid="tab-info">Program</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-4 space-y-4" data-testid="tab-content-roster">
          {rosterLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full skeleton-premium" />
              ))}
            </div>
          ) : sortedRoster.length === 0 ? (
            <Card data-testid="roster-empty">
              <CardContent className="py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No roster data available yet. Roster data is synced from ESPN.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground" data-testid="roster-count">
                  {sortedRoster.length} players
                </span>
              </div>

              <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Height</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Hometown</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRoster.map((player) => (
                      <TableRow
                        key={player.id}
                        className="border-border"
                        data-testid={`roster-player-${player.id}`}
                      >
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.headshotUrl || undefined} alt={player.name} />
                            <AvatarFallback className="text-xs">{getInitials(player.name)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{player.jersey || "-"}</TableCell>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>
                          {player.position ? (
                            <Badge variant="secondary">{player.position}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{player.height || "-"}</TableCell>
                        <TableCell>{player.weight ? `${player.weight} lbs` : "-"}</TableCell>
                        <TableCell>{player.classYear || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{player.hometown || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-2">
                {sortedRoster.map((player) => (
                  <Card
                    key={player.id}
                    className="hover-elevate"
                    data-testid={`roster-player-${player.id}`}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={player.headshotUrl || undefined} alt={player.name} />
                        <AvatarFallback className="text-xs">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {player.jersey && (
                            <span className="text-sm font-bold text-accent">#{player.jersey}</span>
                          )}
                          <span className="font-medium truncate">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {player.position && <Badge variant="secondary">{player.position}</Badge>}
                          {player.classYear && (
                            <span className="text-xs text-muted-foreground">{player.classYear}</span>
                          )}
                          {player.height && (
                            <span className="text-xs text-muted-foreground">{player.height}</span>
                          )}
                        </div>
                        {player.hometown && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{player.hometown}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="staff" className="mt-4 space-y-4" data-testid="tab-content-staff">
          {staffLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full skeleton-premium" />
              ))}
            </div>
          ) : staff.length === 0 ? (
            <Card data-testid="staff-empty">
              <CardContent className="py-12 text-center">
                <UserCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No coaching staff data available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {staff.map((member) => (
                <Card
                  key={member.id}
                  className="hover-elevate"
                  data-testid={`staff-member-${member.id}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.headshotUrl || undefined} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{member.name}</p>
                      {member.title && (
                        <p className="text-sm text-muted-foreground">{member.title}</p>
                      )}
                      {member.experience !== null && member.experience > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {member.experience} {member.experience === 1 ? "year" : "years"} experience
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="needs" className="mt-4 space-y-4" data-testid="tab-content-needs">
          {(() => {
            let needs: string[] = [];
            try {
              if (college.positionNeeds) {
                needs = JSON.parse(college.positionNeeds);
              }
            } catch {}

            const hasScholarships = college.scholarshipsAvailable !== null && college.scholarshipsAvailable > 0;
            const hasNeeds = needs.length > 0;
            const hasContact = college.recruitingContactEmail || college.recruitingUrl;

            if (!hasNeeds && !hasScholarships && !hasContact) {
              return (
                <Card data-testid="needs-empty">
                  <CardContent className="py-12 text-center">
                    <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No recruiting needs posted yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Verified coaches can update what their program is looking for.</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <>
                {hasScholarships && (
                  <Card data-testid="scholarships-card">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Scholarships Available</p>
                        <p className="text-lg font-semibold" data-testid="text-scholarships">{college.scholarshipsAvailable}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {hasNeeds && (
                  <Card data-testid="position-needs-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-heading flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" />
                        Positions Needed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {needs.map((pos) => (
                          <Badge key={pos} variant="default" data-testid={`badge-need-${pos}`}>{pos}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {hasContact && (
                  <Card data-testid="contact-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-heading">Recruiting Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {college.recruitingContactEmail && (
                        <p className="text-sm" data-testid="text-contact-email">{college.recruitingContactEmail}</p>
                      )}
                      {college.recruitingUrl && (
                        <a
                          href={college.recruitingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent underline"
                          data-testid="link-recruiting-url"
                        >
                          Visit Recruiting Page
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="info" className="mt-4 space-y-4" data-testid="tab-content-info">
          {college.headCoachName && (
            <Card data-testid="head-coach-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading">Head Coach</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-lg font-semibold">{college.headCoachName}</p>
                {college.headCoachYears && (
                  <p className="text-sm text-muted-foreground">
                    {college.headCoachYears} {college.headCoachYears === 1 ? "year" : "years"} at {college.shortName || college.name}
                  </p>
                )}
                {college.headCoachRecord && (
                  <p className="text-sm text-muted-foreground">Record: {college.headCoachRecord}</p>
                )}
              </CardContent>
            </Card>
          )}

          {programStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {programStats.map((stat) => (
                <ProgramStatCard key={stat.label} {...stat} />
              ))}
            </div>
          ) : (
            <Card data-testid="info-empty">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No program statistics available yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
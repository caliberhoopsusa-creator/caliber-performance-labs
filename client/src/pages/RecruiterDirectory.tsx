import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Mail, Phone, Users, UserSearch } from "lucide-react";
import { Link } from "wouter";

interface RecruiterProfile {
  id: number;
  schoolName: string;
  division: string;
  title: string;
  schoolEmail: string;
  phone: string;
  bio: string;
  state: string;
  conference: string;
  sport: string;
  isVerified: boolean;
  schoolLogoUrl: string;
  createdAt: string;
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

function RecruiterCardSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-18 rounded-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-full" />
    </Card>
  );
}

export default function RecruiterDirectory() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (sportFilter && sportFilter !== "all") queryParams.set("sport", sportFilter);
  if (divisionFilter && divisionFilter !== "all") queryParams.set("division", divisionFilter);
  const queryString = queryParams.toString();

  const queryUrl = queryString
    ? `/api/recruiters/directory?${queryString}`
    : "/api/recruiters/directory";

  const { data: recruiters, isLoading, isError } = useQuery<RecruiterProfile[]>({
    queryKey: [queryUrl],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-heading tracking-tight" data-testid="text-page-title">
          Recruiter Directory
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          Browse verified college recruiters and find the right fit for your athletic career.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by school or title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-sport">
            <SelectValue placeholder="All Sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            <SelectItem value="Basketball">Basketball</SelectItem>
            <SelectItem value="Football">Football</SelectItem>
          </SelectContent>
        </Select>
        <Select value={divisionFilter} onValueChange={setDivisionFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-division">
            <SelectValue placeholder="All Divisions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Divisions</SelectItem>
            <SelectItem value="D1">D1</SelectItem>
            <SelectItem value="D2">D2</SelectItem>
            <SelectItem value="D3">D3</SelectItem>
            <SelectItem value="NAIA">NAIA</SelectItem>
            <SelectItem value="JUCO">JUCO</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <RecruiterCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Card data-testid="error-state">
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Something went wrong loading the directory. Please try again later.</p>
          </CardContent>
        </Card>
      ) : recruiters && recruiters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-recruiters">
          {recruiters.map((recruiter) => (
            <Card
              key={recruiter.id}
              className="hover-elevate"
              data-testid={`recruiter-card-${recruiter.id}`}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {recruiter.schoolLogoUrl && (
                      <AvatarImage src={recruiter.schoolLogoUrl} alt={recruiter.schoolName} />
                    )}
                    <AvatarFallback className="bg-accent/15 text-accent font-display text-sm">
                      {getInitials(recruiter.schoolName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate" data-testid={`text-school-${recruiter.id}`}>
                      {recruiter.schoolName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate" data-testid={`text-title-${recruiter.id}`}>
                      {recruiter.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recruiter.division && (
                    <Badge variant="default" data-testid={`badge-division-${recruiter.id}`}>
                      {recruiter.division}
                    </Badge>
                  )}
                  {recruiter.conference && (
                    <Badge variant="secondary">
                      {recruiter.conference}
                    </Badge>
                  )}
                  {recruiter.sport && (
                    <Badge variant="outline">
                      {recruiter.sport}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {recruiter.state && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{recruiter.state}</span>
                    </div>
                  )}
                  {recruiter.schoolEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <a
                        href={`mailto:${recruiter.schoolEmail}`}
                        className="truncate text-accent underline-offset-2 hover:underline"
                        data-testid={`link-email-${recruiter.id}`}
                      >
                        {recruiter.schoolEmail}
                      </a>
                    </div>
                  )}
                  {recruiter.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <a
                        href={`tel:${recruiter.phone}`}
                        className="hover:underline underline-offset-2"
                        data-testid={`link-phone-${recruiter.id}`}
                      >
                        {recruiter.phone}
                      </a>
                    </div>
                  )}
                </div>

                {recruiter.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {recruiter.bio}
                  </p>
                )}

                <Link href={`/recruiter/profile/${recruiter.id}`}>
                  <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-profile-${recruiter.id}`}>
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card data-testid="empty-state">
          <CardContent className="py-16 text-center">
            <UserSearch className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-bold mb-1">No recruiters found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search or filters to find college recruiters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSport } from "@/components/SportToggle";
import {
  GitCompareArrows,
  Dumbbell,
  Trophy,
  Film,
  Shield,
  GraduationCap,
  Play,
  Swords,
  UserPlus,
  Medal,
  X,
  type LucideIcon,
} from "lucide-react";

interface DiscoveryCardData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  sport?: "basketball";
}

const DISCOVERY_CARDS: DiscoveryCardData[] = [
  {
    id: "compare",
    title: "Compare Head-to-Head",
    description: "See how your stats stack up against any other player",
    icon: GitCompareArrows,
    href: "/analytics?tab=compare",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
  },
  {
    id: "workouts",
    title: "Track Your Workouts",
    description: "Log training sessions and see your fitness progress",
    icon: Dumbbell,
    href: "/performance?tab=workouts",
    gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700",
  },
  {
    id: "leaderboard",
    title: "Explore the Leaderboard",
    description: "See where you rank among all players",
    icon: Trophy,
    href: "/analytics?tab=leaderboard",
    gradient: "bg-gradient-to-br from-amber-500 to-amber-700",
  },
  {
    id: "reel",
    title: "Build Your Highlight Reel",
    description: "Create shareable highlight videos from your best moments",
    icon: Film,
    href: "/reel-builder",
    gradient: "bg-gradient-to-br from-purple-500 to-purple-700",
    sport: "basketball",
  },
  {
    id: "leagues",
    title: "Join a League",
    description: "Compete in organized leagues and track standings",
    icon: Shield,
    href: "/leagues",
    gradient: "bg-gradient-to-br from-red-500 to-red-700",
  },
  {
    id: "recruiting",
    title: "Get Recruited",
    description: "Build your recruiting profile and connect with college programs",
    icon: GraduationCap,
    href: "/recruiting",
    gradient: "bg-gradient-to-br from-indigo-500 to-indigo-700",
  },
  {
    id: "highlights",
    title: "Discover Highlights",
    description: "Watch the best plays from players across the platform",
    icon: Play,
    href: "/discover/highlights",
    gradient: "bg-gradient-to-br from-pink-500 to-pink-700",
  },
  {
    id: "challenges",
    title: "Challenge a Player",
    description: "Send skill challenges to other players and compete",
    icon: Swords,
    href: "/analytics?tab=challenges",
    gradient: "bg-gradient-to-br from-orange-500 to-orange-700",
  },
  {
    id: "follow",
    title: "Follow Players",
    description: "Find and follow other players to see their updates",
    icon: UserPlus,
    href: "/community?tab=connect",
    gradient: "bg-gradient-to-br from-amber-500 to-amber-700",
  },
  {
    id: "badges",
    title: "Earn Badges",
    description: "Complete milestones and collect achievement badges",
    icon: Medal,
    href: "/dashboard?tab=badges",
    gradient: "bg-gradient-to-br from-yellow-500 to-yellow-600",
  },
];

const DISMISSED_KEY = "caliber_discovery_dismissed";
const VISITED_KEY = "caliber_discovery_visited";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function getVisited(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
  } catch {
    return [];
  }
}

interface DiscoveryCardsProps {
  currentPlayerId?: number | null;
}

export default function DiscoveryCards({ currentPlayerId }: DiscoveryCardsProps) {
  const [, setLocation] = useLocation();
  const sport = useSport();
  const [dismissed, setDismissed] = useState<string[]>(getDismissed);
  const [visited, setVisited] = useState<string[]>(getVisited);
  const [currentIndex, setCurrentIndex] = useState(0);

  const availableCards = useMemo(() => {
    return DISCOVERY_CARDS.filter((card) => {
      if (dismissed.includes(card.id)) return false;
      if (card.sport && card.sport !== sport) return false;
      return true;
    });
  }, [dismissed, sport]);

  useEffect(() => {
    if (currentIndex >= availableCards.length && availableCards.length > 0) {
      setCurrentIndex(0);
    }
  }, [availableCards.length, currentIndex]);

  if (!currentPlayerId || availableCards.length === 0) return null;

  const card = availableCards[currentIndex % availableCards.length];
  if (!card) return null;

  const IconComponent = card.icon;

  const handleDismiss = () => {
    const updated = [...dismissed, card.id];
    setDismissed(updated);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
    setCurrentIndex((prev) => (availableCards.length > 1 ? prev % (availableCards.length - 1) : 0));
  };

  const handleTry = () => {
    if (!visited.includes(card.id)) {
      const updated = [...visited, card.id];
      setVisited(updated);
      localStorage.setItem(VISITED_KEY, JSON.stringify(updated));
    }
    setLocation(card.href);
  };

  return (
    <Card
      className="relative flex items-center gap-3 p-3 cursor-pointer"
      data-testid="card-discovery"
      onClick={handleTry}
    >
      <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${card.gradient}`}>
        <IconComponent className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-sm font-semibold text-foreground truncate" data-testid="text-discovery-title">
          {card.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1" data-testid="text-discovery-description">
          {card.description}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0"
        data-testid="button-discovery-try"
        onClick={(e) => {
          e.stopPropagation();
          handleTry();
        }}
      >
        Try it
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1 right-1 opacity-50"
        data-testid="button-discovery-dismiss"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
}

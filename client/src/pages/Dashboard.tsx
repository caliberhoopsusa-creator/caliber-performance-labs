import { usePlayers } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Plus, ChevronRight, Users, TrendingUp, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonStatCard, SkeletonPlayerCard } from "@/components/ui/skeleton-premium";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";

function DashboardSkeleton() {
  const fadeUpVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <div className="py-6 space-y-6 pb-24 md:pb-6 animate-fade-in">
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        variants={fadeUpVariants}
        initial="initial"
        animate="animate"
      >
        <div className="space-y-2">
          <div className="h-8 w-32 skeleton-cyan rounded" />
          <div className="h-4 w-48 skeleton-premium rounded" />
        </div>
        <div className="h-10 w-28 skeleton-cyan rounded-lg" />
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-2 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeUpVariants}>
          <SkeletonStatCard />
        </motion.div>
        <motion.div variants={fadeUpVariants}>
          <SkeletonStatCard />
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="space-y-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div 
          className="flex justify-between items-center"
          variants={fadeUpVariants}
        >
          <div className="h-6 w-28 skeleton-cyan rounded" />
          <div className="h-4 w-16 skeleton-premium rounded" />
        </motion.div>
        <motion.div variants={fadeUpVariants}>
          <SkeletonPlayerCard />
        </motion.div>
        <motion.div variants={fadeUpVariants}>
          <SkeletonPlayerCard />
        </motion.div>
        <motion.div variants={fadeUpVariants}>
          <SkeletonPlayerCard />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const { data: players, isLoading } = usePlayers();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const recentPlayers = players?.slice(0, 6) || [];
  const avgTeamGrade = "B+";

  return (
    <div className="py-6 space-y-6 pb-24 md:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up delay-100">
        <div>
          <h1 className="text-2xl font-display font-bold bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent tracking-wide" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-cyan-200/50 text-sm tracking-wide">Track and analyze performance</p>
        </div>
        <Link href="/analyze">
          <Button data-testid="button-new-analysis" className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Log Game
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-2 gap-4"
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.15,
            },
          },
        }}
      >
        <motion.div
          variants={{
            initial: { opacity: 0, y: 16 },
            animate: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }
            },
          }}
        >
          <Card className="elite-card hover-lift group" data-testid="card-roster-size">
            <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-400/20 shadow-[0_0_20px_rgba(100,200,255,0.1)]">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent">{players?.length || 0}</p>
                  <p className="text-xs text-cyan-200/50 uppercase tracking-wider">Players</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={{
            initial: { opacity: 0, y: 16 },
            animate: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }
            },
          }}
        >
          <Card className="elite-card hover-lift group" data-testid="card-team-grade">
            <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold bg-gradient-to-b from-white to-emerald-100/80 bg-clip-text text-transparent">{avgTeamGrade}</p>
                  <p className="text-xs text-emerald-200/50 uppercase tracking-wider">Team Grade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Roster */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.35,
          }
        }}
      >
        <Card className="elite-card relative overflow-hidden">
          <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="p-4 border-b border-cyan-500/[0.08] flex items-center justify-between gap-2 bg-gradient-to-r from-cyan-500/[0.02] to-transparent">
          <h2 className="font-display font-bold text-white tracking-wide">Your Roster</h2>
          <Link href="/players" className="text-sm text-cyan-400 flex items-center gap-1 transition-all duration-300 hover:text-cyan-300 hover:gap-2" data-testid="link-view-all-players">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-cyan-500/[0.06]">
          {recentPlayers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Build Your Roster"
              description="Add your first player to start tracking performance, earning grades, and unlocking insights."
              action={{ label: "Add First Player", href: "/players" }}
              variant="compact"
            />
          ) : (
            recentPlayers.map((player, index) => (
              <Link key={player.id} href={`/players/${player.id}`} className="block hover:bg-gradient-to-r hover:from-cyan-500/[0.05] hover:to-transparent transition-all duration-300" data-testid={`link-player-${player.id}`}>
                <div className="p-4 flex items-center justify-between animate-fade-up" style={{ animationDelay: `${200 + index * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-400/20 flex items-center justify-center text-sm font-bold text-cyan-300 shadow-[0_0_15px_rgba(100,200,255,0.1)]">
                      {player.jerseyNumber || "#"}
                    </div>
                    <div>
                      <p className="font-medium text-white">{player.name}</p>
                      <p className="text-xs text-cyan-200/40">{player.position} • {player.team || "Team"}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400/50" />
                </div>
              </Link>
            ))
          )}
        </div>
        </Card>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { usePlayers } from "@/hooks/use-basketball";
import { PlayerReportCard } from "@/components/PlayerReportCard";
import { PrintStyles } from "@/components/PrintStyles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Printer, Calendar, Users, Download } from "lucide-react";
import { format, subDays, startOfYear } from "date-fns";
import { Paywall } from "@/components/Paywall";

type DateRangeOption = "last30" | "season" | "all";

export default function ReportCardPage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const playerFromUrl = searchParams.get("player");
  
  const { data: players, isLoading: playersLoading } = usePlayers();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(playerFromUrl ? parseInt(playerFromUrl) : null);
  const [dateRange, setDateRange] = useState<DateRangeOption>("season");
  
  useEffect(() => {
    if (playerFromUrl) {
      setSelectedPlayerId(parseInt(playerFromUrl));
    }
  }, [playerFromUrl]);

  const handlePrint = () => {
    window.print();
  };

  const getDateRangeLabel = (option: DateRangeOption): string => {
    switch (option) {
      case "last30":
        return "Last 30 Days";
      case "season":
        return "This Season";
      case "all":
        return "All Time";
      default:
        return "Select Range";
    }
  };

  const getDateRange = (option: DateRangeOption): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (option) {
      case "last30":
        return { start: subDays(now, 30), end: now };
      case "season":
        return { start: startOfYear(now), end: now };
      case "all":
        return null;
      default:
        return null;
    }
  };

  if (playersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Report Cards</h1>
            <p className="text-muted-foreground">Loading players...</p>
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <Paywall requiredTier="pro" featureName="PDF Report Cards">
    <div className="space-y-6">
      <PrintStyles />
      
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display" data-testid="text-page-title">Report Cards</h1>
            <p className="text-muted-foreground">Generate printable player reports for recruiters and parents</p>
          </div>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Select Player & Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Player</label>
              <Select
                value={selectedPlayerId?.toString() || ""}
                onValueChange={(val) => setSelectedPlayerId(val ? parseInt(val) : null)}
              >
                <SelectTrigger data-testid="select-player">
                  <SelectValue placeholder="Select a player..." />
                </SelectTrigger>
                <SelectContent>
                  {players?.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{player.name}</span>
                        <span className="text-xs text-muted-foreground">({player.position})</span>
                        {player.team && (
                          <span className="text-xs text-muted-foreground">- {player.team}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date Range</label>
              <Select
                value={dateRange}
                onValueChange={(val) => setDateRange(val as DateRangeOption)}
              >
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue placeholder="Select range..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last 30 Days
                    </div>
                  </SelectItem>
                  <SelectItem value="season">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      This Season
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      All Time
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium text-muted-foreground">Actions</label>
              <div className="flex gap-2">
                <Button
                  onClick={handlePrint}
                  disabled={!selectedPlayerId}
                  className="flex-1"
                  data-testid="button-print-report"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={!selectedPlayerId}
                  variant="outline"
                  data-testid="button-download-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {selectedPlayerId && (
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Showing data for: <strong>{getDateRangeLabel(dateRange)}</strong>
                  {dateRange === "last30" && (
                    <span className="ml-1">
                      ({format(subDays(new Date(), 30), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')})
                    </span>
                  )}
                  {dateRange === "season" && (
                    <span className="ml-1">
                      ({format(startOfYear(new Date()), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedPlayerId ? (
        <Card className="print:hidden">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Select a Player</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Choose a player above to generate their report card
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6" data-testid="report-card-preview">
          <div className="flex items-center gap-2 text-sm text-muted-foreground print:hidden">
            <span>Report Preview</span>
            <span className="text-xs">•</span>
            <span className="text-xs">Use "Print Report" or Ctrl+P to save as PDF</span>
          </div>
          <PlayerReportCard 
            playerId={selectedPlayerId} 
            dateRange={getDateRange(dateRange)}
            showActions={true}
          />
        </div>
      )}
    </div>
    </Paywall>
  );
}

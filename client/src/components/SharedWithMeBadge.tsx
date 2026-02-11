import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SharedWithMeBadgeProps {
  sharedByName: string;
  sharedByPhotoUrl?: string | null;
  sharedAt: string;
  className?: string;
}

export function SharedWithMeBadge({ 
  sharedByName, 
  sharedByPhotoUrl, 
  sharedAt, 
  className 
}: SharedWithMeBadgeProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-1 border-accent/30 bg-accent/5 text-accent gap-1.5",
        className
      )}
      data-testid="badge-shared-with-me"
    >
      <Share2 className="w-3 h-3" />
      <span className="flex items-center gap-1">
        {sharedByPhotoUrl ? (
          <Avatar className="h-4 w-4">
            <AvatarImage src={sharedByPhotoUrl} width={16} height={16} />
            <AvatarFallback className="text-[8px] bg-accent/20">
              {sharedByName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        ) : null}
        <span className="text-xs font-medium">{sharedByName}</span>
        <span className="text-xs text-muted-foreground">{formatDate(sharedAt)}</span>
      </span>
    </Badge>
  );
}
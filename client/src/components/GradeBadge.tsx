import { cn } from "@/lib/utils";

export function GradeBadge({ grade, size = "md", className }: { grade: string, size?: "sm" | "md" | "lg" | "xl", className?: string }) {
  const normalizedGrade = grade.trim().toUpperCase();
  const letter = normalizedGrade.charAt(0);
  
  let colorClass = "bg-gray-500";
  let textClass = "text-white";
  
  if (["A", "A+", "A-"].includes(normalizedGrade)) { colorClass = "bg-grade-a"; textClass = "text-grade-a"; }
  else if (["B", "B+", "B-"].includes(normalizedGrade)) { colorClass = "bg-grade-b"; textClass = "text-grade-b"; }
  else if (["C", "C+", "C-"].includes(normalizedGrade)) { colorClass = "bg-grade-c"; textClass = "text-grade-c"; }
  else if (["D", "D+", "D-"].includes(normalizedGrade)) { colorClass = "bg-grade-d"; textClass = "text-grade-d"; }
  else if (["F"].includes(normalizedGrade)) { colorClass = "bg-grade-f"; textClass = "text-grade-f"; }

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-16 h-16 text-2xl",
    xl: "w-24 h-24 text-4xl",
  };

  return (
    <div className={cn(
      "rounded-lg font-display font-bold flex items-center justify-center shadow-lg border-2 border-white/10 shrink-0",
      colorClass,
      "text-white", // Always white text on colored background for badges
      sizeClasses[size],
      className
    )}>
      {grade}
    </div>
  );
}

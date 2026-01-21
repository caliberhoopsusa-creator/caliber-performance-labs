import { cn } from "@/lib/utils";

export function GradeBadge({ grade, size = "md", className }: { grade: string, size?: "sm" | "md" | "lg" | "xl", className?: string }) {
  const normalizedGrade = grade.trim().toUpperCase();
  const letter = normalizedGrade.charAt(0);
  
  let gradeDisplayClass = "grade-display";
  
  if (["A", "A+", "A-"].includes(normalizedGrade)) { gradeDisplayClass = "grade-display-a"; }
  else if (["B", "B+", "B-"].includes(normalizedGrade)) { gradeDisplayClass = "grade-display-b"; }
  else if (["C", "C+", "C-"].includes(normalizedGrade)) { gradeDisplayClass = "grade-display-c"; }
  else if (["D", "D+", "D-"].includes(normalizedGrade)) { gradeDisplayClass = "grade-display-d"; }
  else if (["F"].includes(normalizedGrade)) { gradeDisplayClass = "grade-display-f"; }

  const sizeClasses = {
    sm: "w-8 h-8 text-sm rounded-lg",
    md: "w-10 h-10 text-base rounded-xl",
    lg: "w-16 h-16 text-2xl rounded-xl",
    xl: "w-24 h-24 text-4xl rounded-2xl",
  };

  return (
    <div className={cn(
      "font-display font-bold flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105",
      "shadow-[0_4px_20px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]",
      gradeDisplayClass,
      sizeClasses[size],
      className
    )}>
      {grade}
    </div>
  );
}

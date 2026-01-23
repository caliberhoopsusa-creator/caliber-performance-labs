import { cn } from "@/lib/utils";

export function GradeBadge({ grade, size = "md", className }: { grade: string, size?: "sm" | "md" | "lg" | "xl", className?: string }) {
  const normalizedGrade = grade.trim().toUpperCase();
  
  let gradeDisplayClass = "grade-display";
  let glowColor = "rgba(100,200,255,0.3)";
  
  if (["A", "A+", "A-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-a"; 
    glowColor = "rgba(16,185,129,0.4)";
  }
  else if (["B", "B+", "B-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-b"; 
    glowColor = "rgba(16,185,129,0.3)";
  }
  else if (["C", "C+", "C-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-c"; 
    glowColor = "rgba(234,179,8,0.4)";
  }
  else if (["D", "D+", "D-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-d"; 
    glowColor = "rgba(251,113,133,0.4)";
  }
  else if (["F"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-f"; 
    glowColor = "rgba(239,68,68,0.4)";
  }

  const sizeClasses = {
    sm: "w-8 h-8 text-sm rounded-lg",
    md: "w-10 h-10 text-base rounded-xl",
    lg: "w-16 h-16 text-2xl rounded-xl",
    xl: "w-24 h-24 text-4xl rounded-2xl",
  };

  return (
    <div 
      className={cn(
        "font-display font-bold flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 relative touch-press",
        gradeDisplayClass,
        sizeClasses[size],
        className
      )}
      style={{
        boxShadow: `0 4px 20px ${glowColor}, 0 1px 0 rgba(255,255,255,0.15) inset, 0 0 30px ${glowColor.replace(')', ',0.2)')}`,
      }}
    >
      <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{grade}</span>
    </div>
  );
}

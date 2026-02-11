import { cn } from "@/lib/utils";

export function GradeBadge({ grade, size = "md", className }: { grade: string, size?: "sm" | "md" | "lg" | "xl", className?: string }) {
  const normalizedGrade = grade.trim().toUpperCase();
  
  let gradeDisplayClass = "grade-display";
  
  if (["A", "A+", "A-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-a"; 
  }
  else if (["B", "B+", "B-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-b"; 
  }
  else if (["C", "C+", "C-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-c"; 
  }
  else if (["D", "D+", "D-"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-d"; 
  }
  else if (["F"].includes(normalizedGrade)) { 
    gradeDisplayClass = "grade-display-f"; 
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
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{grade}</span>
    </div>
  );
}

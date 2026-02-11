import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  GraduationCap,
  FileText,
  Trophy,
  ClipboardCheck,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NCAA_CORE_COURSE_REQUIREMENTS, type NcaaEligibilityProgress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface NcaaEligibilityChecklistProps {
  playerId: number;
}

type Division = "D1" | "D2" | "D3" | "NAIA" | "JUCO";

interface ChecklistItem {
  id: string;
  label: string;
  key: keyof NcaaEligibilityProgress;
  type: "checkbox" | "text" | "number";
  placeholder?: string;
}

interface ChecklistCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: ChecklistItem[];
}

const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    id: "registration",
    title: "NCAA Registration",
    icon: ClipboardCheck,
    items: [
      {
        id: "registered-ncaa",
        label: "Registered with NCAA Eligibility Center",
        key: "registeredWithNcaa",
        type: "checkbox",
      },
      {
        id: "ncaa-id",
        label: "NCAA ID Number",
        key: "ncaaIdNumber",
        type: "text",
        placeholder: "Enter NCAA ID",
      },
    ],
  },
  {
    id: "academic",
    title: "Academic Requirements",
    icon: BookOpen,
    items: [
      {
        id: "core-courses",
        label: "Core Courses Completed",
        key: "coreCoursesCompleted",
        type: "number",
        placeholder: "0",
      },
      {
        id: "core-gpa",
        label: "Core GPA",
        key: "coreGpa",
        type: "text",
        placeholder: "0.00",
      },
      {
        id: "sliding-scale",
        label: "Sliding Scale Eligible",
        key: "slidingScaleEligible",
        type: "checkbox",
      },
    ],
  },
  {
    id: "test-scores",
    title: "Test Scores",
    icon: GraduationCap,
    items: [
      {
        id: "sat-score",
        label: "SAT Score",
        key: "satScore",
        type: "number",
        placeholder: "400-1600",
      },
      {
        id: "act-score",
        label: "ACT Score",
        key: "actScore",
        type: "number",
        placeholder: "1-36",
      },
      {
        id: "test-scores-sent",
        label: "Test Scores Sent to NCAA",
        key: "testScoresSent",
        type: "checkbox",
      },
    ],
  },
  {
    id: "transcript",
    title: "Transcript",
    icon: FileText,
    items: [
      {
        id: "transcript-sent",
        label: "Official Transcript Sent",
        key: "transcriptSent",
        type: "checkbox",
      },
      {
        id: "final-transcript",
        label: "Final Transcript Sent",
        key: "finalTranscriptSent",
        type: "checkbox",
      },
    ],
  },
  {
    id: "amateurism",
    title: "Amateurism",
    icon: Trophy,
    items: [
      {
        id: "amateurism-certified",
        label: "Amateurism Certified",
        key: "amateurismCertified",
        type: "checkbox",
      },
      {
        id: "questionnaire-done",
        label: "Amateurism Questionnaire Done",
        key: "amateurismQuestionnaireDone",
        type: "checkbox",
      },
    ],
  },
];

const DIVISIONS: Division[] = ["D1", "D2", "D3", "NAIA", "JUCO"];

function calculateCompletionPercentage(data: Partial<NcaaEligibilityProgress> | null): number {
  if (!data) return 0;

  const checkboxFields: (keyof NcaaEligibilityProgress)[] = [
    "registeredWithNcaa",
    "slidingScaleEligible",
    "testScoresSent",
    "transcriptSent",
    "finalTranscriptSent",
    "amateurismCertified",
    "amateurismQuestionnaireDone",
  ];

  const textFields: (keyof NcaaEligibilityProgress)[] = [
    "ncaaIdNumber",
    "coreGpa",
  ];

  const numberFields: (keyof NcaaEligibilityProgress)[] = [
    "coreCoursesCompleted",
    "satScore",
    "actScore",
  ];

  let completed = 0;
  const totalItems = checkboxFields.length + textFields.length + numberFields.length;

  checkboxFields.forEach((field) => {
    if (data[field] === true) completed++;
  });

  textFields.forEach((field) => {
    const value = data[field];
    if (value !== null && value !== undefined && value !== "") completed++;
  });

  numberFields.forEach((field) => {
    const value = data[field];
    if (value !== null && value !== undefined && Number(value) > 0) completed++;
  });

  return Math.round((completed / totalItems) * 100);
}

export function NcaaEligibilityChecklist({ playerId }: NcaaEligibilityChecklistProps) {
  const { toast } = useToast();
  const [localData, setLocalData] = useState<Partial<NcaaEligibilityProgress>>({});
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data: eligibilityData, isLoading } = useQuery<NcaaEligibilityProgress | null>({
    queryKey: ["/api/players", playerId, "ncaa-eligibility"],
  });

  useEffect(() => {
    if (eligibilityData) {
      setLocalData(eligibilityData);
    }
  }, [eligibilityData]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<NcaaEligibilityProgress>) => {
      return apiRequest("POST", `/api/players/${playerId}/ncaa-eligibility`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "ncaa-eligibility"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const debouncedSave = useCallback(
    (data: Partial<NcaaEligibilityProgress>) => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      const timeout = setTimeout(() => {
        saveMutation.mutate(data);
      }, 500);
      setSaveTimeout(timeout);
    },
    [saveTimeout, saveMutation]
  );

  const handleCheckboxChange = (key: keyof NcaaEligibilityProgress) => {
    const newValue = !localData[key];
    const newData = { ...localData, [key]: newValue };
    setLocalData(newData);
    saveMutation.mutate(newData);
  };

  const handleTextChange = (key: keyof NcaaEligibilityProgress, value: string) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    debouncedSave(newData);
  };

  const handleNumberChange = (key: keyof NcaaEligibilityProgress, value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    const newData = { ...localData, [key]: numValue };
    setLocalData(newData);
    debouncedSave(newData);
  };

  const handleDivisionChange = (division: Division) => {
    const newData = { ...localData, targetDivision: division };
    setLocalData(newData);
    saveMutation.mutate(newData);
  };

  const completionPercentage = calculateCompletionPercentage(localData);
  const targetDivision = (localData.targetDivision as Division) || "D1";

  const getDivisionRequirements = (division: Division) => {
    const req = NCAA_CORE_COURSE_REQUIREMENTS[division];
    if (!req) return null;

    if ("note" in req) {
      return { type: "note" as const, text: req.note };
    }
    if ("requirements" in req) {
      return { type: "requirements" as const, text: req.requirements };
    }
    return { type: "full" as const, data: req };
  };

  if (isLoading) {
    return (
      <Card
        className="border-accent/20"
        data-testid="ncaa-eligibility-loading"
      >
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const divisionReq = getDivisionRequirements(targetDivision);

  return (
    <Card
      className="border-accent/20"
      data-testid="ncaa-eligibility-checklist"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <GraduationCap className="w-6 h-6 text-accent" />
          </div>
          <CardTitle className="font-display text-xl text-foreground tracking-wide">
            NCAA Eligibility Checklist
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-sm px-3 py-1",
            completionPercentage === 100
              ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
              : "border-accent/50 text-accent bg-accent/10"
          )}
          data-testid="completion-badge"
        >
          {completionPercentage}% Complete
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-accent font-medium">{completionPercentage}%</span>
          </div>
          <Progress
            value={completionPercentage}
            className="h-3 bg-muted/50"
            data-testid="progress-bar"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Target Division</Label>
          <Select
            value={targetDivision}
            onValueChange={(value) => handleDivisionChange(value as Division)}
          >
            <SelectTrigger
              className="w-full bg-muted/50 border-border"
              data-testid="select-division"
            >
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {DIVISIONS.map((div) => (
                <SelectItem key={div} value={div} data-testid={`division-option-${div}`}>
                  {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {divisionReq && (
          <div
            className="p-4 rounded-xl bg-accent/5 border border-accent/20"
            data-testid="division-requirements"
          >
            <h4 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              {targetDivision} Requirements
            </h4>
            {divisionReq.type === "full" ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Total Courses:</div>
                <div className="text-foreground">{divisionReq.data.totalCourses}</div>
                <div className="text-muted-foreground">English:</div>
                <div className="text-foreground">{divisionReq.data.english}</div>
                <div className="text-muted-foreground">Math:</div>
                <div className="text-foreground">{divisionReq.data.math}</div>
                <div className="text-muted-foreground">Science:</div>
                <div className="text-foreground">{divisionReq.data.science}</div>
                <div className="text-muted-foreground">Social Science:</div>
                <div className="text-foreground">{divisionReq.data.socialScience}</div>
                <div className="text-muted-foreground">Minimum Core GPA:</div>
                <div className="text-foreground">{divisionReq.data.minCoreGpa}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{divisionReq.text}</p>
            )}
          </div>
        )}

        <div className="space-y-6">
          {CHECKLIST_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className="space-y-3"
                data-testid={`category-${category.id}`}
              >
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <IconComponent className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                </div>

                <div className="space-y-3 pl-2">
                  {category.items.map((item) => {
                    if (item.type === "checkbox") {
                      const isChecked = !!localData[item.key];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleCheckboxChange(item.key)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                            "hover:bg-muted/50 group cursor-pointer text-left",
                            isChecked && "bg-emerald-500/10"
                          )}
                          data-testid={`checkbox-${item.id}`}
                          data-checked={isChecked}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                              isChecked
                                ? "bg-emerald-500 text-white"
                                : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
                            )}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm transition-colors",
                              isChecked ? "text-emerald-400" : "text-foreground/80"
                            )}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    }

                    const value = localData[item.key];
                    const displayValue =
                      value === null || value === undefined ? "" : String(value);

                    return (
                      <div key={item.id} className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">{item.label}</Label>
                        <Input
                          type={item.type === "number" ? "number" : "text"}
                          value={displayValue}
                          onChange={(e) =>
                            item.type === "number"
                              ? handleNumberChange(item.key, e.target.value)
                              : handleTextChange(item.key, e.target.value)
                          }
                          placeholder={item.placeholder}
                          className="bg-muted/50 border-border placeholder:text-muted-foreground"
                          data-testid={`input-${item.id}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {saveMutation.isPending && (
          <div
            className="flex items-center justify-center py-2 text-sm text-accent"
            data-testid="saving-indicator"
          >
            Saving...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

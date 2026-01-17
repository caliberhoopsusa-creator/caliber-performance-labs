import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateWorkout, type CreateWorkoutInput } from "@/hooks/use-basketball";
import { useToast } from "@/hooks/use-toast";

const workoutSchema = z.object({
  workoutType: z.enum(["shooting", "conditioning", "weights", "skills", "recovery"], {
    required_error: "Please select a workout type",
  }),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  date: z.date({ required_error: "Please select a date" }),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  intensity: z.number().min(1).max(10),
  notes: z.string().max(500, "Notes are too long").optional(),
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;

type LogWorkoutModalProps = {
  playerId: number;
};

export function LogWorkoutModal({ playerId }: LogWorkoutModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createWorkout = useCreateWorkout();

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      workoutType: undefined,
      title: "",
      date: new Date(),
      duration: 60,
      intensity: 5,
      notes: "",
    },
  });

  const onSubmit = async (values: WorkoutFormValues) => {
    try {
      const data: CreateWorkoutInput = {
        playerId,
        date: format(values.date, 'yyyy-MM-dd'),
        workoutType: values.workoutType,
        title: values.title,
        duration: values.duration,
        intensity: values.intensity,
        notes: values.notes || null,
      };
      
      await createWorkout.mutateAsync(data);
      
      toast({
        title: "Workout Logged",
        description: "Your workout has been recorded successfully.",
      });
      
      form.reset({
        workoutType: undefined,
        title: "",
        date: new Date(),
        duration: 60,
        intensity: 5,
        notes: "",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log workout",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-log-workout">
          <Plus className="w-4 h-4" />
          Log Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-log-workout">
        <DialogHeader>
          <DialogTitle>Log Workout</DialogTitle>
          <DialogDescription>
            Record your off-court training session.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="workoutType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-workout-type">
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="shooting">Shooting</SelectItem>
                      <SelectItem value="conditioning">Conditioning</SelectItem>
                      <SelectItem value="weights">Weight Training</SelectItem>
                      <SelectItem value="skills">Skills Training</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Morning shooting drills" 
                      {...field} 
                      data-testid="input-workout-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="input-workout-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="60" 
                      {...field}
                      data-testid="input-workout-duration"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intensity"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Intensity</FormLabel>
                    <span className="text-sm font-medium text-primary">{field.value}/10</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="py-2"
                      data-testid="slider-workout-intensity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How did it go? What did you focus on?"
                      className="resize-none"
                      {...field}
                      data-testid="input-workout-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-workout"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createWorkout.isPending}
                data-testid="button-submit-workout"
              >
                {createWorkout.isPending ? "Saving..." : "Save Workout"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  snapPoints?: number[];
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  snapPoints = [0.5, 0.9],
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const currentSnapIndex = useRef(0);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, handleClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 500 || offset > 200) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            data-testid="bottom-sheet-overlay"
          />
          
          <motion.div
            ref={sheetRef}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] rounded-t-[20px] overflow-hidden",
              "bg-gradient-to-b from-[hsl(220,25%,10%)] to-[hsl(220,25%,8%)]",
              "border-t border-x border-cyan-500/20",
              "shadow-[0_-4px_40px_rgba(0,212,255,0.15)]",
              className
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "bottom-sheet-title" : undefined}
            aria-describedby={description ? "bottom-sheet-description" : undefined}
            data-testid="bottom-sheet"
          >
            <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
            
            <div className="relative">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-cyan-400/40" />
              </div>
              
              {(title || description) && (
                <div className="px-6 pb-4 border-b border-cyan-500/10">
                  <div className="flex items-center justify-between">
                    {title && (
                      <h2 id="bottom-sheet-title" className="text-lg font-display font-bold text-foreground">
                        {title}
                      </h2>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      data-testid="button-close-sheet"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  {description && (
                    <p id="bottom-sheet-description" className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}
              
              <div className="relative overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-4 safe-area-bottom">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface BottomSheetTriggerProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function BottomSheetTrigger({ 
  children, 
  onClick, 
  className,
  variant = "default",
  size = "default"
}: BottomSheetTriggerProps) {
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={onClick} 
      className={className} 
      data-testid="button-open-sheet"
    >
      {children}
    </Button>
  );
}

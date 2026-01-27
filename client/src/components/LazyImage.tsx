import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  aspectRatio?: "square" | "video" | "auto";
  fallback?: React.ReactNode;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderClassName,
  aspectRatio = "auto",
  fallback,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        aspectClasses[aspectRatio],
        className
      )}
    >
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30",
            "animate-pulse",
            placeholderClassName
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
      )}

      {isInView && (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "w-full h-full object-cover",
            !isLoaded && "invisible"
          )}
        />
      )}
    </div>
  );
}

interface LazyAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const sizeDimensions = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function LazyAvatar({ src, name, size = "md", className }: LazyAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn(sizeClasses[size], "border border-cyan-500/30", className)}>
      {src && <AvatarImage src={src} alt={name} width={sizeDimensions[size]} height={sizeDimensions[size]} />}
      <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 text-cyan-400 font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

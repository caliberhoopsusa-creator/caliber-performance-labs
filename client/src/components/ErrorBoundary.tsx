import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] flex items-center justify-center p-4 overflow-hidden relative" data-testid="error-boundary-fallback">
          {/* Cyber grid background */}
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-30" />
          <div className="absolute inset-0 scan-lines pointer-events-none opacity-20" />
          
          {/* Ambient glow spots */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/[0.08] to-transparent rounded-full blur-[180px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-gradient-radial from-blue-500/[0.05] to-transparent rounded-full blur-[150px] pointer-events-none" />
          
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-md w-full text-center space-y-6">
            {/* Error icon container with cyber styling */}
            <div className="w-24 h-24 mx-auto relative group">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-2xl border border-cyan-500/30 group-hover:border-cyan-500/60 transition-colors duration-300" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 animate-pulse" />
              
              {/* Inner tech panel effect */}
              <div className="absolute inset-2 rounded-xl border border-cyan-500/20 flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              </div>
              
              {/* Corner accents */}
              <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/50" />
              <div className="absolute -top-2 -right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/50" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/50" />
              <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/50" />
            </div>
            
            {/* Error message container */}
            <div className="space-y-3 px-2">
              <div className="relative">
                {/* Top border accent */}
                <div className="absolute -top-3 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                
                <h1 className="text-3xl font-display font-bold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-cyan-300" data-testid="text-error-title">
                  System Error
                </h1>
              </div>
              
              <p className="text-sm leading-relaxed text-gray-300" data-testid="text-error-description">
                An unexpected error occurred in the system. Your data remains secure.
              </p>
              
              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-cyan-400/70 pt-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Error detected and logged</span>
              </div>
            </div>

            {/* Error details panel (dev mode only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="relative px-4 py-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-left group" data-testid="text-error-details">
                <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50 group-hover:border-cyan-500/80 transition-colors" />
                <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50 group-hover:border-cyan-500/80 transition-colors" />
                
                <p className="text-xs font-mono text-cyan-300 break-all leading-relaxed">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                onClick={this.handleRetry} 
                className="gap-2 bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/30 hover:border-cyan-400/60"
                data-testid="button-error-retry"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-display font-semibold tracking-wide">TRY AGAIN</span>
              </Button>
              <Button 
                onClick={this.handleGoHome} 
                variant="outline" 
                className="gap-2 border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-500/10"
                data-testid="button-error-home"
              >
                <Home className="w-4 h-4" />
                <span className="font-display font-semibold tracking-wide">GO HOME</span>
              </Button>
            </div>

            {/* Footer accent line */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

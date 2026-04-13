/**
 * Radial Orbital Timeline — Platinum Edition
 * Accent: Obsidian × Steel Silver × Platinum
 */

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";

// Platinum design tokens
const P = {
  main:     '#C6D0D8',   // platinum silver
  dim:      '#4f6878',   // dark steel
  bright:   '#d4e0ea',   // light platinum
  glow:     'rgba(198,208,216,0.20)',
  glowFade: 'rgba(198,208,216,0)',
  trace:    'rgba(198,208,216,0.30)',
};

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [viewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => { newPulseEffect[relId] = true; });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (autoRotate && viewMode === "orbital") {
      timer = setInterval(() => {
        setRotationAngle((prev) => Number(((prev + 0.3) % 360).toFixed(3)));
      }, 50);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    setRotationAngle(270 - (nodeIndex / totalNodes) * 360);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;
    return {
      x: radius * Math.cos(radian) + centerOffset.x,
      y: radius * Math.sin(radian) + centerOffset.y,
      angle,
      zIndex: Math.round(100 + 50 * Math.cos(radian)),
      opacity: Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))),
    };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const item = timelineData.find((i) => i.id === itemId);
    return item ? item.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const getStatusLabel = (status: TimelineItem["status"]) => {
    if (status === "completed") return "LIVE";
    if (status === "in-progress") return "IN PROGRESS";
    return "COMING SOON";
  };

  return (
    <div
      className="w-full h-[600px] flex flex-col items-center justify-center overflow-hidden rounded-2xl relative"
      ref={containerRef}
      onClick={handleContainerClick}
      style={{
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, #0d1519 0%, #080808 100%)',
        border: '1px solid rgba(198,208,216,0.08)',
      }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(198,208,216,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: '1000px',
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* Center node — platinum core */}
          <div
            className="absolute z-10 flex items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            {/* Outer ping rings */}
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: 80, height: 80,
                border: `1px solid ${P.trace}`,
                opacity: 0.5,
              }}
            />
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: 96, height: 96,
                border: `1px solid rgba(198,208,216,0.15)`,
                opacity: 0.4,
                animationDelay: '0.5s',
              }}
            />
            {/* Core circle */}
            <div
              className="absolute rounded-full"
              style={{
                width: 64, height: 64,
                background: `conic-gradient(from 0deg, ${P.dim}, ${P.main}, ${P.bright}, ${P.main}, ${P.dim})`,
                animation: 'spin 8s linear infinite',
                boxShadow: `0 0 24px ${P.glow}, 0 0 48px rgba(198,208,216,0.08)`,
              }}
            />
            {/* Inner white dot */}
            <div
              className="absolute rounded-full"
              style={{
                width: 28, height: 28,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)',
              }}
            />
          </div>

          {/* Orbit ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 400, height: 400,
              border: `1px solid rgba(198,208,216,0.10)`,
            }}
          />

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
              >
                {/* Energy halo */}
                <div
                  className={isPulsing ? 'animate-pulse' : ''}
                  style={{
                    position: 'absolute',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${P.glow} 0%, ${P.glowFade} 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                />

                {/* Node button */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isExpanded
                      ? `linear-gradient(135deg, ${P.dim}, ${P.main})`
                      : isRelated
                      ? `rgba(198,208,216,0.25)`
                      : 'rgba(0,0,0,0.8)',
                    border: `2px solid ${isExpanded ? P.main : isRelated ? P.trace : 'rgba(255,255,255,0.25)'}`,
                    boxShadow: isExpanded
                      ? `0 0 20px ${P.glow}, 0 0 40px rgba(198,208,216,0.08)`
                      : 'none',
                    transform: isExpanded ? 'scale(1.5)' : 'scale(1)',
                    color: isExpanded || isRelated ? '#fff' : 'rgba(255,255,255,0.7)',
                    animation: isRelated ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  <Icon size={16} />
                </div>

                {/* Label */}
                <div
                  className="absolute top-12 whitespace-nowrap text-xs font-semibold tracking-wider transition-all duration-300"
                  style={{
                    left: '50%',
                    transform: isExpanded ? 'translateX(-50%) scale(1.2)' : 'translateX(-50%)',
                    color: isExpanded ? P.main : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {item.title}
                </div>

                {/* Expanded card */}
                {isExpanded && (
                  <div
                    className="absolute top-20 -translate-x-1/2 w-64 overflow-visible"
                    style={{ left: '50%' }}
                  >
                    {/* Connector line */}
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3"
                      style={{ background: P.trace }}
                    />

                    {/* Card */}
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: 'rgba(8,8,8,0.95)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid rgba(198,208,216,0.20)`,
                        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(198,208,216,0.05)`,
                      }}
                    >
                      {/* Card header */}
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex justify-between items-center mb-2.5">
                          {/* Status badge */}
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.12em] uppercase"
                            style={{
                              background: item.status === 'completed'
                                ? `rgba(198,208,216,0.15)`
                                : 'rgba(255,255,255,0.06)',
                              border: `1px solid ${item.status === 'completed' ? P.trace : 'rgba(255,255,255,0.1)'}`,
                              color: item.status === 'completed' ? P.main : 'rgba(255,255,255,0.4)',
                            }}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                          >
                            {item.date}
                          </span>
                        </div>
                        <h4
                          className="text-sm font-bold"
                          style={{ color: '#ffffff', fontFamily: "'Syne', sans-serif" }}
                        >
                          {item.title}
                        </h4>
                      </div>

                      {/* Body */}
                      <div className="px-4 pb-4">
                        <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {item.content}
                        </p>

                        {/* Progress bar */}
                        <div
                          className="pt-3 mb-4"
                          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <div className="flex justify-between items-center text-[11px] mb-1.5">
                            <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <Zap size={10} style={{ color: P.main }} />
                              Adoption
                            </span>
                            <span className="font-mono font-bold" style={{ color: P.main }}>
                              {item.energy}%
                            </span>
                          </div>
                          <div
                            className="w-full h-1 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.06)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.energy}%`,
                                background: `linear-gradient(90deg, ${P.dim}, ${P.main})`,
                                boxShadow: `0 0 8px ${P.glow}`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Related features */}
                        {item.relatedIds.length > 0 && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                            <div className="flex items-center gap-1 mb-2">
                              <Link size={9} style={{ color: 'rgba(255,255,255,0.3)' }} />
                              <span
                                className="text-[10px] uppercase tracking-[0.15em] font-semibold"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                              >
                                Connected Features
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {item.relatedIds.map((relatedId) => {
                                const related = timelineData.find((i) => i.id === relatedId);
                                return (
                                  <button
                                    key={relatedId}
                                    className="flex items-center gap-1 h-6 px-2 rounded text-[11px] transition-all duration-150"
                                    style={{
                                      background: 'rgba(198,208,216,0.06)',
                                      border: `1px solid rgba(198,208,216,0.15)`,
                                      color: 'rgba(255,255,255,0.6)',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(198,208,216,0.12)';
                                      e.currentTarget.style.color = P.main;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(198,208,216,0.06)';
                                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                    }}
                                    onClick={(e) => { e.stopPropagation(); toggleItem(relatedId); }}
                                  >
                                    {related?.title}
                                    <ArrowRight size={8} style={{ color: P.trace }} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint text */}
      <div
        className="absolute bottom-4 text-[11px] tracking-[0.15em] uppercase"
        style={{ color: 'rgba(198,208,216,0.25)' }}
      >
        Click any node to explore
      </div>
    </div>
  );
}

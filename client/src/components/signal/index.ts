// SIGNAL signature components — the identity carriers (see docs/DESIGN-LANGUAGE.md §5).
// CaliberScore (the tier ring) lives at @/components/CaliberScore and already
// reads from the --tier-* tokens.

export { StatNumber, type StatNumberProps } from "./StatNumber";
export { SectionEyebrow, type SectionEyebrowProps } from "./SectionEyebrow";
export {
  TelemetryStrip,
  type TelemetryStripProps,
  type TelemetryItem,
} from "./TelemetryStrip";
export { GradeBadge, type GradeBadgeProps } from "./GradeBadge";

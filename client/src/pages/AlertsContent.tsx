import { AlertsCenter } from "@/components/AlertsCenter";
import { Paywall } from "@/components/Paywall";

export default function AlertsContent() {
  return (
    <Paywall requiredTier="coach_pro" featureName="Trend Alerts">
      <AlertsCenter />
    </Paywall>
  );
}

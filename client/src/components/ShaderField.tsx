import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/** Flowing black · red · silver gradient field (R3F-based; lazy-loaded). */
export default function ShaderField() {
  return (
    <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }} pixelDensity={1} fov={45}>
      <ShaderGradient
        type="waterPlane"
        animate="on"
        uSpeed={0.3}
        uStrength={1.6}
        uDensity={1.3}
        uFrequency={5.5}
        color1="#0A0A0B"
        color2="#E11D2A"
        color3="#C7CCD4"
        cAzimuthAngle={180}
        cDistance={3.2}
        cPolarAngle={115}
        brightness={1.05}
        grain="on"
        lightType="3d"
        reflection={0.1}
        rotationX={0}
        rotationY={10}
        rotationZ={50}
      />
    </ShaderGradientCanvas>
  );
}

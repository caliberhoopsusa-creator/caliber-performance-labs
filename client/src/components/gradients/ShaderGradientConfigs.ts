// client/src/components/gradients/ShaderGradientConfigs.ts

export type GradientVariant = 'hero' | 'subtle' | 'accent' | 'section' | 'card' | 'button' | 'loading';

export interface GradientConfig {
  animate: "on" | "off";
  bgColor1: string;
  bgColor2: string;
  brightness: number;
  color1: string;
  color2: string;
  color3: string;
  cameraZoom: number;
  envPreset: "city" | "forest" | "sunset";
  grain: "on" | "off";
  lightType: "3d" | "2d";
  pixelDensity: number;
  cAzimuthAngle: number;
  cPolarAngle: number;
  cDistance: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  uAmplitude: number;
  uDensity: number;
  uFrequency: number;
  uSpeed: number;
  uStrength: number;
}

export const GRADIENT_CONFIGS: Record<GradientVariant, Partial<GradientConfig>> = {
  // Main hero landing page
  hero: {
    animate: "on",
    bgColor1: "#000000",
    bgColor2: "#000000",
    brightness: 1.1,
    color1: "#ff6b35",
    color2: "#8b4513",
    color3: "#000000",
    cameraZoom: 1,
    envPreset: "city",
    grain: "on",
    lightType: "3d",
    pixelDensity: 1.5,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 0.8,
    uDensity: 1.6,
    uFrequency: 5.5,
    uSpeed: 0.3,
    uStrength: 3.5,
  },

  // Subtle background texture
  subtle: {
    animate: "on",
    bgColor1: "#ffffff",
    bgColor2: "#f5f5f5",
    brightness: 0.8,
    color1: "#ff6b35",
    color2: "#a36d0a",
    color3: "#ffffff",
    cameraZoom: 2,
    envPreset: "city",
    grain: "on",
    lightType: "3d",
    pixelDensity: 1,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 0.2,
    uDensity: 0.8,
    uFrequency: 2,
    uSpeed: 0.1,
    uStrength: 0.5,
  },

  // Section dividers
  section: {
    animate: "on",
    bgColor1: "#000000",
    bgColor2: "#1a1a1a",
    brightness: 0.8,
    color1: "#ff6b35",
    color2: "#8b4513",
    color3: "#1a1a1a",
    cameraZoom: 1.5,
    envPreset: "city",
    grain: "on",
    lightType: "3d",
    pixelDensity: 1.2,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 0.4,
    uDensity: 1.2,
    uFrequency: 3,
    uSpeed: 0.15,
    uStrength: 1.5,
  },

  // Card hover states
  card: {
    animate: "on",
    bgColor1: "#ffffff",
    bgColor2: "#f9fafb",
    brightness: 0.9,
    color1: "#ff6b35",
    color2: "#a36d0a",
    color3: "#ffffff",
    cameraZoom: 2,
    envPreset: "city",
    grain: "off",
    lightType: "3d",
    pixelDensity: 1,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 0.15,
    uDensity: 0.8,
    uFrequency: 2,
    uSpeed: 0.3,
    uStrength: 2,
  },

  // Button hover states
  button: {
    animate: "on",
    bgColor1: "#ff6b35",
    bgColor2: "#8b4513",
    brightness: 1,
    color1: "#ff8c5a",
    color2: "#a36d0a",
    color3: "#ff6b35",
    cameraZoom: 2,
    envPreset: "city",
    grain: "off",
    lightType: "3d",
    pixelDensity: 1,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 0.15,
    uDensity: 0.8,
    uFrequency: 2,
    uSpeed: 0.3,
    uStrength: 2,
  },

  // Accent background layer
  accent: {
    animate: "on",
    bgColor1: "#ffffff",
    bgColor2: "#f9fafb",
    brightness: 0.5,
    color1: "#ff6b35",
    color2: "#a36d0a",
    color3: "#ffffff",
    cameraZoom: 2,
    envPreset: "city",
    grain: "off",
    lightType: "3d",
    pixelDensity: 1,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 0.1,
    uDensity: 0.6,
    uFrequency: 1.5,
    uSpeed: 0.05,
    uStrength: 0.3,
  },

  // Loading screen
  loading: {
    animate: "on",
    bgColor1: "#000000",
    bgColor2: "#000000",
    brightness: 1,
    color1: "#ff6b35",
    color2: "#8b4513",
    color3: "#000000",
    cameraZoom: 1,
    envPreset: "city",
    grain: "on",
    lightType: "3d",
    pixelDensity: 1.5,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 0.5,
    uDensity: 1.4,
    uFrequency: 4,
    uSpeed: 0.5,
    uStrength: 3,
  },
};

/**
 * Get gradient config by variant
 * Merges variant config with defaults
 */
export function getGradientConfig(variant: GradientVariant): GradientConfig {
  const config = GRADIENT_CONFIGS[variant];
  return {
    animate: "on",
    bgColor1: "#000000",
    bgColor2: "#000000",
    brightness: 1,
    color1: "#ff6b35",
    color2: "#8b4513",
    color3: "#000000",
    cameraZoom: 1,
    envPreset: "city",
    grain: "off",
    lightType: "3d",
    pixelDensity: 1,
    cAzimuthAngle: 186,
    cPolarAngle: 90,
    cDistance: 3.79,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    uAmplitude: 1,
    uDensity: 1.8,
    uFrequency: 5.5,
    uSpeed: 0.4,
    uStrength: 4,
    ...config,
  };
}

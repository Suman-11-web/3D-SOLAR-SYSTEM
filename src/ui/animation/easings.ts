import { isReducedMotion } from './reducedMotion';

export const EASINGS = {
  outExpo: 'expo.out',
  inOutExpo: 'expo.inOut',
  outCubic: 'power3.out',
  inOutCubic: 'power3.inOut',
  spring: 'back.out(1.4)'
} as const;

export function motionDuration(seconds: number): number {
  return isReducedMotion() ? 0.01 : seconds;
}

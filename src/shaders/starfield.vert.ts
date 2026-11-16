export const STARFIELD_VERT = `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

uniform float uTime;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  vColor = aColor;
  float twinkleWave = sin(uTime * 2.4 + aPhase * 6.28318);
  vTwinkle = 0.72 + 0.28 * twinkleWave;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float distAtten = clamp(650.0 / -mvPosition.z, 0.35, 3.5);
  gl_PointSize = aSize * vTwinkle * uPixelRatio * distAtten;
}
`;

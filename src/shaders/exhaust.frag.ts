import { NOISE_GLSL } from './noise.glsl';

export const EXHAUST_FRAG = `
uniform float uTime;
uniform float uThrust;

varying vec2 vUv;
varying vec3 vPos;

${NOISE_GLSL}

void main() {
  float n = fbm(vec3(vPos.x * 6.0, vPos.y * 3.5 + uTime * 22.0, vPos.z * 6.0));
  float fade = smoothstep(0.0, 0.92, vUv.y);
  float core = smoothstep(0.48, 0.05, abs(vUv.x - 0.5));

  vec3 colInner = vec3(0.65, 0.95, 1.0);
  vec3 colOuter = vec3(1.0, 0.48, 0.12);
  vec3 col = mix(colOuter, colInner, fade * 0.75 + n * 0.25);

  float machDiamonds = 0.75 + 0.25 * sin(vUv.y * 38.0 - uTime * 35.0);
  float alpha = fade * (0.65 + 0.35 * n) * machDiamonds * uThrust * core;

  gl_FragColor = vec4(col * 1.6, clamp(alpha, 0.0, 1.0));
}
`;

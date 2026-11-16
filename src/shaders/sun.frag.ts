import { NOISE_GLSL } from './noise.glsl';

export const SUN_FRAG = `
uniform float uTime;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform vec3 uColorTertiary;

varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec3 vViewDir;

${NOISE_GLSL}

void main() {
  vec3 p = normalize(vLocalPos) * 3.8;
  float t = uTime * 0.16;

  float gran1 = fbm(p + vec3(t, -t * 0.7, t * 0.4));
  float gran2 = ridgedFbm(p * 2.3 - vec3(t * 1.3, t * 0.8, -t));
  float cells = gran1 * 0.55 + gran2 * 0.45;

  float spotMask = smoothstep(0.54, 0.72, snoise(p * 1.15 + vec3(0.0, t * 0.25, 0.0)));

  vec3 col = mix(uColorSecondary, uColorPrimary, clamp(cells + 0.35, 0.0, 1.0));
  col = mix(col, uColorTertiary, smoothstep(0.42, 0.88, cells));
  col = mix(col, vec3(0.18, 0.04, 0.01), spotMask * 0.65);

  float ndotv = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
  float limbDark = pow(ndotv, 0.38);
  float rimFlare = pow(1.0 - ndotv, 3.2);

  vec3 finalColor = col * (0.65 + 0.55 * limbDark) + uColorTertiary * rimFlare * 0.9;
  gl_FragColor = vec4(finalColor * 1.25, 1.0);
}
`;

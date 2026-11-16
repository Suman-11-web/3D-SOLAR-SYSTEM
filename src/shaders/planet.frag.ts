import { NOISE_GLSL } from './noise.glsl';

export const PLANET_FRAG = `
uniform int uShaderType;
uniform float uTime;
uniform vec3 uSunPos;
uniform vec3 uCameraPos;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform vec3 uColorTertiary;

varying vec3 vLocalPos;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

${NOISE_GLSL}

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 L = normalize(uSunPos - vWorldPos);
  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 H = normalize(L + V);

  float ndotl = dot(N, L);
  float dayFactor = smoothstep(-0.14, 0.22, ndotl);
  float diffuse = max(ndotl, 0.0);

  vec3 p = normalize(vLocalPos);
  vec3 surfaceCol = uColorPrimary;
  float roughness = 0.85;
  vec3 nightLights = vec3(0.0);

  if (uShaderType == 1) {
    float nBase = fbm(p * 3.5);
    float craters = ridgedFbm(p * 8.5 + vec3(1.7));
    float rays = smoothstep(0.62, 0.85, craters);
    surfaceCol = mix(uColorSecondary, uColorPrimary, smoothstep(-0.35, 0.45, nBase));
    surfaceCol = mix(surfaceCol, uColorTertiary, rays * 0.55);
  }
  else if (uShaderType == 2) {
    vec3 q = vec3(p.x, p.y * 2.6, p.z) + vec3(uTime * 0.03, 0.0, 0.0);
    float warp = fbm(q * 2.2);
    float bands = fbm(q * 3.5 + vec3(warp * 1.4));
    surfaceCol = mix(uColorSecondary, uColorPrimary, smoothstep(-0.3, 0.35, bands));
    surfaceCol = mix(surfaceCol, uColorTertiary, smoothstep(0.25, 0.65, bands));
  }
  else if (uShaderType == 3) {
    float contNoise = fbm(p * 2.65 + vec3(0.4, 1.1, -0.5));
    float detail = fbm(p * 9.0);
    float elevation = contNoise + detail * 0.22;
    float isLand = smoothstep(0.03, 0.075, elevation);

    vec3 oceanCol = mix(vec3(0.03, 0.14, 0.36), uColorPrimary, smoothstep(-0.4, 0.03, elevation));
    vec3 landCol = mix(uColorSecondary, vec3(0.68, 0.58, 0.38), smoothstep(0.08, 0.42, elevation));
    landCol = mix(landCol, vec3(0.92, 0.95, 0.98), smoothstep(0.42, 0.62, elevation));

    surfaceCol = mix(oceanCol, landCol, isLand);

    float polar = smoothstep(0.68, 0.84, abs(p.y) + contNoise * 0.12);
    surfaceCol = mix(surfaceCol, vec3(0.95, 0.98, 1.0), polar);

    float clouds = fbm(p * 3.8 + vec3(uTime * 0.025, -uTime * 0.01, 0.0));
    float cloudMask = smoothstep(0.08, 0.48, clouds);
    surfaceCol = mix(surfaceCol, vec3(1.0), cloudMask * 0.78);

    roughness = mix(0.22, 0.9, max(isLand, cloudMask));

    float cityGrid = smoothstep(0.46, 0.65, snoise(p * 24.0)) * isLand * (1.0 - polar) * (1.0 - cloudMask * 0.8);
    nightLights = vec3(1.0, 0.74, 0.35) * cityGrid * smoothstep(0.08, -0.25, ndotl) * 0.95;
  }
  else if (uShaderType == 4) {
    float n1 = fbm(p * 2.8 + vec3(2.1));
    float canyon = ridgedFbm(p * 5.2);
    surfaceCol = mix(uColorSecondary, uColorPrimary, smoothstep(-0.35, 0.35, n1));
    surfaceCol = mix(surfaceCol, uColorTertiary, smoothstep(0.55, 0.85, canyon) * 0.5);
    float marsPolar = smoothstep(0.78, 0.9, abs(p.y) + n1 * 0.08);
    surfaceCol = mix(surfaceCol, vec3(0.94, 0.92, 0.9), marsPolar);
  }
  else if (uShaderType == 5) {
    float turb = fbm(p * 4.5 + vec3(uTime * 0.02, 0.0, 0.0));
    float lat = p.y * 11.5 + turb * 1.45;
    float band = sin(lat) * 0.5 + 0.5;
    float fineBand = cos(lat * 2.7 - turb * 2.0) * 0.5 + 0.5;

    surfaceCol = mix(uColorSecondary, uColorPrimary, band);
    surfaceCol = mix(surfaceCol, uColorTertiary, smoothstep(0.55, 0.92, fineBand) * 0.65);

    vec3 spotCenter = normalize(vec3(0.82, -0.36, 0.44));
    float dSpot = length((p - spotCenter) * vec3(1.0, 1.85, 1.0));
    float spotMask = smoothstep(0.28, 0.08, dSpot);
    float swirl = snoise(p * 14.0 + vec3(uTime * 0.1));
    vec3 spotCol = mix(vec3(0.78, 0.22, 0.12), vec3(0.95, 0.48, 0.28), swirl * 0.5 + 0.5);
    surfaceCol = mix(surfaceCol, spotCol, spotMask);
  }
  else if (uShaderType == 6) {
    float turb = fbm(p * 3.5);
    float lat = p.y * 14.0 + turb * 0.65;
    float band = sin(lat) * 0.5 + 0.5;
    surfaceCol = mix(uColorSecondary, uColorPrimary, band);
    surfaceCol = mix(surfaceCol, uColorTertiary, smoothstep(0.4, 0.85, cos(lat * 1.8)) * 0.45);
  }
  else if (uShaderType == 7 || uShaderType == 8) {
    float n = fbm(vec3(p.x * 2.0, p.y * 8.0, p.z * 2.0) + vec3(uTime * 0.03));
    float band = sin(p.y * 9.0 + n * 1.2) * 0.5 + 0.5;
    surfaceCol = mix(uColorSecondary, uColorPrimary, band);
    float streak = smoothstep(0.52, 0.78, snoise(vec3(p.x * 3.0 + uTime * 0.04, p.y * 18.0, p.z * 3.0)));
    surfaceCol = mix(surfaceCol, uColorTertiary, streak * 0.55);
    roughness = 0.55;
  }
  else {
    float n = fbm(p * 3.2);
    surfaceCol = mix(uColorSecondary, uColorPrimary, smoothstep(-0.3, 0.3, n));
    vec3 heartCenter = normalize(vec3(0.75, 0.1, 0.65));
    float dHeart = length(p - heartCenter);
    float heartMask = smoothstep(0.52, 0.22, dHeart + n * 0.14);
    surfaceCol = mix(surfaceCol, uColorTertiary, heartMask);
  }

  float specPower = mix(64.0, 8.0, roughness);
  float specStrength = mix(0.55, 0.04, roughness);
  float spec = pow(max(dot(N, H), 0.0), specPower) * specStrength * dayFactor;

  float terminatorGlow = smoothstep(-0.22, 0.02, ndotl) * (1.0 - smoothstep(0.02, 0.32, ndotl));
  vec3 terminatorCol = vec3(0.95, 0.42, 0.18) * terminatorGlow * 0.18;

  float ambient = 0.045;
  vec3 litColor = surfaceCol * (ambient + diffuse * 0.96) + vec3(spec) + terminatorCol + nightLights;

  gl_FragColor = vec4(litColor, 1.0);
}
`;

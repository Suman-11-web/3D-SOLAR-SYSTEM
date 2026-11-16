export const ATMOSPHERE_FRAG = `
uniform vec3 uColor;
uniform vec3 uSunPos;
uniform vec3 uCameraPos;
uniform float uIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPos;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 L = normalize(uSunPos - vWorldPos);

  float ndotv = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - ndotv, 3.0);

  float sunFacing = smoothstep(-0.35, 0.45, dot(N, L));
  float alpha = fresnel * (0.22 + 0.78 * sunFacing) * uIntensity;

  gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.88));
}
`;

export const STARFIELD_FRAG = `
varying vec3 vColor;
varying float vTwinkle;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  if (dist > 0.5) discard;

  float core = smoothstep(0.5, 0.04, dist);
  float spike = max(0.0, 1.0 - abs(uv.x * uv.y) * 95.0) * smoothstep(0.5, 0.1, dist);
  float alpha = clamp(core + spike * 0.45, 0.0, 1.0) * vTwinkle;

  gl_FragColor = vec4(vColor * (1.1 + core * 0.6), alpha);
}
`;

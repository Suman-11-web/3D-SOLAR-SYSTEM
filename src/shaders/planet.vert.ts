export const PLANET_VERT = `
varying vec3 vLocalPos;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vLocalPos = normalize(position);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

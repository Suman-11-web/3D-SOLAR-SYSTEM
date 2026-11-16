import * as THREE from 'three';

const RING_VERT = `
varying vec3 vLocalPos;
varying vec3 vWorldPos;

void main() {
  vLocalPos = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const RING_FRAG = `
uniform vec3 uColorInner;
uniform vec3 uColorOuter;
uniform vec3 uPlanetCenter;
uniform float uPlanetRadius;
uniform vec3 uSunPos;
uniform float uOpacity;

varying vec3 vLocalPos;
varying vec3 vWorldPos;

void main() {
  float r = length(vLocalPos.xy);
  float t = clamp((r - 1.35) / (2.45 - 1.35), 0.0, 1.0);

  float bands = 0.65 + 0.35 * sin(t * 95.0) * cos(t * 210.0);
  float cassiniGap = 1.0 - smoothstep(0.035, 0.0, abs(t - 0.58)) * 0.88;
  float enckeGap = 1.0 - smoothstep(0.015, 0.0, abs(t - 0.86)) * 0.75;
  float edgeFade = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.92, 1.0, t));

  vec3 col = mix(uColorInner, uColorOuter, t) * bands;

  vec3 toFrag = vWorldPos - uPlanetCenter;
  vec3 sunDir = normalize(uSunPos - uPlanetCenter);
  float proj = dot(toFrag, sunDir);
  float shadow = 1.0;
  if (proj < 0.0) {
    vec3 perp = toFrag - sunDir * proj;
    float distAxis = length(perp);
    shadow = smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.06, distAxis);
  }

  float alpha = edgeFade * cassiniGap * enckeGap * bands * uOpacity;
  gl_FragColor = vec4(col * (0.15 + 0.85 * shadow), alpha);
}
`;

export class Rings {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.RingGeometry;

  constructor(isUranus = false) {
    const innerR = isUranus ? 1.45 : 1.35;
    const outerR = isUranus ? 1.85 : 2.45;
    this.geometry = new THREE.RingGeometry(innerR, outerR, 128, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
      uniforms: {
        uColorInner: { value: new THREE.Color(isUranus ? '#5fa8bc' : '#d6b685') },
        uColorOuter: { value: new THREE.Color(isUranus ? '#89d4e8' : '#f2dec0') },
        uPlanetCenter: { value: new THREE.Vector3() },
        uPlanetRadius: { value: 1.0 },
        uSunPos: { value: new THREE.Vector3(0, 0, 0) },
        uOpacity: { value: isUranus ? 0.28 : 0.88 }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = Math.PI / 2;
  }

  public update(planetWorldPos: THREE.Vector3, planetRadius: number, sunWorldPos: THREE.Vector3): void {
    this.mesh.scale.setScalar(planetRadius);
    this.material.uniforms.uPlanetCenter.value.copy(planetWorldPos);
    this.material.uniforms.uPlanetRadius.value = planetRadius;
    this.material.uniforms.uSunPos.value.copy(sunWorldPos);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

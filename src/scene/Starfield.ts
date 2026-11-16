import * as THREE from 'three';
import { STARFIELD_VERT } from '../shaders/starfield.vert';
import { STARFIELD_FRAG } from '../shaders/starfield.frag';
import { seededRandom } from '../utils/math';

export class Starfield {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private maxCount: number;

  constructor(maxCount = 14000) {
    this.maxCount = maxCount;
    const rand = seededRandom(42069);

    const positions = new Float32Array(maxCount * 3);
    const sizes = new Float32Array(maxCount);
    const phases = new Float32Array(maxCount);
    const colors = new Float32Array(maxCount * 3);

    const palette = [
      new THREE.Color('#9bb8ff'),
      new THREE.Color('#cad8ff'),
      new THREE.Color('#fbf8ff'),
      new THREE.Color('#fff2d6'),
      new THREE.Color('#ffd09b'),
      new THREE.Color('#ffaa77')
    ];

    for (let i = 0; i < maxCount; i++) {
      const r = 550 + rand() * 1450;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);

      const flattenY = rand() < 0.38 ? 0.28 : 1.0;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * flattenY;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      sizes[i] = 0.8 + Math.pow(rand(), 3.0) * 3.8;
      phases[i] = rand();

      const col = palette[Math.floor(rand() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.ShaderMaterial({
      vertexShader: STARFIELD_VERT,
      fragmentShader: STARFIELD_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public setActiveRatio(ratio: number): void {
    const count = Math.floor(this.maxCount * Math.max(0.2, Math.min(1, ratio)));
    this.geometry.setDrawRange(0, count);
  }

  public update(elapsed: number, cameraPos: THREE.Vector3): void {
    this.material.uniforms.uTime.value = elapsed;
    this.points.position.copy(cameraPos).multiplyScalar(0.88);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

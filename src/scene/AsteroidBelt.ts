import * as THREE from 'three';
import { seededRandom, TWO_PI } from '../utils/math';

interface AsteroidDatum {
  visualRadius: number;
  trueRadius: number;
  angle: number;
  speed: number;
  yOffset: number;
  scale: THREE.Vector3;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
}

export class AsteroidBelt {
  public mesh: THREE.InstancedMesh;
  private geometry: THREE.IcosahedronGeometry;
  private material: THREE.MeshStandardMaterial;
  private asteroids: AsteroidDatum[] = [];
  private maxCount: number;
  private activeCount: number;
  private dummy = new THREE.Object3D();

  constructor(maxCount = 4000) {
    this.maxCount = maxCount;
    this.activeCount = maxCount;

    this.geometry = new THREE.IcosahedronGeometry(0.18, 0);
    this.material = new THREE.MeshStandardMaterial({
      color: '#7a746e',
      roughness: 0.9,
      metalness: 0.15,
      flatShading: true
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, maxCount);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const rand = seededRandom(1337);
    const color = new THREE.Color();

    for (let i = 0; i < maxCount; i++) {
      const t = rand();
      const visualRadius = 66 + t * 11;
      const trueRadius = 112 + t * 28;
      const angle = rand() * TWO_PI;
      const speed = 0.0012 + (1 - t) * 0.0009;
      const yOffset = (rand() - 0.5) * 3.8;

      const baseScale = 0.35 + Math.pow(rand(), 2.4) * 1.65;
      const scale = new THREE.Vector3(
        baseScale * (0.7 + rand() * 0.6),
        baseScale * (0.7 + rand() * 0.6),
        baseScale * (0.7 + rand() * 0.6)
      );

      const rotAxis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      const rotSpeed = (rand() - 0.5) * 2.5;

      this.asteroids.push({
        visualRadius,
        trueRadius,
        angle,
        speed,
        yOffset,
        scale,
        rotAxis,
        rotSpeed
      });

      const shade = 0.42 + rand() * 0.35;
      color.setRGB(shade, shade * 0.95, shade * 0.9);
      this.mesh.setColorAt(i, color);
    }

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public setVisibleCount(count: number): void {
    this.activeCount = Math.min(this.maxCount, Math.max(200, count));
    this.mesh.count = this.activeCount;
  }

  public update(elapsed: number, simDays: number, scaleFactor: number): void {
    for (let i = 0; i < this.activeCount; i++) {
      const a = this.asteroids[i];
      const r = THREE.MathUtils.lerp(a.visualRadius, a.trueRadius, scaleFactor);
      const theta = a.angle + simDays * a.speed;

      this.dummy.position.set(
        Math.cos(theta) * r,
        a.yOffset,
        Math.sin(theta) * r
      );
      this.dummy.rotation.set(
        elapsed * a.rotSpeed * a.rotAxis.x,
        elapsed * a.rotSpeed * a.rotAxis.y,
        elapsed * a.rotSpeed * a.rotAxis.z
      );
      this.dummy.scale.copy(a.scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

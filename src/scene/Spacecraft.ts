import * as THREE from 'three';
import { EXHAUST_VERT } from '../shaders/exhaust.vert';
import { EXHAUST_FRAG } from '../shaders/exhaust.frag';
import { scratchVec3C, scratchVec3D } from '../utils/math';

export class Spacecraft {
  public group = new THREE.Group();
  public shipMeshGroup = new THREE.Group();
  public trajectoryLine: THREE.Line;

  private exhaustMesh: THREE.Mesh;
  private exhaustMat: THREE.ShaderMaterial;
  private plumePoints: THREE.Points;
  private plumeGeo: THREE.BufferGeometry;
  private plumePositions: Float32Array;
  private plumeVelocities: Float32Array;
  private plumeAges: Float32Array;
  private plumeCount = 140;

  private trajectoryGeo: THREE.BufferGeometry;
  private trajectoryMat: THREE.LineDashedMaterial;
  private curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3()
  );

  private active = false;
  private thrustLevel = 0;

  constructor() {
    this.group.visible = false;
    this.group.add(this.shipMeshGroup);

    const hullMat = new THREE.MeshStandardMaterial({
      color: '#e8eef7',
      metalness: 0.65,
      roughness: 0.28
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: '#ff9e2c',
      metalness: 0.4,
      roughness: 0.4
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: '#1e2636',
      metalness: 0.8,
      roughness: 0.35
    });

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 16), hullMat);
    this.shipMeshGroup.add(core);

    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.12, 16), accentMat);
    ring.position.y = 0.22;
    this.shipMeshGroup.add(ring);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 16), hullMat);
    nose.position.y = 0.675;
    this.shipMeshGroup.add(nose);

    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 16, 1, true), darkMat);
    bell.position.y = -0.52;
    this.shipMeshGroup.add(bell);

    const exhaustGeo = new THREE.ConeGeometry(0.22, 1.35, 24, 1, true);
    exhaustGeo.translate(0, -0.675, 0);
    this.exhaustMat = new THREE.ShaderMaterial({
      vertexShader: EXHAUST_VERT,
      fragmentShader: EXHAUST_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uThrust: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.exhaustMesh = new THREE.Mesh(exhaustGeo, this.exhaustMat);
    this.exhaustMesh.position.y = -0.55;
    this.shipMeshGroup.add(this.exhaustMesh);

    this.plumePositions = new Float32Array(this.plumeCount * 3);
    this.plumeVelocities = new Float32Array(this.plumeCount * 3);
    this.plumeAges = new Float32Array(this.plumeCount);
    for (let i = 0; i < this.plumeCount; i++) {
      this.plumeAges[i] = Math.random();
    }
    this.plumeGeo = new THREE.BufferGeometry();
    this.plumeGeo.setAttribute('position', new THREE.BufferAttribute(this.plumePositions, 3));
    const plumeMat = new THREE.PointsMaterial({
      color: '#ffaa44',
      size: 0.22,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.plumePoints = new THREE.Points(this.plumeGeo, plumeMat);
    this.shipMeshGroup.add(this.plumePoints);

    const arcPts = new Array(80).fill(0).map(() => new THREE.Vector3());
    this.trajectoryGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
    this.trajectoryMat = new THREE.LineDashedMaterial({
      color: '#ff9e2c',
      dashSize: 1.5,
      gapSize: 0.8,
      transparent: true,
      opacity: 0.85
    });
    this.trajectoryLine = new THREE.Line(this.trajectoryGeo, this.trajectoryMat);
    this.group.add(this.trajectoryLine);
  }

  public setMissionVisible(visible: boolean): void {
    this.active = visible;
    this.group.visible = visible;
  }

  public updateTransferTrajectory(
    origin: THREE.Vector3,
    destination: THREE.Vector3,
    progress: number,
    thrust: number
  ): void {
    this.thrustLevel = thrust;
    this.exhaustMat.uniforms.uThrust.value = thrust;

    scratchVec3C.addVectors(origin, destination).multiplyScalar(0.5);
    const dist = origin.distanceTo(destination);
    const perp = scratchVec3D
      .subVectors(destination, origin)
      .cross(new THREE.Vector3(0, 1, 0))
      .normalize();
    scratchVec3C.addScaledVector(perp, dist * 0.28);
    scratchVec3C.y += Math.min(dist * 0.12, 12);

    this.curve.v0.copy(origin);
    this.curve.v1.copy(scratchVec3C);
    this.curve.v2.copy(destination);

    const pts = this.curve.getPoints(79);
    this.trajectoryGeo.setFromPoints(pts);
    this.trajectoryLine.computeLineDistances();

    const clampedT = Math.max(0, Math.min(1, progress));
    const pos = this.curve.getPoint(clampedT);
    const tangent = this.curve.getTangent(clampedT).normalize();

    this.shipMeshGroup.position.copy(pos);
    const up = new THREE.Vector3(0, 1, 0);
    this.shipMeshGroup.quaternion.setFromUnitVectors(up, tangent);
  }

  public update(dt: number, elapsed: number): void {
    if (!this.active) return;
    this.exhaustMat.uniforms.uTime.value = elapsed;

    this.plumePoints.visible = this.thrustLevel > 0.05;
    if (this.thrustLevel > 0.05) {
      for (let i = 0; i < this.plumeCount; i++) {
        this.plumeAges[i] += dt * (1.8 + this.thrustLevel * 2.5);
        if (this.plumeAges[i] >= 1.0) {
          this.plumeAges[i] = 0;
          this.plumePositions[i * 3] = (Math.random() - 0.5) * 0.12;
          this.plumePositions[i * 3 + 1] = -0.6;
          this.plumePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
          this.plumeVelocities[i * 3] = (Math.random() - 0.5) * 0.8;
          this.plumeVelocities[i * 3 + 1] = -(2.5 + Math.random() * 2.5) * this.thrustLevel;
          this.plumeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        } else {
          this.plumePositions[i * 3] += this.plumeVelocities[i * 3] * dt;
          this.plumePositions[i * 3 + 1] += this.plumeVelocities[i * 3 + 1] * dt;
          this.plumePositions[i * 3 + 2] += this.plumeVelocities[i * 3 + 2] * dt;
        }
      }
      this.plumeGeo.attributes.position.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.exhaustMesh.geometry.dispose();
    this.exhaustMat.dispose();
    this.plumeGeo.dispose();
    (this.plumePoints.material as THREE.Material).dispose();
    this.trajectoryGeo.dispose();
    this.trajectoryMat.dispose();
  }
}

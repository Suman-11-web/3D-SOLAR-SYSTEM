import * as THREE from 'three';
import type { BodyData } from '../data/bodies';
import { PLANET_VERT } from '../shaders/planet.vert';
import { PLANET_FRAG } from '../shaders/planet.frag';
import { DEG2RAD, TWO_PI } from '../utils/math';

export class Moon {
  public pivotGroup = new THREE.Group();
  public mesh: THREE.Mesh;
  public orbitLine: THREE.LineLoop;
  private surfaceMat: THREE.ShaderMaterial;
  private orbitMat: THREE.LineBasicMaterial;

  constructor(
    public data: BodyData,
    parentGroup: THREE.Group
  ) {
    this.pivotGroup.rotation.z = data.orbitalInclinationDeg * DEG2RAD;
    parentGroup.add(this.pivotGroup);

    const geo = new THREE.SphereGeometry(1, 32, 32);
    this.surfaceMat = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      uniforms: {
        uShaderType: { value: data.shaderType },
        uTime: { value: 0 },
        uSunPos: { value: new THREE.Vector3(0, 0, 0) },
        uCameraPos: { value: new THREE.Vector3(0, 0, 100) },
        uColorPrimary: { value: new THREE.Color(data.primaryColor) },
        uColorSecondary: { value: new THREE.Color(data.secondaryColor) },
        uColorTertiary: { value: new THREE.Color(data.tertiaryColor) }
      }
    });

    this.mesh = new THREE.Mesh(geo, this.surfaceMat);
    this.mesh.userData = { bodyData: data };
    this.pivotGroup.add(this.mesh);

    const pts: THREE.Vector3[] = [];
    const segs = 64;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * TWO_PI;
      pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
    this.orbitMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#6c7d99'),
      transparent: true,
      opacity: 0.32
    });
    this.orbitLine = new THREE.LineLoop(orbitGeo, this.orbitMat);
    this.pivotGroup.add(this.orbitLine);
  }

  public setOrbitVisible(visible: boolean): void {
    this.orbitLine.visible = visible;
  }

  public update(
    elapsed: number,
    simDays: number,
    scaleFactor: number,
    sunWorldPos: THREE.Vector3
  ): void {
    const orbitR = THREE.MathUtils.lerp(
      this.data.visualOrbitRadius,
      this.data.trueOrbitRadius,
      scaleFactor
    );
    const radius = THREE.MathUtils.lerp(
      this.data.visualRadius,
      this.data.trueScaleRadius,
      scaleFactor
    );

    const angle = this.data.initialPhaseRad + (simDays / this.data.orbitalPeriodDays) * TWO_PI;
    this.mesh.position.set(Math.cos(angle) * orbitR, 0, Math.sin(angle) * orbitR);
    this.mesh.scale.setScalar(radius);
    this.mesh.rotation.y = -angle;

    this.orbitLine.scale.setScalar(orbitR);

    this.surfaceMat.uniforms.uTime.value = elapsed;
    this.surfaceMat.uniforms.uSunPos.value.copy(sunWorldPos);
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.surfaceMat.dispose();
    this.orbitLine.geometry.dispose();
    this.orbitMat.dispose();
  }
}

import * as THREE from 'three';
import type { BodyData } from '../data/bodies';
import { PLANET_VERT } from '../shaders/planet.vert';
import { PLANET_FRAG } from '../shaders/planet.frag';
import { ATMOSPHERE_VERT } from '../shaders/atmosphere.vert';
import { ATMOSPHERE_FRAG } from '../shaders/atmosphere.frag';
import { Rings } from './Rings';
import { DEG2RAD, TWO_PI, scratchVec3B } from '../utils/math';

export class Planet {
  public rootGroup = new THREE.Group();
  public bodyGroup = new THREE.Group();
  public tiltGroup = new THREE.Group();
  public mesh: THREE.Mesh;
  public orbitLine: THREE.LineLoop;

  private atmosphereMesh?: THREE.Mesh;
  private rings?: Rings;
  private surfaceMat: THREE.ShaderMaterial;
  private atmosphereMat?: THREE.ShaderMaterial;
  private orbitMat: THREE.LineBasicMaterial;

  constructor(
    public data: BodyData,
    segments = 64
  ) {
    this.rootGroup.rotation.z = data.orbitalInclinationDeg * DEG2RAD;
    this.rootGroup.add(this.bodyGroup);

    this.tiltGroup.rotation.z = data.axialTiltDeg * DEG2RAD;
    this.bodyGroup.add(this.tiltGroup);

    const geo = new THREE.SphereGeometry(1, segments, segments);
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
    this.tiltGroup.add(this.mesh);

    if (data.hasAtmosphere) {
      const atmoGeo = new THREE.SphereGeometry(1.045, 48, 48);
      this.atmosphereMat = new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERT,
        fragmentShader: ATMOSPHERE_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(data.atmosphereColor) },
          uSunPos: { value: new THREE.Vector3(0, 0, 0) },
          uCameraPos: { value: new THREE.Vector3(0, 0, 100) },
          uIntensity: { value: data.id === 'earth' || data.id === 'venus' ? 1.15 : 0.78 }
        },
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      this.atmosphereMesh = new THREE.Mesh(atmoGeo, this.atmosphereMat);
      this.tiltGroup.add(this.atmosphereMesh);
    }

    if (data.hasRings) {
      this.rings = new Rings(data.id === 'uranus');
      this.tiltGroup.add(this.rings.mesh);
    }

    const orbitPts: THREE.Vector3[] = [];
    const orbitSegs = 180;
    for (let i = 0; i < orbitSegs; i++) {
      const a = (i / orbitSegs) * TWO_PI;
      orbitPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    this.orbitMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(data.primaryColor),
      transparent: true,
      opacity: 0.22
    });
    this.orbitLine = new THREE.LineLoop(orbitGeo, this.orbitMat);
    this.orbitLine.rotation.z = data.orbitalInclinationDeg * DEG2RAD;
  }

  public setOrbitVisible(visible: boolean): void {
    this.orbitLine.visible = visible;
  }

  public setOrbitHighlight(isFocused: boolean, isHovered: boolean): void {
    if (isFocused) {
      this.orbitMat.opacity = 0.78;
      this.orbitMat.color.set('#2ce6ff');
    } else if (isHovered) {
      this.orbitMat.opacity = 0.55;
      this.orbitMat.color.set('#ff9e2c');
    } else {
      this.orbitMat.opacity = 0.22;
      this.orbitMat.color.set(this.data.primaryColor);
    }
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

    const orbitAngle =
      this.data.initialPhaseRad + (simDays / this.data.orbitalPeriodDays) * TWO_PI;

    this.bodyGroup.position.set(
      Math.cos(orbitAngle) * orbitR,
      0,
      Math.sin(orbitAngle) * orbitR
    );

    this.orbitLine.scale.setScalar(orbitR);

    this.mesh.scale.setScalar(radius);
    if (this.atmosphereMesh) {
      this.atmosphereMesh.scale.setScalar(radius);
    }

    const rotDays = this.data.rotationPeriodHours / 24;
    this.mesh.rotation.y = (simDays / rotDays) * TWO_PI;

    this.surfaceMat.uniforms.uTime.value = elapsed;
    this.surfaceMat.uniforms.uSunPos.value.copy(sunWorldPos);

    if (this.rings) {
      this.mesh.getWorldPosition(scratchVec3B);
      this.rings.update(scratchVec3B, radius, sunWorldPos);
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.surfaceMat.dispose();
    if (this.atmosphereMesh && this.atmosphereMat) {
      this.atmosphereMesh.geometry.dispose();
      this.atmosphereMat.dispose();
    }
    if (this.rings) {
      this.rings.dispose();
    }
    this.orbitLine.geometry.dispose();
    this.orbitMat.dispose();
  }
}

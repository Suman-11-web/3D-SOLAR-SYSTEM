import * as THREE from 'three';
import type { BodyData } from '../data/bodies';
import { SUN_VERT } from '../shaders/sun.vert';
import { SUN_FRAG } from '../shaders/sun.frag';
import { ATMOSPHERE_VERT } from '../shaders/atmosphere.vert';
import { ATMOSPHERE_FRAG } from '../shaders/atmosphere.frag';
import { DEG2RAD, TWO_PI } from '../utils/math';

export class Sun {
  public group = new THREE.Group();
  public mesh: THREE.Mesh;
  private coronaMesh: THREE.Mesh;
  private pointLight: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;
  private surfaceMat: THREE.ShaderMaterial;
  private coronaMat: THREE.ShaderMaterial;
  private flareSprites: THREE.Sprite[] = [];
  private flareTexture: THREE.CanvasTexture;

  constructor(
    public data: BodyData,
    segments = 64
  ) {
    const geo = new THREE.SphereGeometry(1, segments, segments);
    this.surfaceMat = new THREE.ShaderMaterial({
      vertexShader: SUN_VERT,
      fragmentShader: SUN_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColorPrimary: { value: new THREE.Color(data.primaryColor) },
        uColorSecondary: { value: new THREE.Color(data.secondaryColor) },
        uColorTertiary: { value: new THREE.Color(data.tertiaryColor) }
      }
    });

    this.mesh = new THREE.Mesh(geo, this.surfaceMat);
    this.mesh.rotation.z = data.axialTiltDeg * DEG2RAD;
    this.mesh.userData = { bodyData: data };
    this.group.add(this.mesh);

    const coronaGeo = new THREE.SphereGeometry(1.22, 48, 48);
    this.coronaMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_FRAG,
      uniforms: {
        uColor: { value: new THREE.Color('#ff9a2e') },
        uSunPos: { value: new THREE.Vector3(0, 0, 0) },
        uCameraPos: { value: new THREE.Vector3(0, 0, 100) },
        uIntensity: { value: 1.55 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.coronaMesh = new THREE.Mesh(coronaGeo, this.coronaMat);
    this.group.add(this.coronaMesh);

    this.flareTexture = this.createProceduralFlareTexture();
    const flareScales = [5.5, 9.2, 2.8];
    const flareColors = ['#ffcc66', '#ff7711', '#ffffff'];
    const flareOpacities = [0.65, 0.32, 0.45];

    for (let i = 0; i < flareScales.length; i++) {
      const spriteMat = new THREE.SpriteMaterial({
        map: this.flareTexture,
        color: new THREE.Color(flareColors[i]),
        transparent: true,
        opacity: flareOpacities[i],
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.userData = { baseScale: flareScales[i] };
      this.flareSprites.push(sprite);
      this.group.add(sprite);
    }

    this.pointLight = new THREE.PointLight('#fff6e5', 2.6, 0, 0);
    this.ambientLight = new THREE.AmbientLight('#1a243b', 0.35);
    this.group.add(this.pointLight);
    this.group.add(this.ambientLight);
  }

  private createProceduralFlareTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const cx = 128;
    const cy = 128;

    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 126);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(255, 210, 120, 0.8)');
    grad.addColorStop(0.48, 'rgba(255, 130, 30, 0.25)');
    grad.addColorStop(1.0, 'rgba(255, 80, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(255, 240, 200, 0.32)';
    ctx.lineWidth = 2;
    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(angle) * 118, cy - Math.sin(angle) * 118);
      ctx.lineTo(cx + Math.cos(angle) * 118, cy + Math.sin(angle) * 118);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  public update(
    elapsed: number,
    simDays: number,
    scaleFactor: number,
    camera: THREE.Camera
  ): void {
    this.surfaceMat.uniforms.uTime.value = elapsed;
    this.coronaMat.uniforms.uCameraPos.value.copy(camera.position);

    const radius = THREE.MathUtils.lerp(
      this.data.visualRadius,
      this.data.trueScaleRadius,
      scaleFactor
    );
    this.mesh.scale.setScalar(radius);
    this.coronaMesh.scale.setScalar(radius);

    const rotDays = this.data.rotationPeriodHours / 24;
    this.mesh.rotation.y = (simDays / rotDays) * TWO_PI;

    const pulse = 1 + Math.sin(elapsed * 2.1) * 0.03;
    for (const sprite of this.flareSprites) {
      const base = (sprite.userData as { baseScale: number }).baseScale;
      sprite.scale.setScalar(radius * base * pulse);
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.surfaceMat.dispose();
    this.coronaMesh.geometry.dispose();
    this.coronaMat.dispose();
    this.flareTexture.dispose();
    this.flareSprites.forEach((s) => s.material.dispose());
  }
}

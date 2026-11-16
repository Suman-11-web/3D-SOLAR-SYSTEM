import * as THREE from 'three';
import gsap from 'gsap';
import { clamp, damp, scratchVec3A } from '../utils/math';
import { isReducedMotion } from '../ui/animation/reducedMotion';

export class CameraRig {
  public lookAtTarget = new THREE.Vector3(0, 0, 0);
  private desiredLookAt = new THREE.Vector3(0, 0, 0);
  private trackedObject: THREE.Object3D | null = null;

  public spherical = new THREE.Spherical(135, 1.12, 0.45);
  private targetSpherical = new THREE.Spherical(135, 1.12, 0.45);

  private minDistance = 1.8;
  private maxDistance = 680;

  private shakeIntensity = 0;
  private shakeOffset = new THREE.Vector3();
  private flightTween: gsap.core.Tween | null = null;

  constructor(public camera: THREE.PerspectiveCamera) {
    this.applyCameraTransform();
  }

  public rotate(deltaAzimuth: number, deltaPolar: number): void {
    this.targetSpherical.theta += deltaAzimuth;
    this.targetSpherical.phi = clamp(this.targetSpherical.phi + deltaPolar, 0.12, Math.PI - 0.12);
  }

  public zoom(delta: number): void {
    const scale = 1 + delta * 0.012;
    this.targetSpherical.radius = clamp(
      this.targetSpherical.radius * scale,
      this.minDistance,
      this.maxDistance
    );
  }

  public setShake(intensity: number): void {
    this.shakeIntensity = intensity;
  }

  public focusOnBody(targetObj: THREE.Object3D, bodyRadius: number, isSun = false): void {
    this.trackedObject = targetObj;
    this.minDistance = Math.max(0.6, bodyRadius * 1.65);
    const idealDist = isSun ? bodyRadius * 4.2 : Math.max(bodyRadius * 3.6, 2.2);

    if (this.flightTween) {
      this.flightTween.kill();
    }

    if (isReducedMotion()) {
      this.targetSpherical.radius = idealDist;
      this.spherical.radius = idealDist;
      return;
    }

    const startR = this.targetSpherical.radius;
    const startPhi = this.targetSpherical.phi;
    const endPhi = 1.24;
    const proxy = { t: 0 };

    this.flightTween = gsap.to(proxy, {
      t: 1,
      duration: 1.45,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.targetSpherical.radius = THREE.MathUtils.lerp(startR, idealDist, proxy.t);
        this.targetSpherical.phi = THREE.MathUtils.lerp(startPhi, endPhi, proxy.t);
      }
    });
  }

  public focusOverview(): void {
    this.trackedObject = null;
    this.minDistance = 8.0;
    this.desiredLookAt.set(0, 0, 0);

    if (this.flightTween) {
      this.flightTween.kill();
    }

    gsap.to(this.targetSpherical, {
      radius: 145,
      phi: 1.05,
      duration: isReducedMotion() ? 0.05 : 1.5,
      ease: 'power3.inOut'
    });
  }

  public playIntroFlight(onComplete: () => void): gsap.core.Timeline {
    this.trackedObject = null;
    this.lookAtTarget.set(0, 0, 0);
    this.desiredLookAt.set(0, 0, 0);

    this.spherical.set(820, 1.38, -1.8);
    this.targetSpherical.copy(this.spherical);

    const tl = gsap.timeline({
      onComplete
    });

    if (isReducedMotion()) {
      this.spherical.set(135, 1.12, 0.45);
      this.targetSpherical.copy(this.spherical);
      tl.to({}, { duration: 0.2 });
      return tl;
    }

    tl.to(this.targetSpherical, {
      radius: 135,
      phi: 1.12,
      theta: 0.45,
      duration: 4.4,
      ease: 'expo.inOut',
      onUpdate: () => {
        this.spherical.copy(this.targetSpherical);
      }
    });

    return tl;
  }

  public update(dt: number): void {
    if (this.trackedObject) {
      this.trackedObject.getWorldPosition(this.desiredLookAt);
    }

    this.lookAtTarget.x = damp(this.lookAtTarget.x, this.desiredLookAt.x, 8.5, dt);
    this.lookAtTarget.y = damp(this.lookAtTarget.y, this.desiredLookAt.y, 8.5, dt);
    this.lookAtTarget.z = damp(this.lookAtTarget.z, this.desiredLookAt.z, 8.5, dt);

    this.spherical.radius = damp(this.spherical.radius, this.targetSpherical.radius, 8.0, dt);
    this.spherical.phi = damp(this.spherical.phi, this.targetSpherical.phi, 8.0, dt);
    this.spherical.theta = damp(this.spherical.theta, this.targetSpherical.theta, 8.0, dt);

    if (this.shakeIntensity > 0.001) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    this.applyCameraTransform();
  }

  private applyCameraTransform(): void {
    scratchVec3A.setFromSpherical(this.spherical);
    this.camera.position.copy(this.lookAtTarget).add(scratchVec3A).add(this.shakeOffset);
    this.camera.lookAt(this.lookAtTarget);
  }
}

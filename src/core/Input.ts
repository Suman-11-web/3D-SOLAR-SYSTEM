import * as THREE from 'three';
import { bus } from './EventBus';
import type { CameraRig } from '../scene/CameraRig';
import type { Planet } from '../scene/Planet';
import type { Sun } from '../scene/Sun';
import type { Moon } from '../scene/Moon';
import type { StateMachine } from './StateMachine';

export interface PickableBody {
  mesh: THREE.Object3D;
  bodyId: string;
}

export class Input {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downPos = new THREE.Vector2();
  private lastPos = new THREE.Vector2();
  private isPointerDown = false;
  private isDragging = false;
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastPinchDist = 0;
  private hoveredBodyId: string | null = null;
  private pickables: PickableBody[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: THREE.PerspectiveCamera,
    private cameraRig: CameraRig,
    private stateMachine: StateMachine
  ) {
    this.bindEvents();
  }

  public setPickables(sun: Sun, planets: Planet[], moon: Moon): void {
    this.pickables = [
      { mesh: sun.mesh, bodyId: 'sun' },
      ...planets.map((p) => ({ mesh: p.mesh, bodyId: p.data.id })),
      { mesh: moon.mesh, bodyId: 'moon' }
    ];
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
  }

  private isInteractiveState(): boolean {
    const s = this.stateMachine.state;
    return s === 'EXPLORER' || s === 'PHOTO' || s === 'LAUNCH';
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      this.lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      return;
    }

    this.isPointerDown = true;
    this.isDragging = false;
    this.downPos.set(e.clientX, e.clientY);
    this.lastPos.set(e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger pinch zoom
    if (this.activePointers.size === 2 && this.isInteractiveState()) {
      const pts = Array.from(this.activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.lastPinchDist > 0) {
        const delta = (this.lastPinchDist - dist) * 0.25;
        this.cameraRig.zoom(delta);
      }
      this.lastPinchDist = dist;
      return;
    }

    if (this.isPointerDown && this.isInteractiveState()) {
      const dx = e.clientX - this.lastPos.x;
      const dy = e.clientY - this.lastPos.y;
      if (Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y) > 5) {
        this.isDragging = true;
      }
      this.cameraRig.rotate(-dx * 0.0055, -dy * 0.0055);
      this.lastPos.set(e.clientX, e.clientY);
      return;
    }

    // Hover raycasting in Explorer mode
    if (this.stateMachine.state === 'EXPLORER' && e.target === this.canvas) {
      this.updateRaycaster(e.clientX, e.clientY);
      const hit = this.raycastBodies();
      if (hit) {
        if (this.hoveredBodyId !== hit.bodyData.id) {
          this.hoveredBodyId = hit.bodyData.id;
          this.canvas.style.cursor = 'pointer';
        }
        bus.emit('body:hover', {
          body: hit.bodyData,
          screenPos: hit.screenPos
        });
      } else if (this.hoveredBodyId !== null) {
        this.hoveredBodyId = null;
        this.canvas.style.cursor = 'grab';
        bus.emit('body:hover', { body: null });
      }
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size < 2) {
      this.lastPinchDist = 0;
    }

    if (this.isPointerDown && !this.isDragging && e.target === this.canvas) {
      if (this.stateMachine.state === 'EXPLORER') {
        this.updateRaycaster(e.clientX, e.clientY);
        const hit = this.raycastBodies();
        if (hit) {
          bus.emit('body:select', { body: hit.bodyData });
        }
      }
    }
    this.isPointerDown = false;
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    if (!this.isInteractiveState()) return;
    e.preventDefault();
    this.cameraRig.zoom(e.deltaY * 0.06);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      bus.emit('palette:toggle', {});
      return;
    }

    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      return;
    }

    if (e.key === 'Escape') {
      if (this.stateMachine.state === 'PHOTO' || this.stateMachine.state === 'TOUR' || this.stateMachine.state === 'LAUNCH') {
        void this.stateMachine.transitionTo('EXPLORER');
      } else if (this.stateMachine.state === 'EXPLORER') {
        bus.emit('body:select', { body: null });
      }
    } else if (e.key === ' ' && this.stateMachine.state === 'PHOTO') {
      e.preventDefault();
      bus.emit('photo:capture');
    }
  };

  private updateRaycaster(clientX: number, clientY: number): void {
    this.pointer.x = (clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  private raycastBodies() {
    const meshes = this.pickables.map((p) => p.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length === 0) return null;

    const first = intersects[0].object;
    const match = this.pickables.find((p) => p.mesh === first);
    if (!match) return null;

    const worldPos = new THREE.Vector3();
    match.mesh.getWorldPosition(worldPos);
    worldPos.project(this.camera);

    const screenPos = {
      x: (worldPos.x * 0.5 + 0.5) * window.innerWidth,
      y: (-worldPos.y * 0.5 + 0.5) * window.innerHeight
    };

    const bodyData = (match.mesh.userData as { bodyData?: import('../data/bodies').BodyData }).bodyData;
    if (!bodyData) return null;

    return { bodyData, screenPos };
  }

  public dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
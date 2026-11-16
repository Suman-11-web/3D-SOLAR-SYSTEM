import { bus } from './EventBus';
import { timelineManager } from '../ui/animation/TimelineManager';

export type AppState = 'BOOT' | 'INTRO' | 'EXPLORER' | 'TOUR' | 'LAUNCH' | 'PHOTO';

export interface StateHooks {
  onEnter?: (from: AppState) => Promise<void> | void;
  onExit?: (to: AppState) => Promise<void> | void;
}

const VALID_TRANSITIONS: Record<AppState, AppState[]> = {
  BOOT: ['INTRO', 'EXPLORER'],
  INTRO: ['EXPLORER'],
  EXPLORER: ['TOUR', 'LAUNCH', 'PHOTO'],
  TOUR: ['EXPLORER', 'LAUNCH', 'PHOTO'],
  LAUNCH: ['EXPLORER', 'TOUR', 'PHOTO'],
  PHOTO: ['EXPLORER', 'TOUR', 'LAUNCH']
};

export class StateMachine {
  private current: AppState = 'BOOT';
  private hooks = new Map<AppState, StateHooks>();
  private transitioning = false;
  private queuedState: AppState | null = null;

  public get state(): AppState {
    return this.current;
  }

  public register(state: AppState, hooks: StateHooks): void {
    this.hooks.set(state, hooks);
  }

  public async transitionTo(next: AppState): Promise<boolean> {
    if (next === this.current) return false;

    const allowed = VALID_TRANSITIONS[this.current];
    if (!allowed.includes(next)) {
      return false;
    }

    if (this.transitioning) {
      this.queuedState = next;
      return false;
    }

    this.transitioning = true;
    const prev = this.current;

    // Safely interrupt conflicting UI transition timelines
    timelineManager.killChannel('state-transition');

    const prevHooks = this.hooks.get(prev);
    if (prevHooks?.onExit) {
      await prevHooks.onExit(next);
    }

    this.current = next;
    bus.emit('state:change', { from: prev, to: next });

    const nextHooks = this.hooks.get(next);
    if (nextHooks?.onEnter) {
      await nextHooks.onEnter(prev);
    }

    this.transitioning = false;

    if (this.queuedState && this.queuedState !== this.current) {
      const pending = this.queuedState;
      this.queuedState = null;
      await this.transitionTo(pending);
    }

    return true;
  }
}
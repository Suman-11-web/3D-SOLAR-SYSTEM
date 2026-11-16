export interface SpringState {
  value: number;
  velocity: number;
  target: number;
}

export function stepSpring(
  state: SpringState,
  stiffness = 180,
  damping = 18,
  dt = 0.016
): number {
  const force = -stiffness * (state.value - state.target);
  const dampForce = -damping * state.velocity;
  const accel = force + dampForce;
  state.velocity += accel * dt;
  state.value += state.velocity * dt;
  return state.value;
}

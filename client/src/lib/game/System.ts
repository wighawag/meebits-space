import type { ComponentTypes } from './components';
import type { Entity } from './Entity';
import type { World } from './World';

export interface System<T = ComponentTypes> {
  init(world: World<T>);

  update(dt: number);

  onEntityAdded(entity: Entity<T>);
  onEntityRemoved(entity: Entity<T>);

  onComponentAdded(entity: Entity<T>, component: Entity<T>);
  onComponentRemoved(entity: Entity<T>, component: Entity<T>);
}

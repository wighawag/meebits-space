import type { Scene } from 'three';
import type { CObject3D } from '../components';
import type { Entity } from '../Entity';
import type { System } from '../System';
import type { World } from '../World';

export type SupportedComponents = CObject3D;

export class ThreeSceneSystem implements System<SupportedComponents> {
  constructor(protected scene: Scene) {}

  init(world: World<SupportedComponents>) {}

  supportsEntity(entity: Entity<SupportedComponents>): boolean {
    return !!entity.object3D;
  }

  onEntityAdded(entity: Entity<SupportedComponents>) {
    if (entity.object3D) {
      this.scene.add(entity.object3D);
    }
  }

  onEntityRemoved(entity: Entity<SupportedComponents>) {
    if (entity.object3D) {
      this.scene.remove(entity.object3D);
    }
  }

  onComponentAdded(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {
    if (component.object3D) {
      this.scene.add(entity.object3D);
    }
  }

  onComponentRemoved(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {
    if (component.object3D) {
      this.scene.remove(entity.object3D);
    }
  }

  update(dt: number) {}
}

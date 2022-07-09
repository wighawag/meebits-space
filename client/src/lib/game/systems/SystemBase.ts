import type { ComponentTypes } from '../components';
import type { Entity, EntityWithComponent } from '../Entity';
import type { System } from '../System';
import type { World } from '../World';

export abstract class SystemBase<T = ComponentTypes> implements System<T> {
  protected entitiesUnderControl: EntityWithComponent<T>[] = [];
  protected world: World<T>;

  init(world: World<T>) {
    this.world = world;
  }

  abstract supportsEntity(entity: Entity<T>): boolean;

  abstract entityControlled(entity: EntityWithComponent<T>): void;
  abstract entityReleased(entity: EntityWithComponent<T>): void;

  onEntityAdded(entity: Entity<T>) {
    if (this.supportsEntity(entity)) {
      this.entitiesUnderControl.push(entity as EntityWithComponent<T>);
      this.entityControlled(entity as EntityWithComponent<T>);
    }
  }

  onEntityRemoved(entity: Entity<T>) {
    const entityIndex = this.entitiesUnderControl.indexOf(
      entity as EntityWithComponent<T>,
    );
    if (entityIndex >= 0) {
      const [entity] = this.entitiesUnderControl.splice(entityIndex, 1);
      this.entityReleased(entity);
    }
  }

  onComponentAdded(entity: Entity<T>, component: Entity<T>) {
    if (this.supportsEntity(component)) {
      if (this.entitiesUnderControl.indexOf(entity) === -1) {
        this.entitiesUnderControl.push(entity as EntityWithComponent<T>);
        this.entityControlled(entity as EntityWithComponent<T>);
      }
    }
  }

  onComponentRemoved(entity: Entity<T>, component: Entity<T>) {
    if (this.supportsEntity(component)) {
      if (!this.supportsEntity(entity)) {
        const entityIndex = this.entitiesUnderControl.indexOf(
          entity as EntityWithComponent<T>,
        );
        if (entityIndex >= 0) {
          const [entity] = this.entitiesUnderControl.splice(entityIndex, 1);
          this.entityReleased(entity);
        }
      }
    }
  }

  abstract update(dt);
}

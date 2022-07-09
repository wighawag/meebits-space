import { Clock } from 'three';
import type { Entity, RawEntity } from './Entity';
import type { System } from './System';

export class World<T> {
  protected entities: Entity<T>[] = [];
  protected entityMap: Map<number, Entity<T>> = new Map();
  protected counter = 0;
  protected clock: Clock;
  constructor(protected systems: System<T>[]) {
    this.clock = new Clock();
    for (const system of systems) {
      system.init(this);
    }
  }

  animate(dt: number = 0) {
    requestAnimationFrame(this.animate.bind(this));

    this.update(dt);
  }

  update(dt: number) {
    const delta = this.clock.getDelta();
    for (const system of this.systems) {
      system.update(delta);
    }
  }

  add(entity: RawEntity<T>): Entity<T> {
    // const entityAdded = entity as Entity;
    // if (!entity.id) {
    //   entity.id = ++this.counter;
    //   // RawEntity is now Entity
    // } else {
    //   if (this.entityMap.has(entityAdded.id)) {
    //     throw new Error(`entity ${entityAdded.id} already present`);
    //   }
    // }

    const entityAdded = this.proxyEntity(entity);

    this.entityMap.set(entityAdded.id, entityAdded);
    this.entities.push(entityAdded);
    for (const system of this.systems) {
      system.onEntityAdded(entityAdded);
    }
    return entityAdded;
  }

  remove(entity: Entity<T>) {
    if (!entity.id) {
      throw new Error(`no id on entity`);
    }
    this.entityMap.delete(entity.id);
    this.entities.splice(
      this.entities.findIndex((v) => v.id === entity.id),
      1,
    );
    for (const system of this.systems) {
      system.onEntityRemoved(entity);
    }
  }

  private proxyEntity(entity: RawEntity<T>): Entity<T> {
    if ((entity as Entity<T>).id) {
      throw new Error(`entity has an id already`);
    }
    const id = ++this.counter;
    let entityAdded: Entity<T>;
    const self = this;
    entityAdded = new Proxy(entity, {
      get(rawEntity, p) {
        if (p === 'id') {
          return id;
        } else {
          return rawEntity[p];
        }
      },
      set(rawEntity, p, value) {
        if (p === 'id') {
          return false;
        }
        if (rawEntity[p] === undefined) {
          if (value !== undefined) {
            rawEntity[p] = value;
            self.onComponentAdded(entityAdded, p as keyof T, value);
          }
        } else {
          if (value !== rawEntity[p]) {
            self.onComponentRemoved(entityAdded, p as keyof T, rawEntity[p]);
            rawEntity[p] = value;
            if (value !== undefined) {
              self.onComponentAdded(entityAdded, p as keyof T, value);
            }
          }
        }
        return true;
      },
    }) as Entity<T>;
    return entityAdded;
  }

  onComponentAdded(entity: Entity<T>, p: keyof T, value: T[keyof T]) {
    for (const system of this.systems) {
      system.onComponentAdded(entity, { [p]: value } as Entity<T>);
    }
  }

  onComponentRemoved(entity: Entity<T>, p: keyof T, value: T[keyof T]) {
    for (const system of this.systems) {
      system.onComponentRemoved(entity, { [p]: value } as Entity<T>);
    }
  }
}

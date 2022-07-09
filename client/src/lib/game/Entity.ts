import type { ComponentTypes } from './components';

type Concrete<Type> = {
  [Property in keyof Type]-?: Type[Property];
};

// --
export type RawEntity<T = ComponentTypes> = Partial<T>;
export type Entity<T = ComponentTypes> = RawEntity<T> & { readonly id: number };

// export type EntityWithComponent<T> = Entity<T> & T;
export type EntityWithComponent<T> = Entity<Concrete<T>>;
// --

// export type EntityComponents<T = ComponentTypes> = Partial<T>;
//
// export class Entity {
//   readonly components: EntityComponents = {};
//   id?: number;
//   world?: World;
//   add<T, D = Extract<ComponentTypes, T>>(component: D) {
//     for (const key of Object.keys(component)) {
//       this.components[key] = component[key];
//       if(this.world) {
//         this.world.on
//       }
//     }
//   }
// }

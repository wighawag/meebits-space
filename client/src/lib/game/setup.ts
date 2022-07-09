import { World } from './World';
import { ThreeRendererSystem } from './systems/ThreeRenderer';
import { ThreeSceneSystem } from './systems/ThreeScene';
import type { ComponentTypes } from './components';
import { ThreeLoaderSystem } from './systems/ThreeLoader';
import { createScene } from './scene';
import { Object3D } from 'three';
import { PlayerControllerSystem } from './systems/PlayerController';
import { connection } from '../../state';
import { MultiplayerSystem } from './systems/MultiplayerSystem';

export async function start() {
  const { scene, sun, ground } = createScene();

  const renderer = new ThreeRendererSystem(scene, ground);
  const world = new World<ComponentTypes>([
    renderer,
    new ThreeSceneSystem(scene),
    new ThreeLoaderSystem(),
    new PlayerControllerSystem(renderer, sun),
    new MultiplayerSystem(connection),
  ]);

  world.animate();

  (window as any).world = world;
}

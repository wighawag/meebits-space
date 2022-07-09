import { loadVRM } from '../../three/vrm';
import {
  AnimationClip,
  AnimationMixer,
  Color,
  TextureLoader,
  type BufferGeometry,
  type Material,
  type Mesh,
  type MeshLambertMaterial,
  Object3D,
  MeshStandardMaterial,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { CAnimation, CModel, CObject3D } from '../components';
import { AnimationComponent } from '../components/AnimationComponent';
import type { Entity, EntityWithComponent } from '../Entity';
import type { System } from '../System';
import type { World } from '../World';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from '../../three/mixamo';

export type SupportedComponents = CModel &
  Partial<CObject3D> &
  Partial<CAnimation>;

export class ThreeLoaderSystem implements System<SupportedComponents> {
  protected fbxLoader: FBXLoader;
  protected gltfLoader: GLTFLoader;
  protected textureLoader: TextureLoader;
  constructor() {
    this.fbxLoader = new FBXLoader();
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.register((parser) => new VRMLoaderPlugin(parser));
    this.textureLoader = new TextureLoader();
  }

  init(world: World<SupportedComponents>) {}

  async onEntityAdded(entity: Entity<SupportedComponents>) {
    if (entity.model) {
      this.handleAddition(entity);
    }
  }

  onEntityRemoved(entity: Entity<SupportedComponents>) {
    if (entity.model) {
      this.handleDeletion(entity);
    }
  }

  onComponentAdded(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {
    if (component.model) {
      this.handleAddition(entity);
    }
  }

  onComponentRemoved(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {
    if (component.model) {
      this.handleDeletion(entity);
    }
  }

  async loadFBX(model: CModel['model']): Promise<{
    group: Object3D;
    animations?: { [name: string]: AnimationClip };
  }> {
    return this.fbxLoader.loadAsync(model.source).then(async (group) => {
      let animations: { [name: string]: AnimationClip } | undefined;
      if (model.promise) {
        group.traverse((child) => {
          const childAsMesh = child as Mesh<BufferGeometry, Material>;
          if (childAsMesh.isMesh) {
            (childAsMesh.material as MeshLambertMaterial).emissive = new Color(
              0xaaaaaa,
            );
            (childAsMesh.material as MeshLambertMaterial).emissiveMap = (
              childAsMesh.material as MeshLambertMaterial
            ).map;
          }
        });
        // still loading
        if (model.texture) {
          const texture = await this.textureLoader.load(model.texture);
          // still loading
          if (model.promise) {
            group.traverse((child) => {
              const childAsMesh = child as Mesh<BufferGeometry, Material>;
              if (childAsMesh.isMesh) {
                (childAsMesh.material as MeshLambertMaterial).map = texture;
                (childAsMesh.material as MeshLambertMaterial).emissiveMap =
                  texture;
              }
            });
          }
        }
        if (group.animations[0]) {
          animations = { Idle: group.animations[0] };
        }
        if (model.extraAnimations && model.extraAnimations.length > 0) {
          const extraAnimations = await this.loadFBXAnimations(
            model.extraAnimations,
          );
          if (animations) {
            Object.assign(animations, extraAnimations);
          } else {
            animations = extraAnimations;
          }
        }
      }
      return { group, animations };
    });
  }

  async loadGLTF(model: CModel['model']): Promise<{
    group: Object3D;
    animations?: { [name: string]: AnimationClip };
  }> {
    return this.gltfLoader.loadAsync(model.source).then(async (gltf) => {
      const group = gltf.scene;
      const obj = new Object3D();
      if (model.scale) {
        group.scale.set(model.scale, model.scale, model.scale);
      }
      obj.add(group);

      let animations: { [name: string]: AnimationClip } | undefined;
      if (model.promise) {
        group.traverse((child) => {
          const childAsMesh = child as Mesh<BufferGeometry, Material>;
          if (childAsMesh.isMesh) {
            console.log(childAsMesh.material);
            (childAsMesh.material as MeshStandardMaterial).emissive = (
              childAsMesh.material as MeshStandardMaterial
            ).color;
            // (childAsMesh.material as MeshLambertMaterial).emissiveMap = (
            //   childAsMesh.material as MeshLambertMaterial
            // ).map;
          }
        });
        // still loading
        if (model.texture) {
          const texture = await this.textureLoader.load(model.texture);
          // still loading
          if (model.promise) {
            group.traverse((child) => {
              const childAsMesh = child as Mesh<BufferGeometry, Material>;
              if (childAsMesh.isMesh) {
                (childAsMesh.material as MeshLambertMaterial).map = texture;
                (childAsMesh.material as MeshLambertMaterial).emissiveMap =
                  texture;
              }
            });
          }
        }
        if (gltf.animations[0]) {
          animations = { Idle: gltf.animations[0] };
        }
        // if (model.extraAnimations && model.extraAnimations.length > 0) {
        //   const extraAnimations = await this.loadFBXAnimations(
        //     model.extraAnimations,
        //   );
        //   if (animations) {
        //     Object.assign(animations, extraAnimations);
        //   } else {
        //     animations = extraAnimations;
        //   }
        // }
      }
      return { group: obj, animations };
    });
  }

  async loadFBXAnimations(
    animationsToLoad: { name: string; url: string }[],
  ): Promise<{ [name: string]: AnimationClip }> {
    const animations: { [name: string]: AnimationClip } = {};
    for (const animToLoad of animationsToLoad) {
      const group = await this.fbxLoader.loadAsync(animToLoad.url);
      animations[animToLoad.name] = group.animations[0];
    }
    return animations;
  }

  async loadVRM(model: CModel['model']): Promise<{
    group: Object3D;
    animations?: { [name: string]: AnimationClip };
  }> {
    const vrm = await loadVRM(this.gltfLoader, model.source);
    // const obj = vrm.scene;
    const obj = new Object3D();
    vrm.scene.position.y = -0.49; // TODO config
    if (model.scale) {
      vrm.scene.scale.set(model.scale, model.scale, model.scale);
    }

    // vrm.scene.rotateY(Math.PI);
    obj.add(vrm.scene);

    // const currentMixer = new AnimationMixer(vrm.scene); // vrmのAnimationMixerを作る
    // currentMixer.timeScale = 1;
    // currentMixer.update(0);

    for (const mat of vrm.materials as any) {
      mat.emissive.x = 1;
      mat.emissive.y = 1;
      mat.emissive.z = 1;
      mat.emissiveMap = mat.map;
      mat.uniformsNeedUpdate = true;
    }

    let animations;
    if (model.extraAnimations && model.extraAnimations.length > 0) {
      const extraAnimations = await this.loadVRMFBXAnimations(
        vrm,
        model.extraAnimations,
      );
      if (animations) {
        Object.assign(animations, extraAnimations);
      } else {
        animations = extraAnimations;
      }
    }

    return {
      group: obj,
      animations,
    };
  }

  async loadVRMFBXAnimations(
    vrm: VRM,
    animationsToLoad: { name: string; url: string }[],
  ): Promise<{ [name: string]: AnimationClip }> {
    const animations: { [name: string]: AnimationClip } = {};
    for (const animToLoad of animationsToLoad) {
      const clip = await loadMixamoAnimation(
        this.fbxLoader,
        animToLoad.url,
        vrm,
      );
      animations[animToLoad.name] = clip;
    }
    return animations;
  }

  async handleAddition(entity: EntityWithComponent<SupportedComponents>) {
    let promise;
    if (entity.model.type === 'vrm') {
      promise = this.loadVRM(entity.model);
    } else if (entity.model.type === 'gltf') {
      promise = this.loadGLTF(entity.model);
    } else {
      promise = this.loadFBX(entity.model);
    }
    entity.model.promise = promise;
    const { group, animations } = await promise;
    if (entity.model.promise) {
      entity.model.promise = undefined; // clear
      entity.object3D = group;
      if (animations) {
        entity.animation = new AnimationComponent(
          group,
          animations,
          animations['Idle'] ? 'Idle' : Object.keys(animations)[0],
        );
      }
    } else {
      // skip as it was removed
    }
  }

  async handleDeletion(entity: EntityWithComponent<SupportedComponents>) {
    entity.model.promise = undefined; // clear
  }

  update(dt: number) {}
}

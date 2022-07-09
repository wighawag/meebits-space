import { Color, CubeCamera, Mesh, Vector3, type Scene } from 'three';
import type { Entity, EntityWithComponent } from '../Entity';
import { WebGLRenderer, PerspectiveCamera, Camera, Object3D } from 'three';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import type { CAnimation, CObject3D, CPosition } from '../components';
import type { System } from '../System';
import { removeIfPresent } from '../../utils/array';
import type { World } from '../World';
import MeshReflectorMaterial from '../../three/MeshReflectorMaterial';

export type SupportedComponents = CAnimation & (CObject3D & CPosition);

export class ThreeRendererSystem implements System<SupportedComponents> {
  public renderer: WebGLRenderer;

  protected animatables: CAnimation[] = [];
  protected positionables: (CPosition & CObject3D)[] = [];

  public camera: {
    origin?: Camera;
    target?: Object3D;
    object: PerspectiveCamera;
  };

  constructor(protected scene: Scene, protected ground?: Mesh) {
    this.renderer = new WebGLRenderer({
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    const container = document.querySelector('#scene-container');
    container.appendChild(this.renderer.domElement);

    const cameraObject = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      20000,
    );
    this.camera = {
      origin: undefined,
      target: undefined,
      object: cameraObject,
    };

    ground.material = new MeshReflectorMaterial(
      this.renderer,
      this.camera.object,
      scene,
      ground,
      {
        mirror: 0.2,
        resolution: 512,
        mixStrength: 5,
        blur: [1, 1],
        // planeNormal: new Vector3(0, 1, 0),
        // reflectorOffset: 10
      },
    );

    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    if (WebGL.isWebGLAvailable()) {
    } else {
      const warning = WebGL.getWebGLErrorMessage();
      document.body.appendChild(warning);
      this.renderer.domElement.style.display = 'none';
    }
  }

  init(world: World<SupportedComponents>) {}

  private onWindowResize() {
    this.camera.object.aspect = window.innerWidth / window.innerHeight;
    this.camera.object.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.render();
  }

  private animate(delta: number) {
    for (const entity of this.animatables) {
      entity.animation.update(delta);
    }

    for (const entity of this.positionables) {
      entity.object3D.position.lerp(entity.position.position, 0.5);
      entity.object3D.quaternion.slerp(entity.position.quaternion, 0.5);
      // entity.object3D.lookAt(pos);
      // TODO lerp
    }

    if (this.camera.origin) {
      this.camera.object.position.lerp(
        this.camera.origin.getWorldPosition(new Vector3()),
        0.05,
      );
    }

    if (this.camera.target) {
      // this.camera.object.scale = this.camera.origin.scale;
      this.camera.object.lookAt(this.camera.target.position);
    }

    this.render();
  }

  private render() {
    (this.ground.material as any).update();
    this.renderer.render(this.scene, this.camera.object);
  }

  async onEntityAdded(entity: Entity<SupportedComponents>) {
    this.handleAddition(entity, entity);
  }

  onEntityRemoved(entity: Entity<SupportedComponents>) {
    this.handleDeletion(entity, entity);
  }

  onComponentAdded(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {
    this.handleAddition(entity, component);
  }

  onComponentRemoved(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {
    if (component.animation || component.object3D || component.position) {
      this.handleDeletion(entity, component);
    }
  }

  async handleAddition(
    entity: EntityWithComponent<SupportedComponents>,
    component: EntityWithComponent<SupportedComponents>,
  ) {
    if (component.animation) {
      this.animatables.push(entity as CAnimation);
    }
    if (component.object3D || component.position) {
      if (entity.object3D && entity.position) {
        this.positionables.push(entity as CObject3D & CPosition);
      }
    }
  }

  async handleDeletion(
    entity: EntityWithComponent<SupportedComponents>,
    component: EntityWithComponent<SupportedComponents>,
  ) {
    if (!entity.animation) {
      removeIfPresent(this.animatables, entity);
    }
    if (!(entity.object3D && entity.position)) {
      removeIfPresent(this.positionables, entity);
    }
  }

  update(delta: number) {
    this.animate(delta);
  }
}

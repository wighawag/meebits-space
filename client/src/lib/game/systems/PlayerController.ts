import type { Entity, EntityWithComponent } from '../Entity';
import type { CAnimation, CObject3D, CPlayer, CPosition } from '../components';
import type { System } from '../System';
import { JoyStick } from '../../utils/toon3d';
import type { ThreeRendererSystem } from './ThreeRenderer';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
import type { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import type { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Camera, Euler, Object3D, Vector3, type DirectionalLight } from 'three';
import type { World } from '../World';

export type SupportedComponents = CPlayer &
  CPosition &
  Partial<CAnimation> &
  CObject3D;

export class PlayerControllerSystem implements System<SupportedComponents> {
  protected controlled: SupportedComponents | undefined;

  protected joystick: JoyStick;
  protected move: { forward: number; turn: number } = { forward: 0, turn: 0 };
  protected controls:
    | OrbitControls
    | FirstPersonControls
    | FlyControls
    | PointerLockControls;
  protected requireCameraSync: boolean;

  constructor(
    protected renderer: ThreeRendererSystem,
    protected sun: DirectionalLight,
  ) {
    this.joystick = new JoyStick({
      onMove: this.onMove,
      onDouble: this.onDouble.bind(this),
      game: this,
    });

    // TODO choice ?
    // this.controls = new OrbitControls(
    //   this.renderer.camera.object,
    //   this.renderer.renderer.domElement,
    // );
    // this.controls = new FirstPersonControls(
    //   this.renderer.camera.object,
    //   this.renderer.renderer.domElement,
    // );

    // this.controls.movementSpeed = 200;
    // this.controls.rollSpeed = 1;

    // const controls = new PointerLockControls(
    //   this.renderer.camera.object,
    //   document.body,
    // );
    // controls.connect();
    // document.body.ondblclick = () => {
    //   if (!controls.isLocked) {
    //     controls.lock();
    //   }
    // };

    const controls = new FlyControls(
      this.renderer.camera.object,
      document.body,
      // this.renderer.renderer.domElement,
    );
    controls.movementSpeed = 8;
    controls.rollSpeed = Math.PI / 12;
    controls.autoForward = false;
    controls.dragToLook = true;
    this.renderer.camera.object.position.set(10, 20, -50);
    this.renderer.camera.object.lookAt(0, 4, 0);

    this.controls = controls;

    this.requireCameraSync = !(this.controls as any).addEventListener;
    if (!this.requireCameraSync) {
      setTimeout(() => {
        (this.controls as OrbitControls).addEventListener('change', (e) => {
          // console.log(e);
          // OrbitControls
          this.syncCamera();
        });
      }, 1000);
    }
  }

  syncCamera() {
    if (this.renderer.camera.origin && this.renderer.camera.target) {
      const local = !!this.renderer.camera.origin.parent
        ? this.renderer.camera.origin.parent.worldToLocal(
            this.renderer.camera.object.position,
          )
        : this.renderer.camera.object.position;

      // const localR = !!this.renderer.camera.origin.parent
      // ? this.renderer.camera.origin.parent.rotateOnWorldAxis()
      //     this.renderer.camera.object.position,
      //   )
      // : this.renderer.camera.object.position;

      this.renderer.camera.origin.position.set(local.x, local.y, local.z);

      // this.renderer.camera.object.updateMatrix();
      this.renderer.camera.origin.quaternion.copy(
        this.renderer.camera.object.quaternion,
      );
    }
  }

  init(world: World<SupportedComponents>) {}

  onDouble() {
    if (this.controlled) {
      if (this.controlled.animation.current == 'Gangnam Style') {
        this.controlled.animation.current = 'Idle';
      } else {
        this.controlled.animation.current = 'Gangnam Style';
      }
    }
  }

  onMove(forward: number, turn: number): void {
    if (!this.controlled) {
      return;
    }
    turn = -turn;

    const animation = this.controlled.animation;
    if (animation) {
      const current = this.controlled.animation.current;
      if (forward > 0.3) {
        if (current !== 'Walking' && current !== 'Running') {
          animation.current = 'Walking';
        }
      } else if (forward < -0.3) {
        if (current !== 'Walking Backward') {
          animation.current = 'Walking Backward';
        }
      } else {
        forward = 0;
        if (Math.abs(turn) > 0.1) {
          if (current != 'Turning') {
            animation.current = 'Turning';
          }
        } else {
          animation.current = 'Idle';
        }
      }
    } else if (forward <= 0.3 && forward >= -0.3) {
      forward = 0;
    }

    this.move.forward = forward;
    this.move.turn = turn;
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
    console.log(`component`, component);
    this.handleAddition(entity, component);
  }

  onComponentRemoved(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {
    this.handleDeletion(entity, component);
  }

  async handleAddition(
    entity: EntityWithComponent<SupportedComponents>,
    component: EntityWithComponent<SupportedComponents>,
  ) {
    if (entity.player && entity.position && entity.object3D) {
      console.log(`player found!`, entity);
      this.controlled = entity as SupportedComponents;
    }
  }

  async handleDeletion(
    entity: EntityWithComponent<SupportedComponents>,
    component: EntityWithComponent<SupportedComponents>,
  ) {
    if (this.controlled && this.controlled === entity) {
      this.controlled = undefined;
    }
  }
  update(dt: number) {
    if (this.controlled) {
      if (!this.renderer.camera.origin) {
        this.renderer.camera.origin = new Camera();
        this.renderer.camera.origin.position.set(0, 5, -8.5);
      }
      if (!this.renderer.camera.target) {
        this.renderer.camera.target = new Object3D();
        this.renderer.camera.target.position.set(0, 2, 0);
      }

      this.joystick.show();
      (this.controls as OrbitControls).enabled = false;
      if (this.move.forward > 0) {
        const speed = 1.5; // TODO (this.action=='Running') ? 5 : 1.5;
        this.controlled.position = this.controlled.position.translateZ(
          dt * speed,
        );
      } else if (this.move.forward < 0) {
        this.controlled.position = this.controlled.position.translateZ(
          -dt * 0.3,
        );
      }

      if (this.move.turn) {
        this.controlled.position.rotateY(this.move.turn * dt);
      }

      // if (this.controlled.token?.id === '4564') {
      //   this.controlled.position.position.set(0, 0, 300);
      //   this.controlled.position.rotation.set(0, 0, 0);
      //   // this.controlled.position.rotation.set(0, 1.56 / 2 + 1.56, 0);
      // } else {
      //   this.controlled.position.position.set(0, 0, 0);
      //   this.controlled.position.rotation.set(0, 0, 0);
      // }

      // this.sun.position.x = this.controlled.object3D.position.x;
      // this.sun.position.y = this.controlled.object3D.position.y + 200;
      // this.sun.position.z = this.controlled.object3D.position.z + 100;
      // this.sun.target = this.controlled.object3D;

      const playerPos = this.controlled.position.position;
      playerPos.y = 0;
      if (playerPos.x > 21) {
        playerPos.x = 21;
      }
      if (playerPos.x < -21) {
        playerPos.x = -21;
      }
      if (playerPos.z > 21) {
        playerPos.z = 21;
      }
      if (playerPos.z < -21) {
        playerPos.z = -21;
      }

      const pos = this.controlled.position.position.clone();
      pos.y += 2;
      this.renderer.camera.target.position.set(pos.x, pos.y, pos.z);

      const back = this.controlled.object3D.localToWorld(
        new Vector3(0, 2.5, -2),
      );
      this.renderer.camera.origin.position.copy(back);

      // this.renderer.camera.origin.position.set(pos.x, pos.y, pos.z);
      // this.renderer.camera.origin.position.y = pos.y + 200;

      // this.sun.position.copy(pos);
      // this.sun.position.y += 10;
    } else {
      this.renderer.camera.origin = undefined;
      this.renderer.camera.target = undefined;
      (this.controls as OrbitControls).enabled = true;
      this.joystick.hide();
      if ((this.controls as any).update) {
        // console.log(`updating ${dt}`);

        (this.controls as any).update(dt);
        if (this.requireCameraSync) {
          this.syncCamera();
        }
      }
    }
  }
}

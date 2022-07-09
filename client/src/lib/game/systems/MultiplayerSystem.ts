import type {
  ConnectionData,
  createConnection,
} from '../../connection/connection';
import type { JSONWebsocket } from '../../connection/JSONWebsocket';
import { Euler, Object3D, Vector3 } from 'three';
import type {
  SocketRequestResponseTypes,
  SocketServerMessageTypes,
  Avatars,
} from '../../../../lib/do-verse/src/types';
import type {
  CAnimation,
  CModel,
  CObject3D,
  ComponentTypes,
  CPlayer,
  CPosition,
  CToken,
} from '../components';
import type { Entity, EntityWithComponent } from '../Entity';
import type { System } from '../System';
import type { World } from '../World';
import { serverURL } from '../../../config';

type SupportedComponents = CToken &
  CPosition &
  Partial<CPlayer> &
  CObject3D &
  Partial<CAnimation>;

export class MultiplayerSystem implements System<SupportedComponents> {
  protected world: World<ComponentTypes>;
  protected dataReceived: Avatars | undefined;
  protected player: EntityWithComponent<SupportedComponents>;
  protected socket:
    | JSONWebsocket<SocketRequestResponseTypes, SocketServerMessageTypes>
    | undefined;
  protected $connection: ConnectionData;
  // protected entities: EntityWithComponent<SupportedComponents>[] = [];
  protected entities: {
    [tokenID: string]: EntityWithComponent<SupportedComponents>;
  } = {};
  constructor(protected connection: ReturnType<typeof createConnection>) {}
  init(world: World<ComponentTypes>) {
    this.world = world;
    this.connectWorld();
  }

  onEntityAdded(entity: Entity<SupportedComponents>) {}

  onEntityRemoved(entity: Entity<SupportedComponents>) {}

  onComponentAdded(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {}

  onComponentRemoved(
    entity: Entity<SupportedComponents>,
    component: Entity<SupportedComponents>,
  ) {}

  protected lastPos: Vector3 | undefined;
  protected lastRot: Euler | undefined;
  protected lastAnim: string | undefined;
  update(dt: number) {
    if (this.player) {
      if (
        !this.lastAnim ||
        !this.lastPos ||
        !this.lastRot ||
        !(this.lastAnim === this.player.animation?.current) ||
        !this.lastPos.equals(this.player.position.position) ||
        !this.lastRot.equals(this.player.position.rotation)
      ) {
        if (!this.lastPos) {
          this.lastPos = new Vector3();
        }
        this.lastAnim = this.player.animation?.current;
        if (!this.lastRot) {
          this.lastRot = new Euler();
        }
        this.lastPos.copy(this.player.position.position);
        this.lastRot.copy(this.player.position.rotation);
        const x = this.player.position.position.x;
        const y = this.player.position.position.y;
        const z = this.player.position.position.z;
        const rx = this.player.position.rotation.x;
        const ry = this.player.position.rotation.y;
        const rz = this.player.position.rotation.z;
        // console.log(`SENDING`);
        // console.log(this.player.token.id, { ry });
        this.socket.send({
          type: 'move',
          position: { x, y, z },
          rotation: { rx, ry, rz },
          tokenID: this.player.token.id,
          animation: this.player.animation?.current,
        });
      }
    }
  }

  addAvatar(
    tokenID: string,
    position: Vector3,
    rotation: Vector3,
    isPlayer: boolean,
  ) {
    console.log(
      `adding Avatar ${tokenID} at {${position.x},${position.y},${position.x}} (player: ${isPlayer})`,
    );
    const obj = new Object3D();
    obj.position.copy(position);
    // const euler = new Euler(rotation.x, rotation.y, rotation.y);
    // obj.quaternion.setFromEuler(euler);
    obj.rotation.x = rotation.x;
    obj.rotation.y = rotation.y;
    obj.rotation.z = rotation.z;
    if (this.entities[tokenID]) {
      console.log(`entity already exist`);
      // TODO replace ?
    } else {
      const model: CModel['model'] = {
        source: `${serverURL}/assets/${tokenID}.vrm`,
        type: 'vrm',
        extraAnimations: [
          'Idle',
          'Walking',
          'Walking Backward',
          'Turning',
          'Running',
          'Gangnam Style',
        ].map((v) => ({
          name: v,
          url: `assets/animations/${v}.fbx`,
        })),
      };
      const entity = this.world.add({
        player: isPlayer ? true : undefined,
        token: { id: tokenID },
        model,
        position: obj,
      });
      this.entities[tokenID] = entity;
      if (isPlayer) {
        this.player = entity;
      }
    }
  }

  onMessage(message: SocketServerMessageTypes) {
    switch (message.type) {
      case 'data': {
        console.log(`DATA`);
        this.dataReceived = message.avatars;
        console.log('avatars', message.avatars);
        for (const tokenID of Object.keys(message.avatars)) {
          if (tokenID === this.$connection.tokenID && this.player) {
            console.log(`skip avatar ${tokenID} as player already created it`);
            this.player.position.position.x =
              message.avatars[tokenID].position.x;
            this.player.position.position.y =
              message.avatars[tokenID].position.y;
            this.player.position.position.z =
              message.avatars[tokenID].position.z;
            this.player.position.rotation.set(
              message.avatars[tokenID].rotation.rx,
              message.avatars[tokenID].rotation.ry,
              message.avatars[tokenID].rotation.rz,
            );
            continue;
          } else if (!message.avatars[tokenID].online) {
            continue;
          }
          const avatar = message.avatars[tokenID];
          this.addAvatar(
            tokenID,
            new Vector3(
              avatar.position.x,
              avatar.position.y,
              avatar.position.z,
            ),
            new Vector3(
              avatar.rotation.rx,
              avatar.rotation.ry,
              avatar.rotation.rz,
            ),
            this.$connection.tokenID && tokenID === this.$connection.tokenID,
          );
        }
        break;
      }
      case 'move': {
        const entity = this.entities[message.tokenID];
        if (entity) {
          // console.log('receive : ' + message.tokenID, {
          //   ry: message.rotation.ry,
          // });
          entity.position.position.x = message.position.x;
          entity.position.position.y = message.position.y;
          entity.position.position.z = message.position.z;
          // const euler = new Euler(
          //   message.rotation.rx,
          //   message.rotation.ry,
          //   message.rotation.rz,
          // );
          // entity.position.quaternion.setFromEuler(euler);
          // entity.position.rotation.setFromVector3(
          //   new Vector3(0, message.rotation.ry, 0),
          // );

          entity.position.rotation.set(
            message.rotation.rx,
            message.rotation.ry,
            message.rotation.rz,
          );

          // entity.position.rotation.x = message.rotation.rx;
          // entity.position.rotation.y = message.rotation.ry;
          // entity.position.rotation.z = message.rotation.rz;
          if (entity.animation) {
            entity.animation.current = message.animation || 'Idle';
          }
        } else {
          const entity = this.addAvatar(
            message.tokenID,
            new Vector3(
              message.position.x,
              message.position.y,
              message.position.z,
            ),
            new Vector3(
              message.rotation.rx,
              message.rotation.ry,
              message.rotation.rz,
            ),
            this.$connection.tokenID &&
              message.tokenID === this.$connection.tokenID,
          );
          // TODO animation
        }
        break;
      }
      case 'offline': {
        if (message.tokenID !== this.$connection.tokenID) {
          const entity = this.entities[message.tokenID];
          delete this.entities[message.tokenID];
          if (entity) {
            this.world.remove(entity);
          }
        }
        break;
      }
    }
  }

  connectWorld() {
    this.connection.subscribe(($connection) => {
      this.$connection = $connection;
      if (this.socket !== $connection.socket) {
        if (this.socket) {
          this.socket.onMessage = undefined;
        }
        this.socket = $connection.socket;
        if (this.socket) {
          this.socket.onMessage = this.onMessage.bind(this);
        }
      }

      if ($connection.tokenID && this.dataReceived && !this.player) {
        const entity = this.entities[$connection.tokenID];
        if (entity) {
          console.log(`connection avatar ${entity.token.id} to player`);
          entity.player = true;
          this.player = entity;
        }
        if (!this.player) {
          const avatarData = this.dataReceived[$connection.tokenID];
          let pos = new Vector3();
          let rot = new Vector3();
          if (avatarData) {
            pos.set(
              avatarData.position.x,
              avatarData.position.y,
              avatarData.position.z,
            );
            rot.set(
              avatarData.rotation.rx,
              avatarData.rotation.ry,
              avatarData.rotation.rz,
            );
          }
          console.log(`adding avatar ${$connection.tokenID} for player`);
          this.addAvatar($connection.tokenID, pos, rot, true);
        }
      }
    });
  }
}

import type { AnimationClip, Object3D } from 'three';
import type { AnimationComponent } from './AnimationComponent';

export type CModel = {
  model: {
    scale?: number;
    source: string;
    type: 'fbx' | 'vrm' | 'gltf';
    texture?: string;
    extraAnimations?: { name: string; url: string }[];
    promise?: Promise<{
      group: Object3D;
      animations?: { [name: string]: AnimationClip };
    }>;
  };
};
export type CObject3D = { object3D: Object3D };
export type CAnimation = {
  animation: AnimationComponent;
};

export type CPosition = { position: Object3D };

export type CPlayer = { player: true };

export type CToken = { token: { id: string } };

export type ComponentTypes = CModel &
  CObject3D &
  CAnimation &
  CPosition &
  CPlayer &
  CToken;

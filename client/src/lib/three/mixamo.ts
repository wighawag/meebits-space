// from https://github.com/V-Sekai/three-vrm-1-sandbox-mixamo
/* global THREE, THREE_VRM, mixamoVRMRigMap */

import {
  AnimationClip,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';
import type { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

/**
 * Mixamoのリグ名をVRMのHumanoidボーン名に変換する
 */
const mixamoVRMRigMap = {
  mixamorigHips: 'hips',
  mixamorigSpine: 'spine',
  mixamorigSpine1: 'chest',
  mixamorigSpine2: 'upperChest',
  mixamorigNeck: 'neck',
  mixamorigHead: 'head',
  mixamorigLeftShoulder: 'leftShoulder',
  mixamorigLeftArm: 'leftUpperArm',
  mixamorigLeftForeArm: 'leftLowerArm',
  mixamorigLeftHand: 'leftHand',
  mixamorigLeftHandThumb1: 'leftThumbProximal',
  mixamorigLeftHandThumb2: 'leftThumbIntermediate',
  mixamorigLeftHandThumb3: 'leftThumbDistal',
  mixamorigLeftHandIndex1: 'leftIndexProximal',
  mixamorigLeftHandIndex2: 'leftIndexIntermediate',
  mixamorigLeftHandIndex3: 'leftIndexDistal',
  mixamorigLeftHandMiddle1: 'leftMiddleProximal',
  mixamorigLeftHandMiddle2: 'leftMiddleIntermediate',
  mixamorigLeftHandMiddle3: 'leftMiddleDistal',
  mixamorigLeftHandRing1: 'leftRingProximal',
  mixamorigLeftHandRing2: 'leftRingIntermediate',
  mixamorigLeftHandRing3: 'leftRingDistal',
  mixamorigLeftHandPinky1: 'leftLittleProximal',
  mixamorigLeftHandPinky2: 'leftLittleIntermediate',
  mixamorigLeftHandPinky3: 'leftLittleDistal',
  mixamorigRightShoulder: 'rightShoulder',
  mixamorigRightArm: 'rightUpperArm',
  mixamorigRightForeArm: 'rightLowerArm',
  mixamorigRightHand: 'rightHand',
  mixamorigRightHandPinky1: 'rightLittleProximal',
  mixamorigRightHandPinky2: 'rightLittleIntermediate',
  mixamorigRightHandPinky3: 'rightLittleDistal',
  mixamorigRightHandRing1: 'rightRingProximal',
  mixamorigRightHandRing2: 'rightRingIntermediate',
  mixamorigRightHandRing3: 'rightRingDistal',
  mixamorigRightHandMiddle1: 'rightMiddleProximal',
  mixamorigRightHandMiddle2: 'rightMiddleIntermediate',
  mixamorigRightHandMiddle3: 'rightMiddleDistal',
  mixamorigRightHandIndex1: 'rightIndexProximal',
  mixamorigRightHandIndex2: 'rightIndexIntermediate',
  mixamorigRightHandIndex3: 'rightIndexDistal',
  mixamorigRightHandThumb1: 'rightThumbProximal',
  mixamorigRightHandThumb2: 'rightThumbIntermediate',
  mixamorigRightHandThumb3: 'rightThumbDistal',
  mixamorigLeftUpLeg: 'leftUpperLeg',
  mixamorigLeftLeg: 'leftLowerLeg',
  mixamorigLeftFoot: 'leftFoot',
  mixamorigLeftToeBase: 'leftToes',
  mixamorigRightUpLeg: 'rightUpperLeg',
  mixamorigRightLeg: 'rightLowerLeg',
  mixamorigRightFoot: 'rightFoot',
  mixamorigRightToeBase: 'rightToes',
};

/**
 * Mixamoのアニメーションを読み込み、VRM向けに調整して返す
 * @param {string} url Mixamoのモーションが入ったURL
 * @param {VRM} vrm VRMモデル
 * @returns {Promise<THREE.AnimationClip>} AnimationClip
 */
export function loadMixamoAnimation(fbxLoader: FBXLoader, url, vrm) {
  const loader = fbxLoader;
  return loader.loadAsync(url).then((asset) => {
    const clip = AnimationClip.findByName(asset.animations, 'mixamo.com'); // AnimationClipを抽出する

    const tracks = []; // VRM用のKeyframeTrackをこの配列に格納する

    clip.tracks.forEach((track) => {
      // 各TrackをVRM向けに変換し、 `tracks` に格納する
      const trackSplitted = track.name.split('.');
      const mixamoRigName = trackSplitted[0];
      const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
      const vrmNodeName = vrm.humanoid?.getBoneNode(vrmBoneName)?.name;

      if (vrmNodeName != null) {
        const propertyName = trackSplitted[1];

        if (track instanceof QuaternionKeyframeTrack) {
          tracks.push(
            new QuaternionKeyframeTrack(
              `${vrmNodeName}.${propertyName}`,
              track.times as unknown as any[], // TODO
              track.values.map((v, i) =>
                vrm.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v,
              ) as unknown as any[], // TODO
            ),
          );
        } else if (track instanceof VectorKeyframeTrack) {
          tracks.push(
            new VectorKeyframeTrack(
              `${vrmNodeName}.${propertyName}`,
              track.times as unknown as any[], // TODO
              track.values.map(
                (v, i) =>
                  (vrm.meta?.metaVersion === '0' && i % 3 !== 1 ? -v : v) *
                  0.01,
              ) as unknown as any[], // TODO,
            ),
          );
        }
      }
    });

    return new AnimationClip('vrmAnimation', clip.duration, tracks);
  });
}

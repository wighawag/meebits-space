// from https://github.com/V-Sekai/three-vrm-1-sandbox-mixamo
/* global THREE, THREE_VRM */
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMUtils } from '@pixiv/three-vrm';
/**
 * VRMを読み込む
 * @param {string} modelUrl モデルファイルのURL
 * @returns {Promise<VRM>} VRM
 */
export function loadVRM(
  gltfLoader: GLTFLoader,
  modelUrl: string,
): Promise<VRM> {
  // モデルを読み込む処理
  const loader = gltfLoader;

  return loader.loadAsync(modelUrl).then((gltf) => {
    const vrm = gltf.userData.vrm; // VRMを制御するためのクラス `VRM` が `gltf.userData.vrm` に入っています

    VRMUtils.rotateVRM0(vrm); // 読み込んだモデルがVRM0.0の場合は回す
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    return vrm;
  });
}

import {
  DirectionalLight,
  HemisphereLight,
  Material,
  Scene,
  Mesh,
  GridHelper,
  Fog,
  Color,
  PlaneBufferGeometry,
  MeshPhongMaterial,
  AmbientLight,
  WebGLCubeRenderTarget,
  LinearMipmapLinearFilter,
  CubeCamera,
  MeshLambertMaterial,
  CubeTextureLoader,
  Object3D,
  BoxBufferGeometry,
  MeshBasicMaterial,
} from 'three';
import { InfiniteGridHelper } from '../three/InfiniteGridHelper';

export function createScene(): {
  scene: Scene;
  ambient: AmbientLight;
  sun: DirectionalLight;
  grid: Object3D;
  ground: Mesh;
  // cubeCamera: CubeCamera;
} {
  const scene = new Scene();

  scene.background = new Color(0x191920);
  scene.fog = new Fog(0x191920, 7, 100);
  // scene.background = new Color(0x99ccff);
  // scene.fog = new Fog(0x99ccff, 700, 10000);

  // const hemisphereLight = new HemisphereLight(0xffffff, 0x444444);
  // hemisphereLight.position.set(0, 200, 0);
  // scene.add(hemisphereLight);

  // const directionalLight = new DirectionalLight(0xffffff);
  // directionalLight.position.set(0, 200, 100);
  // directionalLight.castShadow = true;
  // directionalLight.shadow.camera.top = 180;
  // directionalLight.shadow.camera.bottom = -100;
  // directionalLight.shadow.camera.left = -120;
  // directionalLight.shadow.camera.right = 120;
  // scene.add(directionalLight);

  const ambient = new AmbientLight(0x191920);
  scene.add(ambient);

  // const light1 = new HemisphereLight(0xffffff, 0x444444);
  // light1.position.set(0, 200, 0);
  // scene.add(light1);

  const sun = new DirectionalLight(0xffffff);
  // sun.position.set(0, 200, 100);
  // sun.castShadow = true;
  // sun.shadow.camera.top = 180;
  // sun.shadow.camera.bottom = -100;
  // sun.shadow.camera.left = -120;
  // sun.shadow.camera.right = 120;
  // scene.add(sun);

  // const grid = new InfiniteGridHelper(240, 240, new Color(0x7feb7f), 20000);
  // grid.position.y = +1;
  // // (grid.material as Material).opacity = 0.2;
  // // (grid.material as Material).transparent = true;
  // scene.add(grid);

  // const gridBack = new InfiniteGridHelper(
  //   240,
  //   240,
  //   new Color(0x7feb7f),
  //   20000,
  //   'zyx',
  // );
  // gridBack.position.z = 10000;
  // // gridBack.rotation.x = Math.PI / 2;
  // // (grid.material as Material).opacity = 0.2;
  // // (grid.material as Material).transparent = true;
  // scene.add(gridBack);

  const grid = new GridHelper(42, 60, new Color(0x7feb7f), new Color(0x7feb7f));
  grid.position.y = +0.001; // TODO move with camera altitude to remove flicker
  (grid.material as Material).opacity = 0.2;
  (grid.material as Material).transparent = true;
  scene.add(grid);

  // let backGrid;
  // backGrid = new GridHelper(
  //   10000,
  //   60,
  //   new Color(0x7feb7f),
  //   new Color(0x7feb7f),
  // );
  // backGrid.position.z = 5000;
  // backGrid.position.y = 5000;
  // backGrid.rotation.x = Math.PI / 2;
  // (backGrid.material as Material).opacity = 0.2;
  // (backGrid.material as Material).transparent = true;
  // scene.add(backGrid);
  // backGrid = new GridHelper(
  //   10000,
  //   60,
  //   new Color(0x7feb7f),
  //   new Color(0x7feb7f),
  // );
  // backGrid.position.z = -5000;
  // backGrid.position.y = 5000;
  // backGrid.rotation.x = Math.PI / 2;
  // (backGrid.material as Material).opacity = 0.2;
  // (backGrid.material as Material).transparent = true;
  // scene.add(backGrid);
  // backGrid = new GridHelper(
  //   10000,
  //   60,
  //   new Color(0x7feb7f),
  //   new Color(0x7feb7f),
  // );
  // backGrid.position.x = 5000;
  // backGrid.position.y = 5000;
  // backGrid.rotation.z = Math.PI / 2;
  // (backGrid.material as Material).opacity = 0.2;
  // (backGrid.material as Material).transparent = true;
  // scene.add(backGrid);
  // backGrid = new GridHelper(
  //   10000,
  //   60,
  //   new Color(0x7feb7f),
  //   new Color(0x7feb7f),
  // );
  // backGrid.position.x = -5000;
  // backGrid.position.y = 5000;
  // backGrid.rotation.z = Math.PI / 2;
  // (backGrid.material as Material).opacity = 0.2;
  // (backGrid.material as Material).transparent = true;
  // scene.add(backGrid);

  // const cubeRenderTarget = new WebGLCubeRenderTarget(128, {
  //   generateMipmaps: true,
  //   minFilter: LinearMipmapLinearFilter,
  // });

  // // Create cube camera
  // const cubeCamera = new CubeCamera(1, 100000, cubeRenderTarget);

  // // Create car
  // const chromeMaterial = new MeshLambertMaterial({
  //   color: 0xffffff,
  //   envMap: cubeRenderTarget.texture,
  // });
  const ground = new Mesh(new PlaneBufferGeometry(42, 42));
  ground.rotation.x = -Math.PI / 2;
  // const ground = new Mesh(new BoxBufferGeometry(4200, 60, 4200));
  // ground.position.y = -30;

  // ground.position.y = -100;
  // ground.receiveShadow = true;
  scene.add(ground);

  const subground = new Mesh(
    new BoxBufferGeometry(42, 0.6, 42),
    new MeshBasicMaterial({ color: new Color(0x0a0a0a) }),
  );
  subground.position.y = -0.31;
  scene.add(subground);

  // ground.add(cubeCamera);

  // Update the render target cube
  // car.visible = false;
  // cubeCamera.position.copy(ground.position);

  // Render the scene
  // car.visible = true;

  new CubeTextureLoader()
    .setPath('assets/cube/skybox/space/')
    .load(
      [
        'front.png',
        'back.png',
        'top.png',
        'bottom.png',
        'right.png',
        'left.png',
      ],
      (cubeTexture) => {
        scene.background = cubeTexture;
      },
    );

  return { scene, sun, ambient, grid, ground };
}

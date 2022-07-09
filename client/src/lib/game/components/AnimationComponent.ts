import type { AnimationAction, AnimationClip, Object3D } from 'three';
import { AnimationMixer } from 'three';

export type AnimationDict = { [name: string]: AnimationClip };

export class AnimationComponent {
  protected mixer: AnimationMixer;
  protected currentAnimation: string;
  protected currentAction: AnimationAction;
  constructor(
    object3D: Object3D,
    protected animations: AnimationDict,
    animationName: string,
  ) {
    this.mixer = new AnimationMixer(object3D);
    this.current = animationName;
  }
  update(dt: number) {
    this.mixer.update(dt);
  }
  set current(name: string) {
    if (name === this.currentAnimation) {
      return;
    }
    if (!this.animations[name]) {
      return;
    }
    const action = this.mixer.clipAction(this.animations[name]);
    if (this.currentAction) {
      this.currentAction.fadeOut(0.2);
      action.fadeIn(0.2);
    }
    action.reset();
    action.play();
    this.currentAction = action;
    this.currentAnimation = name;
  }
  get current() {
    return this.currentAnimation;
  }

  toggleAnimation(name: string) {
    if (this.animations['Idle']) {
      if (this.currentAnimation === 'Idle') {
        this.current = name;
      } else {
        this.current = 'Idle';
      }
    }
  }
}

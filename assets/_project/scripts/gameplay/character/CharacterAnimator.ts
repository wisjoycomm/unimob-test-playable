import { _decorator, Component, Node, SkeletalAnimation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CharacterAnimator')
export class CharacterAnimator extends Component {
    @property(SkeletalAnimation)
    private animator: SkeletalAnimation = null;

    public playAnimation(animationName: string, onComplete: () => void): void {
        this.animator.play(animationName)
        this.animator.on(SkeletalAnimation.EventType.FINISHED, onComplete);
    }

    public stopAnimation(): void {
        this.animator.stop();
    }
}



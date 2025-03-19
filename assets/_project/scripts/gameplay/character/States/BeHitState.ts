import { State } from "db://assets/scripts/framework/fsm/StateMachine";
import { ICharacter } from '../types/ICharacter';
import { SkeletalAnimation } from "cc";

export class BeHitState extends State<ICharacter> {
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("be-hit");
        this.owner.animator.on(SkeletalAnimation.EventType.LASTFRAME, () => {
            this.owner.changeState("idle");
            this.owner.animator.off(SkeletalAnimation.EventType.LASTFRAME);
        });
    }
    public onExit(nextState?: State<ICharacter>): void {
        this.owner.animator.stop();
    }
    public update(deltaTime: number): void {
    }
    public canTransitions(): boolean {
        return true;
    }
}


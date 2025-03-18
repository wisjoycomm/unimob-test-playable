import { SkeletalAnimation } from 'cc';
import { EventManager } from 'db://assets/scripts/framework/core/EventManager';
import { State } from 'db://assets/scripts/framework/fsm/StateMachine';
import { ICharacter } from '../CharacterBase';


export class SpawnState extends State<ICharacter> {
    public onExit(nextState?: State<ICharacter>): void {
        this.owner.animator.stop();
    }
    public update(deltaTime: number): void { }
    public checkTransitions(): State<ICharacter> {
        return null;
    }
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("spawn");
        this.owner.animator.on(SkeletalAnimation.EventType.LASTFRAME, () => {
            this.owner.changeState("idle");
            EventManager.instance.emit("boss-spawned");
            this.owner.animator.off(SkeletalAnimation.EventType.LASTFRAME);
        });
    }
}

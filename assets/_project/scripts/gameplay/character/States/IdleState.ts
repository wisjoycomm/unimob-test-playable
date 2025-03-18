import { State } from 'db://assets/scripts/framework/fsm/StateMachine';
import { ICharacter } from '../CharacterBase';


export class IdleState extends State<ICharacter> {
    public onExit(nextState?: State<ICharacter>): void {
    }
    public update(deltaTime: number): void { }
    public checkTransitions(): State<ICharacter> {
        return null;
    }
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("idle");
    }
}

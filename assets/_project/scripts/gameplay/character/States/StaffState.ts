import { State } from "db://assets/scripts/framework/fsm/StateMachine";
import { ICharacter } from "../CharacterBase";

export class StaffState extends State<ICharacter> {
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("staff");
    }
    public onExit(nextState?: State<ICharacter>): void {
        this.owner.animator.stop();
    }
    public update(deltaTime: number): void {
    }
    public checkTransitions(): State<ICharacter> {
        return null;
    }
}


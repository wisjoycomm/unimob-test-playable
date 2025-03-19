import { State } from 'db://assets/scripts/framework/fsm/StateMachine';
import { ICharacter } from '../types/ICharacter';


export class IdleState extends State<ICharacter> {
    public onExit(nextState?: State<ICharacter>): void {
    }
    public update(deltaTime: number): void { }
    public canTransitions(): boolean {
        return true;
    }
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("idle");
    }
}

export class IdleStateCustomer extends IdleState {
}


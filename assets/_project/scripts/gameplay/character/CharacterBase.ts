import { _decorator, Component, Node, SkeletalAnimation } from 'cc';
import { StateMachine } from 'db://assets/scripts/framework/fsm/StateMachine';
const { ccclass, property } = _decorator;

// Interface cho Character
export interface ICharacter {
    animator: SkeletalAnimation;
    node: Node;
    getStateMachine(): StateMachine<ICharacter>;
    changeState(state: string): void;
}

@ccclass('CharacterBase')
export class CharacterBase extends Component implements ICharacter {
    @property(SkeletalAnimation)
    animator: SkeletalAnimation = null;
    node: Node = null;
    protected stateMachine: StateMachine<ICharacter> = null;
    protected onLoad(): void {
        this.node = this.node;
        this.animator = this.getComponent(SkeletalAnimation);
        this.stateMachine = this.addComponent(StateMachine<ICharacter>);
    }
    protected update(deltaTime: number): void {
        this.stateMachine.update(deltaTime);
    }

    public getStateMachine(): StateMachine<ICharacter> {
        return this.stateMachine;
    }
    public changeState(state: string): void {
        this.stateMachine.changeState(state);
    }

}


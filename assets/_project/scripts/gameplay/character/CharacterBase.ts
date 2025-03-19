import { _decorator, Component, Node, SkeletalAnimation } from 'cc';
import { StateMachine } from 'db://assets/scripts/framework/fsm/StateMachine';
import { NodeArea } from '../NodeArea';
import { ICharacter } from './types/ICharacter';
const { ccclass, property } = _decorator;

@ccclass('CharacterBase')
export class CharacterBase extends Component implements ICharacter {
    @property(SkeletalAnimation)
    animator: SkeletalAnimation = null;
    node: Node = null;
    currentNode: NodeArea = null;
    orderCharacter: ICharacter = null;
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


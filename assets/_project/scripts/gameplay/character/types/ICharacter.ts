import { SkeletalAnimation, Node } from 'cc';
import { StateMachine } from 'db://assets/scripts/framework/fsm/StateMachine';
import { NodeArea } from '../../NodeArea';

// Interface cho Character

export interface ICharacter {
    animator: SkeletalAnimation;
    node: Node;
    currentNode: NodeArea;
    getStateMachine(): StateMachine<ICharacter>;
    changeState(state: string): void;
}

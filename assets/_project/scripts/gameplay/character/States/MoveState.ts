import { State } from 'db://assets/scripts/framework/fsm/StateMachine';
import { ICharacter } from '../CharacterBase';
import { Quat, tween, Vec3 } from 'cc';
import { GameManager } from '../../GameManager';


export class MoveState extends State<ICharacter> {
    targetPos: Vec3 = null!;
    public onExit(nextState?: State<ICharacter>): void {
        this.owner.animator.stop();
    }
    public update(deltaTime: number): void {
        if (this.targetPos) {
            const currentPos = this.owner.node.position;
            const direction = this.targetPos.clone().subtract(currentPos);
            const angle = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
            this.owner.node.rotation = new Quat(0, angle, 0, 0);
        }
    }
    public checkTransitions(): State<ICharacter> {
        return null;
    }
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("move");
    }

    public moveToNode(targetPos: Vec3): void {
        this.targetPos = targetPos;
        tween(this.owner.node).by(1, { position: targetPos }).start();
    }

    public moveToWaiting(): void {
        const waitingNode = GameManager.instance.getAvailableWaitingNode();
        this.moveToNode(waitingNode.position);
    }
}

export class MoveStateCustomer extends MoveState {
    override onEnter(prevState?: State<ICharacter>): void {
        super.onEnter(prevState);
        this.moveToWaiting();
    }
}



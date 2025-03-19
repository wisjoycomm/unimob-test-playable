import { State } from 'db://assets/scripts/framework/fsm/StateMachine';
import { ICharacter } from '../types/ICharacter';
import { Quat, tween, v3, Vec3 } from 'cc';
import { GameManager } from '../../GameManager';
import { OrderRecept } from '../types/OrderRecept';
import { StaffState } from './StaffState';


export class MoveState extends State<ICharacter> {
    speed: number = 5;
    isMoving: boolean = false;
    public onExit(nextState?: State<ICharacter>): void {
        this.owner.animator.stop();
    }
    public update(deltaTime: number): void {
    }

    public canTransitions(): boolean {
        return !this.isMoving;
    }
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("move");
    }

    public moveToNode(offset: Vec3 = Vec3.ZERO, callback?: () => void): void {
        if (this.owner.currentNode) {
            this.owner.currentNode.used = true;
            this.isMoving = true;
            var target = this.owner.currentNode.node.worldPosition.clone().add(offset);
            var distance = Vec3.distance(this.owner.node.worldPosition, target);
            tween(this.owner.node)
                .to(distance / this.speed, { worldPosition: target })
                .call(() => {
                    this.isMoving = false;
                    callback?.();
                })
                .start();
        }
    }
}

export class MoveStateCustomer extends MoveState {
    override onEnter(prevState?: State<ICharacter>): void {
        super.onEnter(prevState);
        this.moveToWaiting();
    }
    private moveToWaiting(): void {
        this.owner.currentNode = GameManager.instance.getAvailableWaitingNode();
        this.moveToNode(Vec3.ZERO, () => {
            this.owner.changeState("order");
        });
    }
}

export class MoveStateStaff extends MoveState {
    override onEnter(prevState?: State<ICharacter>): void {
        super.onEnter(prevState);
        this.moveToStaff();
    }

    moveToStaff(order?: OrderRecept): void {
        this.owner.currentNode = GameManager.instance.getUsedWaitingNode();

        if (this.owner.currentNode) {
            this.moveToNode(new Vec3(0, 0, 2.5), () => {
                var staffState = this.owner.getStateMachine().getState("staff") as StaffState;
                staffState.setOrder(order);
                this.owner.changeState("staff");
            });
        }
        else {
            this.owner.changeState("idle");
        }
    }
}



import { State } from "db://assets/scripts/framework/fsm/StateMachine";
import { ICharacter } from '../types/ICharacter';
import { OrderRecept } from "../types/OrderRecept";
export class StaffState extends State<ICharacter> {
    timer: number = 0;
    order: OrderRecept;
    setOrder(order: OrderRecept) {
        if (!order) {
            console.warn("Order is undefined. Vui lòng cung cấp order hợp lệ.");
            return;
        }
        this.order = order;
        this.timer = this.order.time;
        console.log("set order", this.order);
    }
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("prepare");
    }
    public onExit(nextState?: State<ICharacter>): void {
        this.owner.animator.stop();
    }
    public update(deltaTime: number): void {
        if (this.order) {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                //if empty order
                if (!this.order.recept) {
                    this.order.recept.onOrderDone();
                    this.owner.changeState("move");
                }
                else {
                    this.owner.changeState("idle");
                }
                this.order = null;
            }
        }
    }
    public canTransitions(): boolean {
        if (this.order && this.timer > 0) {
            return false;
        }
        return true;
    }
}


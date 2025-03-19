import { State } from "db://assets/scripts/framework/fsm/StateMachine";
import { ICharacter } from '../types/ICharacter';
import { EventManager } from "db://assets/scripts/framework/core/EventManager";
import { GameManager } from "../../GameManager";
import { IOrderRecept, OrderRecept } from "../types/OrderRecept";

export class OrderState extends State<ICharacter> {
    orderRecept: IOrderRecept;
    order: OrderRecept;
    constructor(owner: ICharacter, order: IOrderRecept) {
        super(owner);
        this.orderRecept = order;
        this.order = new OrderRecept("", 0);
    }
    public onEnter(prevState?: State<ICharacter>): void {
        this.owner.animator.play("idle");
        this.order = GameManager.instance.getRandomOrder();
        this.order.recept = this.orderRecept;
        this.order.orderCharacter = this.owner;
        EventManager.instance.emit('someone-order', this.order);
        console.log("someone-order", this.order);
    }
    public onExit(nextState?: State<ICharacter>): void {
        this.owner.animator.stop();
    }
    public update(deltaTime: number): void {
    }
    public canTransitions(): boolean {
        return true;
    }

}


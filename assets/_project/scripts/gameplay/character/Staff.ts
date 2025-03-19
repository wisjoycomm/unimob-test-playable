import { _decorator, Component } from 'cc';
import { CharacterBase } from './CharacterBase';
import { IdleState } from './states/IdleState';
import { MoveState, MoveStateStaff } from './states/MoveState';
import { EventManager } from 'db://assets/scripts/framework/core/EventManager';
import { OrderRecept } from './types/OrderRecept';
import { StaffState } from './states/StaffState';
const { ccclass, property } = _decorator;

@ccclass('Staff')
export class Staff extends CharacterBase {
    currentOrder: OrderRecept;
    protected onLoad(): void {
        super.onLoad();
        this.stateMachine.initialize(this);
        this.stateMachine.registerState("idle", new IdleState(this));
        this.stateMachine.registerState("staff", new StaffState(this));
        this.stateMachine.registerState("move", new MoveStateStaff(this));
    }
    protected onEnable(): void {
        this.stateMachine.changeState("idle");
        EventManager.instance.on('someone-order', this.onSomeoneOrder, this);
    }
    onSomeoneOrder(order: OrderRecept) {
        this.currentOrder = order;
        var moveStaff = this.stateMachine.getState("move") as MoveStateStaff;
        this.changeState("move");
        moveStaff.moveToStaff(this.currentOrder);
    }
}

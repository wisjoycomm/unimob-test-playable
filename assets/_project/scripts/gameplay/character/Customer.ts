import { _decorator, Component } from 'cc';
import { CharacterBase } from './CharacterBase';
import { IdleState } from './States/IdleState';
import { MoveState, MoveStateCustomer } from './States/MoveState';
import { AttackState } from './States/AttackState';
import { GameManager } from '../GameManager';
const { ccclass, property } = _decorator;

@ccclass('Customer')
export class Customer extends CharacterBase {
    protected start(): void {
        this.stateMachine.initialize(this);
        this.stateMachine.registerState("idle", new IdleState(this));
        this.stateMachine.registerState("move", new MoveStateCustomer(this));
        this.stateMachine.registerState("attack", new AttackState(this));
        this.stateMachine.changeState("move");
    }

    public moveToWaiting(): void {
        const waitingNode = GameManager.instance.getAvailableWaitingNode();
        this.stateMachine.changeState("move");
    }

}

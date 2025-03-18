import { _decorator, Component } from 'cc';
import { CharacterBase } from './CharacterBase';
import { IdleState } from './States/IdleState';
import { StaffState } from './States/StaffState';
import { MoveState } from './States/MoveState';
const { ccclass, property } = _decorator;

@ccclass('Staff')
export class Staff extends CharacterBase {
    protected start(): void {
        this.stateMachine.initialize(this);
        this.stateMachine.registerState("idle", new IdleState(this));
        this.stateMachine.registerState("staff", new StaffState(this));
        this.stateMachine.registerState("move", new MoveState(this));
        this.stateMachine.changeState("idle");
    }

}

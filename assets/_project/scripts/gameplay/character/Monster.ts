import { _decorator, Component } from 'cc';
import { CharacterBase } from './CharacterBase';
import { SpawnState } from './States/SpawnState';
import { IdleState } from './States/IdleState';
import { AttackState } from './States/AttackState';
import { BeHitState } from './States/BeHitState';
const { ccclass, property } = _decorator;

@ccclass('Monster')
export class Monster extends CharacterBase {
    protected start(): void {
        this.stateMachine.initialize(this);
        this.stateMachine.registerState("spawn", new SpawnState(this));
        this.stateMachine.registerState("idle", new IdleState(this));
        this.stateMachine.registerState("attack", new AttackState(this));
        this.stateMachine.registerState("be-hit", new BeHitState(this));
        this.stateMachine.changeState("spawn");
    }

}

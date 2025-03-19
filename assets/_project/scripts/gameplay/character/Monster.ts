import { _decorator, Component } from 'cc';
import { CharacterBase } from './CharacterBase';
import { SpawnState } from './states/SpawnState';
import { IdleState } from './states/IdleState';
import { AttackState } from './states/AttackState';
import { BeHitState } from './states/BeHitState';
const { ccclass, property } = _decorator;

@ccclass('Monster')
export class Monster extends CharacterBase {
    protected onLoad(): void {
        super.onLoad();
        this.stateMachine.initialize(this);
        this.stateMachine.registerState("spawn", new SpawnState(this));
        this.stateMachine.registerState("idle", new IdleState(this));
        this.stateMachine.registerState("attack", new AttackState(this));
        this.stateMachine.registerState("be-hit", new BeHitState(this));
    }
    protected onEnable(): void {
        this.stateMachine.changeState("spawn");
    }
}

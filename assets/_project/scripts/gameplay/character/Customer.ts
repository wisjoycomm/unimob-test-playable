import { _decorator, Component, Material, SkinnedMeshRenderer } from 'cc';
import { CharacterBase } from './CharacterBase';
import { IdleState } from './states/IdleState';
import { MoveState, MoveStateCustomer } from './states/MoveState';
import { AttackState } from './states/AttackState';
import { OrderState } from './states/OrderState';
import { IOrderRecept, OrderRecept } from './types/OrderRecept';
const { ccclass, property } = _decorator;

@ccclass('Customer')
export class Customer extends CharacterBase implements IOrderRecept {

    @property(SkinnedMeshRenderer)
    meshRenderer: SkinnedMeshRenderer = null!;

    @property(Material)
    uniformMaterial: Material = null!;

    public order: OrderRecept = new OrderRecept("", 0);

    protected onLoad(): void {
        super.onLoad();
        this.order.recept = this;
        this.order.orderCharacter = this;
        this.stateMachine.initialize(this);
        this.stateMachine.registerState("idle", new IdleState(this));
        this.stateMachine.registerState("move", new MoveStateCustomer(this));
        this.stateMachine.registerState("attack", new AttackState(this));
        this.stateMachine.registerState("order", new OrderState(this, this));
        this.stateMachine.changeState("idle");
    }
    protected onEnable(): void {
        this.stateMachine.changeState("move");
    }

    onOrderDone(): void {
        this.stateMachine.changeState("idle");
    }

    onServe(): void {
        this.currentNode.used = false;
        this.order = null!;
        this.meshRenderer.material = this.uniformMaterial;
        this.stateMachine.changeState("idle");
    }

}

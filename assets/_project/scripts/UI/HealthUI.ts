import { _decorator, Component, Label, Node, ProgressBar, Size, tween, UITransform, Vec3 } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

export interface IHealth {
    getHealth(): number;
    setHealth(health: number): void;
    getMaxHealth(): number;
    setMaxHealth(maxHealth: number): void;
}

@ccclass('HealthUI')
@requireComponent(ProgressBar)
export class HealthUI extends Component implements IHealth {
    health: number = 0;
    @property
    maxHealth: number = 0;

    progressBar: ProgressBar = null!;
    progressBarFill: Node = null!;
    progressBarUITransform: UITransform = null!;

    protected onLoad(): void {
        this.progressBar = this.node.getComponent(ProgressBar);
        this.progressBarUITransform = this.progressBar.node.getComponent(UITransform);
        this.progressBarFill = this.progressBar.node.getChildByName('Bar');
        this.setMaxHealth(this.maxHealth);
    }


    getHealth(): number {
        return this.health;
    }
    setHealth(health: number): void {
        this.health = health;
        this.setAnimation(this.health / this.maxHealth);
    }
    getMaxHealth(): number {
        return this.maxHealth;
    }
    setMaxHealth(maxHealth: number): void {
        this.maxHealth = maxHealth;
        this.progressBarUITransform.setContentSize(new Size(this.maxHealth, this.progressBarUITransform.contentSize.height));
        this.progressBar.totalLength = this.maxHealth;
        this.progressBarFill.setPosition(new Vec3(-this.maxHealth / 2, 0, 0));
        this.setAnimation(this.health / this.maxHealth);
    }

    protected setAnimation(floatValue: number): void {
    }
}



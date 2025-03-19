import { _decorator, Component, input, Input, instantiate, Node, Prefab, tween, Vec3 } from 'cc';
import { EventManager } from 'db://assets/scripts/framework/core/EventManager';
import { Singleton } from 'db://assets/scripts/framework/core/Singleton';
import { CameraController } from './CameraController';
import { PoolManager } from 'db://assets/scripts/framework/managers/PoolManager';
import { NodeArea } from './NodeArea';
import { OrderRecept } from './character/types/OrderRecept';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
@Singleton({ persistent: true })
export class GameManager extends Component {
    static instance: GameManager = null!;
    // Prefabs
    @property({ type: Prefab, displayName: "Team Prefab", tooltip: "Prefab for the team" })
    teamPrefab: Prefab = null!;
    @property({ type: Prefab, displayName: "Bullet Prefab", tooltip: "Prefab for the bullet" })
    bulletPrefab: Prefab = null!;
    @property({ type: Prefab, displayName: "Smoke Prefab", tooltip: "Prefab for the smoke" })
    smokePrefab: Prefab = null!;
    // Areas
    @property(Node)
    spawnPoint: Node = null!;
    @property(Node)
    waitingArea: Node = null!;
    @property(Node)
    battleArea: Node = null!;
    @property(Node)
    pistolArea: Node = null!;
    @property(Node)
    riffleArea: Node = null!;

    // Orders
    mapOrders: OrderRecept[] = [];
    mapNodes: Map<string, NodeArea[]> = new Map();

    protected onLoad(): void {
        GameManager.instance = this;
        EventManager.instance.on("boss-spawned", () => {
            console.log("boss spawned");
            CameraController.instance.moveToNextPath();
        });

        input.on(Input.EventType.TOUCH_START, () => {
            this.spawnTeam();
        });

        PoolManager.instance.createPool("team", this.teamPrefab, {
            maxSize: 8,
        });
        // PoolManager.instance.createPool("bullet", this.bulletPrefab, {
        //     maxSize: 10,
        // });
        // PoolManager.instance.createPool("smoke", this.smokePrefab, {
        //     maxSize: 4,
        // });


        this.mapNodes.set("waiting", this.waitingArea.children.map(node => ({ node: node, used: false })));
        this.mapNodes.set("battle", this.battleArea.children.map(node => ({ node: node, used: false })));
        this.mapNodes.set("pistol", this.pistolArea.children.map(node => ({ node: node, used: false })));
        this.mapNodes.set("rifle", this.riffleArea.children.map(node => ({ node: node, used: false })));

        this.mapOrders.push(new OrderRecept("pistol", 2));
        this.mapOrders.push(new OrderRecept("rifle", 3));
    }

    private spawnTeam(): void {
        const waitingNodes = this.mapNodes.get("waiting");
        var node = waitingNodes.find(node => !node.used);
        if (node) {
            const team = PoolManager.instance.get("team", this.teamPrefab);
            team.setParent(this.node);
            team.setPosition(this.spawnPoint.worldPosition);
        } else {
            console.log("no waiting nodes");
        }
    }
    getRandomOrder(): OrderRecept {
        const randomIndex = Math.floor(Math.random() * this.mapOrders.length);
        const order = this.mapOrders[randomIndex];
        return new OrderRecept(order.name, order.time);
    }
    getAvailableWaitingNode(): NodeArea {
        var node = this.mapNodes.get("waiting").find(node => !node.used);
        return node;
    }
    getAvailableBattleNode(): NodeArea {
        var node = this.mapNodes.get("battle").find(node => !node.used);
        return node;
    }
    getAvailablePistolNode(): NodeArea {
        var node = this.mapNodes.get("pistol").find(node => !node.used);
        return node;
    }
    getAvailableRifleNode(): NodeArea {
        var node = this.mapNodes.get("rifle").find(node => !node.used);
        return node;
    }
    getUsedWaitingNode(): NodeArea {
        var node = this.mapNodes.get("waiting").find(node => node.used);
        if (node) {
            return node;
        }
        return null;
    }
}



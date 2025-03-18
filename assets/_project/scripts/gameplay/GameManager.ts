import { _decorator, Component, input, Input, instantiate, Node, Prefab, tween, Vec3 } from 'cc';
import { EventManager } from 'db://assets/scripts/framework/core/EventManager';
import { Singleton } from 'db://assets/scripts/framework/core/Singleton';
import { CameraController } from './CameraController';
import { PoolManager } from 'db://assets/scripts/framework/managers/PoolManager';
import { NodeArea } from './NodeArea';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
@Singleton({ persistent: true })
export class GameManager extends Component {
    static instance: GameManager = null!;
    // Prefabs
    @property({ type: Prefab, displayName: "Team Prefab", tooltip: "Prefab for the team" })
    teamPrefab: Prefab = null!;

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
    @property(Node)
    staffArea: Node = null!;

    @property(Map)
    map: Map<string, NodeArea[]> = new Map();

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

        this.map.set("waiting", this.waitingArea.children.map(node => ({ nodes: node, used: false })));
        this.map.set("battle", this.battleArea.children.map(node => ({ nodes: node, used: false })));
        this.map.set("pistol", this.pistolArea.children.map(node => ({ nodes: node, used: false })));
        this.map.set("rifle", this.riffleArea.children.map(node => ({ nodes: node, used: false })));
        this.map.set("staff", this.staffArea.children.map(node => ({ nodes: node, used: false })));
    }

    private spawnTeam(): void {
        const waitingNodes = this.map.get("waiting");
        var node = waitingNodes.find(node => !node.used);
        if (node) {
            const team = PoolManager.instance.get("team", this.teamPrefab);
            team.setParent(this.node);
            team.setPosition(this.spawnPoint.position);
        } else {
            console.log("no waiting nodes");
        }
    }

    getAvailableWaitingNode(): Node {
        return this.map.get("waiting").find(node => !node.used).nodes;
    }
    getAvailableBattleNode(): Node {
        return this.map.get("battle").find(node => !node.used).nodes;
    }
    getAvailablePistolNode(): Node {
        return this.map.get("pistol").find(node => !node.used).nodes;
    }
    getAvailableRifleNode(): Node {
        return this.map.get("rifle").find(node => !node.used).nodes;
    }
    getAvailableStaffNode(): Node {
        return this.map.get("staff").find(node => !node.used).nodes;
    }
}



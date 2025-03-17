import { _decorator, Camera, Node, Component, Vec3 } from "cc";

const { ccclass, property } = _decorator;


@ccclass('WorldUI')
export class WorldUI extends Component {
    @property(Node)
    targetNode: Node = null!;
    @property(Camera)
    camera: Camera = null!;

    private _isActive: boolean = false;

    private _lastWorldPos: Vec3 = new Vec3();
    private _pos: Vec3 = new Vec3();

    setTargetNode(targetNode?: Node, camera?: Camera): void {
        this.targetNode = targetNode;
        this.camera = camera;
        this._isActive = true;
    }
    protected onLoad(): void {
        this._isActive = this.targetNode != null && this.camera != null;
    }

    protected update(dt: number): void {
        if (!this._isActive) {
            return;
        }

        const worldPos = this.targetNode.worldPosition;

        if (this._lastWorldPos.equals(worldPos)) {
            return;
        }

        this._lastWorldPos.set(worldPos);
        this.camera.camera.update();
        this.camera.convertToUINode(worldPos, this.node.parent!, this._pos);

        this.node.setPosition(this._pos.add(new Vec3(0, 0, 100)));
    }

}
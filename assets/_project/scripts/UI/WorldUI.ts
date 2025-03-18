import { _decorator, Camera, Node, Component, Vec3 } from "cc";

const { ccclass, property } = _decorator;


@ccclass('WorldUI')
export class WorldUI extends Component {
    @property(Node)
    target: Node = null!;
    @property(Camera)
    camera: Camera = null!;

    private _lastWPos: Vec3 = new Vec3();
    private _lastDistance: number = 0;
    private _pos: Vec3 = new Vec3();
    private _distance: number = 0;

    protected start(): void {
        this._distance = Vec3.distance(this.target.worldPosition, this.camera.node.worldPosition);
        this.node.setScale(new Vec3(1, 1, 1));
    }

    update() {
        const wpos = this.target.worldPosition;
        // // @ts-ignore
        let newDistance = Vec3.distance(this.target.worldPosition, this.camera.node.worldPosition);
        if (newDistance !== this._lastDistance) {
            this._lastWPos.set(wpos);
            const camera = this.camera!;
            // [HACK]
            // @ts-ignore
            camera._camera.update();
            camera.convertToUINode(wpos, this.node.parent!, this._pos);
            this.node.setPosition(this._pos.add(new Vec3(0, 150, 0)));
            // // @ts-ignore
            let scale = newDistance / this._distance;
            this.node.setScale(new Vec3(1 / scale, 1 / scale, 1));
            this._lastDistance = newDistance;
        }
    }

}
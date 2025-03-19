import { _decorator, Camera, Component, Node, Quat, tween, Vec3 } from 'cc';
import { CameraPath } from './CameraPath';
import { Singleton } from 'db://assets/scripts/framework/core/Singleton';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
@Singleton({ persistent: true })
export class CameraController extends Component {

    static _instance: CameraController = null;

    static get instance(): CameraController {
        if (!CameraController._instance) {
            console.warn('CameraController instance not found');
        }
        return CameraController._instance;
    }

    @property(Camera)
    private camera: Camera = null;

    @property(CameraPath)
    private paths: CameraPath[] = [];

    private _target: Node = null;

    private _currentPathIndex: number = 0;

    protected onLoad(): void {
        CameraController._instance = this;
        this.camera = this.node.getComponent(Camera);
        this.setPaths(this.paths);
    }


    public setTarget(target: Node): void {
        this._target = target;
    }

    public moveTo(target: Vec3, rotation: Quat, fieldOfView: number, duration: number = 1): void {
        // Tween for node position and rotation
        tween(this.camera.node)
            .to(duration, { position: target, rotation: rotation })
            .start();

        // Separate tween for camera properties
        tween(this.camera)
            .to(duration, { orthoHeight: fieldOfView })
            .start();
    }

    public setPaths(paths: CameraPath[]): void {
        this.paths = paths;
        if (this.paths.length > 0) {
            const firstPath = this.paths[0];
            this.camera.node.setPosition(firstPath.node.worldPosition);
            this.camera.node.setRotation(firstPath.node.worldRotation);
            this.camera.orthoHeight = firstPath.fieldOfView;
        }
        else {
            console.warn('No paths set for CameraController');
        }
    }

    public moveToNextPath(): void {
        if (this.paths.length > 0) {
            console.log("moveToNextPath", this._currentPathIndex);
            this._currentPathIndex++;
            if (this._currentPathIndex >= this.paths.length) {
                this._currentPathIndex = 0;
            }
            const nextPath = this.paths[this._currentPathIndex];
            this.moveTo(nextPath.node.worldPosition, nextPath.node.worldRotation, nextPath.fieldOfView);
        }
        else {
            console.warn('No paths set for CameraController');
        }
    }

    update(deltaTime: number): void {
        if (this._target) {
            const targetPos = this._target.position;
            const targetRot = this._target.rotation;
            this.moveTo(targetPos, targetRot, deltaTime);
        }
    }

}



import { _decorator, Camera, Component, Node, Quat, tween, Vec3 } from 'cc';
import { EventManager } from 'db://assets/scripts/framework/core/EventManager';
import { CameraPath } from './CameraPath';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {

    @property(Camera)
    private camera: Camera = null;

    @property(CameraPath)
    private paths: CameraPath[] = [];

    private _target: Node = null;

    private _currentPathIndex: number = -1;

    protected onLoad(): void {
        this.camera = this.node.getComponent(Camera);
        EventManager.instance.on('next-step', this.moveToNextPath, this);
        this.setPaths(this.paths);
    }


    public setTarget(target: Node): void {
        this._target = target;
    }

    public moveTo(target: Vec3, rotation: Quat, fieldOfView: number, duration: number = 1): void {
        tween()
            .parallel(
                tween(this.camera.node)
                    .to(duration, { position: target })
                    .to(duration, { rotation: rotation }),
                tween(this.camera)
                    .to(duration, { orthoHeight: fieldOfView }),
            )
            .start();
    }

    public setPaths(paths: CameraPath[]): void {
        this.paths = paths;
        if (this.paths.length > 0) {
            const firstPath = this.paths[0];
            this.camera.node.setPosition(firstPath.node.position);
            this.camera.node.setRotation(firstPath.node.rotation);
            this.camera.orthoHeight = firstPath.fieldOfView;
        }
        else {
            console.warn('No paths set for CameraController');
        }
    }

    public moveToNextPath(): void {
        if (this.paths.length > 0) {
            this._currentPathIndex++;
            if (this._currentPathIndex >= this.paths.length) {
                this._currentPathIndex = 0;
            }
            const nextPath = this.paths[this._currentPathIndex];
            this.moveTo(nextPath.node.position, nextPath.node.rotation, nextPath.fieldOfView);
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



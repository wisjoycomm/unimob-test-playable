import { _decorator, CCFloat, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraPath')
export class CameraPath {
    @property(Node)
    public node: Node = null;

    @property(CCFloat)
    public fieldOfView: number = 0;
}

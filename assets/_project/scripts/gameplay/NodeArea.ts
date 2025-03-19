import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("NodeArea")
export class NodeArea {
    node: Node;
    used: boolean;
}

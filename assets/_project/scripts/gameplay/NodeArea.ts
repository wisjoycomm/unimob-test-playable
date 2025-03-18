import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("NodeArea")
export class NodeArea {
    nodes: Node;
    used: boolean;
}

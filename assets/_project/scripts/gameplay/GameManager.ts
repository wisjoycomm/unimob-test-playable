import { _decorator, Component, Node } from 'cc';
import { Singleton } from 'db://assets/scripts/framework/core/Singleton';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
@Singleton({ persistent: true })
export class GameManager extends Component {

}



import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;
export abstract class State<T> {
    // Owner của state (thường là character)
    protected owner: T;

    constructor(owner: T) {
        this.owner = owner;
    }

    /**
     * Được gọi khi state được kích hoạt
     */
    public abstract onEnter(prevState?: State<T>): void;

    /**
     * Được gọi khi state bị hủy kích hoạt
     */
    public abstract onExit(nextState?: State<T>): void;

    /**
     * Được gọi mỗi frame
     */
    public abstract update(deltaTime: number): void;

    /**
     * Được gọi để kiểm tra nếu nên chuyển sang state khác
     * @returns State mới hoặc null nếu không chuyển state
     */
    public abstract canTransitions(): boolean;
}

/**
 * StateMachine quản lý các state và chuyển đổi giữa chúng
 */
@ccclass('StateMachine')
export class StateMachine<T> extends Component {
    // State hiện tại
    private currentState: State<T> = null;
    private nextState: State<T> = null;
    // Danh sách tất cả state
    private states: Map<string, State<T>> = new Map();

    // Owner của state machine
    private owner: T = null;

    /**
     * Khởi tạo state machine
     * @param owner Owner của state machine (thường là character)
     */
    public initialize(owner: T): void {
        this.owner = owner;
    }

    /**
     * Đăng ký một state mới
     * @param name Tên của state
     * @param state Instance của state
     */
    public registerState(name: string, state: State<T>): void {
        this.states.set(name, state);
    }

    /**
     * Chuyển sang state mới
     * @param stateName Tên của state mới
     * @returns true nếu chuyển state thành công
     */
    public changeState(stateName: string){
        const newState = this.states.get(stateName);
        if (!newState) {
            console.warn(`State '${stateName}' không tồn tại`);
            return;
        }
        const prevState = this.currentState;
        if (!this.currentState) {
            this.currentState = newState;
            this.currentState.onEnter(prevState);
        }
        else {
            this.nextState = newState;
        }

    }

    /**
     * Cập nhật state hiện tại và kiểm tra chuyển đổi
     * @param deltaTime Thời gian giữa các frame
     */
    public update(deltaTime: number): void {
        if (!this.currentState) return;

        // Cập nhật state hiện tại
        this.currentState.update(deltaTime);

        if (!this.currentState.canTransitions()) {
            return;
        }
        if (this.nextState) {
            this.currentState.onExit(this.nextState);
            const prevState = this.currentState;
            this.currentState = this.nextState;
            this.nextState = null;
            this.currentState.onEnter(prevState);
        }
    }

    /**
     * Lấy state hiện tại
     * @returns State hiện tại
     */
    public getCurrentState(): State<T> {
        return this.currentState;
    }

    /**
     * Lấy state theo tên
     * @param name Tên của state
     * @returns State tương ứng
     */
    public getState(name: string): State<T> {
        return this.states.get(name);
    }
}
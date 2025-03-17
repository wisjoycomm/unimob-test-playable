import { _decorator, Component, sp, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimationController')
export class AnimationController extends Component {
    @property(sp.Skeleton)
    private skeleton: sp.Skeleton = null;

    // Animation states
    private currentAnimation: string = '';
    private isPlaying: boolean = false;

    // Cache for animation names
    private readonly ANIM_IDLE = 'idle';
    private readonly ANIM_WALK = 'walk';
    private readonly ANIM_RUN = 'run';
    private readonly ANIM_ATTACK = 'attack';

    protected onLoad(): void {
        // Get skeleton component if not set
        if (!this.skeleton) {
            this.skeleton = this.getComponent(sp.Skeleton);
        }

        // Set default animation mix (blend time between animations)
        this.setDefaultMixes();
        
        // Play default idle animation
        this.playAnimation(this.ANIM_IDLE, true);
    }

    /**
     * Set default transition times between animations
     */
    private setDefaultMixes(): void {
        if (!this.skeleton) return;

        // Set transition time between animations (in seconds)
        this.skeleton.setMix(this.ANIM_IDLE, this.ANIM_WALK, 0.2);
        this.skeleton.setMix(this.ANIM_WALK, this.ANIM_IDLE, 0.2);
        this.skeleton.setMix(this.ANIM_WALK, this.ANIM_RUN, 0.15);
        this.skeleton.setMix(this.ANIM_RUN, this.ANIM_WALK, 0.15);
        this.skeleton.setMix(this.ANIM_IDLE, this.ANIM_ATTACK, 0.1);
        this.skeleton.setMix(this.ANIM_ATTACK, this.ANIM_IDLE, 0.1);
    }

    /**
     * Play an animation
     * @param animName Animation name
     * @param loop Should the animation loop?
     * @param trackIndex Track index (default 0)
     * @returns Duration of the animation
     */
    public playAnimation(animName: string, loop: boolean = false, trackIndex: number = 0): number {
        if (!this.skeleton || this.currentAnimation === animName) return 0;

        // Get animation state
        const state = this.skeleton.getState();
        
        // Set animation
        const entry = state.setAnimation(trackIndex, animName, loop);
        this.currentAnimation = animName;
        this.isPlaying = true;

        // Set complete listener
        entry.complete = () => {
            this.isPlaying = false;
            this.onAnimationComplete(animName);
        };

        return entry.animationEnd - entry.animationStart;
    }

    /**
     * Add an animation to be played after the current one
     * @param animName Animation name
     * @param loop Should the animation loop?
     * @param delay Delay before playing (in seconds)
     * @param trackIndex Track index (default 0)
     */
    public addAnimation(animName: string, loop: boolean = false, delay: number = 0, trackIndex: number = 0): void {
        if (!this.skeleton) return;

        const state = this.skeleton.getState();
        state.addAnimation(trackIndex, animName, loop, delay);
    }

    /**
     * Stop current animation
     * @param trackIndex Track index (default 0)
     */
    public stopAnimation(trackIndex: number = 0): void {
        if (!this.skeleton) return;

        const state = this.skeleton.getState();
        state.setEmptyAnimation(trackIndex, 0);
        this.currentAnimation = '';
        this.isPlaying = false;
    }

    /**
     * Set animation timeScale (speed)
     * @param timeScale Time scale value (1 = normal speed)
     */
    public setTimeScale(timeScale: number): void {
        if (!this.skeleton) return;

        const state = this.skeleton.getState();
        state.timeScale = timeScale;
    }

    /**
     * Check if an animation exists
     * @param animName Animation name
     * @returns boolean
     */
    public hasAnimation(animName: string): boolean {
        if (!this.skeleton) return false;
        return this.skeleton.findAnimation(animName) !== null;
    }

    /**
     * Get current animation name
     * @returns Current animation name
     */
    public getCurrentAnimation(): string {
        return this.currentAnimation;
    }

    /**
     * Check if animation is playing
     * @returns boolean
     */
    public isAnimationPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * Called when an animation completes
     * @param animName Completed animation name
     */
    private onAnimationComplete(animName: string): void {
        // Handle animation completion
        // For example, return to idle if it was a one-shot animation
        if (animName === this.ANIM_ATTACK) {
            this.playAnimation(this.ANIM_IDLE, true);
        }
    }

    /**
     * Example methods for common animations
     */
    public playIdle(): void {
        this.playAnimation(this.ANIM_IDLE, true);
    }

    public playWalk(): void {
        this.playAnimation(this.ANIM_WALK, true);
    }

    public playRun(): void {
        this.playAnimation(this.ANIM_RUN, true);
    }

    public playAttack(): void {
        this.playAnimation(this.ANIM_ATTACK, false);
    }
} 
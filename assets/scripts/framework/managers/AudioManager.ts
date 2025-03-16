/**
 * @file AudioManager.ts
 * @description Centralized audio management system for handling different audio types
 */

import { _decorator, Component, AudioClip, AudioSource, game, sys, Node } from 'cc';
import { Singleton } from '../core/Singleton';
import { EventManager } from '../core/EventManager';
const { ccclass, property } = _decorator;

/**
 * Audio category types
 */
export enum AudioCategory {
    MUSIC = 'music',
    SOUND_EFFECT = 'sound_effect',
    VOICE = 'voice',
    UI = 'ui'
}

/**
 * Audio events
 */
export enum AudioEvent {
    MUSIC_CHANGED = 'audio:music_changed',
    VOLUME_CHANGED = 'audio:volume_changed',
    MUTE_CHANGED = 'audio:mute_changed'
}

/**
 * Audio transition types
 */
export enum AudioTransition {
    NONE = 'none',
    FADE_IN = 'fade_in',
    FADE_OUT = 'fade_out',
    CROSS_FADE = 'cross_fade'
}

/**
 * Audio state interface
 */
interface AudioState {
    currentMusic?: AudioInstance;
    volume: {
        [key in AudioCategory]: number;
    };
    muted: {
        [key in AudioCategory]: boolean;
    };
    masterVolume: number;
    masterMuted: boolean;
}

/**
 * Options for playing audio
 */
export interface AudioPlayOptions {
    /** Audio category */
    category: AudioCategory;
    /** Volume between 0 and 1 */
    volume?: number;
    /** Whether to loop the audio */
    loop?: boolean;
    /** Transition type */
    transition?: AudioTransition;
    /** Transition duration in seconds */
    transitionDuration?: number;
    /** Callback when audio starts playing */
    onStart?: () => void;
    /** Callback when audio finishes playing */
    onComplete?: () => void;
    /** Callback for transition progress (0-1) */
    onTransitionProgress?: (progress: number) => void;
}

/**
 * Represents an active audio instance
 */
class AudioInstance {
    /** Audio source component */
    audioSource: AudioSource;
    /** Audio clip */
    clip: AudioClip;
    /** Audio category */
    category: AudioCategory;
    /** Whether the audio is looping */
    loop: boolean;
    /** Original volume (before category/master adjustments) */
    originalVolume: number;
    /** Whether a transition is active */
    transitioning: boolean = false;
    /** Current transition progress (0-1) */
    transitionProgress: number = 0;
    /** Transition start time */
    transitionStartTime: number = 0;
    /** Transition duration */
    transitionDuration: number = 0;
    /** Transition type */
    transitionType: AudioTransition = AudioTransition.NONE;
    /** Callback when audio starts playing */
    onStart?: () => void;
    /** Callback when audio finishes playing */
    onComplete?: () => void;
    /** Callback for transition progress */
    onTransitionProgress?: (progress: number) => void;
    
    constructor(
        audioSource: AudioSource, 
        clip: AudioClip, 
        category: AudioCategory, 
        options: AudioPlayOptions
    ) {
        this.audioSource = audioSource;
        this.clip = clip;
        this.category = category;
        this.loop = options.loop || false;
        this.originalVolume = options.volume !== undefined ? options.volume : 1;
        this.onStart = options.onStart;
        this.onComplete = options.onComplete;
        this.onTransitionProgress = options.onTransitionProgress;
        
        // Set up audio source
        this.audioSource.clip = clip;
        this.audioSource.loop = this.loop;
        
        // Initial volume set to 0 if we're doing a transition
        if (options.transition === AudioTransition.FADE_IN || 
            options.transition === AudioTransition.CROSS_FADE) {
            this.audioSource.volume = 0;
        } else {
            this.audioSource.volume = this.originalVolume;
        }
        
        // Configure transition if specified
        if (options.transition && options.transition !== AudioTransition.NONE) {
            this.transitioning = true;
            this.transitionType = options.transition;
            this.transitionDuration = options.transitionDuration || 1.0;
            this.transitionStartTime = game.totalTime / 1000;
        }
    }
    
    /**
     * Start playing the audio
     */
    play(): void {
        this.audioSource.play();
        if (this.onStart) {
            this.onStart();
        }
    }
    
    /**
     * Stop the audio
     */
    stop(): void {
        this.audioSource.stop();
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    /**
     * Pause the audio
     */
    pause(): void {
        this.audioSource.pause();
    }
    
    /**
     * Resume the audio
     */
    resume(): void {
        this.audioSource.play();
    }
    
    /**
     * Update the volume based on the category and master volume
     * @param categoryVolume Category volume
     * @param masterVolume Master volume
     * @param categoryMuted Whether the category is muted
     * @param masterMuted Whether master audio is muted
     */
    updateVolume(
        categoryVolume: number, 
        masterVolume: number, 
        categoryMuted: boolean, 
        masterMuted: boolean
    ): void {
        if (categoryMuted || masterMuted) {
            this.audioSource.volume = 0;
        } else {
            this.audioSource.volume = this.originalVolume * categoryVolume * masterVolume;
        }
    }
    
    /**
     * Update transition effects
     * @param deltaTime Time since last update in seconds
     * @param crossFadeTarget Optional target instance for cross-fade
     * @returns Whether the transition is complete
     */
    updateTransition(deltaTime: number, crossFadeTarget?: AudioInstance): boolean {
        if (!this.transitioning) {
            return true;
        }
        
        const currentTime = game.totalTime / 1000;
        this.transitionProgress = Math.min(
            1, 
            (currentTime - this.transitionStartTime) / this.transitionDuration
        );
        
        if (this.onTransitionProgress) {
            this.onTransitionProgress(this.transitionProgress);
        }
        
        switch (this.transitionType) {
            case AudioTransition.FADE_IN:
                this.audioSource.volume = this.originalVolume * this.transitionProgress;
                break;
                
            case AudioTransition.FADE_OUT:
                this.audioSource.volume = this.originalVolume * (1 - this.transitionProgress);
                break;
                
            case AudioTransition.CROSS_FADE:
                if (crossFadeTarget) {
                    this.audioSource.volume = this.originalVolume * this.transitionProgress;
                    crossFadeTarget.audioSource.volume = 
                        crossFadeTarget.originalVolume * (1 - this.transitionProgress);
                }
                break;
        }
        
        // Check if transition is complete
        if (this.transitionProgress >= 1) {
            this.transitioning = false;
            
            // For fade out, stop the audio when done
            if (this.transitionType === AudioTransition.FADE_OUT) {
                this.stop();
            }
            
            return true;
        }
        
        return false;
    }
}

/**
 * Audio manager singleton for controlling game audio
 */
@ccclass('AudioManager')
@Singleton({ persistent: true })
export class AudioManager extends Component {
    @property({type: AudioSource})
    musicSource: AudioSource = null!;
    
    @property({type: AudioSource})
    sfxSource: AudioSource = null!;
    
    @property({type: AudioSource})
    voiceSource: AudioSource = null!;
    
    @property({type: AudioSource})
    uiSource: AudioSource = null!;
    
    // Static reference for access before initialization
    static _instance: AudioManager | null = null;
    
    /** Active audio instances */
    private _activeInstances: Map<string, AudioInstance> = new Map();
    
    /** Audio clips cache */
    private _clipsCache: Map<string, AudioClip> = new Map();
    
    /** Current audio state */
    private _state: AudioState = {
        volume: {
            [AudioCategory.MUSIC]: 1,
            [AudioCategory.SOUND_EFFECT]: 1,
            [AudioCategory.VOICE]: 1,
            [AudioCategory.UI]: 1
        },
        muted: {
            [AudioCategory.MUSIC]: false,
            [AudioCategory.SOUND_EFFECT]: false,
            [AudioCategory.VOICE]: false,
            [AudioCategory.UI]: false
        },
        masterVolume: 1,
        masterMuted: false
    };
    
    /** Audio sources by category */
    private _sourcesByCategory: Map<AudioCategory, AudioSource> = new Map();
    
    /** Get the singleton instance */
    static get instance(): AudioManager {
        return AudioManager._instance!;
    }
    
    onLoad() {
        AudioManager._instance = this;
        
        // Initialize audio sources
        if (!this.musicSource) {
            this.musicSource = this.addComponent(AudioSource);
        }
        
        if (!this.sfxSource) {
            this.sfxSource = this.addComponent(AudioSource);
        }
        
        if (!this.voiceSource) {
            this.voiceSource = this.addComponent(AudioSource);
        }
        
        if (!this.uiSource) {
            this.uiSource = this.addComponent(AudioSource);
        }
        
        // Map categories to sources
        this._sourcesByCategory.set(AudioCategory.MUSIC, this.musicSource);
        this._sourcesByCategory.set(AudioCategory.SOUND_EFFECT, this.sfxSource);
        this._sourcesByCategory.set(AudioCategory.VOICE, this.voiceSource);
        this._sourcesByCategory.set(AudioCategory.UI, this.uiSource);
        
        // Load saved audio settings
        this._loadAudioSettings();
        
        // Register update callback
        this.schedule(this._update, 0);
    }
    
    /**
     * Preload audio clip
     * @param clip Audio clip to preload
     * @param id Optional ID to reference the clip later
     */
    preloadClip(clip: AudioClip, id?: string): void {
        const clipId = id || clip.name;
        this._clipsCache.set(clipId, clip);
    }
    
    /**
     * Preload multiple audio clips
     * @param clips Array of audio clips to preload
     * @param idPrefix Optional prefix for auto-generated IDs
     */
    preloadClips(clips: AudioClip[], idPrefix?: string): void {
        clips.forEach((clip, index) => {
            const id = idPrefix ? `${idPrefix}_${index}` : clip.name;
            this.preloadClip(clip, id);
        });
    }
    
    /**
     * Play a music track
     * @param clip Audio clip or clip ID to play
     * @param options Playback options
     * @returns Audio instance ID
     */
    playMusic(clip: AudioClip | string, options: Partial<AudioPlayOptions> = {}): string {
        const audioClip = typeof clip === 'string' ? this._getClip(clip) : clip;
        
        if (!audioClip) {
            console.warn(`[AudioManager] Clip not found: ${clip}`);
            return '';
        }
        
        // Stop current music if it's playing
        const currentMusic = this._state.currentMusic;
        const transition = options.transition || AudioTransition.NONE;
        
        // Generate a unique ID for this instance
        const instanceId = `music_${audioClip.name}_${Date.now()}`;
        
        // Set up full options
        const fullOptions: AudioPlayOptions = {
            category: AudioCategory.MUSIC,
            loop: true,
            ...options
        };
        
        // Create a new audio instance
        const audioInstance = new AudioInstance(
            this.musicSource,
            audioClip,
            AudioCategory.MUSIC,
            fullOptions
        );
        
        // Handle transitions
        if (currentMusic && currentMusic.audioSource.playing) {
            if (transition === AudioTransition.CROSS_FADE) {
                // Start new music immediately for cross-fade
                audioInstance.play();
                this._activeInstances.set(instanceId, audioInstance);
                
                // Set up cross-fade with current music
                audioInstance.transitioning = true;
                audioInstance.transitionType = AudioTransition.CROSS_FADE;
                audioInstance.transitionStartTime = game.totalTime / 1000;
                audioInstance.transitionDuration = options.transitionDuration || 1.0;
                
                // Update current music to fade out
                currentMusic.transitioning = true;
                currentMusic.transitionType = AudioTransition.CROSS_FADE;
                currentMusic.transitionStartTime = game.totalTime / 1000;
                currentMusic.transitionDuration = options.transitionDuration || 1.0;
            } else if (transition === AudioTransition.FADE_OUT) {
                // Fade out current music first
                currentMusic.transitioning = true;
                currentMusic.transitionType = AudioTransition.FADE_OUT;
                currentMusic.transitionStartTime = game.totalTime / 1000;
                currentMusic.transitionDuration = options.transitionDuration || 1.0;
                
                // Start new music after fade out completes
                const startNewMusic = () => {
                    audioInstance.play();
                    this._activeInstances.set(instanceId, audioInstance);
                    this._state.currentMusic = audioInstance;
                    
                    // Update volume based on current settings
                    audioInstance.updateVolume(
                        this._state.volume[AudioCategory.MUSIC],
                        this._state.masterVolume,
                        this._state.muted[AudioCategory.MUSIC],
                        this._state.masterMuted
                    );
                    
                    // Emit event
                    EventManager.instance.emit(AudioEvent.MUSIC_CHANGED, {
                        clipName: audioClip.name,
                        instanceId
                    });
                };
                
                // Schedule starting new music after fade out duration
                this.scheduleOnce(startNewMusic, options.transitionDuration || 1.0);
                
                return instanceId;
            } else {
                // No transition, just stop current music
                currentMusic.stop();
            }
        }
        
        // If no special transition handling occurred, start playing the new music
        if (transition !== AudioTransition.FADE_OUT || !currentMusic) {
            audioInstance.play();
            this._activeInstances.set(instanceId, audioInstance);
            this._state.currentMusic = audioInstance;
            
            // Update volume based on current settings
            audioInstance.updateVolume(
                this._state.volume[AudioCategory.MUSIC],
                this._state.masterVolume,
                this._state.muted[AudioCategory.MUSIC],
                this._state.masterMuted
            );
            
            // Emit event
            EventManager.instance.emit(AudioEvent.MUSIC_CHANGED, {
                clipName: audioClip.name,
                instanceId
            });
        }
        
        return instanceId;
    }
    
    /**
     * Play a sound effect
     * @param clip Audio clip or clip ID to play
     * @param options Playback options
     * @returns Audio instance ID
     */
    playSFX(clip: AudioClip | string, options: Partial<AudioPlayOptions> = {}): string {
        const audioClip = typeof clip === 'string' ? this._getClip(clip) : clip;
        
        if (!audioClip) {
            console.warn(`[AudioManager] Clip not found: ${clip}`);
            return '';
        }
        
        // Generate a unique ID for this instance
        const instanceId = `sfx_${audioClip.name}_${Date.now()}`;
        
        // Set up full options
        const fullOptions: AudioPlayOptions = {
            category: AudioCategory.SOUND_EFFECT,
            loop: false,
            ...options
        };
        
        // Create a new AudioSource for this SFX
        const sfxNode = new Node(`SFX_${audioClip.name}`);
        this.node.addChild(sfxNode);
        const audioSource = sfxNode.addComponent(AudioSource);
        
        // Create audio instance
        const audioInstance = new AudioInstance(
            audioSource,
            audioClip,
            AudioCategory.SOUND_EFFECT,
            fullOptions
        );
        
        // Play the sound effect
        audioInstance.play();
        
        // Update volume based on current settings
        audioInstance.updateVolume(
            this._state.volume[AudioCategory.SOUND_EFFECT],
            this._state.masterVolume,
            this._state.muted[AudioCategory.SOUND_EFFECT],
            this._state.masterMuted
        );
        
        // Add to active instances
        this._activeInstances.set(instanceId, audioInstance);
        
        // If not looping, schedule cleanup
        if (!fullOptions.loop) {
            // The duration is in seconds
            const duration = audioClip.getDuration ? audioClip.getDuration() : 1.0;
            this.scheduleOnce(() => {
                this._activeInstances.delete(instanceId);
                sfxNode.destroy();
            }, duration);
        }
        
        return instanceId;
    }
    
    /**
     * Play voice audio
     * @param clip Audio clip or clip ID to play
     * @param options Playback options
     * @returns Audio instance ID
     */
    playVoice(clip: AudioClip | string, options: Partial<AudioPlayOptions> = {}): string {
        const audioClip = typeof clip === 'string' ? this._getClip(clip) : clip;
        
        if (!audioClip) {
            console.warn(`[AudioManager] Clip not found: ${clip}`);
            return '';
        }
        
        // Stop any currently playing voice
        this.stopAllInCategory(AudioCategory.VOICE);
        
        // Generate a unique ID for this instance
        const instanceId = `voice_${audioClip.name}_${Date.now()}`;
        
        // Set up full options
        const fullOptions: AudioPlayOptions = {
            category: AudioCategory.VOICE,
            loop: false,
            ...options
        };
        
        // Create audio instance
        const audioInstance = new AudioInstance(
            this.voiceSource,
            audioClip,
            AudioCategory.VOICE,
            fullOptions
        );
        
        // Play the voice
        audioInstance.play();
        
        // Update volume based on current settings
        audioInstance.updateVolume(
            this._state.volume[AudioCategory.VOICE],
            this._state.masterVolume,
            this._state.muted[AudioCategory.VOICE],
            this._state.masterMuted
        );
        
        // Add to active instances
        this._activeInstances.set(instanceId, audioInstance);
        
        // If not looping, schedule cleanup
        if (!fullOptions.loop) {
            // The duration is in seconds
            const duration = audioClip.getDuration ? audioClip.getDuration() : 1.0;
            this.scheduleOnce(() => {
                this._activeInstances.delete(instanceId);
            }, duration);
        }
        
        return instanceId;
    }
    
    /**
     * Play UI sound
     * @param clip Audio clip or clip ID to play
     * @param options Playback options
     * @returns Audio instance ID
     */
    playUI(clip: AudioClip | string, options: Partial<AudioPlayOptions> = {}): string {
        const audioClip = typeof clip === 'string' ? this._getClip(clip) : clip;
        
        if (!audioClip) {
            console.warn(`[AudioManager] Clip not found: ${clip}`);
            return '';
        }
        
        // Generate a unique ID for this instance
        const instanceId = `ui_${audioClip.name}_${Date.now()}`;
        
        // Set up full options
        const fullOptions: AudioPlayOptions = {
            category: AudioCategory.UI,
            loop: false,
            ...options
        };
        
        // Create a new AudioSource for this UI sound
        const uiNode = new Node(`UI_${audioClip.name}`);
        this.node.addChild(uiNode);
        const audioSource = uiNode.addComponent(AudioSource);
        
        // Create audio instance
        const audioInstance = new AudioInstance(
            audioSource,
            audioClip,
            AudioCategory.UI,
            fullOptions
        );
        
        // Play the UI sound
        audioInstance.play();
        
        // Update volume based on current settings
        audioInstance.updateVolume(
            this._state.volume[AudioCategory.UI],
            this._state.masterVolume,
            this._state.muted[AudioCategory.UI],
            this._state.masterMuted
        );
        
        // Add to active instances
        this._activeInstances.set(instanceId, audioInstance);
        
        // UI sounds are usually short, schedule cleanup
        // The duration is in seconds
        const duration = audioClip.getDuration ? audioClip.getDuration() : 1.0;
        this.scheduleOnce(() => {
            this._activeInstances.delete(instanceId);
            uiNode.destroy();
        }, duration);
        
        return instanceId;
    }
    
    /**
     * Stop a specific audio instance
     * @param instanceId Audio instance ID
     * @param fadeOut Whether to fade out before stopping
     * @param fadeOutDuration Fade out duration in seconds
     */
    stop(instanceId: string, fadeOut: boolean = false, fadeOutDuration: number = 1.0): void {
        const instance = this._activeInstances.get(instanceId);
        
        if (!instance) {
            return;
        }
        
        if (fadeOut) {
            instance.transitioning = true;
            instance.transitionType = AudioTransition.FADE_OUT;
            instance.transitionStartTime = game.totalTime / 1000;
            instance.transitionDuration = fadeOutDuration;
        } else {
            instance.stop();
            this._activeInstances.delete(instanceId);
            
            // For music, clear the current music reference
            if (instance === this._state.currentMusic) {
                this._state.currentMusic = undefined;
            }
        }
    }
    
    /**
     * Stop all audio in a specific category
     * @param category Audio category
     * @param fadeOut Whether to fade out before stopping
     * @param fadeOutDuration Fade out duration in seconds
     */
    stopAllInCategory(category: AudioCategory, fadeOut: boolean = false, fadeOutDuration: number = 1.0): void {
        this._activeInstances.forEach((instance, id) => {
            if (instance.category === category) {
                this.stop(id, fadeOut, fadeOutDuration);
            }
        });
    }
    
    /**
     * Stop all audio
     * @param fadeOut Whether to fade out before stopping
     * @param fadeOutDuration Fade out duration in seconds
     */
    stopAll(fadeOut: boolean = false, fadeOutDuration: number = 1.0): void {
        this._activeInstances.forEach((instance, id) => {
            this.stop(id, fadeOut, fadeOutDuration);
        });
    }
    
    /**
     * Pause a specific audio instance
     * @param instanceId Audio instance ID
     */
    pause(instanceId: string): void {
        const instance = this._activeInstances.get(instanceId);
        
        if (instance) {
            instance.pause();
        }
    }
    
    /**
     * Pause all audio in a category
     * @param category Audio category
     */
    pauseCategory(category: AudioCategory): void {
        this._activeInstances.forEach(instance => {
            if (instance.category === category) {
                instance.pause();
            }
        });
    }
    
    /**
     * Pause all audio
     */
    pauseAll(): void {
        this._activeInstances.forEach(instance => {
            instance.pause();
        });
    }
    
    /**
     * Resume a specific audio instance
     * @param instanceId Audio instance ID
     */
    resume(instanceId: string): void {
        const instance = this._activeInstances.get(instanceId);
        
        if (instance) {
            instance.resume();
        }
    }
    
    /**
     * Resume all audio in a category
     * @param category Audio category
     */
    resumeCategory(category: AudioCategory): void {
        this._activeInstances.forEach(instance => {
            if (instance.category === category) {
                instance.resume();
            }
        });
    }
    
    /**
     * Resume all audio
     */
    resumeAll(): void {
        this._activeInstances.forEach(instance => {
            instance.resume();
        });
    }
    
    /**
     * Set volume for a category
     * @param category Audio category
     * @param volume Volume between 0 and 1
     */
    setCategoryVolume(category: AudioCategory, volume: number): void {
        volume = Math.max(0, Math.min(1, volume));
        this._state.volume[category] = volume;
        
        // Update all instances in this category
        this._activeInstances.forEach(instance => {
            if (instance.category === category) {
                instance.updateVolume(
                    volume,
                    this._state.masterVolume,
                    this._state.muted[category],
                    this._state.masterMuted
                );
            }
        });
        
        // Save settings
        this._saveAudioSettings();
        
        // Emit event
        EventManager.instance.emit(AudioEvent.VOLUME_CHANGED, {
            category,
            volume
        });
    }
    
    /**
     * Get volume for a category
     * @param category Audio category
     * @returns Volume between 0 and 1
     */
    getCategoryVolume(category: AudioCategory): number {
        return this._state.volume[category];
    }
    
    /**
     * Set master volume
     * @param volume Volume between 0 and 1
     */
    setMasterVolume(volume: number): void {
        volume = Math.max(0, Math.min(1, volume));
        this._state.masterVolume = volume;
        
        // Update all instances
        this._activeInstances.forEach(instance => {
            instance.updateVolume(
                this._state.volume[instance.category],
                volume,
                this._state.muted[instance.category],
                this._state.masterMuted
            );
        });
        
        // Save settings
        this._saveAudioSettings();
        
        // Emit event
        EventManager.instance.emit(AudioEvent.VOLUME_CHANGED, {
            category: 'master',
            volume
        });
    }
    
    /**
     * Get master volume
     * @returns Volume between 0 and 1
     */
    getMasterVolume(): number {
        return this._state.masterVolume;
    }
    
    /**
     * Mute/unmute a category
     * @param category Audio category
     * @param muted Whether to mute or unmute
     */
    setCategoryMuted(category: AudioCategory, muted: boolean): void {
        this._state.muted[category] = muted;
        
        // Update all instances in this category
        this._activeInstances.forEach(instance => {
            if (instance.category === category) {
                instance.updateVolume(
                    this._state.volume[category],
                    this._state.masterVolume,
                    muted,
                    this._state.masterMuted
                );
            }
        });
        
        // Save settings
        this._saveAudioSettings();
        
        // Emit event
        EventManager.instance.emit(AudioEvent.MUTE_CHANGED, {
            category,
            muted
        });
    }
    
    /**
     * Check if a category is muted
     * @param category Audio category
     * @returns Whether the category is muted
     */
    isCategoryMuted(category: AudioCategory): boolean {
        return this._state.muted[category];
    }
    
    /**
     * Mute/unmute all audio
     * @param muted Whether to mute or unmute
     */
    setMasterMuted(muted: boolean): void {
        this._state.masterMuted = muted;
        
        // Update all instances
        this._activeInstances.forEach(instance => {
            instance.updateVolume(
                this._state.volume[instance.category],
                this._state.masterVolume,
                this._state.muted[instance.category],
                muted
            );
        });
        
        // Save settings
        this._saveAudioSettings();
        
        // Emit event
        EventManager.instance.emit(AudioEvent.MUTE_CHANGED, {
            category: 'master',
            muted
        });
    }
    
    /**
     * Check if master audio is muted
     * @returns Whether master audio is muted
     */
    isMasterMuted(): boolean {
        return this._state.masterMuted;
    }
    
    /**
     * Toggle mute for a category
     * @param category Audio category
     * @returns New mute state
     */
    toggleCategoryMute(category: AudioCategory): boolean {
        const newState = !this._state.muted[category];
        this.setCategoryMuted(category, newState);
        return newState;
    }
    
    /**
     * Toggle master mute
     * @returns New mute state
     */
    toggleMasterMute(): boolean {
        const newState = !this._state.masterMuted;
        this.setMasterMuted(newState);
        return newState;
    }
    
    /**
     * Set volume for a specific audio instance
     * @param instanceId Audio instance ID
     * @param volume Volume between 0 and 1
     */
    setInstanceVolume(instanceId: string, volume: number): void {
        const instance = this._activeInstances.get(instanceId);
        
        if (instance) {
            volume = Math.max(0, Math.min(1, volume));
            instance.originalVolume = volume;
            
            instance.updateVolume(
                this._state.volume[instance.category],
                this._state.masterVolume,
                this._state.muted[instance.category],
                this._state.masterMuted
            );
        }
    }
    
    /**
     * Update method called every frame
     * @param dt Delta time in seconds
     */
    private _update(dt: number): void {
        // Update audio transitions
        this._activeInstances.forEach((instance, id) => {
            if (instance.transitioning) {
                const crossFadeTarget = instance === this._state.currentMusic 
                    ? Array.from(this._activeInstances.values()).find(i => 
                        i !== instance && i.category === AudioCategory.MUSIC && i.transitioning)
                    : undefined;
                
                const complete = instance.updateTransition(dt, crossFadeTarget);
                
                // If fade out is complete, remove the instance
                if (complete && instance.transitionType === AudioTransition.FADE_OUT) {
                    this._activeInstances.delete(id);
                    
                    // If this was the current music, clear the reference
                    if (instance === this._state.currentMusic) {
                        this._state.currentMusic = undefined;
                    }
                }
            }
        });
    }
    
    /**
     * Get a clip from the cache by ID
     * @param id Clip ID
     * @returns Audio clip or undefined if not found
     */
    private _getClip(id: string): AudioClip | undefined {
        return this._clipsCache.get(id);
    }
    
    /**
     * Save audio settings to local storage
     */
    private _saveAudioSettings(): void {
        if (!sys.localStorage) {
            return;
        }
        
        const settings = {
            volume: this._state.volume,
            muted: this._state.muted,
            masterVolume: this._state.masterVolume,
            masterMuted: this._state.masterMuted
        };
        
        sys.localStorage.setItem('audioSettings', JSON.stringify(settings));
    }
    
    /**
     * Load audio settings from local storage
     */
    private _loadAudioSettings(): void {
        if (!sys.localStorage) {
            return;
        }
        
        const settingsString = sys.localStorage.getItem('audioSettings');
        
        if (settingsString) {
            try {
                const settings = JSON.parse(settingsString);
                
                // Apply loaded settings
                if (settings.volume) {
                    this._state.volume = settings.volume;
                }
                
                if (settings.muted) {
                    this._state.muted = settings.muted;
                }
                
                if (settings.masterVolume !== undefined) {
                    this._state.masterVolume = settings.masterVolume;
                }
                
                if (settings.masterMuted !== undefined) {
                    this._state.masterMuted = settings.masterMuted;
                }
            } catch (error) {
                console.warn('[AudioManager] Failed to load audio settings:', error);
            }
        }
    }
    
    onDestroy() {
        // Stop all audio
        this.stopAll();
        
        // Clear instance reference
        if (AudioManager._instance === this) {
            AudioManager._instance = null;
        }
    }
} 
/**
 * @file Singleton.ts
 * @description Provides singleton pattern implementation for Cocos Creator components
 */

import { _decorator, Component, Node, director } from 'cc';
const { ccclass } = _decorator;

/**
 * Singleton decorator options
 */
export interface SingletonOptions {
    /** Whether to make the node persistent across scene changes */
    persistent?: boolean;
    /** Custom name for the singleton node, defaults to class name */
    nodeName?: string;
    /** Whether to instantiate the singleton immediately on decoration */
    instantiateImmediately?: boolean;
    /** Custom initialization callback */
    onInit?: () => void;
}

/**
 * Type for class constructor
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Singleton error type
 */
export enum SingletonErrorType {
    DUPLICATE_INSTANCE = 'DUPLICATE_INSTANCE',
    INSTANCE_NOT_FOUND = 'INSTANCE_NOT_FOUND',
    INITIALIZATION_FAILED = 'INITIALIZATION_FAILED'
}

/**
 * Singleton error class
 */
export class SingletonError extends Error {
    type: SingletonErrorType;

    constructor(type: SingletonErrorType, message: string) {
        super(message);
        this.type = type;
        this.name = 'SingletonError';
    }
}

/**
 * Singleton decorator factory for Component classes
 * @param options Singleton configuration options
 * @returns Class decorator function
 */
export function Singleton(options: SingletonOptions = {}) {
    return function <T extends Constructor<Component>>(constructor: T) {
        const originalOnLoad = constructor.prototype.onLoad;
        const originalOnDestroy = constructor.prototype.onDestroy;
        
        // Define instance property on the constructor
        let instance: InstanceType<T> | null = null;
        
        // Define static property to get singleton instance
        Object.defineProperty(constructor, 'instance', {
            get: function() {
                if (!instance) {
                    const nodeName = options.nodeName || constructor.name;
                    const node = new Node(nodeName);
                    instance = node.addComponent(constructor) as InstanceType<T>;
                    
                    const currentScene = director.getScene();
                    if (currentScene) {
                        currentScene.addChild(node);
                        
                        if (options.persistent) {
                            director.addPersistRootNode(node);
                        }
                    } else {
                        console.warn(`[Singleton] Cannot add ${nodeName} to scene - no active scene`);
                    }
                    
                    if (options.onInit) {
                        try {
                            options.onInit();
                        } catch (error) {
                            throw new SingletonError(
                                SingletonErrorType.INITIALIZATION_FAILED,
                                `Failed to initialize singleton ${constructor.name}: ${error}`
                            );
                        }
                    }
                }
                return instance;
            },
            
            // Allow setting the instance (mainly for testing)
            set: function(value: InstanceType<T> | null) {
                instance = value;
            }
        });
        
        // Override onLoad to ensure singleton behavior
        constructor.prototype.onLoad = function(this: InstanceType<T>, ...args: any[]) {
            if (instance && instance !== this) {
                console.warn(`[Singleton] Duplicate instance of ${constructor.name} detected. Destroying duplicate.`);
                this.node.destroy();
                return;
            }
            
            instance = this;
            
            if (originalOnLoad) {
                originalOnLoad.apply(this, args);
            }
        };
        
        // Override onDestroy to clean up instance reference
        constructor.prototype.onDestroy = function(this: InstanceType<T>, ...args: any[]) {
            if (instance === this) {
                instance = null;
            }
            
            if (originalOnDestroy) {
                originalOnDestroy.apply(this, args);
            }
        };
        
        // Instantiate immediately if requested
        if (options.instantiateImmediately) {
            // Use setTimeout to ensure the class is fully defined before instantiation
            setTimeout(() => {
                (constructor as any).instance;
            }, 0);
        }
        
        return constructor;
    };
}

/**
 * Alternative singleton implementation using a base class instead of a decorator
 */
@ccclass('SingletonComponent')
export class SingletonComponent<T extends Component> extends Component {
    private static _instances: Map<Constructor<Component>, Component> = new Map();
    
    /**
     * Get the singleton instance of a component
     * @param type Component constructor
     * @returns The singleton instance
     */
    protected static getInstance<T extends Component>(type: Constructor<T>): T {
        if (!this._instances.has(type)) {
            const nodeName = type.name;
            const node = new Node(nodeName);
            const instance = node.addComponent(type);
            
            this._instances.set(type, instance);
            
            const currentScene = director.getScene();
            if (currentScene) {
                currentScene.addChild(node);
            } else {
                console.warn(`[SingletonComponent] Cannot add ${nodeName} to scene - no active scene`);
            }
        }
        
        return this._instances.get(type) as T;
    }
    
    /**
     * Make the node persistent across scene changes
     */
    protected makePersistent(): void {
        director.addPersistRootNode(this.node);
    }
    
    /**
     * Clear the singleton instance
     */
    protected clearInstance(): void {
        const constructor = this.constructor as any;
        SingletonComponent._instances.delete(constructor);
    }
    
    onDestroy() {
        this.clearInstance();
    }
} 
/**
 * @file PoolManager.ts
 * @description Object pooling system for efficient game object reuse
 */

import { _decorator, Component, Node, Prefab, instantiate, NodePool, Constructor } from 'cc';
import { Singleton } from '../core/Singleton';
const { ccclass, property } = _decorator;

/**
 * Configuration options for a pool
 */
export interface PoolOptions {
    /** Initial size of the pool */
    initialSize?: number;
    /** Whether to expand the pool automatically when empty */
    autoExpand?: boolean;
    /** Maximum size of the pool (0 for unlimited) */
    maxSize?: number;
    /** Whether to shrink the pool when objects are returned */
    autoShrink?: boolean;
    /** Target size for auto-shrinking */
    targetSize?: number;
    /** Callback for initializing a node when created */
    initializeCallback?: (node: Node) => void;
    /** Callback for resetting a node when returned to pool */
    resetCallback?: (node: Node) => void;
}

/**
 * Default pool options
 */
const DEFAULT_POOL_OPTIONS: PoolOptions = {
    initialSize: 5,
    autoExpand: true,
    maxSize: 0, // 0 means unlimited
    autoShrink: false,
    targetSize: 10
};

/**
 * Generic object pool for node-based objects
 */
export class Pool {
    /** The internal node pool */
    private _nodePool: NodePool;
    /** The prefab used to create objects */
    private _prefab: Prefab;
    /** Pool options */
    private _options: PoolOptions;
    /** Original parent node */
    private _originalParent: Node | null = null;
    /** Total node count (including active and pooled) */
    private _totalSize: number = 0;
    
    /**
     * Create a new pool
     * @param prefab Prefab to use for creating objects
     * @param options Pool options
     */
    constructor(prefab: Prefab, options: PoolOptions = {}) {
        this._prefab = prefab;
        this._options = { ...DEFAULT_POOL_OPTIONS, ...options };
        this._nodePool = new NodePool();
        
        // Initialize pool with initial size
        this._initializePool();
    }
    
    /**
     * Get a node from the pool or create a new one
     * @returns Node from the pool
     */
    get(): Node {
        let node: Node;
        
        // Check if pool has available nodes
        if (this._nodePool.size() > 0) {
            node = this._nodePool.get();
        } else {
            // No available nodes, create new if auto-expand is enabled
            if (this._options.autoExpand) {
                // Check if max size reached
                if (this._options.maxSize > 0 && this._totalSize >= this._options.maxSize) {
                    console.warn('[Pool] Max size reached, cannot expand pool further');
                    // Return a copy of the prefab but don't add it to the pool tracking
                    return instantiate(this._prefab);
                }
                
                // Create a new node
                node = this._createNode();
                this._totalSize++;
            } else {
                console.warn('[Pool] Pool is empty and auto-expand is disabled');
                // Return a copy of the prefab but don't add it to the pool tracking
                return instantiate(this._prefab);
            }
        }
        
        return node;
    }
    
    /**
     * Return a node to the pool
     * @param node Node to return
     */
    put(node: Node): void {
        // Check if max size reached and auto-shrink is enabled
        if (this._options.autoShrink && 
            this._options.maxSize > 0 && 
            this._nodePool.size() >= this._options.targetSize!) {
            // Instead of putting back to pool, destroy the node
            node.destroy();
            this._totalSize--;
            return;
        }
        
        // Reset node state if reset callback provided
        if (this._options.resetCallback) {
            this._options.resetCallback(node);
        }
        
        // Put node back in the pool
        this._nodePool.put(node);
    }
    
    /**
     * Clear the pool, destroying all nodes
     */
    clear(): void {
        this._nodePool.clear();
        this._totalSize = 0;
    }
    
    /**
     * Get the current pool size (available nodes)
     * @returns Number of available nodes
     */
    size(): number {
        return this._nodePool.size();
    }
    
    /**
     * Get the total number of nodes in the pool (including active)
     * @returns Total number of nodes
     */
    totalSize(): number {
        return this._totalSize;
    }
    
    /**
     * Initialize the pool with nodes
     * @private
     */
    private _initializePool(): void {
        const initialSize = this._options.initialSize || 0;
        
        for (let i = 0; i < initialSize; i++) {
            const node = this._createNode();
            this._nodePool.put(node);
            this._totalSize++;
        }
    }
    
    /**
     * Create a new node from the prefab
     * @private
     * @returns New node
     */
    private _createNode(): Node {
        const node = instantiate(this._prefab);
        
        // Initialize node if initialize callback provided
        if (this._options.initializeCallback) {
            this._options.initializeCallback(node);
        }
        
        return node;
    }
}

/**
 * Generic type-safe object pool
 * @template T Component type
 */
export class TypedPool<T extends Component> {
    /** The internal pool */
    private _pool: Pool;
    /** Component constructor */
    private _componentType: Constructor<T>;
    /** Pool options */
    private _options: PoolOptions;
    
    /**
     * Create a new typed pool
     * @param prefab Prefab to use for creating objects
     * @param componentType Component constructor
     * @param options Pool options
     */
    constructor(prefab: Prefab, componentType: Constructor<T>, options: PoolOptions = {}) {
        this._componentType = componentType;
        this._options = { ...options };
        
        // Create a wrapper initialize callback to ensure component exists
        const originalInitCallback = options.initializeCallback;
        const initCallback = (node: Node) => {
            // Make sure the component exists on the node
            if (!node.getComponent(componentType)) {
                console.warn(`[TypedPool] Prefab does not have component ${componentType.name}, adding it`);
                node.addComponent(componentType);
            }
            
            // Call original init callback if exists
            if (originalInitCallback) {
                originalInitCallback(node);
            }
        };
        
        this._options.initializeCallback = initCallback;
        this._pool = new Pool(prefab, this._options);
    }
    
    /**
     * Get a component from the pool
     * @returns Component from the pool
     */
    get(): T {
        const node = this._pool.get();
        const component = node.getComponent(this._componentType);
        
        if (!component) {
            console.error(`[TypedPool] Node from pool does not have component ${this._componentType.name}`);
            throw new Error(`Node from pool does not have component ${this._componentType.name}`);
        }
        
        return component;
    }
    
    /**
     * Return a component to the pool
     * @param component Component to return
     */
    put(component: T): void {
        this._pool.put(component.node);
    }
    
    /**
     * Clear the pool
     */
    clear(): void {
        this._pool.clear();
    }
    
    /**
     * Get the current pool size
     * @returns Number of available components
     */
    size(): number {
        return this._pool.size();
    }
    
    /**
     * Get the total number of components in the pool (including active)
     * @returns Total number of components
     */
    totalSize(): number {
        return this._pool.totalSize();
    }
}

/**
 * Pool manager singleton for managing multiple pools
 */
@ccclass('PoolManager')
@Singleton({ persistent: true })
export class PoolManager extends Component {
    // Static reference for access before initialization
    static _instance: PoolManager | null = null;
    
    /** Node pools by key */
    private _pools: Map<string, Pool> = new Map();
    
    /** Typed pools by key */
    private _typedPools: Map<string, TypedPool<any>> = new Map();
    
    /** Get the singleton instance */
    static get instance(): PoolManager {
        return PoolManager._instance!;
    }
    
    onLoad() {
        PoolManager._instance = this;
    }
    
    /**
     * Create or get a pool
     * @param key Pool identifier
     * @param prefab Prefab to use for creating objects
     * @param options Pool options
     * @returns The pool
     */
    createPool(key: string, prefab: Prefab, options: PoolOptions = {}): Pool {
        if (this._pools.has(key)) {
            console.warn(`[PoolManager] Pool with key ${key} already exists, returning existing pool`);
            return this._pools.get(key)!;
        }
        
        const pool = new Pool(prefab, options);
        this._pools.set(key, pool);
        
        return pool;
    }
    
    /**
     * Get a pool by key
     * @param key Pool identifier
     * @returns The pool or undefined if not found
     */
    getPool(key: string): Pool | undefined {
        return this._pools.get(key);
    }
    
    /**
     * Check if a pool exists
     * @param key Pool identifier
     * @returns Whether the pool exists
     */
    hasPool(key: string): boolean {
        return this._pools.has(key);
    }
    
    /**
     * Create or get a typed pool
     * @param key Pool identifier
     * @param prefab Prefab to use for creating objects
     * @param componentType Component constructor
     * @param options Pool options
     * @returns The typed pool
     */
    createTypedPool<T extends Component>(
        key: string, 
        prefab: Prefab, 
        componentType: Constructor<T>, 
        options: PoolOptions = {}
    ): TypedPool<T> {
        if (this._typedPools.has(key)) {
            console.warn(`[PoolManager] Typed pool with key ${key} already exists, returning existing pool`);
            return this._typedPools.get(key) as TypedPool<T>;
        }
        
        const pool = new TypedPool<T>(prefab, componentType, options);
        this._typedPools.set(key, pool);
        
        return pool;
    }
    
    /**
     * Get a typed pool by key
     * @param key Pool identifier
     * @returns The typed pool or undefined if not found
     */
    getTypedPool<T extends Component>(key: string): TypedPool<T> | undefined {
        return this._typedPools.get(key) as TypedPool<T> | undefined;
    }
    
    /**
     * Check if a typed pool exists
     * @param key Pool identifier
     * @returns Whether the typed pool exists
     */
    hasTypedPool(key: string): boolean {
        return this._typedPools.has(key);
    }
    
    /**
     * Get a node from a pool, creating the pool if it doesn't exist
     * @param key Pool identifier
     * @param prefab Prefab to use for creating objects
     * @param options Pool options
     * @returns Node from the pool
     */
    get(key: string, prefab: Prefab, options: PoolOptions = {}): Node {
        let pool: Pool;
        
        if (this.hasPool(key)) {
            pool = this.getPool(key)!;
        } else {
            pool = this.createPool(key, prefab, options);
        }
        
        return pool.get();
    }
    
    /**
     * Get a component from a typed pool, creating the pool if it doesn't exist
     * @param key Pool identifier
     * @param prefab Prefab to use for creating objects
     * @param componentType Component constructor
     * @param options Pool options
     * @returns Component from the pool
     */
    getTyped<T extends Component>(
        key: string, 
        prefab: Prefab, 
        componentType: Constructor<T>, 
        options: PoolOptions = {}
    ): T {
        let pool: TypedPool<T>;
        
        if (this.hasTypedPool(key)) {
            pool = this.getTypedPool<T>(key)!;
        } else {
            pool = this.createTypedPool<T>(key, prefab, componentType, options);
        }
        
        return pool.get();
    }
    
    /**
     * Return a node to a pool
     * @param key Pool identifier
     * @param node Node to return
     */
    put(key: string, node: Node): void {
        if (!this.hasPool(key)) {
            console.warn(`[PoolManager] No pool found with key ${key}, node will be destroyed`);
            node.destroy();
            return;
        }
        
        const pool = this.getPool(key)!;
        pool.put(node);
    }
    
    /**
     * Return a component to a typed pool
     * @param key Pool identifier
     * @param component Component to return
     */
    putTyped<T extends Component>(key: string, component: T): void {
        if (!this.hasTypedPool(key)) {
            console.warn(`[PoolManager] No typed pool found with key ${key}, node will be destroyed`);
            component.node.destroy();
            return;
        }
        
        const pool = this.getTypedPool<T>(key)!;
        pool.put(component);
    }
    
    /**
     * Clear a specific pool
     * @param key Pool identifier
     */
    clearPool(key: string): void {
        if (this.hasPool(key)) {
            const pool = this.getPool(key)!;
            pool.clear();
            this._pools.delete(key);
        }
        
        if (this.hasTypedPool(key)) {
            const pool = this.getTypedPool(key)!;
            pool.clear();
            this._typedPools.delete(key);
        }
    }
    
    /**
     * Clear all pools
     */
    clearAllPools(): void {
        this._pools.forEach(pool => pool.clear());
        this._typedPools.forEach(pool => pool.clear());
        
        this._pools.clear();
        this._typedPools.clear();
    }
    
    onDestroy() {
        this.clearAllPools();
        
        // Clear instance reference
        if (PoolManager._instance === this) {
            PoolManager._instance = null;
        }
    }
} 
/**
 * @file EventManager.ts
 * @description Implementation of the Observer pattern for events with type safety
 */

import { _decorator, Component, EventTarget, log } from 'cc';
import { Singleton } from './Singleton';
const { ccclass } = _decorator;

/**
 * Event priority levels
 */
export enum EventPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}

/**
 * Event listener entry
 */
interface EventListenerEntry<T = any> {
    /** The callback function */
    callback: (eventData?: T) => void;
    /** The target object */
    target?: object;
    /** Whether this is a one-time listener */
    once: boolean;
    /** Event priority */
    priority: EventPriority;
}

/**
 * Event channel - groups related events
 */
export class EventChannel {
    private _eventTarget: EventTarget = new EventTarget();
    private _listenerMap: Map<string, EventListenerEntry[]> = new Map();

    /**
     * Register an event listener
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     * @param priority Event priority
     */
    on<T>(
        eventName: string,
        callback: (eventData?: T) => void,
        target?: object,
        priority: EventPriority = EventPriority.NORMAL
    ): void {
        if (!this._listenerMap.has(eventName)) {
            this._listenerMap.set(eventName, []);
        }

        const listeners = this._listenerMap.get(eventName)!;

        // Check if listener already exists to prevent duplicates
        const existingListener = listeners.find(l =>
            l.callback === callback && l.target === target
        );

        if (existingListener) {
            console.warn(`[EventChannel] Listener already registered for event ${eventName}`);
            return;
        }

        listeners.push({
            callback,
            target,
            once: false,
            priority
        });

        // Sort listeners by priority (high to low)
        listeners.sort((a, b) => b.priority - a.priority);

        this._eventTarget.on(eventName, callback, target);
    }

    /**
     * Register a one-time event listener
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     * @param priority Event priority
     */
    once<T>(
        eventName: string,
        callback: (eventData?: T) => void,
        target?: object,
        priority: EventPriority = EventPriority.NORMAL
    ): void {
        if (!this._listenerMap.has(eventName)) {
            this._listenerMap.set(eventName, []);
        }

        const listeners = this._listenerMap.get(eventName)!;

        const wrappedCallback = (eventData?: T) => {
            callback(eventData);

            // Remove from our listener map
            const index = listeners.findIndex(l =>
                l.callback === wrappedCallback && l.target === target
            );

            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };

        listeners.push({
            callback: wrappedCallback,
            target,
            once: true,
            priority
        });

        // Sort listeners by priority
        listeners.sort((a, b) => b.priority - a.priority);

        this._eventTarget.once(eventName, wrappedCallback, target);
    }

    /**
     * Emit an event
     * @param eventName Event name
     * @param eventData Event data
     */
    emit<T>(eventName: string, eventData?: T): void {
        this._eventTarget.emit(eventName, eventData);
    }

    /**
     * Remove an event listener
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    off(eventName: string, callback?: ((...args: any[]) => void), target?: object): void {
        if (!eventName) {
            console.warn('[EventChannel] Event name is required to remove a listener');
            return;
        }

        this._eventTarget.off(eventName, callback, target);

        // Update our listener map
        if (this._listenerMap.has(eventName)) {
            const listeners = this._listenerMap.get(eventName)!;

            if (callback) {
                const index = listeners.findIndex(l =>
                    l.callback === callback && (!target || l.target === target)
                );

                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            } else {
                // If no callback is provided, remove all listeners for this event and target
                if (target) {
                    const newListeners = listeners.filter(l => l.target !== target);
                    this._listenerMap.set(eventName, newListeners);
                } else {
                    // If no target is provided, remove all listeners for this event
                    this._listenerMap.delete(eventName);
                }
            }
        }
    }

    /**
     * Remove all listeners for a specific target
     * @param target Target object
     */
    targetOff(target: object): void {
        if (!target) {
            console.warn('[EventChannel] Target is required to remove listeners');
            return;
        }

        this._eventTarget.targetOff(target);

        // Update our listener map
        this._listenerMap.forEach((listeners, eventName) => {
            const newListeners = listeners.filter(l => l.target !== target);

            if (newListeners.length === 0) {
                this._listenerMap.delete(eventName);
            } else {
                this._listenerMap.set(eventName, newListeners);
            }
        });
    }

    /**
     * Check if an event has listeners
     * @param eventName Event name
     * @returns Whether the event has listeners
     */
    hasEventListener(eventName: string): boolean {
        return this._listenerMap.has(eventName) && this._listenerMap.get(eventName)!.length > 0;
    }

    /**
     * Remove all listeners
     */
    removeAll(): void {
        this._listenerMap.clear();

        // Create a new EventTarget to ensure all listeners are removed
        this._eventTarget = new EventTarget();
    }
}

/**
 * Event manager singleton for the global event bus
 */
@ccclass('EventManager')
@Singleton({ persistent: true })
export class EventManager extends Component {
    /** Global event channel */
    private _globalChannel: EventChannel = new EventChannel();

    /** Named channels for grouping events */
    private _channels: Map<string, EventChannel> = new Map();

    // Static reference needed to access instance before it's created
    static _instance: EventManager | null = null;

    /**
     * Get the singleton instance
     */
    static get instance(): EventManager {
        if (!EventManager._instance) {
            // The instance will be created using the Singleton decorator
            // This access will trigger the decorator's getter
        }
        return EventManager._instance as EventManager;
    }

    /**
     * Called when the component is loaded
     */
    onLoad() {
        EventManager._instance = this;
    }

    /**
     * Get a named channel, creating it if it doesn't exist
     * @param channelName Channel name
     * @returns Event channel
     */
    getChannel(channelName: string): EventChannel {
        if (!this._channels.has(channelName)) {
            this._channels.set(channelName, new EventChannel());
        }

        return this._channels.get(channelName)!;
    }

    /**
     * Register an event listener on the global channel
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     * @param priority Event priority
     */
    on<T>(
        eventName: string,
        callback: (eventData?: T) => void,
        target?: object,
        priority: EventPriority = EventPriority.NORMAL
    ): void {
        this._globalChannel.on(eventName, callback, target, priority);
    }

    /**
     * Register a one-time event listener on the global channel
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     * @param priority Event priority
     */
    once<T>(
        eventName: string,
        callback: (eventData?: T) => void,
        target?: object,
        priority: EventPriority = EventPriority.NORMAL
    ): void {
        this._globalChannel.once(eventName, callback, target, priority);
    }

    /**
     * Emit an event on the global channel
     * @param eventName Event name
     * @param eventData Event data
     */
    emit<T>(eventName: string, eventData?: T): void {
        this._globalChannel.emit(eventName, eventData);
    }

    /**
     * Remove an event listener from the global channel
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    off(eventName: string, callback?: ((...args: any[]) => void), target?: object): void {
        this._globalChannel.off(eventName, callback, target);
    }

    /**
     * Remove all listeners for a specific target from the global channel
     * @param target Target object
     */
    targetOff(target: object): void {
        this._globalChannel.targetOff(target);

        // Also remove from all named channels
        this._channels.forEach(channel => {
            channel.targetOff(target);
        });
    }

    /**
     * Check if an event has listeners on the global channel
     * @param eventName Event name
     * @returns Whether the event has listeners
     */
    hasEventListener(eventName: string): boolean {
        return this._globalChannel.hasEventListener(eventName);
    }

    /**
     * Remove all listeners from the global channel
     */
    removeAll(): void {
        this._globalChannel.removeAll();
    }

    /**
     * Remove all listeners from all channels
     */
    removeAllChannels(): void {
        this._globalChannel.removeAll();

        this._channels.forEach(channel => {
            channel.removeAll();
        });

        this._channels.clear();
    }

    onDestroy() {
        this.removeAllChannels();
        if (EventManager._instance === this) {
            EventManager._instance = null;
        }
    }
}

/**
 * Event utility to be used in component classes
 */
export class EventUtil {
    /**
     * Register an event listener with automatic cleanup on component destruction
     * @param component Component that will be responsible for the listener
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object (defaults to component)
     * @param channel Optional channel name
     * @param priority Event priority
     */
    static on<T>(
        component: Component,
        eventName: string,
        callback: (eventData?: T) => void,
        target?: object,
        channel?: string,
        priority: EventPriority = EventPriority.NORMAL
    ): void {
        if (!component) {
            console.warn('[EventUtil] Component is required for auto-cleanup');
            return;
        }

        // Use the component as the target if none is provided
        const actualTarget = target || component;

        // Add the event listener
        if (channel) {
            EventManager.instance.getChannel(channel).on(eventName, callback, actualTarget, priority);
        } else {
            EventManager.instance.on(eventName, callback, actualTarget, priority);
        }

        // Store the original onDestroy method
        const originalOnDestroy = component['onDestroy'] as Function | undefined;

        // Set a new onDestroy method that will clean up this listener
        (component as any)['onDestroy'] = function (this: Component) {
            if (channel) {
                EventManager.instance.getChannel(channel).off(eventName, callback as ((...args: any[]) => void), actualTarget);
            } else {
                EventManager.instance.off(eventName, callback as ((...args: any[]) => void), actualTarget);
            }

            if (originalOnDestroy) {
                originalOnDestroy.call(this);
            }
        };
    }
} 
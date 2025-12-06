import { ObserverNotificationManager, type Observable, type Observer } from "./Observable";

/**
 * Basic interface for items that have an entropy value.
 */
interface EntropyItem {
  /** The entropy value of the item */
  entropy: number;
}

/**
 * Event map for entropy item notifications.
 * @template T - The type of the entropy item
 */
type EntropyItemEventMap<T extends EntropyItem> = {
  /** Fired when an item's entropy value changes */
  entropyChanged: { item: T; oldValue: number };
}

/**
 * Abstract base class for items that have observable entropy values.
 * Implements both Observable and EntropyItem interfaces to allow items
 * to notify observers when their entropy changes.
 */
export abstract class ObservableEntropyItem implements Observable<EntropyItemEventMap<ObservableEntropyItem>>, EntropyItem {
  private _entropy: number;
  private readonly _notificationManager: ObserverNotificationManager<EntropyItemEventMap<ObservableEntropyItem>>;

  /**
   * Creates a new observable entropy item.
   * @param initialEntropy - The initial entropy value (defaults to 0)
   */
  constructor(initialEntropy: number = 0) {
    this._entropy = initialEntropy;
    this._notificationManager = new ObserverNotificationManager<EntropyItemEventMap<ObservableEntropyItem>>();
  }

  /**
   * Subscribes an observer to a specific event type.
   * @template EventType - The type of event to subscribe to
   * @param event - The event name to subscribe to
   * @param observer - The observer function to call when the event occurs
   */
  subscribe<EventType extends keyof EntropyItemEventMap<ObservableEntropyItem>>(event: EventType, observer: Observer<EntropyItemEventMap<ObservableEntropyItem>[EventType]>): void {
    this._notificationManager.subscribe(event, observer);
  }

  /**
   * Unsubscribes an observer from a specific event type.
   * @template EventType - The type of event to unsubscribe from
   * @param event - The event name to unsubscribe from
   * @param observer - The observer function to remove
   */
  unsubscribe<EventType extends keyof EntropyItemEventMap<ObservableEntropyItem>>(event: EventType, observer: Observer<EntropyItemEventMap<ObservableEntropyItem>[EventType]>): void {
    this._notificationManager.unsubscribe(event, observer);
  }

  /**
   * Sets the initial entropy value without triggering notifications.
   * This should be called only during construction or when you need to
   * update entropy without notifying observers.
   * @param entropy - The entropy value to set
   */
  protected _initializeEntropy(entropy: number): void {
    this._entropy = entropy;
  }

  /**
   * Gets the current entropy value.
   * @returns The current entropy value
   */
  get entropy(): number {
    return this._entropy;
  }

  /**
   * Sets the entropy value and notifies observers if the value changed.
   * @param entropy - The new entropy value to set
   */
  set entropy(entropy: number) {
    const oldValue = this._entropy;
    this._entropy = entropy;
    if (oldValue !== entropy) {
      this._notificationManager.notify("entropyChanged", { item: this, oldValue });
    }
  }
}

/**
 * A priority queue that dynamically updates item positions based on their entropy.
 * Elements must extend `ObservableEntropyItem` so they can notify the queue of entropy changes.
 * 
 * The queue maintains items in ascending order of entropy (lowest entropy has highest priority).
 * When an item's entropy changes, the queue automatically repositions it to maintain sorted order.
 * 
 * @template T - The type of items stored in the queue, must extend ObservableEntropyItem
 */
export class DynamicEntropyQueue<T extends ObservableEntropyItem> {
  /** Internal array storing items in ascending order of entropy */
  protected readonly _items: T[] = [];

  /** Observer function that handles entropy change notifications from items */
  protected readonly _onEntropyChanged: Observer<EntropyItemEventMap<ObservableEntropyItem>["entropyChanged"]>;
  
  /**
   * Creates a new dynamic entropy queue.
   * @param items - Optional array of initial items to add to the queue
   */
  constructor(items: T[] = []) {
    this._onEntropyChanged = (data) => {
      const item = data.item as T;
      const oldIndex = this._items.indexOf(item);
      
      if (oldIndex === -1) {
        return;
      }
      
      this._items.splice(oldIndex, 1);
      this._items.splice(this._findInsertIndex(item), 0, item);
    }

    this.enqueueAll(items);
  }

  /**
   * Gets the number of items currently in the queue.
   * @returns The number of items in the queue
   */
  get size(): number {
    return this._items.length;
  }

  /**
   * Checks if the queue is empty.
   * @returns True if the queue has no items, false otherwise
   */
  get isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Adds a single item to the queue in the correct position based on its entropy.
   * The item will be automatically repositioned if its entropy changes while in the queue.
   * @param item - The item to add to the queue
   */
  enqueue(item: T): void {

    if (this.size === 0 || item.entropy >= this._items[this.size - 1].entropy) {
      this._items.push(item);
    } else if(item.entropy <= this._items[0].entropy) {
      this._items.unshift(item);
    } else {
      const index = this._findInsertIndex(item);
      this._items.splice(index, 0, item);
    }

    item.subscribe("entropyChanged", this._onEntropyChanged);
  }

  /**
   * Adds multiple items to the queue.
   * Each item will be positioned correctly based on its entropy.
   * @param items - Array of items to add to the queue
   */
  enqueueAll(items: T[]): void {
    for (const item of items) {
      this.enqueue(item);
    }
  }

  /**
   * Finds the correct insertion index for an item using binary search.
   * Maintains ascending order of entropy values.
   * @param item - The item to find the insertion index for
   * @returns The index where the item should be inserted
   */
  protected _findInsertIndex(item: T): number {
    let low = 0;
    let high = this._items.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this._items[mid].entropy > item.entropy) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    return low;
  }

  /**
   * Removes and returns the item with the lowest entropy (highest priority).
   * Also unsubscribes from the item's entropy change notifications.
   * @returns The item with lowest entropy, or undefined if queue is empty
   */
  dequeue(): T | undefined {
    const item = this._items.shift();
    if (item) {
      item.unsubscribe("entropyChanged", this._onEntropyChanged);
    }
    return item;
  }

  /**
   * Returns the item with the lowest entropy without removing it from the queue.
   * @returns The item with lowest entropy, or undefined if queue is empty
   */
  peek(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    return this._items[0];
  }

  /**
   * Returns all items that have the same entropy as the lowest entropy item.
   * This is useful for randomly selecting from items with equal priority.
   * @returns Array of items with the same entropy as the first item, or empty array if queue is empty
   */
  peekEqualEntropy(): T[] {
    const firstItem = this.peek();
    if (firstItem === undefined) {
      return [];
    }

    const result: T[] = [];

    for (const item of this._items) {
      if (item.entropy !== firstItem.entropy) {
        break;
      }
      result.push(item);
    }

    return result;
  }

}

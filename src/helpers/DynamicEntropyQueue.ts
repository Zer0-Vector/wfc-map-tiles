import { ObserverNotificationManager, type Observable, type Observer } from "./Observable";

interface EntropyItem {
  entropy: number;
}

type EntropyItemEventMap<T extends EntropyItem> = {
  entropyChanged: { item: T; oldValue: number };
}

export abstract class ObservableEntropyItem implements Observable<EntropyItemEventMap<ObservableEntropyItem>>, EntropyItem {
  private _entropy: number;
  private readonly _notificationManager: ObserverNotificationManager<EntropyItemEventMap<ObservableEntropyItem>>;

  constructor(initialEntropy: number = 0) {
    this._entropy = initialEntropy;
    this._notificationManager = new ObserverNotificationManager<EntropyItemEventMap<ObservableEntropyItem>>();
  }

  subscribe<EventType extends keyof EntropyItemEventMap<ObservableEntropyItem>>(event: EventType, observer: Observer<EntropyItemEventMap<ObservableEntropyItem>[EventType]>): void {
    this._notificationManager.subscribe(event, observer);
  }

  unsubscribe<EventType extends keyof EntropyItemEventMap<ObservableEntropyItem>>(event: EventType, observer: Observer<EntropyItemEventMap<ObservableEntropyItem>[EventType]>): void {
    this._notificationManager.unsubscribe(event, observer);
  }

  /**
   * Sets the initial entropy value without triggering notifications.
   * This should be called only during construction.
   */
  protected _initializeEntropy(entropy: number): void {
    this._entropy = entropy;
  }

  get entropy(): number {
    return this._entropy;
  }

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
 */
export class DynamicEntropyQueue<T extends ObservableEntropyItem> {
  protected readonly _items: T[] = []; // sorted array, ascending entropy

  protected readonly _onEntropyChanged: Observer<EntropyItemEventMap<ObservableEntropyItem>["entropyChanged"]>;
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

    for (const item of items) {
      this.enqueue(item);
    }
  }

  get size(): number {
    return this._items.length;
  }

  get isEmpty(): boolean {
    return this.size === 0;
  }

  enqueue(item: T): void {
    const index = this._findInsertIndex(item);
    this._items.splice(index, 0, item);
    item.subscribe("entropyChanged", this._onEntropyChanged);
  }

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

  dequeue(): T | undefined {
    const item = this._items.shift();
    if (item) {
      item.unsubscribe("entropyChanged", this._onEntropyChanged);
    }
    return item;
  }

  peek(): T | undefined {
    return this._items[0];
  }

}

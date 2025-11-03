import { ObserverNotificationManager, type Observable, type Observer } from "./Observable";

type PrioritizedEventMap<T extends PrioritizedItem> = {
  priorityChanged: { item: T; oldPriority: number };
}

export abstract class PrioritizedItem implements Observable<PrioritizedEventMap<PrioritizedItem>>{
  private _priority: number;
  private readonly _notificationManager: ObserverNotificationManager<PrioritizedEventMap<PrioritizedItem>>;

  constructor(priority: number = 0) {
    this._priority = priority;
    this._notificationManager = new ObserverNotificationManager<PrioritizedEventMap<PrioritizedItem>>();
  }

  subscribe<K extends keyof PrioritizedEventMap<PrioritizedItem>>(event: K, observer: Observer<PrioritizedEventMap<PrioritizedItem>[K]>): void {
    this._notificationManager.subscribe(event, observer);
  }

  unsubscribe<K extends keyof PrioritizedEventMap<PrioritizedItem>>(event: K, observer: Observer<PrioritizedEventMap<PrioritizedItem>[K]>): void {
    this._notificationManager.unsubscribe(event, observer);
  }

  get priority(): number {
    return this._priority;
  }

  set priority(newPriority: number) {
    const oldPriority = this._priority;
    this._priority = newPriority;
    this._notificationManager.notify("priorityChanged", { item: this, oldPriority });
  }
}


export class DynamicPriorityQueue<T extends PrioritizedItem> {
  protected readonly _items: T[] = []; // sorted array, ascending priority

  protected readonly _onPriorityChanged: Observer<PrioritizedEventMap<PrioritizedItem>["priorityChanged"]>;
  constructor(items: T[] = []) {

    this._onPriorityChanged = (data) => {
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
    item.subscribe("priorityChanged", this._onPriorityChanged);
  }

  protected _findInsertIndex(item: T): number {
    let low = 0;
    let high = this._items.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this._items[mid].priority > item.priority) {
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
      item.unsubscribe("priorityChanged", this._onPriorityChanged);
    }
    return item;
  }

  peek(): T | undefined {
    return this._items[0];
  }

}

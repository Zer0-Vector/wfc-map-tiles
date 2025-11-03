export type Observer<T> = (data: T) => void;


export interface Observable<EventDataMap> {
  subscribe<EventType extends keyof EventDataMap>(event: EventType, observer: Observer<EventDataMap[EventType]>): void;
  unsubscribe<EventType extends keyof EventDataMap>(event: EventType, observer: Observer<EventDataMap[EventType]>): void;
}

type ObserverCollection<InputMap extends Record<string, unknown>> = {
  [K in keyof InputMap]: Observer<InputMap[K]>[];
};

export class ObserverNotificationManager<EventMap extends Record<string, unknown>> implements Observable<EventMap> {
  protected readonly _subscribers: ObserverCollection<EventMap>;

  constructor() {
    this._subscribers = {} as ObserverCollection<EventMap>;
  }

  subscribe<EventType extends keyof EventMap>(eventType: EventType, observer: Observer<EventMap[EventType]>): void {
    if (!this._subscribers[eventType]) {
      this._subscribers[eventType] = [];
    }
    this._subscribers[eventType].push(observer);
  }

  unsubscribe<EventType extends keyof EventMap>(eventType: EventType, observer: Observer<EventMap[EventType]>): void {
    const observers = this._subscribers[eventType];
    if (!observers) {
      return;
    }

    const index = observers.indexOf(observer);
    if (index !== -1) {
      observers.splice(index, 1);
    }
  }

  notify<EventType extends keyof EventMap>(eventName: EventType, data: EventMap[EventType]): void {
    const observers = this._subscribers[eventName];
    if (!observers) {
      return;
    }
    
    for (const observer of observers) {
      observer(data);
    }
  }
}
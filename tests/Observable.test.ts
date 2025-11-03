import { ObserverNotificationManager } from "@/helpers/Observable";

describe("ObserverNotificationManager", () => {
  it("notifies subscribed observers", () => {
    const manager = new ObserverNotificationManager<{ testEvent: number }>();
    const observer = vi.fn();
    const observer2 = vi.fn();

    manager.subscribe("testEvent", observer);
    manager.notify("testEvent", 42);
    
    expect(observer).toHaveBeenCalledWith(42);
    expect(observer2).not.toHaveBeenCalled();

    manager.subscribe("testEvent", observer2);
    manager.notify("testEvent", 100);
    
    expect(observer).toHaveBeenCalledWith(100);
    expect(observer2).toHaveBeenCalledWith(100);
  });

  it("does not notify unsubscribed observers", () => {
    const manager = new ObserverNotificationManager<{ testEvent: number }>();
    const observer = vi.fn();
    const observer2 = vi.fn();
    manager.subscribe("testEvent", observer);
    manager.subscribe("testEvent", observer2);
    
    manager.unsubscribe("testEvent", observer);
    manager.notify("testEvent", 42);

    expect(observer).not.toHaveBeenCalled();
    expect(observer2).toHaveBeenCalledWith(42);

    manager.unsubscribe("testEvent", observer2);
    manager.notify("testEvent", 100);

    expect(observer).not.toHaveBeenCalled();
    expect(observer2).not.toHaveBeenCalledWith(100);
  });
});

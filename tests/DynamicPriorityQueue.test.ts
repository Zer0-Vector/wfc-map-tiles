import { DynamicEntropyQueue, ObservableEntropyItem } from "@/helpers/DynamicEntropyQueue";

class TestItem extends ObservableEntropyItem {
  name: string;

  constructor(name: string, entropy: number) {
    super(entropy);
    this.name = name;
  }
}

describe("ObservableEntropyItem", () => {
  it("constructor sets initial entropy", () => {
    const item = new TestItem("test", 5);
    
    expect(item.entropy).toBe(5);
  });

  it("sets entropy and notifies observers", () => {
    const item = new TestItem("test", 5);
    const mockObserver = vi.fn();
    const mockObserver2 = vi.fn();
    item.subscribe("entropyChanged", mockObserver);
    item.subscribe("entropyChanged", mockObserver2);

    item.entropy = 10;

    expect(item.entropy).toBe(10);
    expect(mockObserver).toHaveBeenCalledWith({ item, oldValue: 5 });
    expect(mockObserver).toHaveBeenCalledTimes(1);
    expect(mockObserver2).toHaveBeenCalledWith({ item, oldValue: 5 });
    expect(mockObserver2).toHaveBeenCalledTimes(1);
  });

  it("does not notify observers if entropy is unchanged", () => {
    const item = new TestItem("test", 5);
    const mockObserver = vi.fn();
    item.subscribe("entropyChanged", mockObserver);
    
    item.entropy = 5;
    
    expect(mockObserver).not.toHaveBeenCalled();
  });

  it("unsubscribed observers are not notified", () => {
    const item = new TestItem("test", 5);
    const mockObserver = vi.fn();
    const mockObserver2 = vi.fn();
    item.subscribe("entropyChanged", mockObserver);
    item.subscribe("entropyChanged", mockObserver2);

    item.entropy = 10;
    item.unsubscribe("entropyChanged", mockObserver);
    item.entropy = 15;
    
    expect(mockObserver).toHaveBeenCalledTimes(1);
    expect(mockObserver2).toHaveBeenCalledTimes(2);
  });
});

class TestDynamicPriorityQueue extends DynamicEntropyQueue<TestItem> {
  // This simplifies test code and allows exposing internals if needed in the future
}

describe('DynamicPriorityQueue', () => {
  it("constructor initializes an empty queue", () => {
    const pq = new TestDynamicPriorityQueue();
    
    expect(pq.size).toBe(0);
    expect(pq.isEmpty).toBe(true);
  });

  it("constructor initializes with items", () => {
    const items: TestItem[] = [
      new TestItem("task1", 1),
      new TestItem("task2", 2),
    ];

    const pq = new TestDynamicPriorityQueue(items);
    
    expect(pq.size).toBe(2);
    expect(pq.isEmpty).toBe(false);
  });

  it("enqueue adds items to the queue", () => {
    const pq = new TestDynamicPriorityQueue();

    pq.enqueue(new TestItem("task1", 1));
    
    expect(pq.size).toBe(1);
    
    pq.enqueue(new TestItem("task2", 2));
    
    expect(pq.size).toBe(2);
  });

  it("dequeue removes lowest priority item", () => {
    const pq = new TestDynamicPriorityQueue();
    pq.enqueue(new TestItem("task2", 2));
    pq.enqueue(new TestItem("task1", 1));

    const item = pq.dequeue();

    expect(item?.name).toBe("task1");
    expect(pq.size).toBe(1);
  });

  it("peek returns lowest priority item without removing it", () => {
    const pq = new TestDynamicPriorityQueue();
    pq.enqueue(new TestItem("task2", 2));
    pq.enqueue(new TestItem("task1", 1));

    const item = pq.peek();

    expect(item?.name).toBe("task1");
    expect(pq.size).toBe(2);
  });

  it("updates item position on priority change", () => {
    const pq = new TestDynamicPriorityQueue();
    const item1 = new TestItem("task1", 2);
    const item2 = new TestItem("task2", 1);

    pq.enqueue(item1);
    pq.enqueue(item2);
    
    expect(pq.peek()?.name).toBe("task2");
    
    item1.entropy = 0; 
    const updatedItem = pq.dequeue();

    expect(updatedItem?.name).toBe("task1");
  });

  it("peekEqualEntropy returns empty array for empty queue", () => {
    const pq = new TestDynamicPriorityQueue();

    const items = pq.peekEqualEntropy();

    expect(items).toHaveLength(0);
  });

  it("peekEqualEntropy returns all items with lowest entropy", () => {
    const pq = new TestDynamicPriorityQueue();
    const item1 = new TestItem("task1", 1);
    const item2 = new TestItem("task2", 1);
    const item3 = new TestItem("task3", 2);
    pq.enqueue(item1, item2, item3);

    let items = pq.peekEqualEntropy();

    expect(items).toHaveLength(2);
    expect(items).toContain(item1);
    expect(items).toContain(item2);

    item3.entropy = item1.entropy;
    items = pq.peekEqualEntropy();
    
    expect(items).toHaveLength(3);
    expect(items).toContain(item1);
    expect(items).toContain(item2);
    expect(items).toContain(item3);

    item2.entropy = 5;
    items = pq.peekEqualEntropy();

    expect(items).toHaveLength(2);
    expect(items).toContain(item1);
    expect(items).toContain(item3);
  });
});
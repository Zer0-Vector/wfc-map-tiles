import { DynamicPriorityQueue, PrioritizedItem } from "@/helpers/DynamicPriorityQueue";

class TestItem extends PrioritizedItem {
  name: string;

  constructor(name: string, priority: number) {
    super(priority);
    this.name = name;
  }
}

class TestDynamicPriorityQueue extends DynamicPriorityQueue<TestItem> {
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
    
    item1.priority = 0; 
    const updatedItem = pq.dequeue();

    expect(updatedItem?.name).toBe("task1");
  });

});
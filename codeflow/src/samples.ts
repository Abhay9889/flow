export type LanguageKey = 'PYTHON' | 'JS' | 'TS' | 'RUST' | 'GO' | 'JAVA' | 'C++' | 'RUBY' | 'PHP' | 'SWIFT';

export interface CodeSample {
  name: string;
  code: string;
  language: string;
  defaultAnalysis: any; // Pre-baked analysis is excellent for fast performance or if API fails
}

export const CODE_SAMPLES: Record<LanguageKey, CodeSample> = {
  PYTHON: {
    name: 'Recursive Quicksort with Memoized Pivot',
    language: 'python',
    code: `import random

def quicksort(arr):
    # Base case: empty or single element lists
    if len(arr) <= 1:
        return arr
        
    # Pivot selection using median-of-three rule
    pivot = select_median_pivot(arr)
    
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # Recursively sort partitions and assemble
    return quicksort(left) + middle + quicksort(right)

def select_median_pivot(arr):
    if len(arr) < 3:
        return arr[0]
    first = arr[0]
    middle = arr[len(arr) // 2]
    last = arr[-1]
    
    # Return middle value among the three
    return sorted([first, middle, last])[1]

# Execution simulation
numbers = [24, 5, 3, 35, 14, 23, 19]
print("Sorted array:", quicksort(numbers))`,
    defaultAnalysis: {
      summary: "This code implements the classic Quicksort divide-and-conquer sorting algorithm in Python, featuring an optimized median-of-three pivot selection strategy to avoid worst-case O(N^2) complexity on sorted inputs.",
      complexity: {
        time: "O(N log N)",
        space: "O(N)",
        explanation: "Selecting the median-of-three pivot yields balanced tree splits on average, resulting under master theorem in logarithmic depth of partitioning. The space complexity is O(N) due to list comprehension allocations and recursion stack frames."
      },
      functions: [
        { name: "quicksort", calls: ["select_median_pivot", "quicksort"], lineRange: "3-15", purpose: "The core recursive divide-and-conquer orchestration block." },
        { name: "select_median_pivot", calls: [], lineRange: "17-25", purpose: "Minimizes complexity degradation by returning the median value of start, middle, and end list items." }
      ],
      flowSteps: [
        { step: 1, title: "Initial Base Constraints", description: "First, inspect if length of input array is less than or equal to 1. If so, return array directly as it is trivially sorted.", relatedCodeSnippet: "if len(arr) <= 1: return arr", role: "condition" },
        { step: 2, title: "Pivot Optimization Selection", description: "Call 'select_median_pivot' comparing first, middle, and final elements, returning the statistical median to prevent worst-case splitting scenarios.", relatedCodeSnippet: "pivot = select_median_pivot(arr)", role: "process" },
        { step: 3, title: "Array Partitioning", description: "Use three list comprehensions to filter items into sub-arrays smaller than, equal to, or larger than the chosen pivot element.", relatedCodeSnippet: "left = [x for x in arr if x < pivot]", role: "loop" },
        { step: 4, title: "Recursive Branching", description: "Recursively trigger quicksort on the filtered left and right branches separately.", relatedCodeSnippet: "quicksort(left) ... quicksort(right)", role: "loop" },
        { step: 5, title: "Merge and Assembly", description: "Assemble the sorted portions together with the middle values to return the unified ordered list.", relatedCodeSnippet: "return quicksort(left) + middle + quicksort(right)", role: "output" }
      ],
      dependencies: [
        { name: "random", type: "external", purpose: "Standard module for pseudo-random number generators." }
      ],
      metrics: {
        difficulty: "Medium",
        cognitiveLoad: 42,
        potentialBottlenecks: [
          "List comprehension reconstructions allocate fresh memory on every stack frame, causing GC overhead.",
          "Depth of recursion can trigger RecursionError for extremely deep sequences without tail-call optimizations."
        ],
        suggestions: [
          "Refactor to an in-place dual-pointer quicksort (Lomuto or Hoare partitioning) to eliminate O(N) auxiliary space allocations.",
          "Incorporate a hybrid approach like Timsort (Python's native list.sort) which falls back to insertionsort on small arrays."
        ]
      }
    }
  },
  JS: {
    name: 'Asynchronous Task Pool (Concurrency)',
    language: 'javascript',
    code: `class TaskPool {
  constructor(concurrencyLimit) {
    this.limit = concurrencyLimit;
    this.runningCount = 0;
    this.queue = [];
  }

  // Accepts an asynchronous task returning a Promise
  async runTask(taskFn) {
    if (this.runningCount >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.runningCount++;
    try {
      return await taskFn();
    } finally {
      this.runningCount--;
      if (this.queue.length > 0) {
        const nextInQueue = this.queue.shift();
        nextInQueue(); // Wake up next task waiting on queue
      }
    }
  }
}

// Demo helper
const pool = new TaskPool(2);
const wait = (ms) => new Promise(r => setTimeout(r, ms));

pool.runTask(async () => { console.log('Task A start'); await wait(100); console.log('Task A done'); });
pool.runTask(async () => { console.log('Task B start'); await wait(150); console.log('Task B done'); });
pool.runTask(async () => { console.log('Task C start'); await wait(50); console.log('Task C done'); });`,
    defaultAnalysis: {
      summary: "This code implements an Asynchronous task congestion limiting queue (TaskPool) in JavaScript. It enforces an upper limit on concurrent Promise executions, queueing outstanding tasks until active tasks complete.",
      complexity: {
        time: "O(1) scheduling, O(T) total",
        space: "O(Q) memory overhead",
        explanation: "Inserting tasks and resolving queues operates in constant time O(1) via fast FIFO arrays. Memory scales linearly O(Q) with the queue size."
      },
      functions: [
        { name: "constructor", calls: [], lineRange: "2-6", purpose: "Initializes concurrency limits, current tracking variables, and FIFO queue buckets." },
        { name: "runTask", calls: [], lineRange: "9-25", purpose: "Handles task execution throttling, returns async task promises, and pulls waiting items on completion." }
      ],
      flowSteps: [
        { step: 1, title: "Concurrency Verification", description: "When a task enters, compare current running count with max pool allowance.", relatedCodeSnippet: "if (this.runningCount >= this.limit)", role: "condition" },
        { step: 2, title: "Execution Suspend Queue", description: "If saturated, create an unresolved Promise and append its resolver trigger function into the waiting list queue.", relatedCodeSnippet: "new Promise(resolve => this.queue.push(resolve))", role: "init" },
        { step: 3, title: "Launch Task Execution", description: "Trigger the async operation block and increment running task counter.", relatedCodeSnippet: "this.runningCount++; return await taskFn();", role: "process" },
        { step: 4, title: "Counter Teardown", description: "Decrease active counter inside a finally block to ensure cleanup even if the task fails.", relatedCodeSnippet: "this.runningCount--;", role: "process" },
        { step: 5, title: "Scheduler Activation", description: "If there are waiting items in the queue, dequeue the next resolver and invoke it, waking up the next suspended task.", relatedCodeSnippet: "const nextInQueue = this.queue.shift(); nextInQueue();", role: "output" }
      ],
      dependencies: [],
      metrics: {
        difficulty: "Hard",
        cognitiveLoad: 68,
        potentialBottlenecks: [
          "Memory builds up under heavy task loading due to persistent queue array arrays.",
          "Promise rejections must be actively handled externally, otherwise silent process crashes might happen."
        ],
        suggestions: [
          "Add dynamic priority queues to tasks to allow high-priority operations to interrupt the pipeline.",
          "Incorporate timeout safeguards inside queue wait cycles to avoid hanging calls if promises fail to fulfill."
        ]
      }
    }
  },
  TS: {
    name: 'Generic Event Emitter',
    language: 'typescript',
    code: `type Listener<T> = (data: T) => void;

class TypedEmitter<Events extends Record<string, any>> {
  private listeners: { [K in keyof Events]?: Listener<Events[K]>[] } = {};

  // Subscribe to typed events
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);

    // Return unsubscriber function
    return () => this.off(event, listener);
  }

  // Unsubscribe standard listener
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter(l => l !== listener);
  }

  // Publish event broadcasts
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const list = this.listeners[event];
    if (list) {
      list.forEach(listener => {
         try {
           listener(data);
         } catch (e) {
           console.error('Listener failure:', e);
         }
      });
    }
  }
}

// Typed configuration structure
interface LogEvents {
  info: string;
  error: { code: number; msg: string };
}

const emitter = new TypedEmitter<LogEvents>();
const unsub = emitter.on('info', (text) => console.log('Log Info:', text.toUpperCase()));
emitter.emit('info', 'System ready');
unsub();`,
    defaultAnalysis: {
      summary: "This file implements a fully typed Generic Event Pub/Sub Emitter in TypeScript, supporting custom payload schemas per event name with full editor autocompletion and compile-time type safety checking.",
      complexity: {
        time: "O(1) subscribe, O(L) publish",
        space: "O(H + L) total",
        explanation: "Creating subscriptions is instant O(1). Emitting events takes O(L) where L is the number of listeners attached to the designated event bucket."
      },
      functions: [
        { name: "on", calls: [], lineRange: "6-14", purpose: "Registers an events listener and returns an automatic unsubscribe handle function." },
        { name: "off", calls: [], lineRange: "17-21", purpose: "Safely filters lists to remove target callbacks from the storage registry." },
        { name: "emit", calls: [], lineRange: "24-36", purpose: "Iterates through matching listener functions under try-catch blocks to broadcast data safely." }
      ],
      flowSteps: [
        { step: 1, title: "Subscriber Registration", description: "Check if event bucket list exists in registry; if not, initialize a blank array.", relatedCodeSnippet: "if (!this.listeners[event])", role: "init" },
        { step: 2, title: "Register Event Callback", description: "Append the listener callback function of type Listener to the array list.", relatedCodeSnippet: "this.listeners[event]!.push(listener)", role: "process" },
        { step: 3, title: "Compile Event Broadcast", description: "During emit, look up key inside the listener collection. If empty, return.", relatedCodeSnippet: "const list = this.listeners[event]", role: "condition" },
        { step: 4, title: "Safe Invocation Loop", description: "Iterate over listener arrays, catching custom exceptions locally inside individual loops to avoid crashing main emitters.", relatedCodeSnippet: "try { listener(data); } catch (e)", role: "loop" },
        { step: 5, title: "Unsubscribe Execution", description: "When the unsubscribe closure is run, filter out that specific subscriber handle from listeners array.", relatedCodeSnippet: "list.filter(l => l !== listener)", role: "output" }
      ],
      dependencies: [],
      metrics: {
        difficulty: "Medium",
        cognitiveLoad: 48,
        potentialBottlenecks: [
          "Linear array lookup filter on unsubscribe calls can lead to performance degradation if thousands of subscriptions exist.",
          "Strong reference retention can trigger memory leaks if callbacks are not properly cleaned up after components unmount."
        ],
        suggestions: [
          "Refactor internally from standard arrays to standard JavaScript Set data structures to reduce deletion searching costs to O(1).",
          "Incorporate 'once' capability to allow auto-discarding listeners after their target event has run a single time."
        ]
      }
    }
  },
  RUST: {
    name: 'Threadsafe Static Circular Queue',
    language: 'rust',
    code: `use std::sync::{Arc, Mutex};
use std::thread;

pub struct SafeQueue<T> {
    data: Mutex<Vec<T>>,
    capacity: usize,
}

impl<T> SafeQueue<T> {
    pub fn new(capacity: usize) -> Self {
        SafeQueue {
            data: Mutex::new(Vec::with_capacity(capacity)),
            capacity,
        }
    }

    pub fn enqueue(&self, item: T) -> Result<(), &'static str> {
        let mut queue = self.data.lock().map_err(|_| "Poisoned lock")?;
        if queue.len() >= self.capacity {
            return Err("Queue reached max capacity");
        }
        queue.push(item);
        Ok(())
    }

    pub fn dequeue(&self) -> Option<T> {
        let mut queue = self.data.lock().ok()?;
        if queue.is_empty() {
            return None;
        }
        Some(queue.remove(0))
    }
}

fn main() {
    let queue = Arc::new(SafeQueue::new(10));
    let q_clone = Arc.clone(&queue);

    let handle = thread::spawn(move || {
        q_clone.enqueue(42).unwrap();
    });

    handle.join().unwrap();
    println!("Dequeued: {:?}", queue.dequeue());
}`,
    defaultAnalysis: {
      summary: "This Rust code implements a concurrent thread-safe Queue employing Arc smart pointers and Mutex interior mutability, guaranteeing complete race-of-data freedom during enqueue and dequeue cycles.",
      complexity: {
        time: "O(1) enqueue, O(N) dequeue",
        space: "O(C) static capacity capacity",
        explanation: "Pushing is constant-time O(1). Dequeuing requires shift-removing the zero-indexed item, cascading elements down which takes O(N) where N is queue length."
      },
      functions: [
        { name: "new", calls: [], lineRange: "10-15", purpose: "Creates the heap-allocated Vec buffer guarded inside a Mutex struct." },
        { name: "enqueue", calls: [], lineRange: "17-24", purpose: "Obtains Mutex locks, checks limits, and pushes item to avoid memory overflows." },
        { name: "dequeue", calls: [], lineRange: "26-32", purpose: "Safely locks the Mutex, returns frontmost element if vector is populated, shifting remaining components." }
      ],
      flowSteps: [
        { step: 1, title: "Lock Acknowledgment", description: "Request Mutex read/write lock access on internal vector, wrapping results inside dynamic poison error catchers.", relatedCodeSnippet: "self.data.lock()", role: "init" },
        { step: 2, title: "Sized Limit Check", description: "Validate current length against preconfigured allocation limits to avoid scaling overheads.", relatedCodeSnippet: "if queue.len() >= self.capacity", role: "condition" },
        { step: 3, title: "Buffered Insertion", description: "Push element safe onto heap-allocated thread storage array.", relatedCodeSnippet: "queue.push(item);", role: "process" },
        { step: 4, title: "Shifting Retraction", description: "On Dequeue, perform index subtraction moving later components forward.", relatedCodeSnippet: "queue.remove(0)", role: "process" },
        { step: 5, title: "Implicit Unlock Mutex", description: "Mutex locks are automatically released once thread scopes naturally end via Rust's RAII drop mechanics.", relatedCodeSnippet: "Ok(())", role: "output" }
      ],
      dependencies: [
        { name: "sync::Arc", type: "internal", purpose: "Atomic Reference Counting pointer to distribute safe read-only queue access across multiple active OS processes." },
        { name: "sync::Mutex", type: "internal", purpose: "Protects write sequences from overlapping data-collisions." }
      ],
      metrics: {
        difficulty: "Hard",
        cognitiveLoad: 60,
        potentialBottlenecks: [
          "Vec::remove(0) triggers full memory copy iterations on every single dequeuing sequence.",
          "Thread blocking bottleneck: High thread saturation creates lock contention, freezing threads on locks."
        ],
        suggestions: [
          "Swap normal heap Vectors for a 'VecDeque' double-ended ring buffer queue to achieve constant-time O(1) dequeue operations.",
          "Replace standard heavy Mutex setups with atomic spinning lock handles (Spinlock/RwLock) or wait-free lock-free structures."
        ]
      }
    }
  },
  GO: {
    name: 'Concurrent Pipeline (Channels)',
    language: 'go',
    code: `package main

import (
	"fmt"
	"sync"
)

// Generator function converting integers to output channels
func generator(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()
	return out
}

// Worker squaring intermediate integers read from channels
func sq(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out)
	}()
	return out
}

func main() {
	// Set up the pipeline and consume results
	genChan := generator(2, 3, 4, 10)
	squaredChan := sq(genChan)

	for res := range squaredChan {
		fmt.Println("Result:", res)
	}
}`,
    defaultAnalysis: {
      summary: "This Go code implements an active CSP-style concurrent pipeline. Channels are chained together, routing inputs through dynamic goroutine workers performing squaring computations without blocking.",
      complexity: {
        time: "O(N) processing, O(1) step latency",
        space: "O(1) buffer storage",
        explanation: "Each stage operates concurrently on unbuffered streams, allowing items to stream through with tight, constant space utilization."
      },
      functions: [
        { name: "generator", calls: [], lineRange: "9-18", purpose: "Converts numbers arrays into channel streams, launching a background goroutine publisher." },
        { name: "sq", calls: [], lineRange: "21-30", purpose: "Consumes items from intermediate channels, squares values, and pipelines outputs." }
      ],
      flowSteps: [
        { step: 1, title: "Unbuffered Channel Allocation", description: "Initialize unbuffered communication channel pipelines using standard 'make(chan int)'.", relatedCodeSnippet: "out := make(chan int)", role: "init" },
        { step: 2, title: "Spawning Generator Thread", description: "Boot an active Go process thread (goroutine) writing numbers to designated pipelines.", relatedCodeSnippet: "go func() { ... out <- n }()", role: "process" },
        { step: 3, title: "Streaming Computation Worker", description: "A separate background worker polls generator channels concurrently using range pipelines.", relatedCodeSnippet: "for n := range in", role: "loop" },
        { step: 4, title: "Safe Closure Broadcasting", description: "Properly notify downstream nodes using standard close operations once writers finish in-loops.", relatedCodeSnippet: "close(out)", role: "output" },
        { step: 5, title: "Main Routine Iteration", description: "The main thread reads values directly from final channels, exiting safely when closed.", relatedCodeSnippet: "for res := range squaredChan", role: "loop" }
      ],
      dependencies: [
        { name: "fmt", type: "internal", purpose: "Implements formatted code printing output commands." },
        { name: "sync", type: "internal", purpose: "Provides concurrency primitives, although this sample relies purely on native channels." }
      ],
      metrics: {
        difficulty: "Medium",
        cognitiveLoad: 45,
        potentialBottlenecks: [
          "Unbuffered pipelines force writers and readers to synchronize perfectly, creating lockstep blocks.",
          "Goroutine Leaking: If consumer loops terminate premature, background generator channels remain blocked permanently."
        ],
        suggestions: [
          "Incorporate buffered channels (e.g. make(chan int, buffered)) to improve throughput under uneven workload spikes.",
          "Introduce a 'context.Context' or close channel cancel pipeline pattern to terminate active goroutines instantly."
        ]
      }
    }
  },
  JAVA: {
    name: 'Recursive Binary Tree Search',
    language: 'java',
    code: `class TreeNode {
    int val;
    TreeNode left, right;
    
    TreeNode(int x) {
        val = x;
        left = right = null;
    }
}

public class BinaryTreeSearch {
    // DFS Preorder Search seeking matching value paths
    public boolean search(TreeNode root, int target) {
        if (root == null) {
            return false;
        }
        
        if (root.val == target) {
            return true;
        }
        
        // Recursive search down left and right branches
        boolean foundLeft = search(root.left, target);
        if (foundLeft) {
            return true;
        }
        
        return search(root.right, target);
    }
}`,
    defaultAnalysis: {
      summary: "This Java class implements a basic Binary Tree Search using Depth-First Search (DFS) traversal to search for a target value in a binary tree hierarchy.",
      complexity: {
        time: "O(N)",
        space: "O(H)",
        explanation: "In worst-case unbalanced scenarios (like a skewed tree), search traverses all N nodes. Dynamic stack space scales with tree height H."
      },
      functions: [
        { name: "TreeNode", calls: [], lineRange: "1-8", purpose: "Data node blueprint containing integer values and pointers to left and right nodes." },
        { name: "search", calls: ["search"], lineRange: "12-25", purpose: "Implements recursive search branching through DFS tree traversals." }
      ],
      flowSteps: [
        { step: 1, title: "Leaf Base Bound", description: "Validate if cursor meets null targets (leaves). If so, search is unsuccessful, return false.", relatedCodeSnippet: "if (root == null)", role: "condition" },
        { step: 2, title: "Target Evaluation", description: "Verify if node value matches target. Return true if criteria satisfies.", relatedCodeSnippet: "if (root.val == target)", role: "condition" },
        { step: 3, title: "Left Search Traverse", description: "Recursively execute DFS searches down the left child node branches.", relatedCodeSnippet: "boolean foundLeft = search(root.left, target)", role: "loop" },
        { step: 4, title: "Short Circuit Optimization", description: "If left search successfully located values, terminate right traversal instantly back to caller.", relatedCodeSnippet: "if (foundLeft) { return true; }", role: "condition" },
        { step: 5, title: "Right Call Iteration", description: "In cases where left branch yielded no target matches, recursively search the right tree branches.", relatedCodeSnippet: "return search(root.right, target)", role: "loop" }
      ],
      dependencies: [],
      metrics: {
        difficulty: "Easy",
        cognitiveLoad: 28,
        potentialBottlenecks: [
          "Skewed tree configurations can cause call stacks to trigger StackOverflowException under recursive traversals."
        ],
        suggestions: [
          "Implement height balancing checks (like AVL or Red-Black trees) to guarantee O(log N) depth parameters.",
          "Swap recursion for iterative stack loops (using standard collections) to eliminate runtime stack depth crashes."
        ]
      }
    }
  },
  'C++': {
    name: 'Dijkstra Shortest Path Solver',
    language: 'cpp',
    code: `#include <iostream>
#include <vector>
#include <queue>

using namespace std;

typedef pair<int, int> iPair;

class Graph {
    int V; // Number of vertices
    vector<vector<iPair>> adj;

public:
    Graph(int V) {
        this->V = V;
        adj.resize(V);
    }

    void addEdge(int u, int v, int w) {
        adj[u].push_back(make_pair(v, w));
        adj[v].push_back(make_pair(u, w));
    }

    void dijkstra(int src) {
        priority_queue<iPair, vector<iPair>, greater<iPair>> pq;
        vector<int> dist(V, 1e9); // Infinity

        pq.push(make_pair(0, src));
        dist[src] = 0;

        while (!pq.empty()) {
            int u = pq.top().second;
            pq.pop();

            for (auto i = adj[u].begin(); i != adj[u].end(); ++i) {
                int v = (*i).first;
                int weight = (*i).second;

                if (dist[v] > dist[u] + weight) {
                    dist[v] = dist[u] + weight;
                    pq.push(make_pair(dist[v], v));
                }
            }
        }

        cout << "Distances from original Source:" << endl;
        for (int i = 0; i < V; ++i)
            cout << "Vertex " << i << " -> " << dist[i] << endl;
    }
};`,
    defaultAnalysis: {
      summary: "This C++ program implements Dijkstra's single-source shortest path algorithm on weighted undirected graphs. It resolves path weights using an STL min-priority queue.",
      complexity: {
        time: "O(E log V)",
        space: "O(V + E)",
        explanation: "Iterating through adjacent edges takes extraction time logarithmic with vertex counts log V, summing across E relaxation operations."
      },
      functions: [
        { name: "Graph", calls: [], lineRange: "12-15", purpose: "Sized constructor dynamically resizing adjacency list array grids." },
        { name: "addEdge", calls: [], lineRange: "17-20", purpose: "Inserts vertex-edge weights bidirectionally for undirected structures." },
        { name: "dijkstra", calls: [], lineRange: "22-48", purpose: "Orchestrates path optimizations using priority queue loops." }
      ],
      flowSteps: [
        { step: 1, title: "Initialize Distance Array", description: "Allocate distance vector containing size V initialized to infinity (1e9), source distance set to 0.", relatedCodeSnippet: "vector<int> dist(V, 1e9); dist[src] = 0;", role: "init" },
        { step: 2, title: "Seed Priority Queue", description: "Push starting source pair vertex (weight 0, vertex src) to min priority queue heap structures.", relatedCodeSnippet: "pq.push(make_pair(0, src));", role: "init" },
        { step: 3, title: "Greedy Vertex Dequeue", description: "While priority queue handles remain active, poll vertex containing shortest cumulative distance.", relatedCodeSnippet: "while (!pq.empty()) ... int u = pq.top().second;", role: "loop" },
        { step: 4, title: "Relax Neighbor Weights", description: "Scan neighbor lists, computing total path weight. If cumulative distance from 'u' is smaller than recorded distances, override distances.", relatedCodeSnippet: "if (dist[v] > dist[u] + weight)", role: "condition" },
        { step: 5, title: "Reheaping Updates", description: "Push relaxed distance-vertex pairs onto heap structures to dynamically adjust priority sequences.", relatedCodeSnippet: "pq.push(make_pair(dist[v], v));", role: "process" }
      ],
      dependencies: [
        { name: "iostream", type: "internal", purpose: "Standard stream input/output printing utilities." },
        { name: "vector", type: "internal", purpose: "Sequence container representing dynamic array templates." },
        { name: "queue", type: "internal", purpose: "Provides priority_queue minheap wrappers." }
      ],
      metrics: {
        difficulty: "Hard",
        cognitiveLoad: 72,
        potentialBottlenecks: [
          "Redundant pushes of the same vertex with larger distances can inflate priority queues queue sizes before loops filter them out.",
          "High memory allocations under extremely dense graphs (adjacency matrices might perform cleaner than lists)."
        ],
        suggestions: [
          "Optimize by checking if dequeued distance is larger than current recorded distance and skipping immediately.",
          "Substitute standard binary heaps for Fibonacci Heaps to achieve theoretical constant O(1) decreases of key weights."
        ]
      }
    }
  },
  RUBY: {
    name: 'ActiveRecord Object Relational Mapper',
    language: 'ruby',
    code: `class SimpleModel
  @table_name = ""

  def self.set_table(name)
    @table_name = name
  end

  def self.find(id)
    # Formulates mock SQL string
    sql = "SELECT * FROM #{@table_name} WHERE id = #{id.to_i} LIMIT 1"
    puts "Executing DB Query: #{sql}"
    
    # Return simulated record result
    { id: id, name: "Simulation Record", status: "Active" }
  end

  def self.create(attrs = {})
    keys = attrs.keys.join(", ")
    values = attrs.values.map { |v| "'#{v}'" }.join(", ")
    
    sql = "INSERT INTO #{@table_name} (#{keys}) VALUES (#{values})"
    puts "Executing DB Insert: #{sql}"
    true
  end
end

class User < SimpleModel
  set_table "application_users"
end

# Usage run
found_row = User.find(102)
User.create(username: "neo_brutalist", role: "admin")`,
    defaultAnalysis: {
      summary: "This file implements a simplified active record style metadata query generator in Ruby, establishing dynamic class model bindings to SQL templates.",
      complexity: {
        time: "O(1) SQL generation",
        space: "O(K) column attributes mapping",
        explanation: "Parsing arguments to format database queries scales with attributes length. Execution complexity resides in DBMS engines."
      },
      functions: [
        { name: "set_table", calls: [], lineRange: "4-6", purpose: "Binds class context variables to target relational database tables." },
        { name: "find", calls: [], lineRange: "8-14", purpose: "Assembles structured selection strings safely casting inputs to integer boundaries." },
        { name: "create", calls: [], lineRange: "16-22", purpose: "Iterates hash parameters maps to construct relational inserts SQL arrays." }
      ],
      flowSteps: [
        { step: 1, title: "Table Binding Registration", description: "Configure static runtime attributes specifying SQL target structures.", relatedCodeSnippet: "set_table \"application_users\"", role: "init" },
        { step: 2, title: "Integer Sanitization Cast", description: "Evaluate query parameters casting ID inputs to secure integer formats.", relatedCodeSnippet: "id.to_i", role: "process" },
        { step: 3, title: "Format DB Query", description: "Inject sanitized parameters inside interpolated string templates.", relatedCodeSnippet: "sql = \"SELECT * FROM #{@table_name}...\"", role: "process" },
        { step: 4, title: "Publish Insertion Keys", description: "For insert actions, extract keys and values array arrays to build strings.", relatedCodeSnippet: "attrs.keys.join(\", \")", role: "loop" },
        { step: 5, title: "SQL Execution Simulation", description: "Simulate publishing SQL outputs out to database drivers, returning result hashes.", relatedCodeSnippet: "puts \"Executing DB...\"; { id: id... }", role: "output" }
      ],
      dependencies: [],
      metrics: {
        difficulty: "Medium",
        cognitiveLoad: 35,
        potentialBottlenecks: [
          "Sql injection risks because values are joined raw into INSERT strings without escaping parameter hooks.",
          "Strict string manipulation can compile unoptimized queries under larger hash schemas."
        ],
        suggestions: [
          "Swap raw string interpolation for prepared statements with bind parameters (e.g. VALUES (?, ?, ?)) to guarantee security.",
          "Add database connection pools to manage database connection pipelines."
        ]
      }
    }
  },
  PHP: {
    name: 'Secure Token Verification Script',
    language: 'php',
    code: `<?php

class TokenVerifier {
    private $secret;

    public function __construct($secretKey) {
        $this->secret = $secretKey;
    }

    public function verify($token, $payload) {
        if (empty($token) || strlen($token) !== 64) {
            return false;
        }

        // Recompute the HMAC hash signature
        $expected = hash_hmac('sha256', $payload, $this->secret);

        // Terminate timing attack vectors using constant-time comparison
        return hash_equals($expected, $token);
    }
}

// Runtime setup
$verifier = new TokenVerifier("secret_platform_passphrase");
$success = $verifier->verify("a1f10...76b2", "user_session_payload");
echo $success ? "Valid Signature" : "Access Denied";`,
    defaultAnalysis: {
      summary: "This PHP script constructs a secure HMAC-SHA256 signature verifier class. It employs constant-time validation strategies ('hash_equals') to prevent timing-based side-channel attacks.",
      complexity: {
        time: "O(K) hashing, O(1) comparison",
        space: "O(1) memory buffers",
        explanation: "Hashing time scales with payload size. Once computed, the signature comparison uses safe comparison loops taking instant time bounds."
      },
      functions: [
        { name: "__construct", calls: [], lineRange: "6-8", purpose: "Sets private cryptographic keys within class boundaries." },
        { name: "verify", calls: [], lineRange: "10-20", purpose: "Constructs SHA256 hashes and uses constant-time assertions to confirm integrity." }
      ],
      flowSteps: [
        { step: 1, title: "Token Boundary Checks", description: "First, screen in empty states or invalid string length parameters prior to computations.", relatedCodeSnippet: "empty($token) || strlen($token) !== 64", role: "condition" },
        { step: 2, title: "HMAC Hash Computation", description: "Publish SHA256 hashes binding payloads with secrets using target hashing drivers.", relatedCodeSnippet: "hash_hmac('sha256', $payload, $this->secret)", role: "process" },
        { step: 3, title: "Timing Attack Defender", description: "Use PHP's native hash_equals function, executing byte-by-byte comparisons to avoid early-exit timing leaks.", relatedCodeSnippet: "return hash_equals($expected, $token)", role: "condition" },
        { step: 4, title: "Flag Assertions", description: "Evaluate boolean results returning confirmations back to client applications.", relatedCodeSnippet: "echo $success ? \"Valid\" : \"Denied\"", role: "output" }
      ],
      dependencies: [],
      metrics: {
        difficulty: "Easy",
        cognitiveLoad: 25,
        potentialBottlenecks: [
          "Large payload sizes can increase computational burdens on servers since hash_hmac handles everything inside single-thread execution blocks."
        ],
        suggestions: [
          "For massive multi-part documents, swap flat hash loops for chunked updates (hash_init, hash_update, hash_final) to stream file payloads."
        ]
      }
    }
  },
  SWIFT: {
    name: 'Asynchronous Cache Manager',
    language: 'swift',
    code: `import Foundation

actor ImageCache {
    private var cache: [URL: Data] = [:]
    
    // Concurrent-safe download and write cache
    func fetchImage(from url: URL) async throws -> Data {
        if let cached = cache[url] {
            return cached
        }
        
        // Asynchronous network capture
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        // Safely updates actor state
        cache[url] = data
        return data
    }
}`,
    defaultAnalysis: {
      summary: "This Swift program implements a modern Concurrency Actor ('ImageCache'). It uses swift actors is to guarantee serialized state updates and protect the internal dictionary from write contentions.",
      complexity: {
        time: "O(1) dictionary fetching",
        space: "O(M) cumulative cache memory size",
        explanation: "Reading and updating local cache directories takes constant O(1)-time. Cumulative space grows with individual network payload sizes. Actor task execution is non-blocking.",
        actorSystem: "Swift Actor models guarantee serialized isolated state access transitions."
      },
      functions: [
        { name: "fetchImage", calls: [], lineRange: "7-22", purpose: "Safely reads/writes dictionary images by awaiting on actors execution loops." }
      ],
      flowSteps: [
        { step: 1, title: "Distributed Read Assertion", description: "Query actor state dictionary URLs. If cached assets exist, return instantly.", relatedCodeSnippet: "if let cached = cache[url]", role: "condition" },
        { step: 2, title: "Concurrent Network Call", description: "Await async URLSession data transfers without blocking system threat pools.", relatedCodeSnippet: "let (data, response) = try await URLSession.shared.data(from: url)", role: "loop" },
        { step: 3, title: "HTTP Status Assertion", description: "Cast status response asserting valid parameters (status code 200). Throw URLError if servers failed.", relatedCodeSnippet: "guard let httpResponse = response as? HTTPURLResponse...", role: "condition" },
        { step: 4, title: "Non-reentrant Actor Mutation", description: "Safely update internal dictionary maps. Swift actor synchronization prevents race hazards.", relatedCodeSnippet: "cache[url] = data", role: "process" },
        { step: 5, title: "Deliver Decoded Assets", description: "Deliver byte data values back to primary callers.", relatedCodeSnippet: "return data", role: "output" }
      ],
      dependencies: [
        { name: "Foundation", type: "external", purpose: "Apple's core library implementing URLSession and URL structures." }
      ],
      metrics: {
        difficulty: "Medium",
        cognitiveLoad: 40,
        potentialBottlenecks: [
          "Unbounded in-memory caches grow indefinitely, which can trigger system Memory Warnings or crashes on mobile devices.",
          "Cache stamps: If multiple concurrent workers request the exact same URL at the same time, simultaneous HTTP requests will fire redundantly."
        ],
        suggestions: [
          "Introduce a system limit algorithm (such as Least Recently Used - LRU cache) or utilize NSCache to automatically discard oldest assets under memory pressures.",
          "Implement task tracking to group simultaneous lookups, so redundant parallel calls await on single active download task."
        ]
      }
    }
  }
};

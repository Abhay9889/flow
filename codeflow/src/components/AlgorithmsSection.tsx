import { useState } from "react";
import { Brain, ChevronDown, ChevronRight, ExternalLink, Code, Trophy, Target, Flame, BookOpen } from "lucide-react";

interface AlgoCategory {
  name: string;
  icon: React.ReactNode;
  topics: { title: string; desc: string; questions: { name: string; difficulty: string; link?: string }[] }[];
}

const BASIC: AlgoCategory = {
  name: "Basic", icon: <BookOpen className="w-5 h-5" />,
  topics: [
    { title: "Arrays & Strings", desc: "Fundamental data manipulation with contiguous memory structures.", questions: [
      { name: "Two Sum", difficulty: "Easy", link: "https://leetcode.com/problems/two-sum/" },
      { name: "Reverse String", difficulty: "Easy", link: "https://leetcode.com/problems/reverse-string/" },
      { name: "Valid Anagram", difficulty: "Easy", link: "https://leetcode.com/problems/valid-anagram/" },
      { name: "Maximum Subarray", difficulty: "Medium", link: "https://leetcode.com/problems/maximum-subarray/" },
    ]},
    { title: "Sorting Algorithms", desc: "Bubble Sort, Selection Sort, Insertion Sort — foundations of ordering.", questions: [
      { name: "Sort an Array", difficulty: "Medium", link: "https://leetcode.com/problems/sort-an-array/" },
      { name: "Merge Sorted Array", difficulty: "Easy", link: "https://leetcode.com/problems/merge-sorted-array/" },
      { name: "Sort Colors", difficulty: "Medium", link: "https://leetcode.com/problems/sort-colors/" },
    ]},
    { title: "Searching", desc: "Linear Search, Binary Search — efficiently finding elements.", questions: [
      { name: "Binary Search", difficulty: "Easy", link: "https://leetcode.com/problems/binary-search/" },
      { name: "First Bad Version", difficulty: "Easy", link: "https://leetcode.com/problems/first-bad-version/" },
      { name: "Search Insert Position", difficulty: "Easy", link: "https://leetcode.com/problems/search-insert-position/" },
    ]},
    { title: "Stacks & Queues", desc: "LIFO and FIFO data structures for sequential processing.", questions: [
      { name: "Valid Parentheses", difficulty: "Easy", link: "https://leetcode.com/problems/valid-parentheses/" },
      { name: "Implement Queue using Stacks", difficulty: "Easy", link: "https://leetcode.com/problems/implement-queue-using-stacks/" },
      { name: "Min Stack", difficulty: "Medium", link: "https://leetcode.com/problems/min-stack/" },
    ]},
  ]
};

const MID: AlgoCategory = {
  name: "Intermediate", icon: <Target className="w-5 h-5" />,
  topics: [
    { title: "Trees & BST", desc: "Hierarchical structures — traversals, balancing, search trees.", questions: [
      { name: "Invert Binary Tree", difficulty: "Easy", link: "https://leetcode.com/problems/invert-binary-tree/" },
      { name: "Validate BST", difficulty: "Medium", link: "https://leetcode.com/problems/validate-binary-search-tree/" },
      { name: "Level Order Traversal", difficulty: "Medium", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
      { name: "Lowest Common Ancestor", difficulty: "Medium", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/" },
    ]},
    { title: "Hash Maps & Sets", desc: "O(1) lookup structures for frequency counting and deduplication.", questions: [
      { name: "Group Anagrams", difficulty: "Medium", link: "https://leetcode.com/problems/group-anagrams/" },
      { name: "Top K Frequent Elements", difficulty: "Medium", link: "https://leetcode.com/problems/top-k-frequent-elements/" },
      { name: "Longest Consecutive Sequence", difficulty: "Medium", link: "https://leetcode.com/problems/longest-consecutive-sequence/" },
    ]},
    { title: "Recursion & Backtracking", desc: "Divide and conquer, permutations, combinations, constraint satisfaction.", questions: [
      { name: "Subsets", difficulty: "Medium", link: "https://leetcode.com/problems/subsets/" },
      { name: "Permutations", difficulty: "Medium", link: "https://leetcode.com/problems/permutations/" },
      { name: "N-Queens", difficulty: "Hard", link: "https://leetcode.com/problems/n-queens/" },
    ]},
    { title: "Linked Lists", desc: "Pointer-based structures — reversal, cycle detection, merging.", questions: [
      { name: "Reverse Linked List", difficulty: "Easy", link: "https://leetcode.com/problems/reverse-linked-list/" },
      { name: "Merge Two Sorted Lists", difficulty: "Easy", link: "https://leetcode.com/problems/merge-two-sorted-lists/" },
      { name: "Linked List Cycle", difficulty: "Easy", link: "https://leetcode.com/problems/linked-list-cycle/" },
    ]},
  ]
};

const ADV: AlgoCategory = {
  name: "Advanced", icon: <Flame className="w-5 h-5" />,
  topics: [
    { title: "Dynamic Programming", desc: "Optimal substructure and overlapping subproblems — memoization & tabulation.", questions: [
      { name: "Climbing Stairs", difficulty: "Easy", link: "https://leetcode.com/problems/climbing-stairs/" },
      { name: "Longest Increasing Subsequence", difficulty: "Medium", link: "https://leetcode.com/problems/longest-increasing-subsequence/" },
      { name: "Edit Distance", difficulty: "Medium", link: "https://leetcode.com/problems/edit-distance/" },
      { name: "Burst Balloons", difficulty: "Hard", link: "https://leetcode.com/problems/burst-balloons/" },
    ]},
    { title: "Graph Algorithms", desc: "BFS, DFS, Dijkstra, topological sort — network traversal.", questions: [
      { name: "Number of Islands", difficulty: "Medium", link: "https://leetcode.com/problems/number-of-islands/" },
      { name: "Course Schedule", difficulty: "Medium", link: "https://leetcode.com/problems/course-schedule/" },
      { name: "Word Ladder", difficulty: "Hard", link: "https://leetcode.com/problems/word-ladder/" },
    ]},
    { title: "Tries & Advanced Trees", desc: "Prefix trees, segment trees, Fenwick trees for complex queries.", questions: [
      { name: "Implement Trie", difficulty: "Medium", link: "https://leetcode.com/problems/implement-trie-prefix-tree/" },
      { name: "Word Search II", difficulty: "Hard", link: "https://leetcode.com/problems/word-search-ii/" },
      { name: "Range Sum Query", difficulty: "Medium", link: "https://leetcode.com/problems/range-sum-query-mutable/" },
    ]},
    { title: "Greedy & Advanced", desc: "Greedy choices, sliding window, two pointers, bit manipulation.", questions: [
      { name: "Jump Game", difficulty: "Medium", link: "https://leetcode.com/problems/jump-game/" },
      { name: "Minimum Window Substring", difficulty: "Hard", link: "https://leetcode.com/problems/minimum-window-substring/" },
      { name: "Trapping Rain Water", difficulty: "Hard", link: "https://leetcode.com/problems/trapping-rain-water/" },
    ]},
  ]
};

const TIERS = [BASIC, MID, ADV];
const tierColors = ["#10b981", "#f59e0b", "#e63b2e"];
const diffColors: Record<string, string> = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#e63b2e" };

export default function AlgorithmsSection({ darkMode, onBack }: { darkMode: boolean; onBack: () => void }) {
  const [activeTier, setActiveTier] = useState(0);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(0);
  const dc = darkMode;
  const tier = TIERS[activeTier];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: dc ? "#0f0f17" : "#f5f0e8", color: dc ? "#e2e8f0" : "#1a1a1a" }}>
      <header className="w-full px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30" style={{ borderBottom: "3px solid #1a1a1a", background: dc ? "#1a1a2e" : "#faf7f2" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-3.5 py-1.5 text-xs uppercase font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", border: "2px solid #1a1a1a", background: dc ? "#2a2a3e" : "#f5f0e8", boxShadow: "3px 3px 0px 0px #1a1a1a" }}>← Back</button>
          <span className="text-lg font-black tracking-tight uppercase flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="w-5 h-5 inline-flex items-center justify-center text-[10px] font-black" style={{ background: "#8b5cf6", border: "2px solid #1a1a1a", color: "#fff" }}>A</span>
            Algorithms
          </span>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-6 pt-10 pb-6 text-center">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Brain className="w-10 h-10 inline-block mr-3" style={{ color: "#8b5cf6" }} />
          DSA Practice <span style={{ color: "#8b5cf6" }}>Hub</span>
        </h1>
        <p className="text-sm font-medium max-w-xl mx-auto mb-8" style={{ color: dc ? "#888" : "#666" }}>
          Curated algorithm topics organized by difficulty. Master the fundamentals and advance to complex paradigms.
        </p>

        {/* Tier Tabs */}
        <div className="flex justify-center gap-3 mb-10">
          {TIERS.map((t, i) => (
            <button key={i} onClick={() => { setActiveTier(i); setExpandedTopic(0); }}
              className="px-5 py-2.5 font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-all"
              style={{
                fontFamily: "'Space Grotesk', sans-serif", border: "3px solid #1a1a1a",
                background: activeTier === i ? tierColors[i] : (dc ? "#1e1e2e" : "#fff"),
                color: activeTier === i ? (i === 1 ? "#1a1a1a" : "#fff") : (dc ? "#e2e8f0" : "#1a1a1a"),
                boxShadow: activeTier === i ? "4px 4px 0px 0px #1a1a1a" : "2px 2px 0px 0px #1a1a1a",
              }}>
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div className="w-full max-w-4xl mx-auto px-6 pb-16 space-y-4">
        {tier.topics.map((topic, i) => {
          const isExp = expandedTopic === i;
          const color = tierColors[activeTier];
          return (
            <div key={i} style={{ border: "3px solid #1a1a1a", boxShadow: isExp ? "5px 5px 0px 0px #1a1a1a" : "2px 2px 0px 0px #1a1a1a", background: dc ? "#1e1e2e" : "#fff" }}>
              <button onClick={() => setExpandedTopic(isExp ? null : i)} className="w-full flex items-center justify-between p-4 text-left" style={{ borderBottom: isExp ? "3px solid #1a1a1a" : "none" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center font-black text-xs" style={{ background: color, border: "2px solid #1a1a1a", color: activeTier === 1 ? "#1a1a1a" : "#fff" }}>{i + 1}</div>
                  <div>
                    <span className="font-black text-sm uppercase tracking-wider block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{topic.title}</span>
                    <span className="text-[10px] font-medium" style={{ color: dc ? "#888" : "#999" }}>{topic.desc}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 uppercase" style={{ border: "1px solid", borderColor: color, color, background: `${color}15` }}>{topic.questions.length} problems</span>
                  {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>
              {isExp && (
                <div className="p-4 space-y-2">
                  {topic.questions.map((q, qi) => (
                    <div key={qi} className="flex items-center justify-between p-3 transition-all hover:translate-x-1" style={{ border: "2px solid #1a1a1a", background: dc ? "#16161e" : "#faf7f2" }}>
                      <div className="flex items-center gap-3">
                        <Code className="w-4 h-4 shrink-0" style={{ color }} />
                        <span className="text-xs font-bold uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{q.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 uppercase" style={{ background: diffColors[q.difficulty] || "#666", color: "#fff", border: "1px solid #1a1a1a" }}>{q.difficulty}</span>
                        {q.link && <a href={q.link} target="_blank" rel="noopener noreferrer" className="p-1 transition-all hover:scale-110" style={{ color }}><ExternalLink className="w-3.5 h-3.5" /></a>}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center gap-2 text-[10px] font-bold uppercase" style={{ color: dc ? "#666" : "#999" }}>
                    <Trophy className="w-3.5 h-3.5" style={{ color }} /> Practice these to strengthen your {tier.name.toLowerCase()} skills
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

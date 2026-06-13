export interface QuestData {
  id: string;
  title: string;
  desc: string;
  type: 'lecture' | 'interactive' | 'coding';
  requiresAvatar: boolean;
  starterCode?: string;
  hint?: string;
  testSuite?: string;
  syllabus?: string[]; // For lecture/interactive classes
  skillCategory?: 'programming' | 'soft-skills' | 'communication' | 'leadership' | 'theory';
}

export const QUESTS_REGISTRY: QuestData[] = [
  {
    id: 'fizzbuzz',
    title: 'Quest 1: FizzBuzz Mastery',
    desc: 'Write a Java method `fizzBuzz(int n)` returning "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of 3 and 5, and the number as a string for other cases.',
    type: 'coding',
    requiresAvatar: false,
    skillCategory: 'programming',
    starterCode: `public class Solution {\n    public String fizzBuzz(int n) {\n        // Write your code here\n        \n    }\n}`,
    hint: 'Use modulo operator % to check divisibility. Check n % 15 first.',
    testSuite: `
      if (typeof fizzBuzz !== 'function') throw new Error("Method fizzBuzz(int n) not found.");
      if (fizzBuzz(3) !== 'Fizz') throw new Error("fizzBuzz(3) returned '" + fizzBuzz(3) + "', expected 'Fizz'");
      if (fizzBuzz(5) !== 'Buzz') throw new Error("fizzBuzz(5) returned '" + fizzBuzz(5) + "', expected 'Buzz'");
      if (fizzBuzz(15) !== 'FizzBuzz') throw new Error("fizzBuzz(15) returned '" + fizzBuzz(15) + "', expected 'FizzBuzz'");
      if (fizzBuzz(7) !== '7') throw new Error("fizzBuzz(7) returned '" + fizzBuzz(7) + "', expected '7'");
    `
  },
  {
    id: 'reverser',
    title: 'Quest 2: String Reversal',
    desc: 'Write a Java method `reverse(String str)` returning the characters of the string in reverse order.',
    type: 'coding',
    requiresAvatar: false,
    skillCategory: 'programming',
    starterCode: `public class Solution {\n    public String reverse(String str) {\n        // Write your code here\n        \n    }\n}`,
    hint: 'You can loop backward through the string or use a StringBuilder.',
    testSuite: `
      if (typeof reverse !== 'function') throw new Error("Method reverse(String str) not found.");
      if (reverse("hello") !== "olleh") throw new Error("reverse('hello') returned '" + reverse("hello") + "', expected 'olleh'");
      if (reverse("java") !== "avaj") throw new Error("reverse('java') returned '" + reverse("java") + "', expected 'avaj'");
    `
  },
  {
    id: 'arraysum',
    title: 'Quest 3: SDE Calculator Sum',
    desc: 'Write a Java method `sum(int[] arr)` returning the sum of all elements inside the integer array.',
    type: 'coding',
    requiresAvatar: false,
    skillCategory: 'programming',
    starterCode: `public class Solution {\n    public int sum(int[] arr) {\n        // Write your code here\n        \n    }\n}`,
    hint: 'Use a simple for loop to iterate over the array elements.',
    testSuite: `
      if (typeof sum !== 'function') throw new Error("Method sum(int[] arr) not found.");
      if (sum([1, 2, 3]) !== 6) throw new Error("sum([1,2,3]) returned " + sum([1,2,3]) + ", expected 6");
      if (sum([-1, 5, 20]) !== 24) throw new Error("sum([-1,5,20]) returned " + sum([-1,5,20]) + ", expected 24");
    `
  },
  {
    id: 'palindrome',
    title: 'Quest 4: Palindrome Checker',
    desc: 'Write a Java method `isPalindrome(String str)` returning true if the string reads the same forward and backward.',
    type: 'coding',
    requiresAvatar: false,
    skillCategory: 'programming',
    starterCode: `public class Solution {\n    public boolean isPalindrome(String str) {\n        // Write your code here\n        \n    }\n}`,
    hint: 'Compare characters from start and end, moving towards the middle.',
    testSuite: `
      if (typeof isPalindrome !== 'function') throw new Error("Method isPalindrome(String str) not found.");
      if (isPalindrome("racecar") !== true) throw new Error("isPalindrome('racecar') returned " + isPalindrome('racecar') + ", expected true");
      if (isPalindrome("hello") !== false) throw new Error("isPalindrome('hello') returned " + isPalindrome('hello') + ", expected false");
      if (isPalindrome("radar") !== true) throw new Error("isPalindrome('radar') returned " + isPalindrome('radar') + ", expected true");
    `
  },
  {
    id: 'findmax',
    title: 'Quest 5: Array Max Finder',
    desc: 'Write a Java method `findMax(int[] arr)` returning the largest integer element inside the array.',
    type: 'coding',
    requiresAvatar: false,
    skillCategory: 'programming',
    starterCode: `public class Solution {\n    public int findMax(int[] arr) {\n        // Write your code here\n        \n    }\n}`,
    hint: 'Initialize max with the first element and update it as you iterate through the array.',
    testSuite: `
      if (typeof findMax !== 'function') throw new Error("Method findMax(int[] arr) not found.");
      if (findMax([1, 5, 3, 9, 2]) !== 9) throw new Error("findMax([1,5,3,9,2]) returned " + findMax([1,5,3,9,2]) + ", expected 9");
      if (findMax([-10, -5, -20]) !== -5) throw new Error("findMax([-10,-5,-20]) returned " + findMax([-10,-5,-20]) + ", expected -5");
    `
  },
  {
    id: 'jvm-intro',
    title: 'Quest 6: Intro to Java & JVM Architecture',
    desc: 'Discuss the internals of the JVM (JVM memory areas: Stack, Heap, Metaspace) and the compilation process with your teacher.',
    type: 'lecture',
    requiresAvatar: true,
    skillCategory: 'theory',
    hint: 'Ask the teacher about JIT Compiler, Garbage Collection, and Stack vs Heap memory allocations.',
    syllabus: [
      'Understand bytecode compilation (.java to .class)',
      'Inspect the ClassLoader subsystem (Loading, Linking, Initialization)',
      'Explore runtime memory regions: Stack, Heap, Program Counter, Method Area',
      'Learn about JIT Compilation and the role of the Execution Engine'
    ]
  },
  {
    id: 'java-oop-principles',
    title: 'Quest 7: Java Object-Oriented Principles',
    desc: 'Engage in an interactive discussion with your teacher on Polymorphism, Inheritance, Encapsulation, and Abstraction.',
    type: 'interactive',
    requiresAvatar: true,
    skillCategory: 'theory',
    hint: 'Discuss static vs dynamic polymorphism, method overriding vs overloading, and interfaces vs abstract classes.',
    syllabus: [
      'Encapsulation (Access Modifiers, Getters/Setters, Data Hiding)',
      'Inheritance (IS-A relationships, method overriding, super keyword)',
      'Polymorphism (Runtime vs Compile-time, Method Overloading, Dynamic Dispatch)',
      'Abstraction (Abstract Classes vs Interfaces, loose coupling principles)'
    ]
  },
  {
    id: 'java-basic-syntax',
    title: 'Quest 8: Basic Syntax & Control Structures',
    desc: 'Discuss primitive data types, variable scopes, operator precedence, and loop control structures in Java.',
    type: 'interactive',
    requiresAvatar: true,
    skillCategory: 'theory',
    hint: 'Ask the teacher about local vs instance variable scopes, byte bounds, and post-increment vs pre-increment operators.',
    syllabus: [
      'Java Primitive Types (byte, short, int, long, float, double, boolean, char)',
      'Variable Lifecycles & Variable Scope boundaries',
      'Conditional Branching (if-else, switch expressions)',
      'Iterative Control Loops (for, while, do-while, and break/continue labels)'
    ]
  },
  {
    id: 'sde-leadership',
    title: 'Quest 9: SDE Leadership & Conflict Resolution',
    desc: 'Conduct a mock sprint planning session. Discuss how you resolve technical conflicts between team members and guide project timelines under pressure.',
    type: 'interactive',
    requiresAvatar: true,
    skillCategory: 'leadership',
    hint: 'Ask the teacher about active listening, sprint estimation metrics, and constructive conflict resolution models like the Thomas-Kilmann matrix.',
    syllabus: [
      'Understand agile team dynamics & sprint scoping estimations',
      'Learn conflict resolution strategies (Collaborating, Compromising)',
      'Practice prioritizing features under resource constraints',
      'Explain constructive feedback loops in code reviews'
    ]
  },
  {
    id: 'system-design-communication',
    title: 'Quest 10: Technical Communication & System Design',
    desc: 'Present and justify your microservice architecture design for a large-scale transaction system. Communicate trade-offs between SQL and NoSQL storage.',
    type: 'interactive',
    requiresAvatar: true,
    skillCategory: 'communication',
    hint: 'Discuss database replication, ACID vs BASE guarantees, and latency impacts of horizontal scaling.',
    syllabus: [
      'Articulate system design blueprints clearly to engineering leads',
      'Compare SQL (ACID consistency) vs NoSQL (horizontal scaling, eventual consistency)',
      'Explain load balancers, message queues, and caching layers (Redis/Memcached)',
      'Practice handling performance bottlenecks under high concurrent loads'
    ]
  }
];

'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERATOR_TEMPLATES = void 0;
exports.default = CareerBuilderClient;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const CareerOSContext_1 = require("@/lib/context/CareerOSContext");
const AuthContext_1 = require("@/lib/context/AuthContext");
const client_1 = require("@/lib/api/client");
const CAREERS = [
    {
        id: 'java_sde',
        title: 'SDE Trajectory',
        desc: 'Focuses on full-stack algorithms, backend architecture, and core enterprise SDE competencies.',
        difficulty: 'Basic to System Architecture',
        estimatedWeeks: 6,
        icon: '☕'
    },
    {
        id: 'react_frontend',
        title: 'Data Trajectory',
        desc: 'Focuses on frontend user interfaces, data visualization interfaces, responsive panels, and client data arrays.',
        difficulty: 'Styling to SSR Frameworks',
        estimatedWeeks: 6,
        icon: '⚛️'
    },
    {
        id: 'devops_cloud',
        title: 'Founder Trajectory',
        desc: 'Focuses on shipping apps end-to-end, DevOps orchestration, product sentinel frameworks, and deployment velocity.',
        difficulty: 'Linux to Kubernetes Orchestration',
        estimatedWeeks: 6,
        icon: '☁️'
    }
];
exports.GENERATOR_TEMPLATES = {
    java_sde: {
        beginner: [
            {
                id: 'java_b_mod1',
                title: 'Module 1: Java Basics & Control Flow',
                desc: 'Introduction to standard Java SE, data types, variable scopes, and standard console IO functions.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'fizzbuzz',
                        title: 'Quest 1: FizzBuzz Mastery',
                        desc: 'Write a Java method `fizzBuzz(int n)` returning "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of 3 and 5, and the number as a string for other cases.',
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
                        starterCode: `public class Solution {\n    public String reverse(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'You can loop backward through the string or use a StringBuilder.',
                        testSuite: `
              if (typeof reverse !== 'function') throw new Error("Method reverse(String str) not found.");
              if (reverse("hello") !== "olleh") throw new Error("reverse('hello') returned '" + reverse("hello") + "', expected 'olleh'");
              if (reverse("java") !== "avaj") throw new Error("reverse('java') returned '" + reverse("java") + "', expected 'avaj'");
            `
                    }
                ]
            },
            {
                id: 'java_b_mod2',
                title: 'Module 2: Arrays & Arithmetic Operators',
                desc: 'Mastering collections iterations, check lists values, and computing array sums.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'arraysum',
                        title: 'Quest 3: SDE Calculator Sum',
                        desc: 'Write a Java method `sum(int[] arr)` returning the sum of all elements inside the integer array.',
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
                        starterCode: `public class Solution {\n    public boolean isPalindrome(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Compare characters from start and end, moving towards the middle.',
                        testSuite: `
              if (typeof isPalindrome !== 'function') throw new Error("Method isPalindrome(String str) not found.");
              if (isPalindrome("racecar") !== true) throw new Error("isPalindrome('racecar') returned " + isPalindrome('racecar') + ", expected true");
              if (isPalindrome("hello") !== false) throw new Error("isPalindrome('hello') returned " + isPalindrome('hello') + ", expected false");
              if (isPalindrome("radar") !== true) throw new Error("isPalindrome('radar') returned " + isPalindrome('radar') + ", expected true");
            `
                    }
                ]
            },
            {
                id: 'java_b_mod3',
                title: 'Module 3: Object-Oriented Operations',
                desc: 'Defining class properties, encapsulation, array manipulations, and finding maximums.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'findmax',
                        title: 'Quest 5: Array Max Finder',
                        desc: 'Write a Java method `findMax(int[] arr)` returning the largest integer element inside the array.',
                        starterCode: `public class Solution {\n    public int findMax(int[] arr) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Initialize max with the first element and update it as you iterate through the array.',
                        testSuite: `
              if (typeof findMax !== 'function') throw new Error("Method findMax(int[] arr) not found.");
              if (findMax([1, 5, 3, 9, 2]) !== 9) throw new Error("findMax([1,5,3,9,2]) returned " + findMax([1,5,3,9,2]) + ", expected 9");
              if (findMax([-10, -5, -20]) !== -5) throw new Error("findMax([-10,-5,-20]) returned " + findMax([-10,-5,-20]) + ", expected -5");
            `
                    }
                ]
            }
        ],
        intermediate: [
            {
                id: 'java_i_mod1',
                title: 'Module 1: Spring Boot Controllers',
                desc: 'Building REST endpoints and processing simple controller routing queries.',
                difficulty: 'Intermediate',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'fizzbuzz',
                        title: 'Quest 1: FizzBuzz Mastery',
                        desc: 'Write a Java method `fizzBuzz(int n)` returning "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of 3 and 5, and the number as a string for other cases.',
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
                        starterCode: `public class Solution {\n    public String reverse(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'You can loop backward through the string or use a StringBuilder.',
                        testSuite: `
              if (typeof reverse !== 'function') throw new Error("Method reverse(String str) not found.");
              if (reverse("hello") !== "olleh") throw new Error("reverse('hello') returned '" + reverse("hello") + "', expected 'olleh'");
              if (reverse("java") !== "avaj") throw new Error("reverse('java') returned '" + reverse("java") + "', expected 'avaj'");
            `
                    }
                ]
            },
            {
                id: 'java_i_mod2',
                title: 'Module 2: ORM JPA Entity Mapping',
                desc: 'Configuring database migrations, mapping entities, and writing native queries.',
                difficulty: 'Intermediate',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'arraysum',
                        title: 'Quest 3: SDE Calculator Sum',
                        desc: 'Write a Java method `sum(int[] arr)` returning the sum of all elements inside the integer array.',
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
                        starterCode: `public class Solution {\n    public boolean isPalindrome(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Compare characters from start and end, moving towards the middle.',
                        testSuite: `
              if (typeof isPalindrome !== 'function') throw new Error("Method isPalindrome(String str) not found.");
              if (isPalindrome("racecar") !== true) throw new Error("isPalindrome('racecar') returned " + isPalindrome('racecar') + ", expected true");
              if (isPalindrome("hello") !== false) throw new Error("isPalindrome('hello') returned " + isPalindrome('hello') + ", expected false");
              if (isPalindrome("radar") !== true) throw new Error("isPalindrome('radar') returned " + isPalindrome('radar') + ", expected true");
            `
                    }
                ]
            },
            {
                id: 'java_i_mod3',
                title: 'Module 3: Security & Session Filters',
                desc: 'Configuring web filters, interceptors, and verifying request signatures.',
                difficulty: 'Intermediate',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'findmax',
                        title: 'Quest 5: Array Max Finder',
                        desc: 'Write a Java method `findMax(int[] arr)` returning the largest integer element inside the array.',
                        starterCode: `public class Solution {\n    public int findMax(int[] arr) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Initialize max with the first element and update it as you iterate through the array.',
                        testSuite: `
              if (typeof findMax !== 'function') throw new Error("Method findMax(int[] arr) not found.");
              if (findMax([1, 5, 3, 9, 2]) !== 9) throw new Error("findMax([1,5,3,9,2]) returned " + findMax([1,5,3,9,2]) + ", expected 9");
              if (findMax([-10, -5, -20]) !== -5) throw new Error("findMax([-10,-5,-20]) returned " + findMax([-10,-5,-20]) + ", expected -5");
            `
                    }
                ]
            }
        ],
        advanced: [
            {
                id: 'java_a_mod1',
                title: 'Module 1: Concurrency & Loom Threads',
                desc: 'Writing concurrent event queues, lock pools, and optimizing thread schedulers.',
                difficulty: 'Advanced',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'fizzbuzz',
                        title: 'Quest 1: FizzBuzz Mastery',
                        desc: 'Write a Java method `fizzBuzz(int n)` returning "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of 3 and 5, and the number as a string for other cases.',
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
                        starterCode: `public class Solution {\n    public String reverse(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'You can loop backward through the string or use a StringBuilder.',
                        testSuite: `
              if (typeof reverse !== 'function') throw new Error("Method reverse(String str) not found.");
              if (reverse("hello") !== "olleh") throw new Error("reverse('hello') returned '" + reverse("hello") + "', expected 'olleh'");
              if (reverse("java") !== "avaj") throw new Error("reverse('java') returned '" + reverse("java") + "', expected 'avaj'");
            `
                    }
                ]
            },
            {
                id: 'java_a_mod2',
                title: 'Module 2: SQL Tuning & Redis Caching',
                desc: 'Analyzing database indexes, transactions lock pools, and key-value cache lookups.',
                difficulty: 'Advanced',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'arraysum',
                        title: 'Quest 3: SDE Calculator Sum',
                        desc: 'Write a Java method `sum(int[] arr)` returning the sum of all elements inside the integer array.',
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
                        starterCode: `public class Solution {\n    public boolean isPalindrome(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Compare characters from start and end, moving towards the middle.',
                        testSuite: `
              if (typeof isPalindrome !== 'function') throw new Error("Method isPalindrome(String str) not found.");
              if (isPalindrome("racecar") !== true) throw new Error("isPalindrome('racecar') returned " + isPalindrome('racecar') + ", expected true");
              if (isPalindrome("hello") !== false) throw new Error("isPalindrome('hello') returned " + isPalindrome('hello') + ", expected false");
              if (isPalindrome("radar") !== true) throw new Error("isPalindrome('radar') returned " + isPalindrome('radar') + ", expected true");
            `
                    }
                ]
            },
            {
                id: 'java_a_mod3',
                title: 'Module 3: Microservices & Docker Deployments',
                desc: 'Writing container orchestrations, service discovery filters, and local gateways.',
                difficulty: 'Advanced',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'findmax',
                        title: 'Quest 5: Array Max Finder',
                        desc: 'Write a Java method `findMax(int[] arr)` returning the largest integer element inside the array.',
                        starterCode: `public class Solution {\n    public int findMax(int[] arr) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Initialize max with the first element and update it as you iterate through the array.',
                        testSuite: `
              if (typeof findMax !== 'function') throw new Error("Method findMax(int[] arr) not found.");
              if (findMax([1, 5, 3, 9, 2]) !== 9) throw new Error("findMax([1,5,3,9,2]) returned " + findMax([1,5,3,9,2]) + ", expected 9");
              if (findMax([-10, -5, -20]) !== -5) throw new Error("findMax([-10,-5,-20]) returned " + findMax([-10,-5,-20]) + ", expected -5");
            `
                    }
                ]
            }
        ]
    },
    react_frontend: {
        beginner: [
            {
                id: 'react_b_mod1',
                title: 'Module 1: Semantic Markup & Vanilla CSS',
                desc: 'Introduction to HTML5 core tags and designing standard CSS layout systems.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'fizzbuzz',
                        title: 'Quest 1: FizzBuzz Mastery',
                        desc: 'Write a Java method `fizzBuzz(int n)` returning "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of 3 and 5, and the number as a string for other cases.',
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
                        starterCode: `public class Solution {\n    public String reverse(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'You can loop backward through the string or use a StringBuilder.',
                        testSuite: `
              if (typeof reverse !== 'function') throw new Error("Method reverse(String str) not found.");
              if (reverse("hello") !== "olleh") throw new Error("reverse('hello') returned '" + reverse("hello") + "', expected 'olleh'");
              if (reverse("java") !== "avaj") throw new Error("reverse('java') returned '" + reverse("java") + "', expected 'avaj'");
            `
                    }
                ]
            },
            {
                id: 'react_b_mod2',
                title: 'Module 2: React Hooks & Core States',
                desc: 'Configuring standard properties, state updates, and modular layouts.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'arraysum',
                        title: 'Quest 3: SDE Calculator Sum',
                        desc: 'Write a Java method `sum(int[] arr)` returning the sum of all elements inside the integer array.',
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
                        starterCode: `public class Solution {\n    public boolean isPalindrome(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Compare characters from start and end, moving towards the middle.',
                        testSuite: `
              if (typeof isPalindrome !== 'function') throw new Error("Method isPalindrome(String str) not found.");
              if (isPalindrome("racecar") !== true) throw new Error("isPalindrome('racecar') returned " + isPalindrome('racecar') + ", expected true");
              if (isPalindrome("hello") !== false) throw new Error("isPalindrome('hello') returned " + isPalindrome('hello') + ", expected false");
              if (isPalindrome("radar") !== true) throw new Error("isPalindrome('radar') returned " + isPalindrome('radar') + ", expected true");
            `
                    }
                ]
            },
            {
                id: 'react_b_mod3',
                title: 'Module 3: Type safety & Strict Compilers',
                desc: 'Writing interfaces contracts and designing custom layout classes.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'findmax',
                        title: 'Quest 5: Array Max Finder',
                        desc: 'Write a Java method `findMax(int[] arr)` returning the largest integer element inside the array.',
                        starterCode: `public class Solution {\n    public int findMax(int[] arr) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Initialize max with the first element and update it as you iterate through the array.',
                        testSuite: `
              if (typeof findMax !== 'function') throw new Error("Method findMax(int[] arr) not found.");
              if (findMax([1, 5, 3, 9, 2]) !== 9) throw new Error("findMax([1,5,3,9,2]) returned " + findMax([1,5,3,9,2]) + ", expected 9");
              if (findMax([-10, -5, -20]) !== -5) throw new Error("findMax([-10,-5,-20]) returned " + findMax([-10,-5,-20]) + ", expected -5");
            `
                    }
                ]
            }
        ],
        intermediate: [],
        advanced: []
    },
    devops_cloud: {
        beginner: [
            {
                id: 'devops_b_mod1',
                title: 'Module 1: Linux CLI commands',
                desc: 'Familiarity with filesystem trees, process pipelines, and permissions.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'fizzbuzz',
                        title: 'Quest 1: FizzBuzz Mastery',
                        desc: 'Write a Java method `fizzBuzz(int n)` returning "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of 3 and 5, and the number as a string for other cases.',
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
                        starterCode: `public class Solution {\n    public String reverse(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'You can loop backward through the string or use a StringBuilder.',
                        testSuite: `
              if (typeof reverse !== 'function') throw new Error("Method reverse(String str) not found.");
              if (reverse("hello") !== "olleh") throw new Error("reverse('hello') returned '" + reverse("hello") + "', expected 'olleh'");
              if (reverse("java") !== "avaj") throw new Error("reverse('java') returned '" + reverse("java") + "', expected 'avaj'");
            `
                    }
                ]
            },
            {
                id: 'devops_b_mod2',
                title: 'Module 2: Container Networks & Volumes',
                desc: 'Writing multi-stage Dockerfiles and configuring docker network bounds.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'arraysum',
                        title: 'Quest 3: SDE Calculator Sum',
                        desc: 'Write a Java method `sum(int[] arr)` returning the sum of all elements inside the integer array.',
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
                        starterCode: `public class Solution {\n    public boolean isPalindrome(String str) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Compare characters from start and end, moving towards the middle.',
                        testSuite: `
              if (typeof isPalindrome !== 'function') throw new Error("Method isPalindrome(String str) not found.");
              if (isPalindrome("racecar") !== true) throw new Error("isPalindrome('racecar') returned " + isPalindrome('racecar') + ", expected true");
              if (isPalindrome("hello") !== false) throw new Error("isPalindrome('hello') returned " + isPalindrome('hello') + ", expected false");
              if (isPalindrome("radar") !== true) throw new Error("isPalindrome('radar') returned " + isPalindrome('radar') + ", expected true");
            `
                    }
                ]
            },
            {
                id: 'devops_b_mod3',
                title: 'Module 3: Git CD pipelines & CI jobs',
                desc: 'Writing build runners, test automations, and rotating secrets keys.',
                difficulty: 'Beginner',
                estimatedWeeks: 2,
                quests: [
                    {
                        id: 'findmax',
                        title: 'Quest 5: Array Max Finder',
                        desc: 'Write a Java method `findMax(int[] arr)` returning the largest integer element inside the array.',
                        starterCode: `public class Solution {\n    public int findMax(int[] arr) {\n        // Write your code here\n        \n    }\n}`,
                        hint: 'Initialize max with the first element and update it as you iterate through the array.',
                        testSuite: `
              if (typeof findMax !== 'function') throw new Error("Method findMax(int[] arr) not found.");
              if (findMax([1, 5, 3, 9, 2]) !== 9) throw new Error("findMax([1,5,3,9,2]) returned " + findMax([1,5,3,9,2]) + ", expected 9");
              if (findMax([-10, -5, -20]) !== -5) throw new Error("findMax([-10,-5,-20]) returned " + findMax([-10,-5,-20]) + ", expected -5");
            `
                    }
                ]
            }
        ],
        intermediate: [],
        advanced: []
    }
};
function CareerBuilderClient() {
    const router = (0, navigation_1.useRouter)();
    const { roadmapGenerated, setRoadmapGenerated, resumeGenerated, onboardingStep, setOnboardingStep, completedQuests, addCompletedQuest, javaTestPassed, pins, spendPins } = (0, CareerOSContext_1.useCareerOS)();
    const { user } = (0, AuthContext_1.useAuth)();
    const userId = user?.id || 'guest';
    const modulesKey = `pinit_${userId}_roadmap_modules`;
    const [selectedPath, setSelectedPath] = (0, react_1.useState)('java_sde');
    const [generating, setGenerating] = (0, react_1.useState)(false);
    const [progress, setProgress] = (0, react_1.useState)(0);
    // Customization States
    const [experienceLevel, setExperienceLevel] = (0, react_1.useState)('beginner');
    const [knownConcepts, setKnownConcepts] = (0, react_1.useState)('');
    const [customFocus, setCustomFocus] = (0, react_1.useState)('');
    // Active Modules State
    const [modules, setModules] = (0, react_1.useState)([]);
    const [tempModules, setTempModules] = (0, react_1.useState)([]);
    const [expandedModuleId, setExpandedModuleId] = (0, react_1.useState)(null);
    // Editing Modules State
    const [editingModuleId, setEditingModuleId] = (0, react_1.useState)(null);
    const [editTitle, setEditTitle] = (0, react_1.useState)('');
    const [editDesc, setEditDesc] = (0, react_1.useState)('');
    const [editWeeks, setEditWeeks] = (0, react_1.useState)(2);
    const [editDiff, setEditDiff] = (0, react_1.useState)('Beginner');
    // Embedded Playground State
    const [activePlaygroundQuest, setActivePlaygroundQuest] = (0, react_1.useState)(null);
    const [code, setCode] = (0, react_1.useState)('');
    const [output, setOutput] = (0, react_1.useState)(null);
    const [showHint, setShowHint] = (0, react_1.useState)(false);
    // Load from localStorage on mount
    (0, react_1.useEffect)(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(modulesKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setModules(parsed);
                    setTempModules(parsed);
                    if (parsed.length > 0) {
                        setExpandedModuleId(parsed[0].id);
                    }
                }
            }
            catch { }
        }
    }, [modulesKey]);
    const allQuestsInRoadmap = modules.flatMap(m => m.quests);
    const totalQuestsInRoadmap = allQuestsInRoadmap.length;
    const completedQuestsInRoadmap = allQuestsInRoadmap.filter(q => completedQuests.includes(q.id)).length;
    const generateFallbackRoadmap = () => {
        const pathTemplates = exports.GENERATOR_TEMPLATES[selectedPath] || exports.GENERATOR_TEMPLATES.java_sde;
        const template = pathTemplates[experienceLevel]?.length > 0
            ? pathTemplates[experienceLevel]
            : pathTemplates.beginner || pathTemplates.intermediate || pathTemplates.advanced;
        let generatedModules = JSON.parse(JSON.stringify(template));
        // Customize based on known concepts
        if (knownConcepts.trim().length > 0) {
            const keywords = knownConcepts.toLowerCase().split(/[,\s]+/);
            generatedModules = generatedModules.map(m => {
                const matchesKeyword = keywords.some(k => m.title.toLowerCase().includes(k) || m.desc.toLowerCase().includes(k));
                if (matchesKeyword) {
                    return {
                        ...m,
                        title: `${m.title} (Review)`,
                        desc: `${m.desc} (Review adapted because you know: ${knownConcepts.trim()})`,
                        estimatedWeeks: Math.max(1, Math.round(m.estimatedWeeks * 0.5))
                    };
                }
                return m;
            });
        }
        // Append custom focus in last module if focus requested
        if (customFocus.trim().length > 0 && generatedModules.length > 0) {
            const lastMod = generatedModules[generatedModules.length - 1];
            lastMod.title = `${lastMod.title} & ${customFocus.trim()}`;
            lastMod.desc = `${lastMod.desc} (Specifically modified to incorporate specialized focus on ${customFocus.trim()})`;
        }
        // Add category property to fallback quests
        generatedModules = generatedModules.map(m => ({
            ...m,
            quests: m.quests.map((q) => {
                let category = 'assignment';
                if (q.requiresAvatar || q.type === 'lecture' || q.type === 'interactive') {
                    category = 'learning';
                }
                else if (q.id === 'fizzbuzz' || q.id.includes('exam')) {
                    category = 'exam';
                }
                return { ...q, category };
            })
        }));
        setTempModules(generatedModules);
        setRoadmapGenerated(true);
        setProgress(100);
    };
    const handleGenerateRoadmap = async () => {
        setGenerating(true);
        setProgress(15);
        const intervalId = setInterval(() => {
            setProgress(p => {
                if (p >= 85)
                    return p;
                return p + 10;
            });
        }, 400);
        try {
            const skillTags = user?.skill_tags || [];
            const weakAreas = user?.weak_areas || [];
            const targetRoleName = selectedPath === 'java_sde'
                ? 'Java Backend Software Engineer'
                : selectedPath === 'react_frontend'
                    ? 'Frontend React Developer'
                    : 'Cloud DevOps Engineer';
            const targetRole = user?.target_role || targetRoleName;
            const res = await client_1.api.post('/api/career-builder/generate', {
                targetRole,
                skillTags,
                weakAreas,
                experienceLevel
            });
            clearInterval(intervalId);
            setProgress(100);
            if (res && res.ok && Array.isArray(res.modules) && res.modules.length > 0) {
                const normalized = res.modules.map((m) => ({
                    ...m,
                    quests: (m.quests || []).map((q) => {
                        let category = q.category;
                        if (!category) {
                            if (q.requiresAvatar || q.type === 'lecture' || q.type === 'interactive') {
                                category = 'learning';
                            }
                            else if (q.id === 'fizzbuzz' || q.id?.includes('exam') || q.title?.toLowerCase().includes('exam') || q.title?.toLowerCase().includes('test')) {
                                category = 'exam';
                            }
                            else {
                                category = 'assignment';
                            }
                        }
                        return { ...q, category };
                    })
                }));
                setTempModules(normalized);
                setRoadmapGenerated(true);
            }
            else {
                console.warn('AI Roadmap Generation failed. Falling back to local templates.');
                generateFallbackRoadmap();
            }
        }
        catch (err) {
            clearInterval(intervalId);
            console.error('Failed to generate dynamic AI roadmap:', err);
            generateFallbackRoadmap();
        }
        finally {
            setGenerating(false);
        }
    };
    const handleResetRoadmap = () => {
        if (window.confirm('Are you sure you want to reset your career trajectory roadmap? This will delete your current modules progress.')) {
            localStorage.removeItem(modulesKey);
            setModules([]);
            setTempModules([]);
            setRoadmapGenerated(false);
        }
    };
    // Module actions before commit
    const startEditingModule = (m) => {
        setEditingModuleId(m.id);
        setEditTitle(m.title);
        setEditDesc(m.desc);
        setEditWeeks(m.estimatedWeeks);
        setEditDiff(m.difficulty);
    };
    const saveModuleChanges = () => {
        setTempModules(prev => prev.map(m => m.id === editingModuleId
            ? { ...m, title: editTitle, desc: editDesc, estimatedWeeks: editWeeks, difficulty: editDiff }
            : m));
        setEditingModuleId(null);
    };
    const deleteModule = (id) => {
        setTempModules(prev => prev.filter(m => m.id !== id));
        if (editingModuleId === id)
            setEditingModuleId(null);
    };
    const addCustomModule = () => {
        const newId = `mod_${Date.now()}`;
        const newModule = {
            id: newId,
            title: 'New Custom Module',
            desc: 'Double click edit to update this module learning description.',
            difficulty: 'Intermediate',
            estimatedWeeks: 2,
            quests: [
                {
                    id: `custom_q_${Date.now()}`,
                    title: 'Custom Logic Quest',
                    desc: 'Demonstrate logic by passing unit assertions.',
                    starterCode: 'public class Solution {\n    public int sum(int[] arr) {\n        return 0;\n    }\n}',
                    hint: 'Modify return statement to compute proper sum.',
                    testSuite: 'if (typeof sum !== "function") throw new Error("Method sum not found.");'
                }
            ]
        };
        setTempModules(prev => [...prev, newModule]);
        startEditingModule(newModule);
    };
    const commitRoadmap = () => {
        setModules(tempModules);
        localStorage.setItem(modulesKey, JSON.stringify(tempModules));
        if (tempModules.length > 0) {
            setExpandedModuleId(tempModules[0].id);
        }
        if (onboardingStep === 4) {
            setOnboardingStep(5);
        }
    };
    // Emulated compiler logic
    const javaToJsTranspiler = (javaCode) => {
        let js = javaCode;
        js = js.replace(/public\s+class\s+\w+\s*\{/, '');
        js = js.trim();
        if (js.endsWith('}'))
            js = js.slice(0, -1);
        const keywords = new Set(['if', 'for', 'while', 'switch', 'catch', 'synchronized']);
        js = js.replace(/(public|protected|private|static|\s)+([a-zA-Z0-9_<>\s\[\]]+)\s+(\w+)\s*\(([^)]*)\)/g, (match, access, retType, name, args) => {
            if (keywords.has(name))
                return match;
            const cleanArgs = args.replace(/(int|String|double|float|boolean|char|int\[\])\s+/g, '');
            return `function ${name}(${cleanArgs})`;
        });
        js = js.replace(/new\s+int\[\]\s*\{/g, '[');
        js = js.replace(/\b(int|String|double|float|boolean|char)\b(?!\.)\s+(\w+)/g, 'let $2');
        js = js.replace(/String\.valueOf\(/g, 'String(');
        js = js.replace(/\.length\(\)/g, '.length');
        js = js.replace(/System\.out\.println/g, 'console.log');
        return js;
    };
    const selectPlaygroundQuest = (q) => {
        if (completedQuests.includes(q.id)) {
            setActivePlaygroundQuest(q);
            setCode(q.starterCode);
            setOutput(null);
            setShowHint(false);
            return;
        }
        if (spendPins('quest_start', `Unlock Quest: ${q.title.split(':')[1]?.trim() || q.title}`)) {
            setActivePlaygroundQuest(q);
            setCode(q.starterCode);
            setOutput(null);
            setShowHint(false);
        }
    };
    const verifySolution = () => {
        if (!activePlaygroundQuest)
            return;
        setOutput(null);
        try {
            const jsCode = javaToJsTranspiler(code);
            const evaluator = new Function(`
        ${jsCode}
        try {
          ${activePlaygroundQuest.testSuite}
          return { success: true, message: "Verification Passed! All test cases cleared." };
        } catch (e) {
          return { success: false, message: e.message };
        }
      `);
            const res = evaluator();
            setOutput(res);
            if (res.success) {
                addCompletedQuest(activePlaygroundQuest.id);
            }
        }
        catch (err) {
            setOutput({ success: false, message: 'Syntax or compiler emulation error: ' + err.message });
        }
    };
    // Determine quest locking status
    const getQuestStatus = (qId, questsList) => {
        if (completedQuests.includes(qId))
            return 'completed';
        const idx = questsList.findIndex(q => q.id === qId);
        if (idx === 0)
            return 'unlocked';
        const prev = questsList[idx - 1];
        if (completedQuests.includes(prev.id))
            return 'unlocked';
        return 'locked';
    };
    const selectedCareer = CAREERS.find(c => c.id === selectedPath) || CAREERS[0];
    return (<div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }} className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>🛠 AI Trajectory Builder</h1>
          <p>Define your professional targets and generate actionable, gamified roadmaps. Customise elements based on your prior knowledge.</p>
        </div>
        {roadmapGenerated && (<button onClick={handleResetRoadmap} className="btn-ghost" style={{ fontSize: 12.5, padding: '8px 16px', border: '1px solid var(--border)', cursor: 'pointer' }}>
            🔄 Reset Trajectory
          </button>)}
      </div>

      {!resumeGenerated ? (<div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }} className="animate-fade-in">
          <div style={{
                background: 'linear-gradient(135deg, var(--bg2), var(--bg3))',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '60px 40px',
                boxShadow: 'var(--shadow-xl)',
                maxWidth: 600,
                margin: '0 auto'
            }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px', marginBottom: 10 }}>
              Career Roadmap Locked
            </h2>
            <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 24 }}>
              Please upload or build a resume in the <strong style={{ color: 'var(--accent)' }}>Resume Builder</strong> first. Your resume skills and onboarding choices will automatically fuse to construct your customized study quests.
            </p>
            <link_1.default href="/resume" className="btn-primary" style={{ display: 'inline-flex', padding: '12px 24px', fontSize: 13.5 }}>
              Go to Resume Builder ➔
            </link_1.default>
          </div>
        </div>) : !roadmapGenerated ? (<div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* Selector Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: '0 0 14px 0' }}>
                1. Select Your Target Career Path Branch
              </h3>
              
              {/* Branching timeline representation */}
              <div style={{ position: 'relative', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                position: 'absolute', left: 5, top: 20, bottom: 20, width: 2,
                background: 'linear-gradient(180deg, var(--accent) 0%, var(--teal) 50%, var(--purple) 100%)'
            }}/>
                {CAREERS.map(c => {
                const active = selectedPath === c.id;
                return (<div key={c.id} onClick={() => !generating && setSelectedPath(c.id)} className={`glass-card ${active ? 'card-glow-hover' : 'card-hover'}`} style={{
                        padding: 16,
                        cursor: generating ? 'not-allowed' : 'pointer',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 16,
                        boxShadow: active ? '0 10px 25px -5px rgba(99, 102, 241, 0.2)' : 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                        position: 'relative'
                    }}>
                      {/* Timeline branching node marker */}
                      <div style={{
                        position: 'absolute', left: -20, top: '50%', transform: 'translate(-50%, -50%)',
                        width: 12, height: 12, borderRadius: '50%',
                        background: active ? 'var(--accent)' : 'var(--bg3)',
                        border: `2.5px solid ${active ? '#fff' : 'var(--border2)'}`,
                        boxShadow: active ? '0 0 8px var(--accent)' : 'none',
                        transition: 'all 0.2s',
                        zIndex: 2
                    }}/>

                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: active ? 'var(--accent)' : 'var(--bg3)',
                        color: active ? 'white' : 'var(--t2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0
                    }}>
                        {c.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)' }}>{c.title}</span>
                          {active && (<span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              ✓ Active Target
                            </span>)}
                        </div>
                        <p style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
                      </div>
                    </div>);
            })}
              </div>
            </div>

            {/* Customizer */}
            <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                2. Customise Learning Depth
              </h3>

              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: 10 }}>Experience Level / Prior Knowledge</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 6 }}>
                  {[
                { id: 'beginner', label: '🥚 Beginner', desc: 'Syntax Basics & Logic' },
                { id: 'intermediate', label: '🐥 Intermediate', desc: 'Frameworks & REST APIs' },
                { id: 'advanced', label: '🦅 Advanced', desc: 'Cloud Systems & Concurrency' }
            ].map(lvl => {
                const selected = experienceLevel === lvl.id;
                return (<div key={lvl.id} onClick={() => setExperienceLevel(lvl.id)} style={{
                        background: 'var(--bg3)',
                        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 12,
                        padding: '12px 8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                    }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{lvl.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 4 }}>{lvl.desc}</div>
                      </div>);
            })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: 10 }}>Concepts You Already Know (Comma Separated)</label>
                <input type="text" placeholder="e.g. variables, loops, arrays, OOP, classes" value={knownConcepts} onChange={e => setKnownConcepts(e.target.value)} className="form-input" style={{ marginTop: 6 }}/>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 10 }}>Custom Learning Target Focus (Optional)</label>
                <input type="text" placeholder="e.g. Spring Boot, REST endpoints, Docker containerisation" value={customFocus} onChange={e => setCustomFocus(e.target.value)} className="form-input" style={{ marginTop: 6 }}/>
              </div>
            </div>
          </div>

          {/* Synthesis Preview */}
          <div className="glass-card" style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
            }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>⚙️</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Trajectory Blueprint</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>{selectedCareer.title} Path</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>ESTIMATED TIME</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>{selectedCareer.estimatedWeeks} Weeks</div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>LEVEL TARGET</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2, textTransform: 'capitalize' }}>{experienceLevel} Focus</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Target Core Competencies</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPath === 'java_sde' && ['Java Standard Library', 'OOP Principles', 'Spring Boot REST', 'SQL Databases', 'System Design'].map(s => (<span key={s} style={{ fontSize: 11, background: 'var(--bg3)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 8, color: 'var(--t2)' }}>
                      ✓ {s}
                    </span>))}
                  {selectedPath === 'react_frontend' && ['React Hooks', 'NextJS SSR', 'Vanilla CSS', 'Zustand State', 'TypeScript Types'].map(s => (<span key={s} style={{ fontSize: 11, background: 'var(--bg3)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 8, color: 'var(--t2)' }}>
                      ✓ {s}
                    </span>))}
                  {selectedPath === 'devops_cloud' && ['Docker Containers', 'CI/CD Pipelines', 'AWS Cloud Services', 'Prometheus & Grafana', 'Kubernetes Orchestration'].map(s => (<span key={s} style={{ fontSize: 11, background: 'var(--bg3)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 8, color: 'var(--t2)' }}>
                      ✓ {s}
                    </span>))}
                </div>
              </div>
            </div>

            {generating ? (<div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--t2)', marginBottom: 6 }}>
                  <span>Synthesizing roadmap modules...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--teal))', borderRadius: 3 }}/>
                </div>
              </div>) : (<button onClick={handleGenerateRoadmap} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13, gap: 8 }}>
                <span>🚀</span> Generate Career Quest Roadmap
              </button>)}
          </div>
        </div>) : (modules.length > 0 ? (
        // COMMITTED & LOCKED ROADMAP VISUAL TIMELINE
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Daily Quest Target Panel */}
            <div className="glass-card" style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                boxShadow: 'var(--shadow-md)'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎯 Roadmap Active Quest Board</span>
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>5 Quests Target</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4, marginBottom: 0 }}>
                  Quests cost 5 pins to unlock. Your daily quest allowance provides exactly 25 pins. Current balance: <strong style={{ color: 'var(--accent)' }}>⚡ {pins} Pins</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: completedQuestsInRoadmap >= totalQuestsInRoadmap ? 'var(--green)' : 'var(--accent)' }}>
                    Roadmap Completion: {completedQuestsInRoadmap} / {totalQuestsInRoadmap} Quests
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Solve in order to advance</div>
                </div>
                <div style={{ width: 140, height: 10, background: 'var(--bg3)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{
                width: `${Math.min(100, (completedQuestsInRoadmap / Math.max(1, totalQuestsInRoadmap)) * 100)}%`,
                height: '100%',
                background: completedQuestsInRoadmap >= totalQuestsInRoadmap ? 'var(--green)' : 'linear-gradient(90deg, var(--accent), var(--teal))',
                transition: 'width 0.3s'
            }}/>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: activePlaygroundQuest ? '1fr 1.2fr' : '1fr', gap: 24, alignItems: 'flex-start' }}>
              {/* Left Column: Visual Modules Accordion Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', paddingLeft: 16 }}>
                
                {/* Visual timeline connector line */}
                <div style={{
                position: 'absolute', left: 4, top: 40, bottom: 40, width: 2,
                background: 'dashed rgba(255, 255, 255, 0.1)', borderLeft: '2px dashed rgba(255, 255, 255, 0.15)'
            }}/>

                {modules.map((mod, index) => {
                const isExpanded = expandedModuleId === mod.id;
                const completedQuestsInMod = mod.quests.filter(q => completedQuests.includes(q.id)).length;
                const modPercentage = Math.round((completedQuestsInMod / Math.max(1, mod.quests.length)) * 100);
                return (<div key={mod.id} className="glass-card" style={{
                        border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 20,
                        overflow: 'hidden',
                        transition: 'all 0.25s',
                        boxShadow: isExpanded ? '0 10px 30px rgba(99, 102, 241, 0.1)' : 'var(--shadow-sm)',
                        position: 'relative'
                    }}>
                      {/* Timeline node icon */}
                      <div style={{
                        position: 'absolute', left: -22, top: 28, transform: 'translateX(-50%)',
                        width: 16, height: 16, borderRadius: '50%',
                        background: modPercentage === 100 ? 'var(--green)' : 'var(--accent)',
                        border: '3px solid var(--bg)',
                        boxShadow: '0 0 6px rgba(0,0,0,0.8)',
                        zIndex: 3
                    }}/>

                      {/* Module Header Bar */}
                      <div onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)} style={{
                        padding: '18px 24px',
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(79,70,229,0.02)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        userSelect: 'none'
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: modPercentage === 100 ? 'var(--green-light)' : 'var(--accent-light)',
                        color: modPercentage === 100 ? 'var(--green)' : 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, flexShrink: 0
                    }}>
                              {modPercentage === 100 ? '✓' : index + 1}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>{mod.title}</span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, paddingLeft: 34, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.desc}</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: modPercentage === 100 ? 'var(--green)' : 'var(--t2)' }}>
                              {modPercentage}% Completed
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--t4)', marginTop: 2 }}>{mod.estimatedWeeks} weeks · {mod.difficulty}</div>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--t4)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                        </div>
                      </div>

                      {/* Module Expandable Body: Quests List */}
                      {isExpanded && (<div style={{
                            padding: '0 24px 20px 24px',
                            borderTop: '1px solid var(--border)',
                            background: 'var(--bg3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            paddingTop: 16
                        }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                            Module Programming Quests
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {mod.quests.map((q, qIdx) => {
                            const status = getQuestStatus(q.id, allQuestsInRoadmap);
                            const isCurrentActive = activePlaygroundQuest?.id === q.id;
                            return (<div key={q.id} onClick={() => status !== 'locked' && selectPlaygroundQuest(q)} className={`glass-card ${status === 'locked' ? '' : 'card-hover'}`} style={{
                                    border: `1px solid ${isCurrentActive ? 'var(--accent)' : status === 'completed' ? 'var(--green)' : 'var(--border)'}`,
                                    borderRadius: 14,
                                    padding: 14,
                                    cursor: status === 'locked' ? 'not-allowed' : 'pointer',
                                    opacity: status === 'locked' ? 0.5 : 1,
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14
                                }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: status === 'completed' ? 'rgba(5,150,105,0.15)' : status === 'locked' ? 'var(--bg3)' : 'rgba(99, 102, 241, 0.15)',
                                    color: status === 'completed' ? 'var(--green)' : status === 'locked' ? 'var(--t3)' : 'var(--accent)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 800, flexShrink: 0
                                }}>
                                    {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : qIdx + 1}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{q.title}</span>
                                      {status === 'completed' && <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>COMPLETED</span>}
                                      {status === 'unlocked' && <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>START PLAY ➔</span>}
                                    </div>
                                    <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {q.desc}
                                    </p>
                                  </div>
                                </div>);
                        })}
                          </div>
                        </div>)}
                    </div>);
            })}
              </div>

              {/* Right Column: Embedded Code Compiler Playground */}
              {activePlaygroundQuest && (<div className="glass-card" style={{
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    boxShadow: 'var(--shadow-md)',
                    position: 'sticky',
                    top: 20
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>{activePlaygroundQuest.title}</span>
                      <button onClick={() => setShowHint(h => !h)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                        {showHint ? 'Hide Hint' : 'Show Hint 💡'}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>{activePlaygroundQuest.desc}</p>
                    {showHint && (<div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: 10, borderRadius: 8, marginTop: 10, fontSize: 11, color: 'var(--amber)', lineHeight: 1.4 }}>
                        💡 <strong>Hint:</strong> {activePlaygroundQuest.hint}
                      </div>)}
                  </div>

                  {/* Java Editor */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', border: '1px solid var(--border)', borderBottom: 'none', padding: '6px 12px', borderRadius: '10px 10px 0 0' }}>
                      <span style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>Solution.java (Compiler Simulator)</span>
                      <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Java Standard Edition</span>
                    </div>
                    <textarea value={code} onChange={(e) => setCode(e.target.value)} style={{
                    width: '100%',
                    height: 240,
                    background: '#1e1e24',
                    color: '#f8f8f2',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    padding: 14,
                    border: '1px solid var(--border)',
                    borderRadius: '0 0 10px 10px',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: 1.6
                }}/>
                  </div>

                  {/* Verification Output */}
                  {output && (<div style={{
                        background: output.success ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
                        border: `1.5px solid ${output.success ? 'var(--green)' : 'var(--coral)'}`,
                        padding: 12,
                        borderRadius: 10,
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        color: output.success ? 'var(--green)' : 'var(--coral)',
                        whiteSpace: 'pre-wrap'
                    }}>
                      {output.success ? '🟢 ' : '🔴 '}
                      {output.message}
                    </div>)}

                  {/* Compile Buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={verifySolution} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 10, fontSize: 12.5 }}>
                      Verify Solution ✓
                    </button>
                    <button onClick={() => setCode(activePlaygroundQuest.starterCode)} className="btn-ghost" style={{ padding: 10, fontSize: 12.5 }}>
                      Reset
                    </button>
                  </div>
                </div>)}
            </div>
          </div>) : (
        // ROADMAP INTERACTIVE EDITOR prior to committing
        <div className="glass-card animate-fade-in" style={{ padding: 30 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--t1)', margin: '0 0 6px 0' }}>
              🛠 Interactive Modules Customiser
            </h2>
            <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Review the generated modules blueprint. You can fully customize this roadmap by editing, adding, or deleting modules before committing it to your career timeline.
            </p>

            {/* Editable Modules List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 26 }}>
              {tempModules.map((m, idx) => {
                const isEditing = editingModuleId === m.id;
                return (<div key={m.id} className="glass-card" style={{
                        border: `1px solid ${isEditing ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 16,
                        padding: 18,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11.5, fontWeight: 700
                    }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{m.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEditingModule(m)} style={{
                        background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6,
                        color: 'var(--accent)', padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontWeight: 600
                    }}>
                          Edit ✏️
                        </button>
                        <button onClick={() => deleteModule(m.id)} style={{
                        background: 'rgba(220,38,38,0.08)', border: 'none', borderRadius: 6,
                        color: 'var(--coral)', padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontWeight: 600
                    }}>
                          Delete 🗑
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, margin: 0, paddingLeft: 34 }}>{m.desc}</p>
                    
                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)', paddingLeft: 34 }}>
                      <span>Difficulty: <strong style={{ color: 'var(--teal)' }}>{m.difficulty}</strong></span>
                      <span>Duration: <strong style={{ color: 'var(--accent)' }}>{m.estimatedWeeks} {m.estimatedWeeks === 1 ? 'Week' : 'Weeks'}</strong></span>
                      <span>Nested Quests: <strong style={{ color: 'var(--purple)' }}>{m.quests.length} Quests</strong></span>
                    </div>

                    {/* Inline Edit Form */}
                    {isEditing && (<div className="glass-card" style={{
                            marginTop: 14,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 9 }}>Module Title</label>
                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}/>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 9 }}>Difficulty</label>
                            <select value={editDiff} onChange={e => setEditDiff(e.target.value)} className="form-input" style={{ padding: '6px 10px', fontSize: 12, background: 'var(--bg3)', color: 'var(--t1)' }}>
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: 9 }}>Duration (Weeks)</label>
                            <input type="number" min="1" max="12" value={editWeeks} onChange={e => setEditWeeks(parseInt(e.target.value) || 2)} className="form-input" style={{ padding: '6px 10px', fontSize: 12 }}/>
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: 9 }}>Description</label>
                          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="form-input" style={{ padding: '8px 10px', height: 60, resize: 'none', fontSize: 12 }}/>
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingModuleId(null)} className="btn-ghost btn-sm" style={{ padding: '5px 12px', fontSize: 11 }}>
                            Cancel
                          </button>
                          <button onClick={saveModuleChanges} className="btn-primary btn-sm" style={{ padding: '5px 12px', fontSize: 11 }}>
                            Save Changes ✓
                          </button>
                        </div>
                      </div>)}
                  </div>);
            })}
            </div>

            {/* Visual Editor Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button onClick={addCustomModule} className="btn-ghost" style={{ fontSize: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                ➕ Add Custom Module
              </button>
              <button onClick={commitRoadmap} className="btn-primary" style={{ fontSize: 13, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 6 }}>
                🔒 Commit & Lock Roadmap ➔
              </button>
            </div>
          </div>))}
    </div>);
}

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error("PORT must be a positive integer.");
}

// Lazy initialization of GoogleGenAI client to avoid crashing on start if API Key is not set
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ===== AUTH PROXY: Forward auth requests to Spring Boot backend =====

app.post("/api/auth/signup", async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.json(data);
  } catch (error: any) {
    if (IS_PRODUCTION) {
      console.error("Auth backend unavailable during signup:", error);
      return res.status(502).json({ error: "Authentication service is temporarily unavailable." });
    }
    console.warn("Auth backend unavailable, using offline fallback for signup");
    // Offline fallback: store in memory for dev purposes
    const { email, password, preferredLanguage } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    return res.json({
      token: Buffer.from(`${email}:${Date.now()}`).toString("base64"),
      email,
      preferredLanguage: preferredLanguage || "PYTHON",
      message: "[Offline Mode] Account created locally. Start Spring Boot backend for persistent storage."
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.json(data);
  } catch (error: any) {
    if (IS_PRODUCTION) {
      console.error("Auth backend unavailable during login:", error);
      return res.status(502).json({ error: "Authentication service is temporarily unavailable." });
    }
    console.warn("Auth backend unavailable, using offline fallback for login");
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    return res.json({
      token: Buffer.from(`${email}:${Date.now()}`).toString("base64"),
      email,
      preferredLanguage: "PYTHON",
      message: "[Offline Mode] Logged in locally. Start Spring Boot backend for real authentication."
    });
  }
});

// ===== GEMINI API ENDPOINTS =====

// API endpoint for analyzing code
app.post("/api/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code content is required for analysis." });
    }

    const ai = getGenAIClient();

    const prompt = `Analyze the following ${language || "unspecified"} code. Extract its execution flow, dependencies, internal call hierarchy of functions, complexity, cognitive load, potential issues, and suggest improvements. 
    Make sure to provide highly detailed visual flowcharting steps outlining what is happening in chronological execution order.
    Also check the code for any syntax errors, logical errors, or bugs. If errors exist, include them in the "errors" field with line numbers and descriptions.

Code to analyze:
\`\`\`${language || ""}
${code}
\`\`\`
`;

    // Modern Gemini 3.5 Flash is recommended for standard text tasks 
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert static program analysis engine. You generate correct structural complexity analysis, function metadata, chronological execution flow steps, metric estimations, error detection, and bottleneck suggestions. Return output strictly in valid JSON according to the specified schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "complexity", "functions", "flowSteps", "dependencies", "metrics"],
          properties: {
            summary: {
              type: Type.STRING,
              description: "A summary explanation of what this code does in high-level readable terms."
            },
            complexity: {
              type: Type.OBJECT,
              required: ["time", "space", "explanation"],
              properties: {
                time: { type: Type.STRING, description: "Time complexity using Big O notation, e.g. O(N)" },
                space: { type: Type.STRING, description: "Space complexity using Big O notation, e.g. O(1)" },
                explanation: { type: Type.STRING, description: "Clear architectural explanation of the space/time complexity." }
              }
            },
            functions: {
              type: Type.ARRAY,
              description: "List of internal functions, methods or main blocks of code identified.",
              items: {
                type: Type.OBJECT,
                required: ["name", "calls", "lineRange", "purpose"],
                properties: {
                  name: { type: Type.STRING, description: "Function or block name" },
                  calls: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Other local functions or methods that this function invokes." 
                  },
                  lineRange: { type: Type.STRING, description: "Estimated line numbers or scope (e.g. '1-12')" },
                  purpose: { type: Type.STRING, description: "Brief functional purpose of this function." }
                }
              }
            },
            flowSteps: {
              type: Type.ARRAY,
              description: "Sequence of chronological logical/execution flow steps inside the code for visual flowchart structure.",
              items: {
                type: Type.OBJECT,
                required: ["step", "title", "description", "relatedCodeSnippet", "role"],
                properties: {
                  step: { type: Type.INTEGER, description: "1-based index order of step" },
                  title: { type: Type.STRING, description: "Short title of this action or phase" },
                  description: { type: Type.STRING, description: "What this execution step does step-by-step." },
                  relatedCodeSnippet: { type: Type.STRING, description: "A one-liner or short snippet related to this execution stage." },
                  role: { type: Type.STRING, description: "Logical category, select one of: 'input', 'init', 'loop', 'condition', 'process', 'output', 'error'" }
                }
              }
            },
            dependencies: {
              type: Type.ARRAY,
              description: "Imports, external modules, libraries or internal helper components.",
              items: {
                type: Type.OBJECT,
                required: ["name", "type", "purpose"],
                properties: {
                  name: { type: Type.STRING, description: "Name of the library or module (e.g., 'math', 'lodash', 'fs')" },
                  type: { type: Type.STRING, description: "Must be 'internal' or 'external'" },
                  purpose: { type: Type.STRING, description: "Why is it used or imported" }
                }
              }
            },
            errors: {
              type: Type.ARRAY,
              description: "Any syntax errors, logical errors, or bugs found in the code.",
              items: {
                type: Type.OBJECT,
                required: ["line", "message", "severity"],
                properties: {
                  line: { type: Type.INTEGER, description: "Line number where the error occurs" },
                  message: { type: Type.STRING, description: "Description of the error" },
                  severity: { type: Type.STRING, description: "Either 'error' or 'warning'" }
                }
              }
            },
            metrics: {
              type: Type.OBJECT,
              required: ["difficulty", "cognitiveLoad", "potentialBottlenecks", "suggestions"],
              properties: {
                difficulty: { type: Type.STRING, description: "Overall readability/construction level, choose from: 'Easy', 'Medium', 'Hard', 'Extreme'" },
                cognitiveLoad: { type: Type.INTEGER, description: "Rating from 1 (simple) to 100 (highly complex nested blocks)" },
                potentialBottlenecks: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Potential performance, security, memory, or logical bottleneck statements." 
                },
                suggestions: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Polished instructions to optimize or fix the issues." 
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from static analysis engine.");
    }

    const data = JSON.parse(resultText.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Analysis failure:", error);
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred during program flow compilation." 
    });
  }
});

// API endpoint for follow-up AI conversation regarding the analyzed code
app.post("/api/chat", async (req, res) => {
  try {
    const { message, code, language, history, webSearch } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message context is required for chat." });
    }

    const ai = getGenAIClient();

    const systemInstruction = `You are CodeFlow's AI Companion, an expert program visualizer and software architect. 
You answer questions about the analyzed code. Keep explanations concise, practical, and structured in a helpful clear format.
Highlight any security holes, code optimization spots, or concurrency race risks where applicable.

Provide advice specifically focused on this code snippet:
CODE LANGUAGE: ${language || "unspecified"}
CODE BLOCK:
\`\`\`${language || ""}
${code || ""}
\`\`\`
`;

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const config: any = {
      systemInstruction: systemInstruction,
    };

    // Enable Google Search grounding when webSearch is true
    if (webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: config
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat failure:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred during interactive conversation." 
    });
  }
});

// ===== NEW ENDPOINTS =====

// Global chatbot endpoint (not code-specific)
app.post("/api/global-chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGenAIClient();

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are CodeFlow AI, a helpful programming assistant. You help with coding questions, algorithm explanations, debugging, and general programming advice. Be concise, practical, and friendly. Use code examples when helpful."
      }
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Global chat failure:", error);
    return res.status(500).json({ error: error.message || "Chat error." });
  }
});

// Web search endpoint using Gemini with Google Search grounding
app.post("/api/web-search", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGenAIClient();

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are CodeFlow AI with web search capabilities. Search the web to provide up-to-date answers about programming, technology, libraries, and documentation. Cite sources when available. Be concise and accurate.",
        tools: [{ googleSearch: {} }]
      }
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Web search failure:", error);
    return res.status(500).json({ error: error.message || "Web search error." });
  }
});

// Project overview stitch page generation endpoint
app.post("/api/generate-overview", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Project prompt is required." });
    }

    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a comprehensive project overview for: "${prompt}". Create 5-7 detailed pages covering different aspects of the project.`,
      config: {
        systemInstruction: "You are a senior software architect. Generate comprehensive project overview documents. Each page should cover a different aspect. Return valid JSON matching the schema exactly.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["pages"],
          properties: {
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "content", "icon", "highlights"],
                properties: {
                  title: { type: Type.STRING, description: "Page title (e.g. 'Project Overview', 'Architecture', 'Tech Stack')" },
                  content: { type: Type.STRING, description: "Detailed page content with multiple paragraphs." },
                  icon: { type: Type.STRING, description: "Icon type: 'overview', 'architecture', 'tech', or 'features'" },
                  highlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3-5 short keyword highlights for this page."
                  }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response.");
    const data = JSON.parse(resultText.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Overview generation failure:", error);
    return res.status(500).json({ error: error.message || "Failed to generate overview." });
  }
});

// Screenshot analysis endpoint using Gemini Vision
app.post("/api/analyze-screenshot", async (req, res) => {
  try {
    const { image, history } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Screenshot image is required." });
    }

    const ai = getGenAIClient();

    // Extract base64 data (remove the data:image/...;base64, prefix)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const contents: any[] = [];
    
    // Add conversation history for context
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    // Add the screenshot with analysis request
    contents.push({
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          }
        },
        {
          text: "Analyze this screenshot of my current screen. Describe what you see — identify any code, UI elements, data visualizations, error messages, or interesting details. If there's code visible, explain what it does. If there are charts or graphs, interpret the data. Be concise but thorough. Format your response with clear sections."
        }
      ]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are CodeFlow AI's Vision Assistant. You analyze screenshots of the CodeFlow application and other screens. You can identify code, UI elements, visualizations, error messages, and provide intelligent insights. Be concise, practical, and helpful. When you see code, explain its purpose. When you see visualizations, interpret the data. When you see errors, suggest fixes."
      }
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Screenshot analysis failure:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze screenshot." });
  }
});

// ===== NEW ENHANCED ANALYSIS ENDPOINTS =====

// AST (Abstract Syntax Tree) analysis
app.post("/api/analyze-ast", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required." });

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following ${language || "unspecified"} code and generate its Abstract Syntax Tree (AST) structure.

Code:
\`\`\`${language || ""}
${code}
\`\`\``,
      config: {
        systemInstruction: "You are an expert compiler and parser engineer. Generate a detailed AST representation of the provided code. Identify all nodes, their types, hierarchical relationships, and depths. Return valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["rootNode", "totalNodes", "maxDepth", "nodeTypes", "summary"],
          properties: {
            rootNode: {
              type: Type.OBJECT,
              required: ["type", "name", "children", "lineRange", "description"],
              properties: {
                type: { type: Type.STRING, description: "AST node type (e.g., Program, FunctionDeclaration, IfStatement)" },
                name: { type: Type.STRING, description: "Node identifier or label" },
                lineRange: { type: Type.STRING, description: "Line range this node covers" },
                description: { type: Type.STRING, description: "What this node represents" },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["type", "name", "children", "lineRange", "description"],
                    properties: {
                      type: { type: Type.STRING },
                      name: { type: Type.STRING },
                      lineRange: { type: Type.STRING },
                      description: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          required: ["type", "name", "lineRange", "description"],
                          properties: {
                            type: { type: Type.STRING },
                            name: { type: Type.STRING },
                            lineRange: { type: Type.STRING },
                            description: { type: Type.STRING },
                            children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, name: { type: Type.STRING }, lineRange: { type: Type.STRING }, description: { type: Type.STRING } } } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            totalNodes: { type: Type.INTEGER, description: "Total number of AST nodes" },
            maxDepth: { type: Type.INTEGER, description: "Maximum depth of the AST tree" },
            nodeTypes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["type", "count"],
                properties: {
                  type: { type: Type.STRING, description: "Node type name" },
                  count: { type: Type.INTEGER, description: "How many of this type exist" }
                }
              }
            },
            summary: { type: Type.STRING, description: "Summary of the AST structure" }
          }
        }
      }
    });

    const data = JSON.parse(response.text!.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("AST analysis failure:", error);
    return res.status(500).json({ error: error.message || "AST analysis failed." });
  }
});

// Security vulnerability scanning
app.post("/api/analyze-security", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required." });

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Perform a comprehensive security audit on the following ${language || "unspecified"} code. Identify all security vulnerabilities, potential attack vectors, and provide remediation guidance.

Code:
\`\`\`${language || ""}
${code}
\`\`\``,
      config: {
        systemInstruction: "You are an elite application security engineer (AppSec). Perform thorough SAST (Static Application Security Testing) analysis. Check for OWASP Top 10, CWE patterns, injection flaws, authentication issues, cryptographic weaknesses, and more. Be specific with line numbers and provide actionable fixes. Return valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["overallScore", "riskLevel", "vulnerabilities", "summary", "bestPractices"],
          properties: {
            overallScore: { type: Type.INTEGER, description: "Security score from 0-100 (100 = most secure)" },
            riskLevel: { type: Type.STRING, description: "One of: Critical, High, Medium, Low, Secure" },
            vulnerabilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "severity", "category", "line", "description", "recommendation"],
                properties: {
                  id: { type: Type.STRING, description: "Unique vulnerability ID like SEC-001" },
                  title: { type: Type.STRING, description: "Short vulnerability title" },
                  severity: { type: Type.STRING, description: "One of: critical, high, medium, low, info" },
                  category: { type: Type.STRING, description: "Category like Injection, Authentication, Cryptography, etc." },
                  line: { type: Type.INTEGER, description: "Approximate line number" },
                  description: { type: Type.STRING, description: "Detailed explanation of the vulnerability" },
                  recommendation: { type: Type.STRING, description: "How to fix this vulnerability" },
                  cweId: { type: Type.STRING, description: "CWE ID if applicable (e.g., CWE-89)" }
                }
              }
            },
            summary: { type: Type.STRING, description: "Overall security assessment summary" },
            bestPractices: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of security best practices recommendations"
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text!.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Security analysis failure:", error);
    return res.status(500).json({ error: error.message || "Security analysis failed." });
  }
});

// AI-generated code detection
app.post("/api/detect-ai", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required." });

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following ${language || "unspecified"} code and determine whether it was likely written by a human or generated by AI. Look for telltale patterns.

Code:
\`\`\`${language || ""}
${code}
\`\`\``,
      config: {
        systemInstruction: "You are an expert at detecting AI-generated code vs human-written code. Analyze coding style, comment patterns, variable naming conventions, structure uniformity, error handling patterns, and other indicators. Provide a detailed assessment with confidence scores. Be honest and nuanced. Return valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["overallScore", "verdict", "indicators", "summary", "patterns"],
          properties: {
            overallScore: { type: Type.INTEGER, description: "AI probability score from 0-100 (100 = definitely AI, 0 = definitely human)" },
            verdict: { type: Type.STRING, description: "One of: Likely AI, Possibly AI, Mixed, Possibly Human, Likely Human" },
            indicators: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["indicator", "confidence", "explanation"],
                properties: {
                  indicator: { type: Type.STRING, description: "Name of the indicator checked" },
                  confidence: { type: Type.STRING, description: "One of: High, Medium, Low" },
                  explanation: { type: Type.STRING, description: "Why this indicator suggests AI or human authorship" }
                }
              }
            },
            summary: { type: Type.STRING, description: "Overall assessment of whether code is AI-generated" },
            patterns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific patterns observed that support the verdict"
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text!.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("AI detection failure:", error);
    return res.status(500).json({ error: error.message || "AI detection failed." });
  }
});

// Code improvement suggestions
app.post("/api/suggest", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required." });

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Review the following ${language || "unspecified"} code and provide comprehensive improvement suggestions across performance, readability, security, architecture, style, and best practices.

Code:
\`\`\`${language || ""}
${code}
\`\`\``,
      config: {
        systemInstruction: "You are a senior staff engineer doing a thorough code review. Provide specific, actionable suggestions with before/after code examples. Prioritize suggestions by impact. Cover performance optimizations, readability improvements, security hardening, architectural patterns, coding style, and industry best practices. Return valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["suggestions", "overallQuality", "summary", "quickWins"],
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "category", "priority", "description", "currentCode", "suggestedCode", "impact"],
                properties: {
                  id: { type: Type.INTEGER, description: "Suggestion ID starting from 1" },
                  title: { type: Type.STRING, description: "Short descriptive title" },
                  category: { type: Type.STRING, description: "One of: performance, readability, security, architecture, style, best-practice" },
                  priority: { type: Type.STRING, description: "One of: high, medium, low" },
                  description: { type: Type.STRING, description: "Detailed explanation of why this change should be made" },
                  currentCode: { type: Type.STRING, description: "The current problematic code snippet" },
                  suggestedCode: { type: Type.STRING, description: "The improved code snippet" },
                  impact: { type: Type.STRING, description: "Expected impact of this change" }
                }
              }
            },
            overallQuality: { type: Type.INTEGER, description: "Overall code quality score from 0-100" },
            summary: { type: Type.STRING, description: "High-level summary of code quality" },
            quickWins: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Quick easy improvements that can be made immediately"
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text!.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Suggestions failure:", error);
    return res.status(500).json({ error: error.message || "Suggestions generation failed." });
  }
});

// Execution step-by-step trace
app.post("/api/trace-execution", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required." });

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Trace the step-by-step execution of the following ${language || "unspecified"} code. For each step, show the current line, what happens, variable states, and any output produced.

Code:
\`\`\`${language || ""}
${code}
\`\`\``,
      config: {
        systemInstruction: "You are a runtime debugger engine. Simulate the execution of the code step by step, tracking variable states, function calls, and output at each step. Be precise about what happens at each line. Return valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["steps", "finalOutput", "totalSteps", "summary"],
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["step", "line", "action", "variables", "output", "explanation"],
                properties: {
                  step: { type: Type.INTEGER, description: "Step number" },
                  line: { type: Type.INTEGER, description: "Line number being executed" },
                  action: { type: Type.STRING, description: "Short description of action (e.g., 'Assign variable', 'Call function')" },
                  variables: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["name", "value"],
                      properties: {
                        name: { type: Type.STRING },
                        value: { type: Type.STRING }
                      }
                    }
                  },
                  output: { type: Type.STRING, description: "Any console output produced at this step (empty string if none)" },
                  explanation: { type: Type.STRING, description: "Detailed explanation of what happens" }
                }
              }
            },
            finalOutput: { type: Type.STRING, description: "The complete final output of the program" },
            totalSteps: { type: Type.INTEGER, description: "Total number of execution steps" },
            summary: { type: Type.STRING, description: "Summary of the execution trace" }
          }
        }
      }
    });

    const data = JSON.parse(response.text!.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Execution trace failure:", error);
    return res.status(500).json({ error: error.message || "Execution tracing failed." });
  }
});

// AI Tutor - explain concepts in the code
app.post("/api/tutor", async (req, res) => {
  try {
    const { code, language, topic } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required." });

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a programming tutor. Analyze the following ${language || "unspecified"} code and ${topic ? `explain the concept: "${topic}"` : "identify the main programming concepts used and explain them"}.

Code:
\`\`\`${language || ""}
${code}
\`\`\``,
      config: {
        systemInstruction: "You are a world-class programming educator. Explain concepts clearly with analogies. Identify key patterns in the code, provide practice questions to test understanding, and suggest related topics for deeper learning. Be encouraging and thorough. Return valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["conceptName", "difficulty", "explanation", "keyTakeaways", "codePatterns", "practiceQuestions", "relatedTopics"],
          properties: {
            conceptName: { type: Type.STRING, description: "The main concept or pattern being taught" },
            difficulty: { type: Type.STRING, description: "One of: Beginner, Intermediate, Advanced, Expert" },
            explanation: { type: Type.STRING, description: "Comprehensive, beginner-friendly explanation with analogies" },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key points to remember"
            },
            codePatterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["pattern", "description"],
                properties: {
                  pattern: { type: Type.STRING, description: "The code pattern name" },
                  description: { type: Type.STRING, description: "How it's used in this code" }
                }
              }
            },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["question", "hint"],
                properties: {
                  question: { type: Type.STRING, description: "A practice question" },
                  hint: { type: Type.STRING, description: "A hint for the answer" }
                }
              }
            },
            relatedTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Related topics to explore next"
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text!.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Tutor failure:", error);
    return res.status(500).json({ error: error.message || "AI Tutor failed." });
  }
});

// Render uses this endpoint to confirm that the web service is accepting traffic.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "CodeFlow Web" });
});

// Setup Vite as a dev middleware or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA routing fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CodeFlow web server listening on 0.0.0.0:${PORT}`);
  });
}

startServer();

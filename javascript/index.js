const express = require("express");
const bodyParser = require("body-parser");
const { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } = require("@aws-sdk/client-bedrock-runtime");
const CanvasLMSClient = require("./canvas-client");

const app = express();

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

// Initialize Canvas client (will use environment variables)
let canvasClient = null;
try {
  canvasClient = new CanvasLMSClient();
  console.log(`Canvas client initialized for domain: ${canvasClient.canvasDomain}`);
} catch (error) {
  console.warn('Canvas client not initialized:', error.message);
  console.warn('Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables to enable Canvas integration.');
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// POST /api/completions endpoint
app.post("/api/completions", async (req, res) => {
  try {
    const {
      message,
      system,
      temperature = 0.7,
      max_tokens = 512,
      model_id = "us.amazon.nova-pro-v1:0",
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Prepare messages for Bedrock
    const messages = [{
      role: "user",
      content: [{ text: message }]
    }];

    // Prepare system prompt if provided
    const systemMessages = system ? [{ text: system }] : [];

    // Prepare inference configuration
    const inferenceConfig = {
      temperature,
      maxTokens: max_tokens
    };

    // Create Bedrock command
    const command = new ConverseCommand({
      modelId: model_id,
      messages,
      system: systemMessages,
      inferenceConfig
    });

    // Call Bedrock
    const response = await bedrockClient.send(command);
    const responseText = response.output.message.content[0].text;

    res.json({
      response: responseText,
      model_id,
      usage: response.usage
    });

  } catch (error) {
    console.error("Bedrock error:", error);
    res.status(500).json({ error: `Bedrock error: ${error.message}` });
  }
});

// POST /api/chats endpoint
app.post("/api/chats", async (req, res) => {
  try {
    const {
      messages,
      system,
      temperature = 0.7,
      max_tokens = 512,
      model_id = "us.amazon.nova-pro-v1:0",
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Convert chat messages to Bedrock format
    const bedrockMessages = messages.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
    }));

    // Prepare system prompt if provided
    const systemMessages = system ? [{ text: system }] : [];

    // Prepare inference configuration
    const inferenceConfig = {
      temperature,
      maxTokens: max_tokens
    };

    // Create Bedrock command
    const command = new ConverseCommand({
      modelId: model_id,
      messages: bedrockMessages,
      system: systemMessages,
      inferenceConfig
    });

    // Call Bedrock
    const response = await bedrockClient.send(command);
    const responseText = response.output.message.content[0].text;

    res.json({
      response: responseText,
      model_id,
      usage: response.usage
    });

  } catch (error) {
    console.error("Bedrock error:", error);
    res.status(500).json({ error: `Bedrock error: ${error.message}` });
  }
});

// POST /api/streaming/chats endpoint
app.post("/api/streaming/chats", async (req, res) => {
  try {
    const {
      messages,
      system,
      temperature = 0.7,
      max_tokens = 512,
      model_id = "us.amazon.nova-pro-v1:0",
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Convert chat messages to Bedrock format
    const bedrockMessages = messages.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
    }));

    // Prepare system prompt if provided
    const systemMessages = system ? [{ text: system }] : [];

    // Prepare inference configuration
    const inferenceConfig = {
      temperature,
      maxTokens: max_tokens
    };

    // Create Bedrock streaming command
    const command = new ConverseStreamCommand({
      modelId: model_id,
      messages: bedrockMessages,
      system: systemMessages,
      inferenceConfig
    });

    // Call Bedrock streaming
    const response = await bedrockClient.send(command);

    // Stream the response
    for await (const event of response.stream) {
      if (event.contentBlockDelta) {
        const delta = event.contentBlockDelta.delta;
        if (delta.text) {
          res.write(`data: ${JSON.stringify({ text: delta.text })}\n\n`);
        }
      } else if (event.messageStop) {
        res.write(`data: ${JSON.stringify({ done: true, usage: event.messageStop.stopReason })}\n\n`);
        break;
      }
    }

    res.end();

  } catch (error) {
    console.error("Bedrock streaming error:", error);
    res.write(`data: ${JSON.stringify({ error: `Bedrock error: ${error.message}` })}\n\n`);
    res.end();
  }
});

// Canvas LMS API endpoints

// GET /api/canvas/search - Smart search across Canvas content
app.get("/api/canvas/search", async (req, res) => {
  if (!canvasClient) {
    return res.status(503).json({ 
      error: "Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables." 
    });
  }

  try {
    const { q: query, per_page, type, context } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const options = {};
    if (per_page) options.per_page = parseInt(per_page);
    if (type) options.type = type;
    if (context) options.context = context;

    const result = await canvasClient.smartSearch(query, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 500).json(result);
    }
  } catch (error) {
    console.error("Canvas search error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/canvas/courses/:courseId/students - Get students in a course
app.get("/api/canvas/courses/:courseId/students", async (req, res) => {
  if (!canvasClient) {
    return res.status(503).json({ 
      error: "Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables." 
    });
  }

  try {
    const { courseId } = req.params;
    const { 
      enrollment_type, 
      enrollment_state, 
      per_page, 
      include_avatar_url, 
      include_enrollments 
    } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const options = {};
    if (enrollment_type) options.enrollment_type = enrollment_type;
    if (enrollment_state) options.enrollment_state = enrollment_state;
    if (per_page) options.per_page = parseInt(per_page);
    if (include_avatar_url === 'true') options.include_avatar_url = true;
    if (include_enrollments === 'true') options.include_enrollments = true;

    const result = await canvasClient.getStudentsInCourse(courseId, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 500).json(result);
    }
  } catch (error) {
    console.error("Canvas get students error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/canvas/user - Get current Canvas user profile
app.get("/api/canvas/user", async (req, res) => {
  if (!canvasClient) {
    return res.status(503).json({ 
      error: "Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables." 
    });
  }

  try {
    const result = await canvasClient.getCurrentUser();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 500).json(result);
    }
  } catch (error) {
    console.error("Canvas get user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/canvas/test - Test Canvas connectivity
app.get("/api/canvas/test", async (req, res) => {
  if (!canvasClient) {
    return res.status(503).json({ 
      error: "Canvas integration not configured. Set CANVAS_API_KEY and CANVAS_DOMAIN environment variables.",
      canvas_connected: false
    });
  }

  try {
    const result = await canvasClient.testConnection();
    
    if (result.success) {
      res.json({ ...result, canvas_connected: true });
    } else {
      res.status(result.status || 500).json({ ...result, canvas_connected: false });
    }
  } catch (error) {
    console.error("Canvas connection test error:", error);
    res.status(500).json({ 
      error: error.message, 
      canvas_connected: false 
    });
  }
});

// GET /api/health endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Test Bedrock connectivity with a simple request
    const command = new ConverseCommand({
      modelId: "us.amazon.nova-pro-v1:0",
      messages: [{ role: "user", content: [{ text: "Hello" }] }],
      inferenceConfig: { maxTokens: 10 },
    });

    await bedrockClient.send(command);
    res.json({ status: "ok", bedrock_connected: true });
  } catch (error) {
    console.error("Health check error:", error);
    res.json({ status: "degraded", bedrock_connected: false, error: error.message });
  }
});

app.listen(8000, () => {
  console.log("Canvas LMS AI Workshop API (JavaScript) is running on http://localhost:8000");
  console.log("Available endpoints:");
  console.log("  POST /api/completions");
  console.log("  POST /api/chats");
  console.log("  POST /api/streaming/chats");
  console.log("  GET /api/health");
  
  if (canvasClient) {
    console.log("Canvas LMS endpoints:");
    console.log("  GET /api/canvas/search?q=<query>");
    console.log("  GET /api/canvas/courses/:courseId/students");
    console.log("  GET /api/canvas/user");
    console.log("  GET /api/canvas/test");
  } else {
    console.log("Canvas LMS integration: DISABLED (missing environment variables)");
  }
});

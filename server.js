const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Import routes
const usersRoutes = require("./routes/users");
const productsRoutes = require("./routes/products");
const ordersRoutes = require("./routes/orders");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RESTful API Assessment",
      version: "1.0.0",
      description:
        "A comprehensive RESTful API implementation following industry best practices",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 2, maxLength: 50 },
            email: { type: "string", format: "email" },
            age: { type: "integer", minimum: 18, maximum: 120 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["name", "email", "age"],
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 1, maxLength: 100 },
            description: { type: "string", maxLength: 500 },
            price: { type: "number", minimum: 0 },
            category: {
              type: "string",
              enum: ["electronics", "clothing", "books", "home"],
            },
            inStock: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["name", "price", "category"],
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string", format: "uuid" },
                  quantity: { type: "integer", minimum: 1 },
                  price: { type: "number", minimum: 0 },
                },
              },
            },
            totalAmount: { type: "number", minimum: 0 },
            status: {
              type: "string",
              enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["userId", "products", "totalAmount"],
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "integer" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(limiter); // Rate limiting
app.use(morgan("combined")); // Logging
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/orders", ordersRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to RESTful API Assessment",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
    endpoints: {
      users: "/api/v1/users",
      products: "/api/v1/products",
      orders: "/api/v1/orders",
    },
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;

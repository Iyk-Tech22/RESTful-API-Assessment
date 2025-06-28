const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();

const {
  orderOperations,
  userOperations,
  productOperations,
} = require("../data/store");
const validate = require("../middleware/validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderProduct:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *         - price
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: The product's unique ID
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: The quantity of the product
 *         price:
 *           type: number
 *           minimum: 0
 *           description: The price per unit
 *
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - products
 *         - totalAmount
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the order
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The user's unique ID
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *           description: Array of products in the order
 *         totalAmount:
 *           type: number
 *           minimum: 0
 *           description: The total amount of the order
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           default: pending
 *           description: The order status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the order was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the order was last updated
 */

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Retrieve all orders
 *     description: Get a list of all orders with optional pagination and filtering
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter orders by user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum total amount filter
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum total amount filter
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Bad request - invalid query parameters
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("userId").optional().isUUID().withMessage("Invalid user ID format"),
    query("status")
      .optional()
      .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
      .withMessage("Invalid status"),
    query("minAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum amount must be a non-negative number"),
    query("maxAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum amount must be a non-negative number"),
    validate,
  ],
  (req, res) => {
    try {
      let orders = orderOperations.getAll();

      // Apply filters
      if (req.query.userId) {
        orders = orders.filter((order) => order.userId === req.query.userId);
      }

      if (req.query.status) {
        orders = orders.filter((order) => order.status === req.query.status);
      }

      if (req.query.minAmount) {
        orders = orders.filter(
          (order) => order.totalAmount >= parseFloat(req.query.minAmount)
        );
      }

      if (req.query.maxAmount) {
        orders = orders.filter(
          (order) => order.totalAmount <= parseFloat(req.query.maxAmount)
        );
      }

      // Apply pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const paginatedOrders = orders.slice(startIndex, endIndex);

      const pagination = {
        page,
        limit,
        total: orders.length,
        totalPages: Math.ceil(orders.length / limit),
      };

      res.status(200).json({
        success: true,
        data: paginatedOrders,
        pagination,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to retrieve orders",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Retrieve an order by ID
 *     description: Get a specific order by its unique ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The order's unique ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - invalid ID format
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid order ID format"), validate],
  (req, res) => {
    try {
      const order = orderOperations.getById(req.params.id);

      if (!order) {
        return res.status(404).json({
          error: true,
          message: "Order not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to retrieve order",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order with the provided information
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - products
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: The user's unique ID
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: The product's unique ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: The quantity of the product
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or product not found
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  [
    body("userId").isUUID().withMessage("Invalid user ID format"),
    body("products")
      .isArray({ min: 1 })
      .withMessage("Products must be a non-empty array"),
    body("products.*.productId")
      .isUUID()
      .withMessage("Invalid product ID format"),
    body("products.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
    validate,
  ],
  (req, res) => {
    try {
      // Validate user exists
      const user = userOperations.getById(req.body.userId);
      if (!user) {
        return res.status(404).json({
          error: true,
          message: "User not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      // Validate products exist and calculate total
      let totalAmount = 0;
      const validatedProducts = [];

      for (const productItem of req.body.products) {
        const product = productOperations.getById(productItem.productId);
        if (!product) {
          return res.status(404).json({
            error: true,
            message: `Product with ID ${productItem.productId} not found`,
            statusCode: 404,
            timestamp: new Date().toISOString(),
          });
        }

        if (!product.inStock) {
          return res.status(400).json({
            error: true,
            message: `Product ${product.name} is out of stock`,
            statusCode: 400,
            timestamp: new Date().toISOString(),
          });
        }

        const itemTotal = product.price * productItem.quantity;
        totalAmount += itemTotal;

        validatedProducts.push({
          productId: productItem.productId,
          quantity: productItem.quantity,
          price: product.price,
        });
      }

      const orderData = {
        userId: req.body.userId,
        products: validatedProducts,
        totalAmount,
        status: "pending",
      };

      const newOrder = orderOperations.create(orderData);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: newOrder,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to create order",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update an order completely
 *     description: Replace all order data with the provided information
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The order's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - products
 *               - totalAmount
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderProduct'
 *               totalAmount:
 *                 type: number
 *                 minimum: 0
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid order ID format"),
    body("userId").isUUID().withMessage("Invalid user ID format"),
    body("products")
      .isArray({ min: 1 })
      .withMessage("Products must be a non-empty array"),
    body("products.*.productId")
      .isUUID()
      .withMessage("Invalid product ID format"),
    body("products.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
    body("products.*.price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("totalAmount")
      .isFloat({ min: 0 })
      .withMessage("Total amount must be a non-negative number"),
    body("status")
      .optional()
      .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
      .withMessage("Invalid status"),
    validate,
  ],
  (req, res) => {
    try {
      // Check if order exists
      const existingOrder = orderOperations.getById(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({
          error: true,
          message: "Order not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      // Validate user exists
      const user = userOperations.getById(req.body.userId);
      if (!user) {
        return res.status(404).json({
          error: true,
          message: "User not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      // Validate products exist
      for (const productItem of req.body.products) {
        const product = productOperations.getById(productItem.productId);
        if (!product) {
          return res.status(404).json({
            error: true,
            message: `Product with ID ${productItem.productId} not found`,
            statusCode: 404,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedOrder = orderOperations.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to update order",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   patch:
 *     summary: Partially update an order
 *     description: Update specific fields of an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The order's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.patch(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid order ID format"),
    body("status")
      .optional()
      .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
      .withMessage("Invalid status"),
    validate,
  ],
  (req, res) => {
    try {
      // Check if order exists
      const existingOrder = orderOperations.getById(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({
          error: true,
          message: "Order not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      const updatedOrder = orderOperations.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to update order",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     description: Remove an order from the system
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The order's unique ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - invalid ID format
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid order ID format"), validate],
  (req, res) => {
    try {
      const deleted = orderOperations.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: true,
          message: "Order not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: "Order deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to delete order",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

module.exports = router;

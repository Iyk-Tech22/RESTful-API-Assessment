const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();

const { productOperations } = require("../data/store");
const validate = require("../middleware/validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: The product's name
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: The product's description
 *         price:
 *           type: number
 *           minimum: 0
 *           description: The product's price
 *         category:
 *           type: string
 *           enum: [electronics, clothing, books, home]
 *           description: The product's category
 *         inStock:
 *           type: boolean
 *           description: Whether the product is in stock
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was last updated
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Retrieve all products
 *     description: Get a list of all products with optional pagination and filtering
 *     tags: [Products]
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
 *         description: Number of products per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter products by name (partial match)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [electronics, clothing, books, home]
 *         description: Filter products by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
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
 *                     $ref: '#/components/schemas/Product'
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
    query("name")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Name filter must be a non-empty string"),
    query("category")
      .optional()
      .isIn(["electronics", "clothing", "books", "home"])
      .withMessage("Invalid category"),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum price must be a non-negative number"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum price must be a non-negative number"),
    query("inStock")
      .optional()
      .isBoolean()
      .withMessage("inStock must be a boolean value"),
    validate,
  ],
  (req, res) => {
    try {
      let products = productOperations.getAll();

      // Apply filters
      if (req.query.name) {
        products = products.filter((product) =>
          product.name.toLowerCase().includes(req.query.name.toLowerCase())
        );
      }

      if (req.query.category) {
        products = products.filter(
          (product) => product.category === req.query.category
        );
      }

      if (req.query.minPrice) {
        products = products.filter(
          (product) => product.price >= parseFloat(req.query.minPrice)
        );
      }

      if (req.query.maxPrice) {
        products = products.filter(
          (product) => product.price <= parseFloat(req.query.maxPrice)
        );
      }

      if (req.query.inStock !== undefined) {
        const inStock = req.query.inStock === "true";
        products = products.filter((product) => product.inStock === inStock);
      }

      // Apply pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const paginatedProducts = products.slice(startIndex, endIndex);

      const pagination = {
        page,
        limit,
        total: products.length,
        totalPages: Math.ceil(products.length / limit),
      };

      res.status(200).json({
        success: true,
        data: paginatedProducts,
        pagination,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to retrieve products",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Retrieve a product by ID
 *     description: Get a specific product by its unique ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The product's unique ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
  [param("id").isUUID().withMessage("Invalid product ID format"), validate],
  (req, res) => {
    try {
      const product = productOperations.getById(req.params.id);

      if (!product) {
        return res.status(404).json({
          error: true,
          message: "Product not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to retrieve product",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product with the provided information
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: The product's name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: The product's description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: The product's price
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, books, home]
 *                 description: The product's category
 *               inStock:
 *                 type: boolean
 *                 description: Whether the product is in stock
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("category")
      .isIn(["electronics", "clothing", "books", "home"])
      .withMessage(
        "Category must be one of: electronics, clothing, books, home"
      ),
    body("inStock")
      .optional()
      .isBoolean()
      .withMessage("inStock must be a boolean value"),
    validate,
  ],
  (req, res) => {
    try {
      const newProduct = productOperations.create(req.body);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: newProduct,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to create product",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update a product completely
 *     description: Replace all product data with the provided information
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The product's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               price:
 *                 type: number
 *                 minimum: 0
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, books, home]
 *               inStock:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
    param("id").isUUID().withMessage("Invalid product ID format"),
    body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("category")
      .isIn(["electronics", "clothing", "books", "home"])
      .withMessage(
        "Category must be one of: electronics, clothing, books, home"
      ),
    body("inStock")
      .optional()
      .isBoolean()
      .withMessage("inStock must be a boolean value"),
    validate,
  ],
  (req, res) => {
    try {
      // Check if product exists
      const existingProduct = productOperations.getById(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({
          error: true,
          message: "Product not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      const updatedProduct = productOperations.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to update product",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     summary: Partially update a product
 *     description: Update specific fields of a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The product's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               price:
 *                 type: number
 *                 minimum: 0
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, books, home]
 *               inStock:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
    param("id").isUUID().withMessage("Invalid product ID format"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("category")
      .optional()
      .isIn(["electronics", "clothing", "books", "home"])
      .withMessage(
        "Category must be one of: electronics, clothing, books, home"
      ),
    body("inStock")
      .optional()
      .isBoolean()
      .withMessage("inStock must be a boolean value"),
    validate,
  ],
  (req, res) => {
    try {
      // Check if product exists
      const existingProduct = productOperations.getById(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({
          error: true,
          message: "Product not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      const updatedProduct = productOperations.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to update product",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Remove a product from the system
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The product's unique ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *         description: Product not found
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
  [param("id").isUUID().withMessage("Invalid product ID format"), validate],
  (req, res) => {
    try {
      const deleted = productOperations.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: true,
          message: "Product not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to delete product",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

module.exports = router;

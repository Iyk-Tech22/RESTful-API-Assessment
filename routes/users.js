const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();

const { userOperations } = require("../data/store");
const validate = require("../middleware/validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - age
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: The user's name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         age:
 *           type: integer
 *           minimum: 18
 *           maximum: 120
 *           description: The user's age
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Get a list of all users with optional pagination and filtering
 *     tags: [Users]
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
 *         description: Number of users per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter users by name (partial match)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter users by email (exact match)
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
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
    query("email")
      .optional()
      .isEmail()
      .withMessage("Email filter must be a valid email"),
    validate,
  ],
  (req, res) => {
    try {
      let users = userOperations.getAll();

      // Apply filters
      if (req.query.name) {
        users = users.filter((user) =>
          user.name.toLowerCase().includes(req.query.name.toLowerCase())
        );
      }

      if (req.query.email) {
        users = users.filter((user) => user.email === req.query.email);
      }

      // Apply pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const paginatedUsers = users.slice(startIndex, endIndex);

      const pagination = {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit),
      };

      res.status(200).json({
        success: true,
        data: paginatedUsers,
        pagination,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to retrieve users",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Retrieve a user by ID
 *     description: Get a specific user by their unique ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user's unique ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
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
  [param("id").isUUID().withMessage("Invalid user ID format"), validate],
  (req, res) => {
    try {
      const user = userOperations.getById(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: true,
          message: "User not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to retrieve user",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with the provided information
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - age
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: The user's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 120
 *                 description: The user's age
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   $ref: '#/components/schemas/User'
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
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Must be a valid email address"),
    body("age")
      .isInt({ min: 18, max: 120 })
      .withMessage("Age must be between 18 and 120"),
    validate,
  ],
  (req, res) => {
    try {
      // Check if email already exists
      const existingUser = userOperations
        .getAll()
        .find((user) => user.email === req.body.email);
      if (existingUser) {
        return res.status(409).json({
          error: true,
          message: "User with this email already exists",
          statusCode: 409,
          timestamp: new Date().toISOString(),
        });
      }

      const newUser = userOperations.create(req.body);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to create user",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update a user completely
 *     description: Replace all user data with the provided information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - age
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 120
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
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
    param("id").isUUID().withMessage("Invalid user ID format"),
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Must be a valid email address"),
    body("age")
      .isInt({ min: 18, max: 120 })
      .withMessage("Age must be between 18 and 120"),
    validate,
  ],
  (req, res) => {
    try {
      // Check if user exists
      const existingUser = userOperations.getById(req.params.id);
      if (!existingUser) {
        return res.status(404).json({
          error: true,
          message: "User not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      // Check if email is being changed and if it already exists
      if (req.body.email !== existingUser.email) {
        const emailExists = userOperations
          .getAll()
          .find(
            (user) => user.email === req.body.email && user.id !== req.params.id
          );
        if (emailExists) {
          return res.status(409).json({
            error: true,
            message: "User with this email already exists",
            statusCode: 409,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedUser = userOperations.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to update user",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Partially update a user
 *     description: Update specific fields of a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user's unique ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 120
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
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
    param("id").isUUID().withMessage("Invalid user ID format"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Must be a valid email address"),
    body("age")
      .optional()
      .isInt({ min: 18, max: 120 })
      .withMessage("Age must be between 18 and 120"),
    validate,
  ],
  (req, res) => {
    try {
      // Check if user exists
      const existingUser = userOperations.getById(req.params.id);
      if (!existingUser) {
        return res.status(404).json({
          error: true,
          message: "User not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      // Check if email is being changed and if it already exists
      if (req.body.email && req.body.email !== existingUser.email) {
        const emailExists = userOperations
          .getAll()
          .find(
            (user) => user.email === req.body.email && user.id !== req.params.id
          );
        if (emailExists) {
          return res.status(409).json({
            error: true,
            message: "User with this email already exists",
            statusCode: 409,
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedUser = userOperations.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to update user",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Remove a user from the system
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user's unique ID
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *         description: User not found
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
  [param("id").isUUID().withMessage("Invalid user ID format"), validate],
  (req, res) => {
    try {
      const deleted = userOperations.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          error: true,
          message: "User not found",
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Failed to delete user",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

module.exports = router;

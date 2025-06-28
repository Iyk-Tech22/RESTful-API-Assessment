const request = require("supertest");
const app = require("../server");

describe("RESTful API Assessment", () => {
  let userId, productId, orderId;

  describe("Health Check", () => {
    test("GET /health should return 200", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("message", "API is running");
    });
  });

  describe("Root Endpoint", () => {
    test("GET / should return API information", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Welcome to RESTful API Assessment"
      );
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("endpoints");
    });
  });

  describe("Users API", () => {
    describe("GET /api/v1/users", () => {
      test("should return all users with pagination", async () => {
        const response = await request(app).get("/api/v1/users");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("data");
        expect(response.body).toHaveProperty("pagination");
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test("should filter users by name", async () => {
        const response = await request(app).get("/api/v1/users?name=John");
        expect(response.status).toBe(200);
        expect(
          response.body.data.every((user) =>
            user.name.toLowerCase().includes("john")
          )
        ).toBe(true);
      });

      test("should filter users by email", async () => {
        const response = await request(app).get(
          "/api/v1/users?email=john.doe@example.com"
        );
        expect(response.status).toBe(200);
        expect(
          response.body.data.every(
            (user) => user.email === "john.doe@example.com"
          )
        ).toBe(true);
      });

      test("should handle invalid pagination parameters", async () => {
        const response = await request(app).get("/api/v1/users?page=0");
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
      });
    });

    describe("GET /api/v1/users/:id", () => {
      test("should return user by ID", async () => {
        const response = await request(app).get(
          "/api/v1/users/550e8400-e29b-41d4-a716-446655440000"
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty(
          "id",
          "550e8400-e29b-41d4-a716-446655440000"
        );
      });

      test("should return 404 for non-existent user", async () => {
        const response = await request(app).get(
          "/api/v1/users/550e8400-e29b-41d4-a716-446655440999"
        );
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
        expect(response.body).toHaveProperty("message", "User not found");
      });

      test("should return 400 for invalid UUID", async () => {
        const response = await request(app).get("/api/v1/users/invalid-id");
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
      });
    });

    describe("POST /api/v1/users", () => {
      test("should create a new user", async () => {
        const userData = {
          name: "Test User",
          email: "test.user@example.com",
          age: 25,
        };

        const response = await request(app)
          .post("/api/v1/users")
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "User created successfully"
        );
        expect(response.body.data).toHaveProperty("name", userData.name);
        expect(response.body.data).toHaveProperty("email", userData.email);
        expect(response.body.data).toHaveProperty("age", userData.age);
        expect(response.body.data).toHaveProperty("id");
        expect(response.body.data).toHaveProperty("createdAt");
        expect(response.body.data).toHaveProperty("updatedAt");

        userId = response.body.data.id;
      });

      test("should return 409 for duplicate email", async () => {
        const userData = {
          name: "Duplicate User",
          email: "john.doe@example.com",
          age: 30,
        };

        const response = await request(app)
          .post("/api/v1/users")
          .send(userData);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty("error", true);
        expect(response.body).toHaveProperty(
          "message",
          "User with this email already exists"
        );
      });

      test("should validate required fields", async () => {
        const response = await request(app).post("/api/v1/users").send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
        expect(response.body).toHaveProperty("errors");
      });

      test("should validate email format", async () => {
        const response = await request(app).post("/api/v1/users").send({
          name: "Test User",
          email: "invalid-email",
          age: 25,
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
      });

      test("should validate age range", async () => {
        const response = await request(app).post("/api/v1/users").send({
          name: "Test User",
          email: "test@example.com",
          age: 15,
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
      });
    });

    describe("PUT /api/v1/users/:id", () => {
      test("should update user completely", async () => {
        const updateData = {
          name: "Updated User",
          email: "updated.user@example.com",
          age: 35,
        };

        const response = await request(app)
          .put(`/api/v1/users/${userId}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty("name", updateData.name);
        expect(response.body.data).toHaveProperty("email", updateData.email);
        expect(response.body.data).toHaveProperty("age", updateData.age);
      });

      test("should return 404 for non-existent user", async () => {
        const response = await request(app)
          .put("/api/v1/users/550e8400-e29b-41d4-a716-446655440999")
          .send({
            name: "Test",
            email: "test@example.com",
            age: 25,
          });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
      });
    });

    describe("PATCH /api/v1/users/:id", () => {
      test("should update user partially", async () => {
        const updateData = {
          age: 40,
        };

        const response = await request(app)
          .patch(`/api/v1/users/${userId}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty("age", updateData.age);
      });
    });

    describe("DELETE /api/v1/users/:id", () => {
      test("should delete user", async () => {
        const response = await request(app).delete(`/api/v1/users/${userId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty(
          "message",
          "User deleted successfully"
        );
      });

      test("should return 404 for non-existent user", async () => {
        const response = await request(app).delete(
          "/api/v1/users/550e8400-e29b-41d4-a716-446655440999"
        );

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
      });
    });
  });

  describe("Products API", () => {
    describe("GET /api/v1/products", () => {
      test("should return all products with pagination", async () => {
        const response = await request(app).get("/api/v1/products");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("data");
        expect(response.body).toHaveProperty("pagination");
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test("should filter products by category", async () => {
        const response = await request(app).get(
          "/api/v1/products?category=electronics"
        );
        expect(response.status).toBe(200);
        expect(
          response.body.data.every(
            (product) => product.category === "electronics"
          )
        ).toBe(true);
      });

      test("should filter products by price range", async () => {
        const response = await request(app).get(
          "/api/v1/products?minPrice=100&maxPrice=1000"
        );
        expect(response.status).toBe(200);
        expect(
          response.body.data.every(
            (product) => product.price >= 100 && product.price <= 1000
          )
        ).toBe(true);
      });
    });

    describe("POST /api/v1/products", () => {
      test("should create a new product", async () => {
        const productData = {
          name: "Test Product",
          description: "A test product",
          price: 99.99,
          category: "electronics",
          inStock: true,
        };

        const response = await request(app)
          .post("/api/v1/products")
          .send(productData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty("name", productData.name);
        expect(response.body.data).toHaveProperty("price", productData.price);
        expect(response.body.data).toHaveProperty(
          "category",
          productData.category
        );

        productId = response.body.data.id;
      });

      test("should validate required fields", async () => {
        const response = await request(app).post("/api/v1/products").send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
      });

      test("should validate category enum", async () => {
        const response = await request(app).post("/api/v1/products").send({
          name: "Test Product",
          price: 99.99,
          category: "invalid-category",
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
      });
    });

    describe("PUT /api/v1/products/:id", () => {
      test("should update product completely", async () => {
        const updateData = {
          name: "Updated Product",
          description: "Updated description",
          price: 149.99,
          category: "clothing",
          inStock: false,
        };

        const response = await request(app)
          .put(`/api/v1/products/${productId}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty("name", updateData.name);
        expect(response.body.data).toHaveProperty("price", updateData.price);
        expect(response.body.data).toHaveProperty(
          "category",
          updateData.category
        );
      });
    });

    describe("DELETE /api/v1/products/:id", () => {
      test("should delete product", async () => {
        const response = await request(app).delete(
          `/api/v1/products/${productId}`
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
      });
    });
  });

  describe("Orders API", () => {
    describe("GET /api/v1/orders", () => {
      test("should return all orders with pagination", async () => {
        const response = await request(app).get("/api/v1/orders");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("data");
        expect(response.body).toHaveProperty("pagination");
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test("should filter orders by status", async () => {
        const response = await request(app).get(
          "/api/v1/orders?status=delivered"
        );
        expect(response.status).toBe(200);
        expect(
          response.body.data.every((order) => order.status === "delivered")
        ).toBe(true);
      });
    });

    describe("POST /api/v1/orders", () => {
      test("should create a new order", async () => {
        const orderData = {
          userId: "550e8400-e29b-41d4-a716-446655440000",
          products: [
            {
              productId: "660e8400-e29b-41d4-a716-446655440000",
              quantity: 2,
            },
          ],
        };

        const response = await request(app)
          .post("/api/v1/orders")
          .send(orderData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty("userId", orderData.userId);
        expect(response.body.data).toHaveProperty("products");
        expect(response.body.data).toHaveProperty("totalAmount");
        expect(response.body.data).toHaveProperty("status", "pending");

        orderId = response.body.data.id;
      });

      test("should return 404 for non-existent user", async () => {
        const response = await request(app)
          .post("/api/v1/orders")
          .send({
            userId: "550e8400-e29b-41d4-a716-446655440999",
            products: [
              {
                productId: "660e8400-e29b-41d4-a716-446655440000",
                quantity: 1,
              },
            ],
          });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
        expect(response.body).toHaveProperty("message", "User not found");
      });

      test("should return 404 for non-existent product", async () => {
        const response = await request(app)
          .post("/api/v1/orders")
          .send({
            userId: "550e8400-e29b-41d4-a716-446655440000",
            products: [
              {
                productId: "660e8400-e29b-41d4-a716-446655440999",
                quantity: 1,
              },
            ],
          });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
      });
    });

    describe("PATCH /api/v1/orders/:id", () => {
      test("should update order status", async () => {
        const updateData = {
          status: "processing",
        };

        const response = await request(app)
          .patch(`/api/v1/orders/${orderId}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body.data).toHaveProperty("status", updateData.status);
      });

      test("should validate status enum", async () => {
        const response = await request(app)
          .patch(`/api/v1/orders/${orderId}`)
          .send({
            status: "invalid-status",
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
      });
    });

    describe("DELETE /api/v1/orders/:id", () => {
      test("should delete order", async () => {
        const response = await request(app).delete(`/api/v1/orders/${orderId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
      });
    });
  });

  describe("Error Handling", () => {
    test("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/v1/nonexistent");
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", true);
    });

    test("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/v1/users")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", true);
    });

    test("should handle rate limiting", async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(101)
        .fill()
        .map(() => request(app).get("/api/v1/users"));

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find((res) => res.status === 429);

      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty(
        "error",
        "Too many requests from this IP, please try again later."
      );
      expect(rateLimitedResponse.body).toHaveProperty("statusCode", 429);
    });
  });
});

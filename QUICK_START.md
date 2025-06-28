# Quick Start Guide - RESTful API Assessment

## 🚀 Immediate Testing

### 1. Start the Server

```bash
npm install
npm start
```

### 2. Verify API is Running

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "API is running",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 10.5
}
```

### 3. Check API Information

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "message": "Welcome to RESTful API Assessment",
  "version": "1.0.0",
  "documentation": "/api-docs",
  "health": "/health",
  "endpoints": {
    "users": "/api/v1/users",
    "products": "/api/v1/products",
    "orders": "/api/v1/orders"
  }
}
```

## 📚 Interactive Documentation

Visit: **http://localhost:3000/api-docs**

- Complete API documentation
- Interactive testing interface
- Request/response examples
- Schema definitions

## 🧪 Quick API Tests

### Test Users API

```bash
# Get all users
curl http://localhost:3000/api/v1/users

# Create a user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","age":25}'

# Get user by ID (use ID from create response)
curl http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000
```

### Test Products API

```bash
# Get all products
curl http://localhost:3000/api/v1/products

# Create a product
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":99.99,"category":"electronics"}'

# Filter products
curl "http://localhost:3000/api/v1/products?category=electronics&minPrice=100"
```

### Test Orders API

```bash
# Get all orders
curl http://localhost:3000/api/v1/orders

# Create an order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "products": [
      {
        "productId": "660e8400-e29b-41d4-a716-446655440000",
        "quantity": 2
      }
    ]
  }'
```

## 🚨 Test Error Handling

### Validation Errors

```bash
# Invalid user data
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"T","email":"invalid","age":15}'
```

### Not Found Errors

```bash
# Non-existent user
curl http://localhost:3000/api/v1/users/99999999-9999-9999-9999-999999999999
```

### Rate Limiting

```bash
# Make 101 requests quickly to trigger rate limiting
for i in {1..101}; do curl http://localhost:3000/api/v1/users; done
```

## 📋 Postman Collection

1. Import `RESTful_API_Assessment.postman_collection.json` into Postman
2. Set environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `apiVersion`: `v1`
3. Run the collection for comprehensive testing

## 🧪 Automated Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📊 Sample Data

The API comes with sample data:

**Users:**

- John Doe (john.doe@example.com)
- Jane Smith (jane.smith@example.com)

**Products:**

- iPhone 15 Pro ($999.99, electronics)
- MacBook Air M2 ($1199.99, electronics)
- Cotton T-Shirt ($29.99, clothing)

**Orders:**

- Sample order with iPhone 15 Pro

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] API documentation loads at `/api-docs`
- [ ] Users API responds correctly
- [ ] Products API responds correctly
- [ ] Orders API responds correctly
- [ ] Error handling works properly
- [ ] Validation errors are returned
- [ ] Rate limiting is active
- [ ] All tests pass

## 🎯 Assessment Requirements Verification

- ✅ **HTTP Methods**: GET, POST, PUT, PATCH, DELETE implemented
- ✅ **Status Codes**: 200, 201, 400, 404, 409, 429, 500 used correctly
- ✅ **RESTful Naming**: Proper resource naming conventions
- ✅ **Error Handling**: Comprehensive error handling
- ✅ **API Documentation**: Complete OpenAPI/Swagger documentation
- ✅ **Postman Collection**: Ready-to-use collection provided
- ✅ **Error Examples**: Multiple error scenarios demonstrated

## 🚀 Ready for Assessment!

The API is fully functional and ready for evaluation. All requirements have been implemented with industry best practices.

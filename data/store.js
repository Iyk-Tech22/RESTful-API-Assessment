const { v4: uuidv4 } = require("uuid");

// In-memory data store
let users = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "John Doe",
    email: "john.doe@example.com",
    age: 30,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    age: 25,
    createdAt: "2024-01-15T11:00:00.000Z",
    updatedAt: "2024-01-15T11:00:00.000Z",
  },
];

let products = [
  {
    id: "660e8400-e29b-41d4-a716-446655440000",
    name: "iPhone 15 Pro",
    description: "Latest iPhone with advanced features",
    price: 999.99,
    category: "electronics",
    inStock: true,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "MacBook Air M2",
    description: "Powerful laptop with M2 chip",
    price: 1199.99,
    category: "electronics",
    inStock: true,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    name: "Cotton T-Shirt",
    description: "Comfortable cotton t-shirt",
    price: 29.99,
    category: "clothing",
    inStock: true,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
];

let orders = [
  {
    id: "770e8400-e29b-41d4-a716-446655440000",
    userId: "550e8400-e29b-41d4-a716-446655440000",
    products: [
      {
        productId: "660e8400-e29b-41d4-a716-446655440000",
        quantity: 1,
        price: 999.99,
      },
    ],
    totalAmount: 999.99,
    status: "delivered",
    createdAt: "2024-01-15T12:00:00.000Z",
    updatedAt: "2024-01-15T12:00:00.000Z",
  },
];

// Helper functions
const generateId = () => uuidv4();
const getCurrentTimestamp = () => new Date().toISOString();

// Users CRUD operations
const userOperations = {
  getAll: () => [...users],
  getById: (id) => users.find((user) => user.id === id),
  create: (userData) => {
    const newUser = {
      id: generateId(),
      ...userData,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    users.push(newUser);
    return newUser;
  },
  update: (id, userData) => {
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: getCurrentTimestamp(),
    };
    return users[index];
  },
  delete: (id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return false;

    users.splice(index, 1);
    return true;
  },
};

// Products CRUD operations
const productOperations = {
  getAll: () => [...products],
  getById: (id) => products.find((product) => product.id === id),
  create: (productData) => {
    const newProduct = {
      id: generateId(),
      ...productData,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    products.push(newProduct);
    return newProduct;
  },
  update: (id, productData) => {
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...productData,
      updatedAt: getCurrentTimestamp(),
    };
    return products[index];
  },
  delete: (id) => {
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) return false;

    products.splice(index, 1);
    return true;
  },
};

// Orders CRUD operations
const orderOperations = {
  getAll: () => [...orders],
  getById: (id) => orders.find((order) => order.id === id),
  create: (orderData) => {
    const newOrder = {
      id: generateId(),
      ...orderData,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    orders.push(newOrder);
    return newOrder;
  },
  update: (id, orderData) => {
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) return null;

    orders[index] = {
      ...orders[index],
      ...orderData,
      updatedAt: getCurrentTimestamp(),
    };
    return orders[index];
  },
  delete: (id) => {
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) return false;

    orders.splice(index, 1);
    return true;
  },
};

module.exports = {
  userOperations,
  productOperations,
  orderOperations,
};

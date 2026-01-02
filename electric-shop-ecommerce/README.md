# Electric Shop E-Commerce Website

A full-stack e-commerce platform for an electrical products shop with separate Admin Panel and Customer Website built using MERN stack (MongoDB, Express.js, React.js, Node.js).

## 📋 Features

### Customer Features
- User registration and login with JWT authentication
- Browse products by categories (TV, AC, Fan, Fridge, etc.)
- Search and filter products by price range and category
- View detailed product specifications
- Add products to shopping cart
- Place orders with multiple payment options
- View order history with status tracking
- User profile management
- Order cancellation (for pending orders)

### Admin Features
- Separate admin login system
- Dashboard with statistics (sales, orders, customers)
- Product management (Add, Edit, Delete products)
- Image upload for products
- Order management with status updates
- Customer management
- Category-wise sales analysis

## 🛠️ Tech Stack

### Frontend
- React.js 18.2.0
- React Router DOM 6.20.0
- Axios 1.6.2
- Vite 5.0.7 (Build Tool)
- CSS3 (Custom Styling)

### Backend
- Node.js
- Express.js 4.18.2
- MongoDB with Mongoose 8.0.0
- JWT (jsonwebtoken 9.0.2)
- Bcrypt.js 2.4.3 (Password Hashing)
- Multer 1.4.5 (File Upload)
- Express Validator 7.0.1

## 📁 Project Structure

```
electric-shop-ecommerce/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── productController.js  # Product CRUD operations
│   │   ├── cartController.js     # Cart management
│   │   ├── orderController.js    # Order management
│   │   ├── adminController.js    # Admin-specific operations
│   │   └── userController.js     # User profile management
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── upload.js             # File upload configuration
│   ├── models/
│   │   ├── User.js               # Customer model
│   │   ├── Admin.js              # Admin model
│   │   ├── Product.js            # Product model
│   │   ├── Cart.js               # Cart model
│   │   └── Order.js              # Order model
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication routes
│   │   ├── productRoutes.js      # Product routes
│   │   ├── cartRoutes.js         # Cart routes
│   │   ├── orderRoutes.js        # Order routes
│   │   ├── adminRoutes.js        # Admin routes
│   │   └── userRoutes.js         # User routes
│   ├── uploads/
│   │   └── products/             # Product images storage
│   ├── utils/
│   │   └── generateToken.js      # JWT token generation
│   ├── .env                      # Environment variables
│   ├── package.json
│   ├── seeder.js                 # Sample data seeder
│   └── server.js                 # Entry point
│
└── frontend/
    ├── public/
    │   └── brands/               # Brand logo images
    ├── src/
    │   ├── components/
    │   │   ├── AdminLayout.jsx   # Admin panel layout
    │   │   ├── AdminRoute.jsx    # Admin route guard
    │   │   ├── Footer.jsx        # Site footer
    │   │   ├── Navbar.jsx        # Customer navbar
    │   │   ├── PrivateRoute.jsx  # Customer route guard
    │   │   └── ProductCard.jsx   # Product display card
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Authentication state
    │   │   └── CartContext.jsx   # Cart state
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── AdminAddProduct.jsx
    │   │   │   ├── AdminCustomers.jsx
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── AdminEditProduct.jsx
    │   │   │   ├── AdminLogin.jsx
    │   │   │   ├── AdminOrders.jsx
    │   │   │   └── AdminProducts.jsx
    │   │   └── customer/
    │   │       ├── Cart.jsx
    │   │       ├── Checkout.jsx
    │   │       ├── Home.jsx
    │   │       ├── Login.jsx
    │   │       ├── Orders.jsx
    │   │       ├── ProductDetails.jsx
    │   │       ├── Products.jsx
    │   │       ├── Profile.jsx
    │   │       └── Register.jsx
    │   ├── services/
    │   │   └── api.js            # Axios configuration
    │   ├── App.jsx               # Route configuration
    │   ├── index.css             # Global styles
    │   └── main.jsx              # React entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Compass or MongoDB Server
- Git

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd electric-shop-ecommerce
```

### Step 2: Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the backend folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/electric-shop
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

4. Connect MongoDB:
   - Open **MongoDB Compass**
   - Click "New Connection"
   - Enter connection string: `mongodb://localhost:27017`
   - Click "Connect"
   - The database `electric-shop` will be created automatically when you seed data

5. Seed sample data (optional but recommended):
```bash
npm run seed
```

This will create:
- 1 Admin account
- 2 Customer accounts
- 16 Products across different categories

6. Start the backend server:
```bash
npm run dev
```

Backend will run on: `http://localhost:5000`

### Step 3: Frontend Setup

1. Open a new terminal and navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 🔑 Demo Credentials

### Admin Login
- **URL**: http://localhost:5173/admin/login
- **Email**: admin@electricshop.com
- **Password**: admin123

### Customer Login
- **URL**: http://localhost:5173/login
- **Email**: john@example.com
- **Password**: password123

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Customer login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get all categories
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/cancel` - Cancel order

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/customers/:id` - Get customer details
- `DELETE /api/admin/customers/:id` - Delete customer

### User
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password

## 🧪 Testing the Application

### Test Customer Flow:
1. Open `http://localhost:5173`
2. Browse products on home page
3. Register a new account or login with demo credentials
4. Add products to cart
5. Proceed to checkout
6. Place an order
7. View order history in "My Orders"
8. Update profile information

### Test Admin Flow:
1. Open `http://localhost:5173/admin/login`
2. Login with admin credentials
3. View dashboard statistics
4. Add new products with images
5. Edit existing products
6. Manage orders (update status)
7. View customer list and details
8. Delete products/customers

## 📦 Database Collections

### users
- Customer accounts with hashed passwords
- Address information
- Order history

### admin
- Admin accounts with role-based permissions
- Separate from customer authentication

### products
- Product details (name, price, description)
- Categories and brands
- Stock management
- Specifications (power, voltage, warranty, etc.)
- Product images
- Ratings and reviews

### carts
- User shopping carts
- Item list with quantities
- Auto-calculated totals

### orders
- Order details with unique order numbers
- Shipping information
- Payment method and status
- Order status tracking
- Item list with prices

## 🎨 Available Categories
- TV
- Fan
- AC (Air Conditioner)
- Washing Machine
- Fridge
- Lights
- Switches
- Microwave
- Water Heater
- Other

## 💡 Key Features Implementation

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes (customer and admin)
- Token stored in localStorage
- Middleware for authentication verification

### File Upload
- Multer middleware for image uploads
- File type validation (JPEG, PNG, GIF, WEBP)
- File size limit (5MB)
- Images stored in `/uploads/products/`

### State Management
- React Context API for global state
- AuthContext for user authentication
- CartContext for shopping cart

### Order Management
- Auto-generated order numbers
- Stock validation before order
- Automatic stock updates
- Order status workflow (Pending → Confirmed → Processing → Shipped → Delivered)
- Cancel orders with stock restoration

### Responsive Design
- Mobile-friendly layouts
- Flexible grid system
- Touch-friendly buttons
- Responsive tables and cards

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file configuration
- Ensure port 5000 is not in use

### Frontend can't connect to backend
- Check if backend is running on port 5000
- Verify Vite proxy configuration in `vite.config.js`
- Check browser console for CORS errors

### Image upload fails
- Ensure `uploads/products/` folder exists
- Check file size (max 5MB)
- Verify file type (JPEG, PNG, GIF, WEBP only)

### MongoDB connection failed
- Start MongoDB service
- Check MongoDB Compass connection
- Verify MONGODB_URI in `.env`

## 📝 Notes

- Always run backend before frontend
- Seed data includes sample products for testing
- Admin and customer authentication are separate
- Product images are served from `/uploads/products/`
- All prices are in Indian Rupees (₹)

## 🔧 Development Scripts

### Backend
```bash
npm start          # Production mode
npm run dev        # Development mode with nodemon
npm run seed       # Seed sample data
```

### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## 📄 License

This project is open source and available under the MIT License.

## 👥 Support

For issues and questions, please create an issue in the repository.

---

**Happy Coding! 🚀**

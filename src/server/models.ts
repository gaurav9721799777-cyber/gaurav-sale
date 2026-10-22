import { Schema, model, models } from "mongoose";

const entitySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  active: { type: Boolean, default: true },
}, { timestamps: true, strict: false });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0, min: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 },
  sku: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true, strict: false });

const cartSchema = new Schema({
  cartId: { type: String, required: true, unique: true },
  items: [{ productId: { type: Schema.Types.ObjectId, ref: "Product" }, quantity: { type: Number, min: 1 } }],
}, { timestamps: true });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    fullName: { type: String, required: true }, email: { type: String, default: "" }, phoneNumber: { type: String, required: true },
  },
  shippingAddress: {
    streetAddress: { type: String, required: true }, city: { type: String, required: true }, postalCode: { type: String, required: true }, countryRegion: { type: String, required: true }, deliveryInstructions: { type: String, default: "" },
  },
  items: [{ productId: Schema.Types.ObjectId, name: String, sku: String, imageUrl: String, quantity: Number, unitPrice: Number }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"], default: "PENDING" },
  paymentStatus: { type: String, enum: ["PENDING", "PAID", "REFUNDED"], default: "PENDING" },
  paymentMethod: { type: String, default: "CASH_ON_DELIVERY" },
}, { timestamps: true });

const adminUserSchema = new Schema({
  username: { type: String, required: true, trim: true, lowercase: true, unique: true, minlength: 3, maxlength: 120 },
  passwordHash: { type: String, required: true, select: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const adminBootstrapSchema = new Schema({
  key: { type: String, required: true, unique: true },
}, { timestamps: true });

export const Category = models.Category || model("Category", entitySchema);
export const Brand = models.Brand || model("Brand", entitySchema);
export const Product = models.Product || model("Product", productSchema);
export const Cart = models.Cart || model("Cart", cartSchema);
export const Order = models.Order || model("Order", orderSchema);
export const AdminUser = models.AdminUser || model("AdminUser", adminUserSchema);
export const AdminBootstrap = models.AdminBootstrap || model("AdminBootstrap", adminBootstrapSchema);
 
export const databaseModels = [
  Product,
  Brand,
  Category,
  Cart,
  Order,
  AdminUser,
  AdminBootstrap,
];
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
  customerType: { type: String, enum: ["INDIVIDUAL", "DEALER"], default: "INDIVIDUAL" },
  dealerId: { type: Schema.Types.ObjectId, ref: "Dealer", default: null },
  customer: {
    fullName: { type: String, required: true }, email: { type: String, default: "" }, phoneNumber: { type: String, required: true },
  },
  shippingAddress: {
    streetAddress: { type: String, default: "" }, city: { type: String, default: "" }, postalCode: { type: String, default: "" }, countryRegion: { type: String, default: "" }, deliveryInstructions: { type: String, default: "" },
  },
  items: [{ productId: Schema.Types.ObjectId, name: String, sku: String, imageUrl: String, quantity: Number, unitPrice: Number }],
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0, min: 0 },
  payments: [{ amount: { type: Number, required: true, min: 0 }, method: { type: String, required: true }, note: { type: String, default: "" }, receivedAt: { type: Date, default: Date.now } }],
  status: { type: String, enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"], default: "PENDING" },
  paymentStatus: { type: String, enum: ["PENDING", "PARTIALLY_PAID", "PAID", "REFUNDED"], default: "PENDING" },
  paymentMethod: { type: String, default: "CASH_ON_DELIVERY" },
}, { timestamps: true });

const dealerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  businessName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true, unique: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  gstin: { type: String, default: "", trim: true, uppercase: true },
  address: { type: String, default: "", trim: true },
  active: { type: Boolean, default: true },
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
export const Dealer = models.Dealer || model("Dealer", dealerSchema);
export const AdminUser = models.AdminUser || model("AdminUser", adminUserSchema);
export const AdminBootstrap = models.AdminBootstrap || model("AdminBootstrap", adminBootstrapSchema);
 
export const databaseModels = [
  Product,
  Brand,
  Category,
  Cart,
  Order,
  Dealer,
  AdminUser,
  AdminBootstrap,
];
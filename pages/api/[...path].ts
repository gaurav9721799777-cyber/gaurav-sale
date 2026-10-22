import { randomUUID } from "node:crypto";
import { mkdir, copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import formidable from "formidable";
import { put } from "@vercel/blob";
import type { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import { hasAdminSession, requireAdmin } from "../../src/server/admin-auth";
import { connectMongo } from "../../src/server/mongodb";
import { Brand, Cart, Category, Order, Product } from "../../src/server/models";
import { assertWithinDeliveryZone, DeliveryZoneError } from "../../src/server/delivery-zone";

export const config = { api: { bodyParser: false } };

type Row = Record<string, any>;
async function parseJsonBody(request: NextApiRequest) {
  if (request.body || !request.headers["content-type"]?.includes("application/json")) return;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1024 * 1024) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  request.body = raw ? JSON.parse(raw) : {};
}

const sendError = (response: NextApiResponse, error: unknown) => {
  const message = error instanceof Error ? error.message : "The request could not be completed.";
  const errorName = error instanceof Error ? error.name : "";
  const errorDetails = error && typeof error === "object"
    ? error as {
      code?: unknown;
      codeName?: unknown;
      reason?: {
        servers?: Map<unknown, { error?: { code?: unknown; codeName?: unknown; message?: string } }>;
      };
    }
    : {};
  const serverErrors = errorDetails.reason?.servers
    ? Array.from(errorDetails.reason.servers.values()).map((server) => server.error).filter((item) => item !== undefined)
    : [];
  const serverMessages = serverErrors.map((item) => item.message || "").join(" ").toLowerCase();
  const errorCode = errorDetails.code;
  const mongoUnavailable =
    message.includes("MONGODB_") ||
    errorName.includes("MongooseServerSelection") ||
    errorName.includes("MongoNetwork") ||
    errorCode === "ECONNREFUSED" ||
    errorCode === "ENOTFOUND";
  const authFailed = errorCode === 18 || errorDetails.codeName === "AuthenticationFailed" ||
    serverErrors.some((item) => item.code === 18 || item.codeName === "AuthenticationFailed") ||
    /bad auth|authentication failed/.test(`${serverMessages} ${message.toLowerCase()}`);
  const environmentMissing =
    message.includes("Set MONGODB_URI") ||
    message.includes("MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_HOST must be configured");
  const outsideDeliveryZone = error instanceof DeliveryZoneError;
  const status = authFailed || mongoUnavailable
    ? 503
    : outsideDeliveryZone
      ? 422
    : errorCode === 11000
      ? 409
      : errorName === "ValidationError" || errorName === "CastError" || error instanceof SyntaxError
        ? 400
        : 500;
  const responseMessage = environmentMissing
    ? "MongoDB connection settings are missing. Configure MONGODB_URI, or MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_HOST, then restart Next.js."
    : authFailed
      ? "MongoDB Atlas rejected authentication. Verify the database username/password and database-user permissions, then restart Next.js."
      : mongoUnavailable
        ? "MongoDB Atlas is unreachable. Check the cluster host and Atlas Network Access IP allowlist."
        : message;
  response.status(status).json({ success: false, message: responseMessage });
};
const idString = (value: unknown) => String(value ?? "");
const isId = (value: string) => Types.ObjectId.isValid(value);
const entityModel = (kind: string) => kind === "categories" ? Category : Brand;
const toEntity = (row: Row) => ({ ...row, id: idString(row._id ?? row.id), _id: undefined, __v: undefined });
const toProduct = (row: Row) => {
  const brand = row.brandId && typeof row.brandId === "object" ? row.brandId : null;
  const category = row.categoryId && typeof row.categoryId === "object" ? row.categoryId : null;
  return {
    ...row,
    id: idString(row._id ?? row.id),
    brandId: idString(brand?._id ?? row.brandId),
    categoryId: idString(category?._id ?? row.categoryId),
    brand: brand ? { id: idString(brand._id), name: brand.name, slug: brand.slug } : row.brand,
    category: category ? { id: idString(category._id), name: category.name, slug: category.slug } : row.category,
    stock: row.stockQuantity ?? row.stock ?? 0,
    _id: undefined,
    __v: undefined,
  };
};
const toOrder = (row: Row) => ({
  ...row,
  id: idString(row._id ?? row.id),
  fullName: row.customer?.fullName ?? row.fullName,
  phoneNumber: row.customer?.phoneNumber ?? row.phoneNumber,
  email: row.customer?.email ?? row.email ?? "",
  _id: undefined,
  __v: undefined,
});
const toPublicOrder = (row: Row) => ({
  id: idString(row._id ?? row.id),
  orderNumber: row.orderNumber,
  status: row.status,
  paymentStatus: row.paymentStatus,
  totalAmount: row.totalAmount,
  createdAt: row.createdAt,
});
const adminOnly = (request: NextApiRequest, response: NextApiResponse) => requireAdmin(request, response);

async function parseProductForm(request: NextApiRequest) {
  if (!request.headers["content-type"]?.includes("multipart/form-data")) {
    return { fields: request.body as Row, imageUrl: undefined as string | undefined };
  }
  const form = formidable({ maxFileSize: 8 * 1024 * 1024, multiples: false });
  const [fields, files] = await form.parse(request);
  const fieldValues = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) as Row;
  const picked = (Object.values(files).flat() as formidable.File[]).find((file) => file.size > 0);
  if (!picked) return { fields: fieldValues, imageUrl: undefined };
  const extension = path.extname(picked.originalFilename || "").toLowerCase().replace(/[^.a-z0-9]/g, "");
  const filename = `${randomUUID()}${extension}`;
  if (process.env.VERCEL === "1") {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "Product image uploads on Vercel require a connected Blob store and BLOB_READ_WRITE_TOKEN.",
      );
    }
    const blob = await put(`products/${filename}`, await readFile(picked.filepath), {
      access: "public",
      contentType: picked.mimetype || undefined,
    });
    return { fields: fieldValues, imageUrl: blob.url };
  }
  const directory = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(directory, { recursive: true });
  await copyFile(picked.filepath, path.join(directory, filename));
  return { fields: fieldValues, imageUrl: `/uploads/products/${filename}` };
}

async function handleCatalog(request: NextApiRequest, response: NextApiResponse, resource: "products" | "brands" | "categories", segments: string[]) {
  const model = resource === "products" ? Product : entityModel(resource);
  const identifier = segments[1];
  const admin = hasAdminSession(request);

  if (request.method === "GET" && !identifier) {
    const query = admin ? {} : { active: { $ne: false } };
    const rows = await model.find(query).sort({ name: 1 }).lean();
    return response.status(200).json(resource === "products" ? rows.map((row) => toProduct(row as Row)) : rows.map((row) => toEntity(row as Row)));
  }

  if (request.method === "GET" && identifier === "slug" && resource === "products") {
    const product = await Product.findOne({ slug: segments[2], active: { $ne: false } }).populate("brandId").populate("categoryId").lean();
    if (!product) return response.status(404).json({ success: false, message: "Product not found." });
    return response.status(200).json({ data: toProduct(product as Row) });
  }

  if (request.method === "GET" && identifier) {
    const row = isId(identifier) ? await model.findById(identifier).lean() : null;
    if (!row || (!admin && (row as Row).active === false)) return response.status(404).json({ success: false, message: "Record not found." });
    const populated = resource === "products" ? await Product.findById(identifier).populate("brandId").populate("categoryId").lean() : row;
    return response.status(200).json({ data: resource === "products" ? toProduct(populated as Row) : toEntity(row as Row) });
  }

  if (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") {
    if (!adminOnly(request, response)) return;
  }
  if (request.method === "DELETE" && identifier && resource !== "products") {
    const deleted = await model.findByIdAndDelete(identifier);
    return response.status(deleted ? 200 : 404).json({ success: !!deleted, message: deleted ? "Deleted." : "Record not found." });
  }
  if (request.method === "DELETE" && identifier && resource === "products") {
    const deleted = await Product.findByIdAndUpdate(identifier, { active: false }, { new: true });
    return response.status(deleted ? 200 : 404).json({ success: !!deleted, message: deleted ? "Product archived." : "Product not found." });
  }

  if (resource !== "products" && (request.method === "POST" || request.method === "PUT")) {
    const body = request.body as Row;
    const values = { name: String(body.name || "").trim(), slug: String(body.slug || "").trim().toLowerCase(), description: String(body.description || ""), logoUrl: String(body.logoUrl || ""), active: body.active !== false };
    if (!values.name || !values.slug) return response.status(400).json({ success: false, message: "Name and slug are required." });
    const entity = request.method === "POST"
      ? await model.create(values)
      : identifier ? await model.findByIdAndUpdate(identifier, values, { new: true, runValidators: true }) : null;
    if (!entity) return response.status(404).json({ success: false, message: "Record not found." });
    return response.status(request.method === "POST" ? 201 : 200).json({ data: toEntity(entity.toObject() as Row) });
  }

  if (resource === "products" && (request.method === "POST" || request.method === "PUT")) {
    const { fields, imageUrl } = await parseProductForm(request);
    const values = {
      name: String(fields.name || "").trim(),
      slug: String(fields.slug || "").trim().toLowerCase(),
      description: String(fields.description || ""),
      price: Number(fields.price),
      discountPrice: Number(fields.discountPrice || 0),
      stockQuantity: Number(fields.stockQuantity || 0),
      sku: String(fields.sku || ""),
      brandId: String(fields.brandId || ""),
      categoryId: String(fields.categoryId || ""),
      ...(imageUrl ? { imageUrl } : {}),
    };
    if (!values.name || !values.slug || !Number.isFinite(values.price) || !isId(values.brandId) || !isId(values.categoryId)) {
      return response.status(400).json({ success: false, message: "Product name, slug, price, brand, and category are required." });
    }
    const product = request.method === "POST"
      ? await Product.create(values)
      : identifier ? await Product.findByIdAndUpdate(identifier, values, { new: true, runValidators: true }) : null;
    if (!product) return response.status(404).json({ success: false, message: "Product not found." });
    const populated = await Product.findById(product._id).populate("brandId").populate("categoryId").lean();
    return response.status(request.method === "POST" ? 201 : 200).json({ data: toProduct(populated as Row) });
  }

  response.setHeader("Allow", "GET, POST, PUT, DELETE");
  return response.status(405).json({ success: false, message: "Method not allowed." });
}

async function handleCart(request: NextApiRequest, response: NextApiResponse, segments: string[]) {
  const cartId = segments[1];
  const action = segments[2];
  const productId = segments[3];
  if (!cartId) return response.status(400).json({ success: false, message: "Cart ID is required." });
  let cart = await Cart.findOne({ cartId });
  if (request.method === "GET" && !action) {
    cart ??= await Cart.create({ cartId, items: [] });
    return response.status(200).json({ data: cart.toObject() });
  }
  if (action !== "items") return response.status(404).json({ success: false, message: "Cart route not found." });
  if (request.method === "DELETE" && !productId) {
    if (cart) { cart.items = []; await cart.save(); }
    return response.status(200).json({ success: true });
  }
  if (!cart) cart = await Cart.create({ cartId, items: [] });
  if (request.method === "POST") {
    const body = request.body as Row;
    const id = String(body.productId || "");
    const quantity = Math.floor(Number(body.quantity || 1));
    if (!isId(id) || !Number.isInteger(quantity) || quantity < 1) return response.status(400).json({ success: false, message: "Invalid product or quantity." });
    const product = await Product.findById(id);
    if (!product || !product.active) return response.status(404).json({ success: false, message: "Product is unavailable." });
    const line = cart.items.find((item: { productId: Types.ObjectId; quantity: number }) => idString(item.productId) === id);
    const nextQuantity = (line?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stockQuantity) return response.status(409).json({ success: false, message: "Requested quantity exceeds available stock." });
    if (line) line.quantity = nextQuantity;
    else cart.items.push({ productId: new Types.ObjectId(id), quantity });
  } else if (request.method === "PUT" && productId) {
    const quantity = Math.floor(Number((request.body as Row)?.quantity));
    if (!isId(productId) || !Number.isInteger(quantity) || quantity < 1) return response.status(400).json({ success: false, message: "Invalid product or quantity." });
    const product = await Product.findById(productId);
    const line = cart.items.find((item: { productId: Types.ObjectId; quantity: number }) => idString(item.productId) === productId);
    if (!product || !line) return response.status(404).json({ success: false, message: "Cart item not found." });
    if (quantity > product.stockQuantity) return response.status(409).json({ success: false, message: "Requested quantity exceeds available stock." });
    line.quantity = quantity;
  } else if (request.method === "DELETE" && productId) {
    if (!isId(productId)) return response.status(400).json({ success: false, message: "Invalid product ID." });
    cart.items = cart.items.filter((item: { productId: Types.ObjectId; quantity: number }) => idString(item.productId) !== productId);
  } else {
    response.setHeader("Allow", "GET, POST, PUT, DELETE");
    return response.status(405).json({ success: false, message: "Method not allowed." });
  }
  await cart.save();
  return response.status(200).json({ data: cart.toObject() });
}

async function handleOrders(request: NextApiRequest, response: NextApiResponse, segments: string[]) {
  const first = segments[1];
  if (first === "admin") {
    if (!adminOnly(request, response)) return;
    const rest = segments.slice(2);
    const [action, value, field] = rest;
    if (request.method === "GET" && !action) {
      const rows = await Order.find().sort({ createdAt: -1 }).lean();
      return response.status(200).json(rows.map((row) => toOrder(row as Row)));
    }
    if (request.method === "GET" && action === "status" && value) {
      const rows = await Order.find({ status: value.toUpperCase() }).sort({ createdAt: -1 }).lean();
      return response.status(200).json(rows.map((row) => toOrder(row as Row)));
    }
    if (request.method === "GET" && action === "payment-status" && value) {
      const rows = await Order.find({ paymentStatus: value.toUpperCase().replace(/-/g, "_") }).sort({ createdAt: -1 }).lean();
      return response.status(200).json(rows.map((row) => toOrder(row as Row)));
    }
    if (request.method === "GET" && action === "count") {
      const count = value === "status" ? await Order.countDocuments({ status: String(field || "").toUpperCase() }) : await Order.countDocuments();
      return response.status(200).json({ count });
    }
    if (request.method === "GET" && action === "revenue") {
      const [result] = await Order.aggregate([{ $match: { status: { $ne: "CANCELLED" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
      return response.status(200).json({ revenue: result?.total ?? 0 });
    }
    if (request.method === "GET" && action === "dashboard") {
      const [totalOrders, revenue, pending, delivered] = await Promise.all([
        Order.countDocuments(),
        Order.aggregate([{ $match: { status: { $ne: "CANCELLED" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
        Order.countDocuments({ status: "PENDING" }),
        Order.countDocuments({ status: "DELIVERED" }),
      ]);
      return response.status(200).json({ totalOrders, totalRevenue: revenue[0]?.total ?? 0, pendingOrders: pending, deliveredOrders: delivered });
    }
    if (request.method === "GET" && action === "number" && value) {
      const row = await Order.findOne({ orderNumber: value }).lean();
      return row ? response.status(200).json({ data: toOrder(row as Row) }) : response.status(404).json({ success: false, message: "Order not found." });
    }
    if (request.method === "GET" && action && isId(action)) {
      const row = await Order.findById(action).lean();
      return row ? response.status(200).json({ data: toOrder(row as Row) }) : response.status(404).json({ success: false, message: "Order not found." });
    }
    if (request.method === "PATCH" && action && isId(action)) {
      const order = await Order.findById(action);
      if (!order) return response.status(404).json({ success: false, message: "Order not found." });
      if (value === "status") order.status = String(request.query.status ?? request.query.orderStatus ?? "").toUpperCase() as typeof order.status;
      else if (value === "payment-status") order.paymentStatus = String(request.query.status ?? request.query.paymentStatus ?? "").toUpperCase() as typeof order.paymentStatus;
      else if (value === "cancel") order.status = "CANCELLED";
      else return response.status(404).json({ success: false, message: "Order action not found." });
      await order.save();
      return response.status(200).json({ data: toOrder(order.toObject() as Row) });
    }
    return response.status(404).json({ success: false, message: "Order route not found." });
  }

  if (request.method === "POST" && first) {
    const cart = await Cart.findOne({ cartId: first });
    if (!cart || !cart.items.length) return response.status(400).json({ success: false, message: "Your bag is empty." });
    const body = request.body as Row;
    if (!body.fullName || !body.phoneNumber || !body.streetAddress || !body.city || !body.postalCode || !body.countryRegion) {
      return response.status(400).json({ success: false, message: "Complete the required delivery details." });
    }
    const deliveryLocation = body.deliveryLocation;
    if (!deliveryLocation || typeof deliveryLocation.latitude !== "number" || typeof deliveryLocation.longitude !== "number") {
      return response.status(400).json({ success: false, message: "Confirm your delivery location before placing the order." });
    }
    assertWithinDeliveryZone(deliveryLocation);
    const items: Row[] = [];
    const reserved: { productId: Types.ObjectId; quantity: number }[] = [];
    let totalAmount = 0;
    for (const line of cart.items) {
      const product = await Product.findOneAndUpdate(
        { _id: line.productId, active: true, stockQuantity: { $gte: line.quantity } },
        { $inc: { stockQuantity: -line.quantity } },
        { new: true },
      );
      if (!product) {
        await Promise.all(reserved.map((item) => Product.updateOne({ _id: item.productId }, { $inc: { stockQuantity: item.quantity } })));
        return response.status(409).json({ success: false, message: "An item in your bag is no longer available in that quantity." });
      }
      reserved.push({ productId: product._id, quantity: line.quantity });
      const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      totalAmount += unitPrice * line.quantity;
      items.push({ productId: product._id, name: product.name, sku: product.sku, imageUrl: product.imageUrl, quantity: line.quantity, unitPrice });
    }
    let order;
    try {
      order = await Order.create({
        orderNumber: `GS-${Date.now()}-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
        customer: { fullName: body.fullName, phoneNumber: body.phoneNumber, email: body.email || "" },
        shippingAddress: { streetAddress: body.streetAddress, city: body.city, postalCode: body.postalCode, countryRegion: body.countryRegion, deliveryInstructions: body.deliveryInstructions || "" },
        items, totalAmount, paymentMethod: body.paymentMethod || "CASH_ON_DELIVERY",
      });
    } catch (error) {
      await Promise.all(reserved.map((item) => Product.updateOne({ _id: item.productId }, { $inc: { stockQuantity: item.quantity } })));
      throw error;
    }
    cart.items = [];
    await cart.save();
    return response.status(201).json({ data: toOrder(order.toObject() as Row) });
  }

  if (request.method === "GET" && first) {
    if (first === "number" && segments[2]) {
      const order = await Order.findOne({ orderNumber: segments[2] }).lean();
      return order ? response.status(200).json({ data: toPublicOrder(order as Row) }) : response.status(404).json({ success: false, message: "Order not found." });
    }
    const row = isId(first) ? await Order.findById(first).lean() : null;
    const order = row || await Order.findOne({ orderNumber: first }).lean();
    return order ? response.status(200).json({ data: toPublicOrder(order as Row) }) : response.status(404).json({ success: false, message: "Order not found." });
  }
  response.setHeader("Allow", "GET, POST, PATCH");
  return response.status(405).json({ success: false, message: "Method not allowed." });
}

export default async function api(request: NextApiRequest, response: NextApiResponse) {
  response.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  try {
    await parseJsonBody(request);
    await connectMongo();
    const segments = Array.isArray(request.query.path) ? request.query.path : [];
    const [resource] = segments;
    if (resource === "products" || resource === "brands" || resource === "categories") return await handleCatalog(request, response, resource, segments);
    if (resource === "cart") return await handleCart(request, response, segments);
    if (resource === "orders") return await handleOrders(request, response, segments);
    return response.status(404).json({ success: false, message: "API route not found." });
  } catch (error) {
    return sendError(response, error);
  }
}
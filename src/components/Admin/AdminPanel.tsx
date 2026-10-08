import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  IconArrowUpRight,
  IconBell,
  IconBox,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconCurrencyRupee,
  IconDots,
  IconEdit,
  IconEye,
  IconFilter,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconPlus,
  IconSearch,
  IconShoppingBag,
  IconShoppingCart,
  IconTag,
  IconTrash,
  IconTruck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { createCategory, getCategories, updateCategory, type Category, type CategoryWriteRequest } from "../../services/CategoryServiceService";
import { createBrand, getBrands, updateBrand, type Brand, type BrandWriteRequest } from "../../services/BrandService";
import { allProducts, createProduct, deleteProduct as deleteProductRequest, getProductById, resolveProductImageUrl, updateProduct, type Product, type ProductWriteRequest } from "../../services/ProductService";
import { getAdminOrderById, getAdminOrderByNumber, getAdminOrderCount, getAdminOrderCountByStatus, getAdminOrderDashboard, getAdminRevenue, listAdminOrders, listAdminOrdersByPaymentStatus, listAdminOrdersByStatus, paymentStatuses as paymentStatusOptions, updateAdminOrderStatus, updateAdminPaymentStatus, type AdminOrder, type OrderStatus, type PaymentStatus } from "../../services/AdminOrderService";
import brandLogo from "../../assets/gs-logo.png";
import AppLoader from "../AppLoader";
import InfiniteScrollTrigger from "../InfiniteScrollTrigger";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { apiErrorMessage } from "../../services/apiError";
import "./AdminPanel.css";

type Section = "Dashboard" | "Products" | "Categories" | "Brands" | "Customers" | "Orders";
type AdminEntity = Category | Brand;
type EntityKind = "Category" | "Brand";

const confirmDelete = async (label: string, action: () => void | Promise<void>) => {
  const result = await Swal.fire({ title: `Delete ${label}?`, text: "This action cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#b42318" });
  if (result.isConfirmed) await action();
};
const sectionFromRoute = (routePath: string): Section => {
  const key = routePath.split("/").filter(Boolean)[1]?.toLowerCase();
  if (key === "products" || key === "categories" || key === "brands") return key[0].toUpperCase() + key.slice(1) as Section;
  if (key === "customers" || key === "orders") return key[0].toUpperCase() + key.slice(1) as Section;
  return "Dashboard";
};
const orderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const orderStatusLabel = (status: OrderStatus) => status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
type Order = AdminOrder;

type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: number | string;
  brand: string;
  brandId: number | string;
  price: number;
  discountPrice: number;
  description: string;
  stock: number;
  image: string;
  active: boolean;
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const toAdminProduct = (product: Product): AdminProduct => ({
  id: String(product.id), name: product.name, sku: product.sku,
  category: product.categoryName || product.category, categoryId: product.categoryId,
  brand: product.brandName || product.brand, brandId: product.brandId,
  price: product.price, discountPrice: product.discountPrice, description: product.description,
  stock: product.stock, image: resolveProductImageUrl(product.mainImageUrl || product.imageUrl || product.image) || "",
  active: product.active !== false,
});

const salesBars = [36, 52, 44, 68, 57, 78, 63, 89, 72, 96, 79, 100];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function AdminPanel({ routePath, navigate: navigateRoute, onLogout }: { routePath: string; navigate: (path: import("../../Route/AppRoutes").RoutePath) => void; onLogout: () => void }) {
  const [section, setSection] = useState<Section>(() => sectionFromRoute(routePath));
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [productSaving, setProductSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [entityError, setEntityError] = useState("");
  const [entitySearch, setEntitySearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [entityKind, setEntityKind] = useState<EntityKind | null>(null);
  const [editingEntity, setEditingEntity] = useState<AdminEntity | null>(null);
  const [entitySaving, setEntitySaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [visibleOrders, setVisibleOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All payment statuses");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderActionId, setOrderActionId] = useState("");
  const [orderStats, setOrderStats] = useState({ count: 0, revenue: 0, pending: 0, delivered: 0, dashboard: {} as Record<string, unknown> });
  const [orderSearch, setOrderSearch] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("All orders");

  const refreshOrders = useCallback(async (statusFilter = filter, paymentStatusFilter = paymentFilter) => {
    setOrdersLoading(true);
    setOrderError("");
    try {
      const allRows = await listAdminOrders();
      setOrders(allRows);
      let rows = allRows;
      if (statusFilter !== "All orders") rows = await listAdminOrdersByStatus(statusFilter);
      else if (paymentStatusFilter !== "All payment statuses") rows = await listAdminOrdersByPaymentStatus(paymentStatusFilter);
      if (paymentStatusFilter !== "All payment statuses") {
        rows = rows.filter((order) => order.paymentStatus === paymentStatusFilter);
      }
      setVisibleOrders(rows);
    } catch (error) {
      setOrderError(apiErrorMessage(error, "Could not load orders."));
      setVisibleOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [filter, paymentFilter]);

  const refreshOrderStats = async () => {
    try {
      const [count, pending, delivered, revenue, dashboard] = await Promise.all([
        getAdminOrderCount(), getAdminOrderCountByStatus("PENDING"), getAdminOrderCountByStatus("DELIVERED"), getAdminRevenue(), getAdminOrderDashboard(),
      ]);
      const dashboardCount = Number(dashboard.totalOrders ?? dashboard.orderCount);
      const dashboardRevenue = Number(dashboard.totalRevenue ?? dashboard.revenue);
      setOrderStats({
        count: Number.isFinite(dashboardCount) && dashboardCount ? dashboardCount : count,
        revenue: Number.isFinite(dashboardRevenue) && dashboardRevenue ? dashboardRevenue : revenue,
        pending, delivered, dashboard,
      });
    } catch (error) {
      setOrderError(apiErrorMessage(error, "Could not load order totals."));
    }
  };

  useEffect(() => { void refreshOrders(); }, [refreshOrders]);
  useEffect(() => { void refreshOrderStats(); }, []);

  const refreshProducts = async () => {
    setProductsLoading(true);
    setProductError("");
    try {
      setProducts((await allProducts()).map(toAdminProduct));
    } catch (error) {
      setProductError(apiErrorMessage(error, "Could not load products."));
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => { void refreshProducts(); }, []);
  const refreshEntities = async () => {
    setEntityError("");
    try {
      const [categoryRows, brandRows] = await Promise.all([getCategories(true), getBrands(true)]);
      setCategories(categoryRows);
      setBrands(brandRows);
    } catch (error) {
      setEntityError(apiErrorMessage(error, "Could not load categories and brands."));
    }
  };
  useEffect(() => { void refreshEntities(); }, []);
  useEffect(() => { setSection(sectionFromRoute(routePath)); }, [routePath]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.sku} ${product.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [products, search],
  );
  const filteredOrders = visibleOrders.filter((order) =>
    `${order.id} ${order.orderNumber} ${order.customerName} ${order.email}`.toLowerCase().includes(orderSearch.toLowerCase()),
  );
  const exportOrders = () => {
    const columns = ["Order ID", "Order Number", "Customer Name", "Email", "Order Date", "Amount (INR)", "Order Status", "Payment Status"];
    const csvValue = (value: string | number) => {
      const safeValue = typeof value === "string" && ["=", "+", "-", "@"].includes(value[0]) ? `'${value}` : String(value);
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const rows = filteredOrders.map((order) => [order.id, order.orderNumber, order.customerName, order.email, order.date, order.amount, orderStatusLabel(order.status), order.paymentStatus.replace(/_/g, " ")]);
    const csv = [columns, ...rows].map((row) => row.map(csvValue).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([String.fromCharCode(65279) + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `gaurav-sales-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const customersFromOrders = Array.from(orders.reduce((map, order) => {
    const key = order.email || order.customerName;
    const current = map.get(key) || { name: order.customerName, email: order.email, orders: 0, spent: 0, joined: order.date, phone: "", customerId: "", address: "", orderNumbers: [] as string[] };
    const raw = order.raw;
    const nested = (raw.customer ?? raw.customerDetails) as Record<string, unknown> | undefined;
    const shipping = (raw.shippingAddress ?? raw.shipping_address ?? raw.address) as Record<string, unknown> | undefined;
    current.phone ||= String(raw.phone ?? raw.phoneNumber ?? raw.phone_number ?? nested?.phone ?? nested?.phoneNumber ?? nested?.phone_number ?? "");
    current.customerId ||= String(raw.customerId ?? raw.customer_id ?? nested?.id ?? nested?.customerId ?? "");
    current.address ||= [shipping?.addressLine1 ?? shipping?.address_line1 ?? shipping?.street, shipping?.addressLine2 ?? shipping?.address_line2, shipping?.city, shipping?.state, shipping?.postalCode ?? shipping?.postal_code ?? shipping?.zipCode, shipping?.country].filter(Boolean).join(", ");
    current.orders += 1;
    current.spent += order.amount;
    current.orderNumbers.push(order.orderNumber || order.id);
    map.set(key, current);
    return map;
  }, new Map<string, { name: string; email: string; orders: number; spent: number; joined: string; phone: string; customerId: string; address: string; orderNumbers: string[] }>()).values());
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 10);
  const currentEntities: AdminEntity[] = section === "Categories" ? categories : brands;
  const filteredEntities = currentEntities.filter((item) =>
    `${item.name} ${item.slug}`.toLowerCase().includes(entitySearch.toLowerCase()) &&
    (entityFilter === "all" || (entityFilter === "active" ? item.active !== false : item.active === false)),
  );

  const saveProduct = async (product: ProductWriteRequest) => {
    setProductSaving(true);
    setProductError("");
    try {
      if (editing) await updateProduct(editing.id, product);
      else await createProduct(product);
      await refreshProducts();
      setNotice(editing ? "Product details updated." : "Product added to your catalog.");
      setEditing(null);
      setShowForm(false);
    } catch (error) {
      setProductError(apiErrorMessage(error, "Could not save this product."));
    } finally {
      setProductSaving(false);
    }
  };

  const openAddProduct = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEditProduct = async (product: AdminProduct) => {
    setProductError("");
    try {
      setEditing(toAdminProduct(await getProductById(product.id)));
      setShowForm(true);
    } catch (error) {
      setProductError(apiErrorMessage(error, "Could not load product details."));
    }
  };

  const removeProduct = async (id: string) => {
    setProductError("");
    try {
      await deleteProductRequest(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setNotice("Product deleted.");
    } catch (error) {
      setProductError(apiErrorMessage(error, "Could not delete this product."));
    }
  };

  const navigate = (next: Section) => {
    setSection(next);
    setMobileMenuOpen(false);
    setSearch("");
    setEntitySearch("");
    setEntityFilter("all");
    setNotice("");
    const route: Record<Section, import("../../Route/AppRoutes").RoutePath> = {
      Dashboard: "/admin/dashboard", Products: "/admin/products", Categories: "/admin/categories", Brands: "/admin/brands", Customers: "/admin/customers", Orders: "/admin/orders",
    };
    navigateRoute(route[next]);
  };

  const saveEntity = async (value: CategoryWriteRequest | BrandWriteRequest) => {
    if (!entityKind) return;
    setEntitySaving(true);
    setEntityError("");
    try {
      if (entityKind === "Category") {
        if (editingEntity) await updateCategory(editingEntity.id, value as CategoryWriteRequest);
        else await createCategory(value as CategoryWriteRequest);
      } else {
        if (editingEntity) await updateBrand(editingEntity.id, value as BrandWriteRequest);
        else await createBrand(value as BrandWriteRequest);
      }
      await refreshEntities();
      setNotice(`${entityKind} ${editingEntity ? "updated" : "added"}.`);
      setEntityKind(null);
      setEditingEntity(null);
    } catch (error) {
      setEntityError(apiErrorMessage(error, `Could not save ${entityKind.toLowerCase()}.`));
    } finally {
      setEntitySaving(false);
    }
  };

  const toggleEntityActive = async (kind: EntityKind, entity: AdminEntity) => {
    const nextActive = entity.active === false;
    setEntitySaving(true);
    setEntityError("");
    try {
      if (kind === "Brand") {
        const brand = entity as Brand;
        await updateBrand(brand.id, { name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl ?? "", active: nextActive });
      } else {
        const category = entity as Category;
        await updateCategory(category.id, { name: category.name, slug: category.slug, description: "", active: nextActive });
      }
      await refreshEntities();
      setNotice(`${entity.name} is now ${nextActive ? "active" : "inactive"}.`);
    } catch (error) {
      setEntityError(apiErrorMessage(error, `Could not ${nextActive ? "activate" : "deactivate"} ${entity.name}.`));
    } finally {
      setEntitySaving(false);
    }
  };

  const changeOrderStatus = async (id: string, status: OrderStatus) => {
    setOrderActionId(id);
    setOrderError("");
    try {
      await updateAdminOrderStatus(id, status);
      setNotice(`Order status updated to ${orderStatusLabel(status)}.`);
      await Promise.all([refreshOrders(filter, paymentFilter), refreshOrderStats()]);
    } catch (error) {
      setOrderError(apiErrorMessage(error, "Could not update order status."));
    } finally {
      setOrderActionId("");
    }
  };

  const changePaymentStatus = async (id: string, status: PaymentStatus) => {
    setOrderActionId(id);
    setOrderError("");
    try {
      await updateAdminPaymentStatus(id, status);
      setNotice(`Payment status updated to ${status.replace(/_/g, " ")}.`);
      await Promise.all([refreshOrders(filter, paymentFilter), refreshOrderStats()]);
    } catch (error) {
      setOrderError(apiErrorMessage(error, "Could not update payment status."));
    } finally {
      setOrderActionId("");
    }
  };

  const viewOrder = async (key: string, byNumber: boolean) => {
    setOrderError("");
    setOrderActionId(key);
    try {
      setSelectedOrder(byNumber ? await getAdminOrderByNumber(key) : await getAdminOrderById(key));
    } catch (error) {
      setOrderError(apiErrorMessage(error, "Could not load order details."));
    } finally {
      setOrderActionId("");
    }
  };
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
        <a className="admin-brand" href="#dashboard" onClick={() => navigate("Dashboard")}>
          <img className="admin-brand-logo" src={brandLogo} alt="Gaurav Sales logo" />
          <span className="admin-brand-word">Gaurav<span>Sales</span></span>
        </a>
        <div className="admin-side-caption">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <NavButton icon={<IconLayoutDashboard />} label="Dashboard" active={section === "Dashboard"} onClick={() => navigate("Dashboard")} />
          <NavButton icon={<IconBox />} label="Products" count={products.length} active={section === "Products"} onClick={() => navigate("Products")} />
          <NavButton icon={<IconTag />} label="Categories" count={categories.length} active={section === "Categories"} onClick={() => navigate("Categories")} />
          <NavButton icon={<IconShoppingBag />} label="Brands" count={brands.length} active={section === "Brands"} onClick={() => navigate("Brands")} />
          <NavButton icon={<IconUsers />} label="Customers" active={section === "Customers"} onClick={() => navigate("Customers")} />
          <NavButton icon={<IconShoppingBag />} label="Orders" count={orders.length} active={section === "Orders"} onClick={() => navigate("Orders")} />
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user">
            <span className="admin-avatar">GS</span>
            <span className="admin-user-details"><strong>Gaurav Sales</strong><small>Administrator</small></span>
            <button aria-label="Account options" onClick={() => setNotice("Signed in as Gaurav Sales.")}><IconDots size={19} /></button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && <button className="admin-mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />}

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}><IconMenu2 /></button>
          <div className="admin-breadcrumb"><span>Workspace</span><IconChevronRight size={15} /><strong>{section}</strong></div>
          <div className="admin-topbar-right">
            <span className="admin-date"><IconClock size={16} /> Monday, October 5</span>
            <button className="admin-notification" aria-label="Notifications" onClick={() => setNotice("You’re all caught up.")}><IconBell size={19} /><i /></button>
            <div className="admin-account-menu">
              <button className="admin-top-profile" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}><span className="admin-avatar">GS</span><span>Gaurav Sales</span><IconChevronDown size={15} /></button>
              {accountMenuOpen && <div className="admin-account-dropdown" role="menu"><div className="admin-account-dropdown-heading"><strong>Gaurav Sales</strong><small>Administrator</small></div><button role="menuitem" onClick={() => { setAccountMenuOpen(false); onLogout(); }}><IconLogout size={16} /> Logout</button></div>}
            </div>
          </div>
        </header>

        <div className="admin-content">
          {notice && <div className="admin-notice" role="status"><IconCircleCheck size={18} />{notice}<button aria-label="Dismiss notice" onClick={() => setNotice("")}><IconX size={17} /></button></div>}
          {section === "Dashboard" && (
            <Dashboard
              products={products}
              orders={orders}
              orderStats={orderStats}
              customerCount={customersFromOrders.length}
              lowStock={lowStock}
              onProducts={() => navigate("Products")}
              onOrders={() => navigate("Orders")}
            />
          )}
          {section === "Products" && (
            <>
            {productError && <div className="admin-notice is-error" role="alert">{productError}<button aria-label="Dismiss error" onClick={() => setProductError("")}><IconX size={17} /></button></div>}
            <ProductsSection
              products={filteredProducts}
              loading={productsLoading}
              query={search}
              onQuery={setSearch}
              onAdd={openAddProduct}
              onEdit={openEditProduct}
              onRemove={removeProduct}
            />
            </>
          )}
          {(section === "Categories" || section === "Brands") && (
            <>
              {entityError && <div className="admin-notice is-error" role="alert">{entityError}<button aria-label="Dismiss error" onClick={() => setEntityError("")}><IconX size={17} /></button></div>}
              <CatalogEntitySection
                kind={section === "Categories" ? "Category" : "Brand"}
                entities={filteredEntities}
                query={entitySearch}
                filter={entityFilter}
                onQuery={setEntitySearch}
                onFilter={setEntityFilter}
                onAdd={() => { setEntityKind(section === "Categories" ? "Category" : "Brand"); setEditingEntity(null); }}
                onEdit={(entity) => { setEntityKind(section === "Categories" ? "Category" : "Brand"); setEditingEntity(entity); }}
                onToggleActive={(entity) => { void toggleEntityActive(section === "Categories" ? "Category" : "Brand", entity); }}
                saving={entitySaving}
              />
            </>
          )}
          {section === "Customers" && <CustomersSection customers={customersFromOrders} />}
          {section === "Customers" && orderError && <div className="admin-notice is-error" role="alert">{orderError}</div>}
          {section === "Orders" && (
            <>
            {orderError && <div className="admin-notice is-error" role="alert">{orderError}<button aria-label="Dismiss order error" onClick={() => setOrderError("")}><IconX size={17} /></button></div>}
            <OrdersSection
              orders={filteredOrders}
              orderStats={orderStats}
              filter={filter}
              onFilter={setFilter}
              paymentFilter={paymentFilter}
              paymentStatuses={Array.from(new Set(orders.map((order) => order.paymentStatus).filter((status) => status && status !== "UNKNOWN")))}
              onPaymentFilter={setPaymentFilter}
              search={orderSearch}
              onSearch={setOrderSearch}
              loading={ordersLoading}
              orderActionId={orderActionId}
              onStatusChange={changeOrderStatus}
              onPaymentStatusChange={changePaymentStatus}
              onViewById={(id) => { void viewOrder(id, false); }}
              onViewByNumber={(number) => { void viewOrder(number, true); }}
              onExport={exportOrders}
            />
            </>
          )}
        </div>
      </main>

      {showForm && (
        <ProductForm
          product={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={saveProduct}
          saving={productSaving}
        />
      )}
      {entityKind && <CatalogEntityForm key={`${entityKind}-${editingEntity?.id ?? "new"}`} kind={entityKind} entity={editingEntity} saving={entitySaving} onClose={() => { if (!entitySaving) { setEntityKind(null); setEditingEntity(null); } }} onSave={saveEntity} />}
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button className={`admin-nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon}<span>{label}</span>{count !== undefined && <small>{count}</small>}
    </button>
  );
}

function Dashboard({
  products,
  orders,
  orderStats,
  customerCount,
  lowStock,
  onProducts,
  onOrders,
}: {
  products: AdminProduct[];
  orders: Order[];
  orderStats: { count: number; revenue: number; pending: number; delivered: number; dashboard: Record<string, unknown> };
  customerCount: number;
  lowStock: AdminProduct[];
  onProducts: () => void;
  onOrders: () => void;
}) {
  const revenue = orderStats.revenue;
  const delivered = orderStats.delivered;
  const activeProducts = products.filter((product) => product.active).length;

  return (
    <>
      <section className="admin-welcome">
        <div className="admin-welcome-copy">
          <span className="admin-eyebrow">ADMIN OVERVIEW</span>
          <h1><img className="welcome-brand-logo" src={brandLogo} alt="Gaurav Sales logo" />Welcome to Gaurav Sales</h1>
          <p>Here’s what’s happening with your store today.</p>
        </div>
      </section>

      <section className="admin-stat-grid" aria-label="Store summary">
        <StatCard label="Total revenue" value={currency(revenue)} change="+12.8%" icon={<IconCurrencyRupee />} tone="purple" />
        <StatCard label="Orders" value={String(orderStats.count)} helper={`${orderStats.pending} pending`} icon={<IconShoppingCart />} tone="blue" />
        <StatCard label="Products" value={products.length.toString()} helper={`${activeProducts} active in catalog`} icon={<IconBox />} tone="orange" />
        <StatCard label="Customers" value={String(customerCount)} helper="From order history" icon={<IconUsers />} tone="green" />
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-panel-card sales-panel">
          <div className="admin-panel-heading">
            <div><h2>Sales overview</h2><p>Revenue performance through the year</p></div>
            <button className="admin-select-button" onClick={() => undefined}>This year <IconChevronDown size={15} /></button>
          </div>
          <div className="sales-summary"><strong>{currency(revenue)}</strong><span className="admin-trend"><IconArrowUpRight size={15} /> Revenue</span><small>from order API</small></div>
          <div className="sales-chart" role="img" aria-label="Bar chart showing monthly sales from January to December">
            <div className="chart-guides"><span>{currency(50000)}</span><span>{currency(35000)}</span><span>{currency(20000)}</span><span>{currency(5000)}</span></div>
            <div className="chart-bars">
              {salesBars.map((height, index) => (
                <div className="chart-bar-column" key={months[index]}>
                  <div className={`chart-bar ${index === 9 ? "highlight" : ""}`} style={{ height: `${height}%` }} title={`${months[index]} sales`} />
                  <span>{months[index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend"><span><i /> This year</span><span><i /> Last year</span></div>
        </div>

        <div className="admin-panel-card orders-panel">
          <div className="admin-panel-heading">
            <div><h2>Recent orders</h2><p>Latest activity in your store</p></div>
            <button className="admin-link-button" onClick={onOrders}>View all <IconArrowUpRight size={15} /></button>
          </div>
          <div className="recent-orders-list">
            {orders.slice(0, 4).map((order) => (
              <div className="recent-order" key={order.id}>
                <span className="order-product-icon"><IconShoppingBag size={18} /></span>
                <span className="recent-order-info"><strong>{order.customerName}</strong><small>{order.orderNumber} · {order.date}</small></span>
                <span className="recent-order-amount">{currency(order.amount)}<StatusBadge status={order.status} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-dashboard-grid lower-grid">
        <div className="admin-panel-card">
          <div className="admin-panel-heading">
            <div><h2>Inventory snapshot</h2><p>Products that may need attention</p></div>
            <button className="admin-link-button" onClick={onProducts}>View products <IconArrowUpRight size={15} /></button>
          </div>
          {lowStock.length ? (
            <div className="inventory-list">
              {lowStock.map((product) => (
                <div className="inventory-row" key={product.id}>
                  <img src={product.image} alt="" />
                  <span><strong>{product.name}</strong><small>{product.sku}</small></span>
                  <b className="inventory-low">{product.stock} left</b>
                </div>
              ))}
            </div>
          ) : <div className="admin-empty-inline">All products are well stocked.</div>}
        </div>
        <div className="admin-panel-card quick-panel">
          <div className="admin-panel-heading"><div><h2>Quick overview</h2><p>A quick look at your store</p></div><IconDots size={20} /></div>
          <div className="overview-row"><span><i className="overview-dot purple-dot" />Fulfilled orders</span><strong>{delivered} <small>of {orders.length}</small></strong></div>
          <div className="overview-row"><span><i className="overview-dot orange-dot" />Low stock items</span><strong>{lowStock.length}</strong></div>
          <div className="overview-row"><span><i className="overview-dot green-dot" />Active products</span><strong>{activeProducts}</strong></div>
        </div>
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  change,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  change?: string;
  helper?: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="admin-stat-card">
      <div className="stat-card-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div>
      <strong className="stat-value">{value}</strong>
      {change ? <span className="stat-change"><IconArrowUpRight size={14} />{change}<small> vs last month</small></span> : <span className="stat-helper">{helper}</span>}
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-section-heading">
      <div><span className="admin-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function ProductsSection({
  products,
  loading,
  query,
  onQuery,
  onAdd,
  onEdit,
  onRemove,
}: {
  products: AdminProduct[];
  loading: boolean;
  query: string;
  onQuery: (value: string) => void;
  onAdd: () => void;
  onEdit: (product: AdminProduct) => void;
  onRemove: (id: string) => void;
}) {
  const { visibleCount, hasMore, loadMore } = useInfiniteScroll(products.length, 10, query);
  const visibleProducts = products.slice(0, visibleCount);
  return (
    <>
      <SectionHeading eyebrow="CATALOG" title="Products" description="Manage your product catalog, pricing, and stock." action={<button className="admin-primary-button" onClick={onAdd}><IconPlus size={18} /> Add product</button>} />
      <div className="admin-panel-card admin-table-panel">
        <div className="admin-table-toolbar">
          <label className="admin-search"><IconSearch size={18} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search products..." /></label>
          <button className="admin-filter-button"><IconFilter size={17} /> Filter</button>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7}><div className="admin-table-loader"><AppLoader label="Loading products" variant="inline" /></div></td></tr>}
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td><div className="admin-product-cell"><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.category}</small></span></div></td>
                  <td><span className="admin-sku">{product.sku}</span></td>
                  <td><span className="admin-category-pill">{product.category}</span></td>
                  <td><strong>{currency(product.price)}</strong></td>
                  <td><span className={`admin-stock ${product.stock <= 10 ? "low" : ""}`}><i />{product.stock} units</span></td>
                  <td><span className={`admin-status ${product.active ? "active" : "inactive"}`}><i />{product.active ? "Active" : "Inactive"}</span></td>
                  <td><div className="admin-row-actions"><button aria-label={`Edit ${product.name}`} onClick={() => onEdit(product)}><IconEdit size={17} /></button><button aria-label={`Remove ${product.name}`} onClick={() => { void confirmDelete(`product “${product.name}”`, () => onRemove(product.id)); }}><IconTrash size={17} /></button></div></td>
                </tr>
              ))}
              {!loading && hasMore && <tr><td colSpan={7}><InfiniteScrollTrigger hasMore={hasMore} onLoadMore={loadMore} /></td></tr>}
              {!loading && !products.length && <tr><td colSpan={7}><div className="admin-empty-state"><IconBox size={30} /><strong>No products found</strong><p>Try another search or add a product to your catalog.</p></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="admin-table-footer">Showing <strong>{visibleProducts.length}</strong> of {products.length} products</div>
      </div>
    </>
  );
}

function CatalogEntitySection({ kind, entities, query, filter, onQuery, onFilter, onAdd, onEdit, onToggleActive, saving }: {
  kind: EntityKind;
  entities: AdminEntity[];
  query: string;
  filter: string;
  onQuery: (value: string) => void;
  onFilter: (value: string) => void;
  onAdd: () => void;
  onEdit: (entity: AdminEntity) => void;
  onToggleActive: (entity: AdminEntity) => void;
  saving: boolean;
}) {
  const { visibleCount, hasMore, loadMore } = useInfiniteScroll(entities.length, 10, `${query}|${filter}`);
  const visibleEntities = entities.slice(0, visibleCount);
  return <>
    <SectionHeading eyebrow="CATALOG" title={`${kind}s`} description={`Add, edit, filter, and manage your ${kind.toLowerCase()} catalog.`} action={<button className="admin-primary-button" onClick={onAdd}><IconPlus size={18} /> Add {kind.toLowerCase()}</button>} />
    <div className="admin-panel-card admin-table-panel">
      <div className="admin-table-toolbar">
        <label className="admin-search"><IconSearch size={18} /><input value={query} onChange={(event) => onQuery(event.currentTarget.value)} placeholder={`Search ${kind.toLowerCase()}...`} /></label>
        <select className="admin-filter-button order-filter" aria-label={`Filter ${kind.toLowerCase()} by status`} value={filter} onChange={(event) => onFilter(event.currentTarget.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      </div>
      <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>NAME</th><th>SLUG</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
        <tbody>{visibleEntities.map((entity) => <tr key={entity.id}><td><strong>{entity.name}</strong></td><td><span className="admin-sku">{entity.slug}</span></td><td><span className={`admin-status ${entity.active === false ? "inactive" : "active"}`}>{entity.active === false ? <IconCircleX size={15} /> : <IconCircleCheck size={15} />}{entity.active === false ? "Inactive" : "Active"}</span></td><td><div className="admin-row-actions"><button aria-label={`${entity.active === false ? "Activate" : "Deactivate"} ${entity.name}`} title={entity.active === false ? "Activate" : "Deactivate"} disabled={saving} onClick={() => onToggleActive(entity)}>{entity.active === false ? <IconCircleCheck size={17} /> : <IconCircleX size={17} />}</button><button aria-label={`Edit ${entity.name}`} title="Edit" disabled={saving} onClick={() => onEdit(entity)}><IconEdit size={17} /></button></div></td></tr>)}
          {hasMore && <tr><td colSpan={4}><InfiniteScrollTrigger hasMore={hasMore} onLoadMore={loadMore} /></td></tr>}
          {!entities.length && <tr><td colSpan={4}><div className="admin-empty-state"><IconTag size={30} /><strong>No {kind.toLowerCase()}s found</strong><p>Try a different filter or add a {kind.toLowerCase()}.</p></div></td></tr>}</tbody>
      </table></div>
      <div className="admin-table-footer">Showing <strong>{visibleEntities.length}</strong> of {entities.length} {kind.toLowerCase()}s</div>
    </div>
  </>;
}

function CatalogEntityForm({ kind, entity, saving, onClose, onSave }: {
  kind: EntityKind;
  entity: AdminEntity | null;
  saving: boolean;
  onClose: () => void;
  onSave: (value: CategoryWriteRequest | BrandWriteRequest) => void;
}) {
  const [name, setName] = useState(entity?.name ?? "");
  const [slug, setSlug] = useState(entity?.slug ?? "");
  const [active, setActive] = useState(entity?.active !== false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const safeSlug = slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (kind === "Category") onSave({ name: name.trim(), slug: safeSlug, description: "", active });
    else onSave({ name: name.trim(), slug: safeSlug, logoUrl: entity && "logoUrl" in entity ? entity.logoUrl ?? "" : "", active });
  };
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <form className="admin-product-form" onSubmit={submit}>
      <div className="admin-form-heading"><div><span className="admin-eyebrow">CATALOG</span><h2>{entity ? `Edit ${kind.toLowerCase()}` : `Add ${kind.toLowerCase()}`}</h2><p>Manage your {kind.toLowerCase()} details.</p></div><button type="button" className="admin-modal-close" aria-label="Close form" onClick={onClose}><IconX /></button></div>
      <div className="admin-form-content">
        <label>{kind} name<input required maxLength={100} value={name} onChange={(event) => { setName(event.currentTarget.value); if (!entity) setSlug(""); }} placeholder={`Enter ${kind.toLowerCase()} name`} /></label>
        <label>Slug<input required maxLength={120} value={slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")} onChange={(event) => setSlug(event.currentTarget.value)} placeholder="url-friendly-name" /></label>
        <label className="admin-active-toggle"><input type="checkbox" checked={active} onChange={(event) => setActive(event.currentTarget.checked)} /><span><strong>Active</strong><small>Available in the store catalog</small></span></label>
      </div>
      <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="admin-primary-button" disabled={saving}>{saving ? "Saving…" : entity ? "Save changes" : `Add ${kind.toLowerCase()}`}</button></div>
    </form>
  </div>;
}

function CustomersSection({ customers }: { customers: Array<{ name: string; email: string; orders: number; spent: number; joined: string; phone: string; customerId: string; address: string; orderNumbers: string[] }> }) {
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[number] | null>(null);
  const filteredCustomers = customers.filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(query.toLowerCase()));
  const { visibleCount, hasMore, loadMore } = useInfiniteScroll(filteredCustomers.length, 10, query);
  const visibleCustomers = filteredCustomers.slice(0, visibleCount);
  return (
    <>
      <SectionHeading eyebrow="RELATIONSHIPS" title="Customers" description="Get to know the people who shop with Gaurav Sales." />
      <div className="admin-panel-card admin-table-panel">
        <div className="admin-table-toolbar"><label className="admin-search"><IconSearch size={18} /><input placeholder="Search customer name or email..." value={query} onChange={(event) => setQuery(event.currentTarget.value)} /></label></div>
        <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>CUSTOMER</th><th>ORDERS</th><th>TOTAL SPENT</th><th>RECENT ORDER</th><th /></tr></thead>
          <tbody>{visibleCustomers.map((customer) => <tr key={customer.email || customer.name}><td><div className="admin-customer-cell"><span className="admin-avatar customer-avatar">{customer.name.split(" ").map((part) => part[0]).join("")}</span><span><strong>{customer.name}</strong><small>{customer.email || "Email not provided"}</small></span></div></td><td>{customer.orders} orders</td><td><strong>{currency(customer.spent)}</strong></td><td>{customer.joined}</td><td><div className="admin-row-actions"><button aria-label={`View ${customer.name} details`} title="View customer details" onClick={() => setSelectedCustomer(customer)}><IconEye size={17} /></button></div></td></tr>)}{hasMore && <tr><td colSpan={5}><InfiniteScrollTrigger hasMore={hasMore} onLoadMore={loadMore} /></td></tr>}{!filteredCustomers.length && <tr><td colSpan={5}><div className="admin-empty-state"><IconUsers size={28} /><strong>No customers found</strong><p>Customers appear here from admin order records.</p></div></td></tr>}</tbody>
        </table></div>
        <div className="admin-table-footer">Showing <strong>{visibleCustomers.length}</strong> of {filteredCustomers.length} customers</div>
      </div>
      {selectedCustomer && <CustomerDetailsModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
    </>
  );
}

function CustomerDetailsModal({ customer, onClose }: { customer: { name: string; email: string; orders: number; spent: number; joined: string; phone: string; customerId: string; address: string; orderNumbers: string[] }; onClose: () => void }) {
  const details: [string, string][] = [["Customer ID", customer.customerId], ["Full name", customer.name], ["Email", customer.email], ["Phone", customer.phone], ["Address", customer.address], ["Orders", String(customer.orders)], ["Total spent", currency(customer.spent)], ["Most recent order", customer.joined], ["Order numbers", customer.orderNumbers.filter(Boolean).join(", ")]];
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-product-form admin-order-detail-modal" aria-labelledby="admin-customer-detail-title">
      <div className="admin-form-heading"><div><span className="admin-eyebrow">CUSTOMER DETAILS</span><h2 id="admin-customer-detail-title">{customer.name}</h2><p>Customer information from order history.</p></div><button type="button" className="admin-modal-close" aria-label="Close customer details" onClick={onClose}><IconX /></button></div>
      <dl className="admin-order-detail-grid">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl>
    </section>
  </div>;
}

function OrdersSection({
  orders,
  orderStats,
  filter,
  onFilter,
  paymentFilter,
  paymentStatuses,
  onPaymentFilter,
  search,
  onSearch,
  loading,
  orderActionId,
  onStatusChange,
  onPaymentStatusChange,
  onViewById,
  onViewByNumber,
  onExport,
}: {
  orders: Order[];
  orderStats: { count: number; revenue: number; pending: number; delivered: number; dashboard: Record<string, unknown> };
  filter: string;
  onFilter: (value: string) => void;
  paymentFilter: string;
  paymentStatuses: string[];
  onPaymentFilter: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
  loading: boolean;
  orderActionId: string;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onPaymentStatusChange: (id: string, status: PaymentStatus) => void;
  onViewById: (id: string) => void;
  onViewByNumber: (number: string) => void;
  onExport: () => void;
}) {
  const paymentOptions: string[] = paymentStatusOptions;
  const { visibleCount, hasMore, loadMore } = useInfiniteScroll(orders.length, 10, `${search}|${filter}|${paymentFilter}`);
  const visibleOrders = orders.slice(0, visibleCount);
  return (
    <>
      <SectionHeading eyebrow="SALES" title="Orders" description="Track customer orders and their fulfillment status." action={<button className="admin-secondary-button" onClick={onExport}><IconTruck size={17} /> Export Excel</button>} />
      <div className="admin-order-summary">
        <SummaryPill icon={<IconShoppingBag />} label="Total orders" value={String(orderStats.count)} />
        <SummaryPill icon={<IconClock />} label="Pending orders" value={String(orderStats.pending)} />
        <SummaryPill icon={<IconCircleCheck />} label="Delivered orders" value={String(orderStats.delivered)} />
      </div>
      <div className="admin-panel-card admin-table-panel">
        <div className="admin-table-toolbar"><label className="admin-search"><IconSearch size={18} /><input placeholder="Search order number, ID, or customer..." value={search} onChange={(event) => onSearch(event.currentTarget.value)} /></label><select className="admin-filter-button order-filter" aria-label="Filter by order status" value={filter} onChange={(event) => onFilter(event.target.value)}><option>All orders</option>{orderStatuses.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select><select className="admin-filter-button order-filter" aria-label="Filter by payment status" value={paymentFilter} onChange={(event) => onPaymentFilter(event.target.value)}><option>All payment statuses</option>{paymentOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}</select></div>
        <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>CUSTOMER NAME</th><th>ORDER NUMBER</th><th>ORDER ID</th><th>DATE</th><th>AMOUNT</th><th>STATUS · UPDATE</th><th>PAYMENT · UPDATE</th><th>ACTIONS</th></tr></thead>
          <tbody>{loading && <tr><td colSpan={8}><div className="admin-table-loader"><AppLoader label="Loading orders" variant="inline" /></div></td></tr>}{!loading && visibleOrders.map((order) => <tr key={order.id}><td><span className="admin-customer-name"><strong>{order.customerName}</strong><small>{order.email || "Email not provided"}</small></span></td><td><button className="admin-order-reference" disabled={!order.orderNumber} onClick={() => onViewByNumber(order.orderNumber)}>{order.orderNumber || "—"}</button></td><td><button className="admin-order-reference admin-order-id" disabled={!order.id} onClick={() => onViewById(order.id)}>{order.id || "—"}</button></td><td>{order.date}</td><td><strong>{currency(order.amount)}</strong></td><td><label className="admin-order-status-control"><StatusBadge status={order.status} /><select aria-label={`Update status for order ${order.orderNumber}`} value={order.status} disabled={orderActionId === order.id} onChange={(event) => onStatusChange(order.id, event.currentTarget.value as OrderStatus)}>{orderStatuses.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select></label></td><td><label className="admin-order-status-control"><span className="admin-order-status">{order.paymentStatus.replace(/_/g, " ")}</span><select aria-label={`Update payment status for order ${order.orderNumber}`} value={paymentOptions.includes(order.paymentStatus) ? order.paymentStatus : ""} disabled={orderActionId === order.id} onChange={(event) => onPaymentStatusChange(order.id, event.currentTarget.value as PaymentStatus)}><option value="" disabled>Update payment</option>{paymentOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}</select></label></td><td><div className="admin-row-actions"><button aria-label={`View order ${order.orderNumber}`} title="View order" onClick={() => onViewById(order.id)}><IconEye size={17} /></button></div></td></tr>)}
            {!loading && hasMore && <tr><td colSpan={8}><InfiniteScrollTrigger hasMore={hasMore} onLoadMore={loadMore} /></td></tr>}
            {!loading && !orders.length && <tr><td colSpan={8}><div className="admin-empty-state"><IconTag size={30} /><strong>No orders in this view</strong><p>Choose a different status filter.</p></div></td></tr>}</tbody>
        </table></div>
        <div className="admin-table-footer">Showing <strong>{visibleOrders.length}</strong> of {orders.length} orders</div>
      </div>
    </>
  );
}

function SummaryPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="admin-panel-card order-summary-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const fields = [
    ["Customer", order.customerName], ["Email", order.email], ["Order number", order.orderNumber],
    ["Order ID", order.id], ["Order date", order.date], ["Amount", currency(order.amount)],
    ["Order status", orderStatusLabel(order.status)], ["Payment status", order.paymentStatus.replace(/_/g, " ")],
  ];
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-product-form admin-order-detail-modal" aria-labelledby="admin-order-detail-title">
      <div className="admin-form-heading"><div><span className="admin-eyebrow">ORDER DETAILS</span><h2 id="admin-order-detail-title">{order.orderNumber || order.id}</h2><p>Order information from the admin orders API.</p></div><button type="button" className="admin-modal-close" aria-label="Close order details" onClick={onClose}><IconX /></button></div>
      <dl className="admin-order-detail-grid">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>
      <div className="admin-form-actions"><button type="button" className="admin-primary-button" onClick={onClose}>Done</button></div>
    </section>
  </div>;
}

function StatusBadge({ status }: { status: Order["status"] }) {
  return <span className={`admin-order-status ${status.toLowerCase()}`}><i />{orderStatusLabel(status)}</span>;
}

function ProductForm({
  product,
  onClose,
  onSave,
  saving,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSave: (product: ProductWriteRequest) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryId, setCategoryId] = useState(String(product?.categoryId ?? ""));
  const [brandId, setBrandId] = useState(String(product?.brandId ?? ""));
  const [description, setDescription] = useState(product?.description ?? "");
  const [discountPrice, setDiscountPrice] = useState(product?.discountPrice?.toString() ?? "0");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [price, setPrice] = useState(product?.price.toString() ?? "");
  const [stock, setStock] = useState(product?.stock.toString() ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), getBrands()]).then(([items, brandItems]) => {
      if (!active) return;
      setCategories(items);
      setBrands(brandItems);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!categoryId && categories.length) setCategoryId(String(categories[0].id));
    if (!brandId && brands.length) setBrandId(String(brands[0].id));
  }, [categoryId, brandId, categories, brands]);

  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Choose a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Choose an image smaller than 5 MB.");
      return;
    }
    setImageError("");
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImage(reader.result);
    };
    reader.onerror = () => setImageError("The image could not be loaded. Please try again.");
    reader.readAsDataURL(file);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    onSave({ name, slug, description, sku, categoryId, brandId, price: Number(price), discountPrice: Number(discountPrice), stockQuantity: Number(stock), image: imageFile });
  };

  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="admin-product-form" onSubmit={submit}>
        <div className="admin-form-heading"><div><span className="admin-eyebrow">PRODUCT CATALOG</span><h2>{product ? "Edit product" : "Add a product"}</h2><p>Product details are saved to your catalog.</p></div><button type="button" className="admin-modal-close" aria-label="Close form" onClick={onClose}><IconX /></button></div>
        <div className="admin-form-content">
          <label className="admin-image-upload">
            {image ? <img src={image} alt="Product preview" /> : <span className="upload-placeholder"><IconBox size={26} /><strong>Upload product image</strong><small>PNG, JPG or WEBP · up to 5 MB</small></span>}
            <input type="file" accept="image/*" onChange={selectImage} aria-label="Upload product image" />
            <span className="upload-change">{image ? "Change image" : "Choose image"}</span>
          </label>
          {imageError && <p className="admin-image-error" role="alert">{imageError}</p>}
          <label>Product name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Home inverter 900VA" /></label>
          <label>Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe this product" /></label>
          <div className="admin-form-row"><label>SKU<input required maxLength={40} value={sku} onChange={(event) => setSku(event.target.value)} placeholder="e.g. GS-INV-001" /></label><label>Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
          <label>Brand<select required value={brandId} onChange={(event) => setBrandId(event.target.value)}>{brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div className="admin-form-row"><label>Price (₹)<input required type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="18500" /></label><label>Stock quantity<input required type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="20" /></label></div>
          <label>Discount price (₹)<input type="number" min="0" step="1" value={discountPrice} onChange={(event) => setDiscountPrice(event.target.value)} /></label>
        </div>
        <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onClose} disabled={saving}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving || !categories.length || !brands.length}><IconPlus size={17} />{saving ? "Saving…" : product ? "Save changes" : "Add product"}</button></div>
      </form>
    </div>
  );
}

export default AdminPanel;

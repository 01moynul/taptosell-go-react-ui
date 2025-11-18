// src/types/CoreTypes.ts

/**
 * Interface for the key/value pair of a product variant option (e.g., "Size: Small").
 * Corresponds to Go model ProductVariantOption.
 */
export interface ProductVariantOption {
    name: string;
    value: string;
}

/**
 * Interface for the core marketplace product.
 * This is a minimal representation based on the data needed across the UI.
 * You should expand this to match the full Go product model (models.Product).
 */
export interface Product {
    id: number;
    name: string;
    description: string;
    price: number; // Corresponds to Go's price_to_tts
    isVariable: boolean;
    status: 'draft' | 'pending' | 'published' | 'rejected' | 'private_inventory';
    // Add other fields (SKU, Stock, Categories, etc.) as needed
}

/**
 * Defines the required payload for the POST /v1/products/:id/request-price-change endpoint.
 * Corresponds to Go struct RequestPriceChangeInput.
 */
export interface RequestPriceChangePayload {
    newPrice: number;
    reason?: string;
}

// You can add other global types here (e.g., User, Category, Brand)
/**
 * Defines the required payload for POST /v1/supplier/inventory (Create) 
 * and PUT /v1/supplier/inventory/:id (Update) endpoints.
 * All fields are required for a valid submission.
 */
export interface InventoryPayload {
    name: string;
    description: string;
    price: number;
    sku: string;
    stockQuantity: number;
    weight: number;
    pkgLength: number;
    pkgWidth: number;
    pkgHeight: number;
    categoryName?: string; // Optional if no category is assigned
    brandName?: string;   // Optional if no brand is assigned
    // Status is typically managed on the backend, but we include it for clarity
    status?: 'draft' | 'ready'; 
}
/**
 * Interface for a single item in the Supplier's private inventory.
 * Corresponds to Go model InventoryItem.
 * This item is NOT visible on the public marketplace until promoted.
 */
export interface InventoryItem {
    id: number;
    userId: number; // The supplier who owns it
    name: string;
    description: string;
    price: number; // The supplier's cost/price
    sku: string;
    stockQuantity: number;
    // Dimensions (as added in Phase 4.7)
    weight: number;
    pkgLength: number;
    pkgWidth: number;
    pkgHeight: number;
    // Association to private categories/brands
    categoryName?: string; 
    brandName?: string;
    // Status can be 'draft', 'ready', or 'promoted'
    status: 'draft' | 'ready' | 'promoted';
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
}

/**
 * Interface for the response from GET /v1/supplier/inventory
 */
export interface GetInventoryResponse {
    items: InventoryItem[];
}

/**
 * Interface for a product awaiting Manager approval.
 * This extends the core Product interface with Manager-specific details.
 * Corresponds to the response from GET /v1/manager/products/pending.
 */
export interface PendingProduct extends Product {
    supplierId: number;
    supplierName: string; // Name of the user who submitted the product
    commissionRate: number; // The commission rate applied to this specific product (from the products table)
    // You may add other fields like a list of images or variations here later
}

/**
 * Interface for the rejection payload required by PATCH /v1/manager/products/:id/reject
 */
export interface RejectProductPayload {
    reason: string;
}

/**
 * Interface for a Supplier's withdrawal request awaiting Manager processing.
 * Corresponds to Go model WithdrawalRequest in the Manager API response.
 */
export interface WithdrawalRequest {
    id: number;
    supplierId: number;
    supplierName: string; // Included for Manager view
    amount: number;
    status: 'wd-pending' | 'wd-processed' | 'wd-rejected';
    bankDetails: string; // Bank details provided by the supplier
    requestedAt: string; // ISO Date String
}

/**
 * Interface for the payload required by PATCH /v1/manager/withdrawal-requests/:id
 * This is used to approve or reject a request.
 * Corresponds to Go struct ProcessWithdrawalInput.
 */
export interface ProcessWithdrawalPayload {
    action: 'approve' | 'reject';
    rejectionReason?: string; // Required only if action is 'reject'
}

/**
 * Interface for a Price Appeal/Request awaiting Manager processing.
 * Corresponds to Go model PriceAppeal in the Manager API response.
 * This is created when a supplier changes the price of a PUBLISHED product.
 */
export interface PriceAppeal {
    id: number;
    productId: number;
    productName: string; // Included for Manager view
    supplierId: number;
    supplierName: string; // Included for Manager view
    oldPrice: number;
    newPrice: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string; // ISO Date String
}

/**
 * Interface for the payload required by PATCH /v1/manager/price-requests/:id
 * This is used to approve or reject a price appeal.
 * Corresponds to Go struct ProcessPriceAppealInput.
 */
export interface ProcessPriceAppealPayload {
    action: 'approve' | 'reject';
    rejectionReason?: string; // Required only if action is 'reject'
}

/**
 * Interface for a single platform setting (key/value pair).
 * Corresponds to Go model models.Setting.
 */
export interface Setting {
    key: string;
    value: string;
}

/**
 * Interface for the response from GET /v1/manager/settings.
 * The Go endpoint returns settings as an object map keyed by setting name.
 */
export interface GetSettingsResponse {
    settings: {
        [key: string]: string; // Key is setting name (e.g., 'supplier_registration_key'), value is a string.
    };
}

/**
 * Interface for the payload required by PATCH /v1/manager/settings.
 * Allows updating one or more settings at once.
 * Corresponds to Go struct UpdateSettingsInput.
 */
export interface UpdateSettingsPayload {
    supplier_registration_key?: string;
    default_commission_rate?: string;
    maintenance_mode?: 'true' | 'false'; // Key field for Phase 6.8 backend patch
    // Add other dynamic settings here as they are introduced
}

// ... existing code ...

/**
 * Interface for a Global Product Category (Public Marketplace).
 * Corresponds to Go model models.Category.
 * API: GET /v1/categories
 */
export interface Category {
    id: number;
    name: string;
    parentId?: number; // Optional/Nullable. ID of the parent category.
}

/**
 * Interface for the response from GET /v1/categories
 */
export interface GetCategoriesResponse {
    categories: Category[];
}

/**
 * Payload for creating a new Global Category.
 * API: POST /v1/categories
 */
export interface CreateCategoryPayload {
    name: string;
    parentId?: number; // Optional. 0 or null if it's a root category.
}

/**
 * Interface for a Global Product Brand (Public Marketplace).
 * Corresponds to Go model models.Brand.
 * API: GET /v1/brands
 */
export interface Brand {
    id: number;
    name: string;
    // Add 'icon' or 'logo' fields here if the backend supports them in the future.
}

/**
 * Interface for the response from GET /v1/brands
 */
export interface GetBrandsResponse {
    brands: Brand[];
}

/**
 * Payload for creating a new Global Brand.
 * API: POST /v1/brands
 */
export interface CreateBrandPayload {
    name: string;
}
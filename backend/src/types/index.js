// ========================
// Enum Types (frozen objects)
// ========================
const Role = Object.freeze({
	USER: "USER",
	ADMIN: "ADMIN",
});

const OrderStatus = Object.freeze({
	PENDING: "PENDING",
	CONFIRMED: "CONFIRMED",
	SHIPPING: "SHIPPING",
	DELIVERED: "DELIVERED",
	CANCELLED: "CANCELLED",
});

const PaymentMethod = Object.freeze({
	COD: "COD",
	MOMO: "MOMO",
});

const PaymentStatus = Object.freeze({
	UNPAID: "UNPAID",
	PAID: "PAID",
	REFUNDED: "REFUNDED",
});

const NotificationType = Object.freeze({
	ORDER: "ORDER",
	REVIEW: "REVIEW",
	SYSTEM: "SYSTEM",
	PROMOTION: "PROMOTION",
});

const ImportJobStatus = Object.freeze({
	PENDING: "PENDING",
	PROCESSING: "PROCESSING",
	COMPLETED: "COMPLETED",
	FAILED: "FAILED",
});

module.exports = {
	Role,
	OrderStatus,
	PaymentMethod,
	PaymentStatus,
	NotificationType,
	ImportJobStatus,
};

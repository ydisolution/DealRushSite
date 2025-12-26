// Helper functions for order management

export interface Order {
  id: string;
  participantId: string;
  dealId: string;
  supplierId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingZip: string | null;
  notesFromCustomer: string | null;
  status: string;
  priority?: string | null;
  supplierNotes: string | null;
  internalNotes?: string | null;
  expectedDeliveryDate?: Date | null;
  scheduledDeliveryDate: Date | null;
  outForDeliveryDate: Date | null;
  deliveredDate: Date | null;
  trackingNumber: string | null;
  carrier: string | null;
  shippingMethod: string | null;
  coordinationRequired?: string | null;
  lastContactDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  dealName: string;
  dealImage: string | null;
  quantity: number;
  pricePaid: number;
  initialPrice: number;
  position: number;
  totalAmount: number;
  events?: FulfillmentEvent[];
}

export interface FulfillmentEvent {
  id: string;
  orderId: string;
  type: string;
  message: string;
  createdAt: Date;
  createdBySupplierId: string | null;
}

// Calculate if order is overdue based on expected delivery date
export function isOrderOverdue(order: Order): boolean {
  if (!order.expectedDeliveryDate || order.status === 'delivered' || order.status === 'cancelled') {
    return false;
  }
  return new Date(order.expectedDeliveryDate) < new Date();
}

// Calculate days until expected delivery
export function daysUntilDelivery(order: Order): number | null {
  if (!order.expectedDeliveryDate) return null;
  const today = new Date();
  const expected = new Date(order.expectedDeliveryDate);
  const diff = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

// Get urgency level based on expected delivery
export function getOrderUrgency(order: Order): 'critical' | 'urgent' | 'normal' | null {
  const days = daysUntilDelivery(order);
  if (days === null) return null;
  if (days < 0) return 'critical'; // Overdue
  if (days <= 2) return 'urgent';
  return 'normal';
}

// Calculate SLA status
export function getSLAStatus(order: Order): {
  status: 'on-track' | 'at-risk' | 'breached';
  message: string;
} {
  const days = daysUntilDelivery(order);
  
  if (days === null) {
    return { status: 'on-track', message: 'לא הוגדר תאריך משלוח' };
  }
  
  if (days < 0) {
    return { status: 'breached', message: `באיחור של ${Math.abs(days)} ימים` };
  }
  
  if (days <= 2) {
    return { status: 'at-risk', message: `נשארו ${days} ימים` };
  }
  
  return { status: 'on-track', message: `${days} ימים למשלוח` };
}

// Export orders to CSV
export function exportOrdersToCSV(orders: Order[]): void {
  const headers = [
    'מזהה הזמנה',
    'שם לקוח',
    'אימייל',
    'טלפון',
    'מוצר',
    'כמות',
    'מיקום',
    'סכום',
    'כתובת',
    'עיר',
    'סטטוס',
    'עדיפות',
    'תאריך צפוי',
    'מספר מעקב',
    'חברת משלוח',
    'תאריך יצירה',
  ];

  const rows = orders.map(order => [
    order.id.slice(0, 8),
    order.customerName,
    order.customerEmail || '',
    order.customerPhone || '',
    order.dealName,
    order.quantity,
    order.position,
    order.totalAmount,
    order.shippingAddress || '',
    order.shippingCity || '',
    order.status,
    order.priority || 'normal',
    order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('he-IL') : '',
    order.trackingNumber || '',
    order.carrier || '',
    new Date(order.createdAt).toLocaleDateString('he-IL'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Add BOM for Hebrew support
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Get priority badge config
export function getPriorityConfig(priority?: string | null): {
  color: string;
  bgColor: string;
  label: string;
} {
  const configs: Record<string, { color: string; bgColor: string; label: string }> = {
    urgent: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'דחוף!' },
    high: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'גבוה' },
    normal: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'רגיל' },
    low: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'נמוך' },
  };
  
  return configs[priority || 'normal'] || configs.normal;
}

// Get status badge config
export function getStatusBadge(status: string): {
  color: string;
  label: string;
  bgColor: string;
} {
  const configs: Record<string, { color: string; label: string; bgColor: string }> = {
    pending: { color: 'text-gray-600', label: 'ממתינות', bgColor: 'bg-gray-100' },
    verified: { color: 'text-blue-600', label: 'אומתו', bgColor: 'bg-blue-100' },
    needs_coordination: { color: 'text-yellow-600', label: 'טעון תיאום', bgColor: 'bg-yellow-100' },
    scheduled: { color: 'text-purple-600', label: 'תוזמנו', bgColor: 'bg-purple-100' },
    out_for_delivery: { color: 'text-orange-600', label: 'נשלחו', bgColor: 'bg-orange-100' },
    delivered: { color: 'text-green-600', label: 'נמסרו', bgColor: 'bg-green-100' },
    cancelled: { color: 'text-red-600', label: 'בוטלו', bgColor: 'bg-red-100' },
  };

  return configs[status] || configs.pending;
}

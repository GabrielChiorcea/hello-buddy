/**
 * =============================================================================
 * PAGINA COMENZI ADMIN - CU BULK ACTIONS + CSV EXPORT
 * =============================================================================
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { useAppDispatch, useAppSelector } from '@/store';
import { DataTable, Column } from '@/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Download, Bell, Loader2, Store, CheckSquare } from 'lucide-react';
import { PointsOrderDetails } from '@/plugins/points';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { OrderStatus } from '@/types';
import { Pagination } from '@/types/admin';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface OrderItemConfigOption {
  optionId: number;
  name: string;
  priceDelta: number;
}

interface OrderItemConfigGroup {
  groupId: number;
  groupName: string;
  options: OrderItemConfigOption[];
}

interface OrderItem {
  id: number;
  productId: string | null;
  productName: string;
  productImage?: string;
  quantity: number;
  priceAtOrder: number;
  configuration?: OrderItemConfigGroup[];
  unitPriceWithConfiguration?: number;
}

interface AdminOrder {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  fulfillmentType?: 'delivery' | 'in_location';
  tableNumber?: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes?: string;
  paymentMethod: 'cash' | 'card';
  pointsEarned?: number;
  pointsUsed?: number;
  discountFromPoints?: number;
  createdAt: string;
  estimatedDelivery?: string;
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'În așteptare', variant: 'outline' },
  confirmed: { label: 'Confirmată', variant: 'secondary' },
  preparing: { label: 'În preparare', variant: 'default' },
  delivering: { label: 'În livrare', variant: 'default' },
  delivered: { label: 'Livrată', variant: 'secondary' },
  cancelled: { label: 'Anulată', variant: 'destructive' },
};

/** Export orders to CSV */
function exportOrdersCSV(orders: AdminOrder[]) {
  const headers = ['ID', 'Data', 'Client', 'Email', 'Telefon', 'Adresă', 'Oraș', 'Tip', 'Subtotal', 'Livrare', 'Total', 'Plată', 'Status'];
  const rows = orders.map((o) => [
    o.id,
    format(new Date(o.createdAt), 'dd.MM.yyyy HH:mm'),
    o.userName || '',
    o.userEmail || '',
    o.phone,
    o.deliveryAddress,
    o.deliveryCity,
    o.fulfillmentType === 'in_location' ? 'În locație' : 'Livrare',
    o.subtotal,
    o.deliveryFee,
    o.total,
    o.paymentMethod === 'card' ? 'Card' : 'Numerar',
    statusConfig[o.status]?.label || o.status,
  ]);
  
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `comenzi_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrders() {
  const dispatch = useAppDispatch();
  const { getOrders, updateOrderStatus, updateOrder, getSettings } = useAdminApi();
  const { enabled: pointsEnabled } = usePluginEnabled('points');
  const newOrdersCount = useAppSelector((state) => state.admin.newOrdersCount);
  
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingTableNumber, setEditingTableNumber] = useState<string>('');
  const [hasTables, setHasTables] = useState(true);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const lastOrderCount = useRef<number>(0);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (fulfillmentFilter !== 'all') params.append('fulfillmentType', fulfillmentFilter);
      if (search) params.append('search', search);

      const result = await getOrders(params.toString());
      setOrders(result.orders || []);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      }));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Eroare la încărcarea comenzilor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca comenzile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, fulfillmentFilter, search, getOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    getSettings()
      .then((data: any) => {
        const map = data?.settings ?? data;
        const val = map?.has_tables?.value ?? 'true';
        setHasTables(val === 'true');
      })
      .catch(() => setHasTables(true));
  }, [getSettings]);

  useEffect(() => {
    if (selectedOrder) {
      setEditingTableNumber(selectedOrder.tableNumber ?? '');
    }
  }, [selectedOrder?.id]);

  // New orders notification with persistent banner
  useEffect(() => {
    if (lastOrderCount.current === 0) {
      lastOrderCount.current = newOrdersCount;
      return;
    }

    if (newOrdersCount > lastOrderCount.current) {
      toast({
        title: '🔔 Comandă nouă!',
        description: `Ai ${newOrdersCount} ${newOrdersCount === 1 ? 'comandă nouă' : 'comenzi noi'} în așteptare`,
      });
      
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
      
      if (statusFilter === 'pending' || statusFilter === 'all') {
        fetchOrders();
      }
    }
    
    lastOrderCount.current = newOrdersCount;
  }, [newOrdersCount, statusFilter, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast({
        title: 'Succes',
        description: `Status actualizat la "${statusConfig[newStatus].label}"`,
      });
      if (statusFilter === 'pending' || statusFilter === 'all') {
        fetchOrders();
      }
    } catch (error) {
      console.error('Eroare la actualizarea statusului:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la actualizarea statusului',
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Bulk status change
  const handleBulkStatusChange = async (newStatus: OrderStatus) => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await updateOrderStatus(id, newStatus);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    toast({
      title: 'Bulk update',
      description: `${successCount} actualizate, ${errorCount} erori`,
    });
    
    setSelectedIds(new Set());
    setIsBulkUpdating(false);
    fetchOrders();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const columns: Column<AdminOrder>[] = [
    {
      key: 'select',
      header: () => (
        <Checkbox
          checked={orders.length > 0 && selectedIds.size === orders.length}
          onCheckedChange={toggleSelectAll}
        />
      ),
      className: 'w-10',
      cell: (order) => (
        <Checkbox
          checked={selectedIds.has(order.id)}
          onCheckedChange={() => toggleSelect(order.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'id',
      header: 'ID Comandă',
      cell: (order) => (
        <span className="font-mono text-sm font-medium">{order.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      cell: (order) => (
        <div className="text-sm">
          <p>{format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ro })}</p>
          <p className="text-muted-foreground">
            {format(new Date(order.createdAt), 'HH:mm')}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Client',
      cell: (order) => (
        <div className="text-sm">
          <p className="font-medium">{order.userName || 'Client'}</p>
          <p className="text-muted-foreground">{order.phone}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      cell: (order) => (
        order.fulfillmentType === 'in_location' ? (
          <Badge variant="secondary" className="gap-1">
            <Store className="h-3 w-3" />
            În locație
          </Badge>
        ) : (
          <Badge variant="outline">Livrare</Badge>
        )
      ),
    },
    {
      key: 'address',
      header: 'Adresă / Locație',
      cell: (order) => (
        <div className="max-w-xs">
          <p className="truncate text-sm">{order.deliveryAddress}</p>
          <p className="text-xs text-muted-foreground">{order.deliveryCity}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      cell: (order) => (
        <span className="font-semibold">{order.total} RON</span>
      ),
    },
    {
      key: 'payment',
      header: 'Plată',
      cell: (order) => (
        <Badge variant="outline">
          {order.paymentMethod === 'card' ? 'Card' : 'Numerar'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (order) => (
        <Select
          value={order.status}
          onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
          disabled={updatingOrderId === order.id}
        >
          <SelectTrigger className="h-8 w-[140px]">
            {updatingOrderId === order.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Badge variant={statusConfig[order.status].variant}>
                {statusConfig[order.status].label}
              </Badge>
            )}
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (order) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSelectedOrder(order)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Persistent new orders alert */}
      {newOrdersCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-primary/5 p-4 animate-pulse">
          <Bell className="h-5 w-5 text-primary" />
          <p className="font-medium text-primary">
            {newOrdersCount} {newOrdersCount === 1 ? 'comandă nouă' : 'comenzi noi'} în așteptare!
          </p>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              setStatusFilter('pending');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            Vezi comenzile
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comenzi</h1>
          <p className="text-muted-foreground">
            Vizualizează și gestionează comenzile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportOrdersCSV(orders)}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedIds.size} selectate</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Schimbă status:</span>
            {(['confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
              <Button
                key={status}
                size="sm"
                variant="outline"
                disabled={isBulkUpdating}
                onClick={() => handleBulkStatusChange(status)}
              >
                {isBulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : statusConfig[status].label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrează după status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate comenzile</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tip livrare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="delivery">Livrare</SelectItem>
            <SelectItem value="in_location">În locație</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        searchPlaceholder="Caută după ID sau adresă..."
        searchValue={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) =>
          setPagination((prev) => ({ ...prev, limit, page: 1 }))
        }
        emptyMessage="Nu există comenzi"
      />

      {/* Dialog detalii comandă */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
          else if (selectedOrder) setEditingTableNumber(selectedOrder.tableNumber ?? '');
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalii comandă</DialogTitle>
            <DialogDescription>
              Plasată pe {selectedOrder && format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Info client */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 font-medium">Informații client</h4>
                <p className="text-sm">{selectedOrder.userName || 'Client'}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.userEmail}</p>
                <p className="text-sm">Tel: {selectedOrder.phone}</p>
              </div>

              {/* Info livrare / În locație */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 font-medium">
                  {selectedOrder.fulfillmentType === 'in_location' ? 'În locație' : 'Adresă livrare'}
                </h4>
                {selectedOrder.fulfillmentType === 'in_location' ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      Comandă ridicată în locație. Duce comanda la masa indicată de client.
                    </p>
                    <div className="rounded-md bg-muted/60 p-3">
                      <p className="text-sm font-medium text-muted-foreground">Masa la care duce comanda:</p>
                      <p className="text-lg font-semibold mt-1">
                        {selectedOrder.tableNumber ? `Masa ${selectedOrder.tableNumber}` : '— (clientul nu a indicat masa)'}
                      </p>
                    </div>
                    {hasTables && (
                      <div className="flex items-center gap-2 pt-1">
                        <Label htmlFor="tableNumber" className="text-sm shrink-0">Corectare număr masă:</Label>
                        <Input
                          id="tableNumber"
                          className="max-w-[100px]"
                          placeholder="Ex: 5"
                          value={editingTableNumber}
                          onChange={(e) => setEditingTableNumber(e.target.value)}
                          onBlur={async () => {
                            const value = editingTableNumber.trim() || null;
                            if (value !== (selectedOrder.tableNumber ?? '')) {
                              try {
                                await updateOrder(selectedOrder.id, { tableNumber: value });
                                setSelectedOrder((prev) => prev ? { ...prev, tableNumber: value } : null);
                                toast({ title: 'Număr masă actualizat' });
                              } catch {
                                toast({
                                  title: 'Eroare',
                                  description: 'Nu s-a putut actualiza numărul mesei',
                                  variant: 'destructive',
                                });
                              }
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">(opțional, dacă clientul s-a înșelat)</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{selectedOrder.deliveryAddress}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.deliveryCity}</p>
                  </>
                )}
                {selectedOrder.notes && (
                  <p className="mt-2 text-sm italic">
                    Note: {selectedOrder.notes}
                  </p>
                )}
              </div>

              {/* Produse */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 font-medium">Produse</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => {
                    const unitPrice = item.unitPriceWithConfiguration ?? item.priceAtOrder;
                    return (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between">
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span>{(unitPrice * item.quantity).toFixed(2)} RON</span>
                        </div>
                        {item.configuration && item.configuration.length > 0 && (
                          <p className="text-xs text-muted-foreground ml-4 mt-0.5">
                            {item.configuration.map((g: OrderItemConfigGroup) =>
                              `${g.groupName}: ${g.options.map((o: OrderItemConfigOption) =>
                                o.priceDelta ? `${o.name} (+${o.priceDelta.toFixed(2)})` : o.name
                              ).join(', ')}`
                            ).join(' · ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-lg border border-border p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{selectedOrder.subtotal} RON</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livrare</span>
                    <span>{selectedOrder.deliveryFee} RON</span>
                  </div>
                  {pointsEnabled && <PointsOrderDetails order={selectedOrder} currency="RON" />}
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <span>Total</span>
                    <span>{selectedOrder.total} RON</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status curent:</span>
                <Badge variant={statusConfig[selectedOrder.status].variant}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>

              {/* Plată */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Metodă plată:</span>
                <Badge variant="outline">
                  {selectedOrder.paymentMethod === 'card' ? 'Card' : 'Numerar'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
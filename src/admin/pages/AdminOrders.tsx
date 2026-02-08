/**
 * =============================================================================
 * PAGINA COMENZI ADMIN - INTEGRAT CU BACKEND + POLLING
 * =============================================================================
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { useAppDispatch, useAppSelector } from '@/store';
import { DataTable, Column } from '@/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Eye, Download, Bell, Loader2 } from 'lucide-react';
import { PointsOrderDetails } from '@/plugins/points';
import { OrderStatus } from '@/types';
import { Pagination } from '@/types/admin';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  id: number;
  productId: string | null;
  productName: string;
  productImage?: string;
  quantity: number;
  priceAtOrder: number;
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

export default function AdminOrders() {
  const dispatch = useAppDispatch();
  const { getOrders, updateOrderStatus } = useAdminApi();
  const newOrdersCount = useAppSelector((state) => state.admin.newOrdersCount);
  
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Ref pentru a urmări schimbările în numărul de comenzi noi (pentru notificări)
  const lastOrderCount = useRef<number>(0);

  // Fetch comenzi
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const result = await getOrders(params.toString());
      setOrders(result.orders || []);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      }));
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
  }, [pagination.page, pagination.limit, statusFilter, search, getOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Notificări și refresh când se schimbă numărul de comenzi noi (din Redux)
  useEffect(() => {
    // Ignoră prima încărcare (când lastOrderCount este 0)
    if (lastOrderCount.current === 0) {
      lastOrderCount.current = newOrdersCount;
      return;
    }

    // Notificare dacă sunt comenzi noi
    if (newOrdersCount > lastOrderCount.current) {
      toast({
        title: '🔔 Comandă nouă!',
        description: `Ai ${newOrdersCount} ${newOrdersCount === 1 ? 'comandă nouă' : 'comenzi noi'} în așteptare`,
      });
      
      // Play notification sound (opțional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
      
      // Refresh lista dacă suntem pe pagina cu pending
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
      
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      
      toast({
        title: 'Succes',
        description: `Status actualizat la "${statusConfig[newStatus].label}"`,
      });

      // Refresh lista dacă este necesar (polling-ul global va actualiza newOrdersCount)
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

  const columns: Column<AdminOrder>[] = [
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
      key: 'address',
      header: 'Adresă livrare',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comenzi</h1>
          <p className="text-muted-foreground">
            Vizualizează și gestionează comenzile
          </p>
        </div>
        <div className="flex items-center gap-4">
          {newOrdersCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground">
              <Bell className="h-4 w-4" />
              <span className="font-medium">{newOrdersCount} în așteptare</span>
            </div>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

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
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
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

              {/* Info livrare */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 font-medium">Adresă livrare</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.deliveryAddress}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.deliveryCity}
                </p>
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
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span>{(item.priceAtOrder * item.quantity).toFixed(2)} RON</span>
                    </div>
                  ))}
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
                  <PointsOrderDetails order={selectedOrder} currency="RON" />
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

import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Orders = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const { data: orders, isLoading } = useQuery({
        queryKey: ["orders", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            *,
            products (
              title,
              image_url
            )
          )
        `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!user) {
        navigate("/auth");
        return null;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
            case "paid":
                return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
            case "shipped":
                return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
            case "completed":
                return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
            case "cancelled":
                return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
            default:
                return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending":
                return "Menunggu Pesanan";
            case "paid":
                return "Dibayar";
            case "shipped":
                return "Sedang Diantar";
            case "completed":
                return "Selesai";
            case "cancelled":
                return "Dibatalkan";
            default:
                return status;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Pesanan Saya</h1>
                </div>

                {!orders || orders.length === 0 ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <div className="flex justify-center mb-4">
                                <Package className="h-16 w-16 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Belum ada pesanan</h3>
                            <p className="text-muted-foreground mb-6">
                                Anda belum pernah melakukan pemesanan apapun.
                            </p>
                            <Button onClick={() => navigate("/")}>Mulai Belanja</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{format(new Date(order.created_at), "d MMMM yyyy, HH:mm", { locale: id })}</span>
                                            <span>•</span>
                                            <span>ID: {order.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className={getStatusColor(order.status)}>
                                        {getStatusLabel(order.status)}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        {order.order_items.map((item: any) => (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                                                    {item.products?.image_url ? (
                                                        <img
                                                            src={item.products.image_url}
                                                            alt={item.products.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                                            No Img
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-1 flex-col justify-between">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <h4 className="font-medium">{item.products?.title || "Produk dihapus"}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {item.quantity} x Rp {item.price.toLocaleString("id-ID")}
                                                            </p>
                                                        </div>
                                                        <div className="text-right sm:text-right">
                                                            <p className="font-medium">
                                                                Rp {(item.quantity * item.price).toLocaleString("id-ID")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                                                <p className="text-xs text-muted-foreground">(Termasuk biaya layanan)</p>
                                            </div>
                                            <p className="text-xl font-bold text-primary">
                                                Rp {order.total_amount.toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;

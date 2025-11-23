import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Banknote, QrCode, Wallet } from "lucide-react";

const Checkout = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        paymentMethod: "bca",
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    // Fetch cart items
    const { data: cartItems } = useQuery({
        queryKey: ["cart", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("cart_items")
                .select(`
          *,
          products (*)
        `)
                .eq("user_id", user.id);

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const totalPrice = cartItems?.reduce((sum, item) => {
        return sum + (item.products?.price || 0) * item.quantity;
    }, 0) || 0;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePaymentMethodChange = (value: string) => {
        setFormData((prev) => ({ ...prev, paymentMethod: value }));
    };

    const handleCheckout = async () => {
        if (!formData.fullName || !formData.phone || !formData.email || !formData.address) {
            toast.error("Mohon lengkapi informasi pengiriman");
            return;
        }

        setIsLoading(true);

        try {
            // Simulate processing delay
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Clear cart
            if (user) {
                const { error } = await supabase
                    .from("cart_items")
                    .delete()
                    .eq("user_id", user.id);

                if (error) throw error;

                queryClient.invalidateQueries({ queryKey: ["cart"] });
                queryClient.invalidateQueries({ queryKey: ["cart-count"] });
            }

            setIsSuccess(true);
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("Gagal memproses pesanan");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background relative">
            <Navbar />

            {/* Success Modal Overlay */}
            {isSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md mx-4 scale-100 animate-in zoom-in-95 duration-300">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Pesanan Berhasil!</h2>
                            <p className="text-muted-foreground mb-6">
                                Terima kasih telah berbelanja. Pesanan Anda sedang diproses oleh penjual.
                            </p>
                            <Button
                                className="w-full"
                                onClick={() => navigate("/")}
                            >
                                Kembali ke Beranda
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-primary">📍</span> Informasi Pengiriman
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Nama Lengkap *</Label>
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            placeholder="Nama penerima"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Nomor Telepon *</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="08xx-xxxx-xxxx"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Alamat Lengkap *</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Masukkan alamat lengkap termasuk nama jalan, nomor rumah, RT/RW"
                                        className="min-h-[100px]"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        placeholder="Tambahkan catatan untuk kurir atau penjual"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-primary">💳</span> Metode Pembayaran
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={formData.paymentMethod}
                                    onValueChange={handlePaymentMethodChange}
                                    className="space-y-3"
                                >
                                    <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'bca' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                        <RadioGroupItem value="bca" id="bca" />
                                        <Label htmlFor="bca" className="flex-1 flex items-center gap-3 cursor-pointer">
                                            <Banknote className="w-5 h-5 text-blue-600" />
                                            <span>BCA Virtual Account</span>
                                        </Label>
                                    </div>

                                    <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'mandiri' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                        <RadioGroupItem value="mandiri" id="mandiri" />
                                        <Label htmlFor="mandiri" className="flex-1 flex items-center gap-3 cursor-pointer">
                                            <Banknote className="w-5 h-5 text-yellow-600" />
                                            <span>Mandiri Virtual Account</span>
                                        </Label>
                                    </div>

                                    <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                        <RadioGroupItem value="cod" id="cod" />
                                        <Label htmlFor="cod" className="flex-1 flex items-center gap-3 cursor-pointer">
                                            <Wallet className="w-5 h-5 text-green-600" />
                                            <span>COD (Bayar di Tempat)</span>
                                        </Label>
                                    </div>

                                    <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'qris' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                        <RadioGroupItem value="qris" id="qris" />
                                        <Label htmlFor="qris" className="flex-1 flex items-center gap-3 cursor-pointer">
                                            <QrCode className="w-5 h-5" />
                                            <span>QRIS</span>
                                        </Label>
                                    </div>

                                    <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'dana' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                        <RadioGroupItem value="dana" id="dana" />
                                        <Label htmlFor="dana" className="flex-1 flex items-center gap-3 cursor-pointer">
                                            <CreditCard className="w-5 h-5 text-blue-400" />
                                            <span>DANA</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div>
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Ringkasan Pesanan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                                    {cartItems?.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                                {item.products?.image_url ? (
                                                    <img
                                                        src={item.products.image_url}
                                                        alt={item.products.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{item.products?.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.products?.category}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                                                    <span className="text-sm font-semibold">Rp {item.products?.price?.toLocaleString("id-ID")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal ({cartItems?.length} produk)</span>
                                        <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Biaya Layanan</span>
                                        <span>Rp 1.000</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>Total</span>
                                        <span className="text-primary">Rp {(totalPrice + 1000).toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleCheckout}
                                    disabled={isLoading || !cartItems?.length}
                                >
                                    {isLoading ? "Memproses..." : "Bayar Sekarang"}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                    <span className="text-green-600">🔒</span> Transaksi Anda aman dan terenkripsi
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

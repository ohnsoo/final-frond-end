import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingCart, User, ArrowLeft, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const { data: product, isLoading } = useQuery({
        queryKey: ["product", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("products")
                .select(`
          *,
          profiles:seller_id (
            full_name,
            username,
            avatar_url,
            phone
          )
        `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // Check if product is in wishlist
    useEffect(() => {
        const checkWishlist = async () => {
            if (!user || !id) return;
            const { data } = await supabase
                .from("wishlist")
                .select("*")
                .eq("user_id", user.id)
                .eq("product_id", id)
                .single();

            setIsWishlisted(!!data);
        };

        checkWishlist();
    }, [user, id]);

    const handleWishlist = async () => {
        if (!user) {
            toast.error("Silakan login terlebih dahulu");
            navigate("/auth");
            return;
        }

        setActionLoading(true);
        try {
            if (isWishlisted) {
                const { error } = await supabase
                    .from("wishlist")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("product_id", id);

                if (error) throw error;
                setIsWishlisted(false);
                toast.success("Dihapus dari wishlist");
            } else {
                const { error } = await supabase
                    .from("wishlist")
                    .insert({ user_id: user.id, product_id: id });

                if (error) throw error;
                setIsWishlisted(true);
                toast.success("Ditambahkan ke wishlist");
            }
            queryClient.invalidateQueries({ queryKey: ["wishlist-count"] });
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            toast.error("Silakan login terlebih dahulu");
            navigate("/auth");
            return;
        }

        if (product?.seller_id === user.id) {
            toast.error("Anda tidak dapat membeli produk sendiri");
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase.from("cart_items").upsert(
                { user_id: user.id, product_id: id, quantity: 1 },
                { onConflict: "user_id,product_id" }
            );

            if (error) throw error;
            toast.success("Ditambahkan ke keranjang");
            queryClient.invalidateQueries({ queryKey: ["cart-count"] });
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setActionLoading(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link produk disalin!");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Skeleton className="aspect-square rounded-xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">Produk tidak ditemukan</h2>
                    <Button onClick={() => navigate("/")}>Kembali ke Beranda</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Product Image */}
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-xl border bg-muted relative group">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    No Image
                                </div>
                            )}
                            {product.is_sold && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Badge className="text-xl px-6 py-2 bg-destructive">TERJUAL</Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-start">
                                <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                                <Button variant="ghost" size="icon" onClick={handleShare}>
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className="text-sm">
                                    {product.condition === "new" ? "Baru" : "Bekas"}
                                </Badge>
                                <Badge variant="secondary" className="text-sm">
                                    {product.category}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Stok: {product.stock}
                                </span>
                            </div>
                            <p className="text-4xl font-bold text-primary">
                                Rp {product.price.toLocaleString("id-ID")}
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Deskripsi</h3>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        <Separator />

                        {/* Seller Info */}
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                    {product.profiles?.avatar_url ? (
                                        <img src={product.profiles.avatar_url} alt={product.profiles.username} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-6 w-6 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{product.profiles?.full_name || product.profiles?.username || "Penjual"}</p>
                                    <p className="text-sm text-muted-foreground">Penjual</p>
                                </div>
                                {/* Placeholder for Chat Feature */}
                                <Button variant="outline" size="sm" onClick={() => toast.info("Fitur chat akan segera hadir!")}>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Chat
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={handleWishlist}
                                disabled={actionLoading}
                            >
                                <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                                {isWishlisted ? "Disimpan" : "Wishlist"}
                            </Button>
                            <Button
                                size="lg"
                                className="flex-[2]"
                                onClick={handleAddToCart}
                                disabled={actionLoading || product.is_sold || product.seller_id === user?.id}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {product.is_sold ? "Barang Terjual" : "Tambah ke Keranjang"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;

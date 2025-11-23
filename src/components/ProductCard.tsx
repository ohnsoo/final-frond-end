import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  condition: string;
  category: string;
  is_sold?: boolean;
  isInWishlist?: boolean;
}

export const ProductCard = ({
  id,
  title,
  price,
  image_url,
  condition,
  category,
  is_sold,
  isInWishlist = false,
}: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth");
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth");
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative aspect-square overflow-hidden bg-muted" onClick={() => navigate(`/product/${id}`)}>
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        {is_sold && (
          <Badge className="absolute top-2 right-2 bg-destructive">
            Terjual
          </Badge>
        )}
        <Button
          size="icon"
          variant={isWishlisted ? "default" : "secondary"}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleWishlist}
          disabled={loading}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </Button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
          <Badge variant="outline" className="text-xs shrink-0">
            {condition === "new" ? "Baru" : "Bekas"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{category}</p>
        <p className="text-lg font-bold text-primary">
          Rp {price.toLocaleString("id-ID")}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="sm"
          onClick={handleAddToCart}
          disabled={loading || is_sold}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {is_sold ? "Terjual" : "Tambah ke Keranjang"}
        </Button>
      </CardFooter>
    </Card>
  );
};

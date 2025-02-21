import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "lucide-react";

interface ImageDisplayProps {
  imageUrl: string;
  alt: string;
}

export function ImageDisplay({ imageUrl, alt }: ImageDisplayProps) {
  console.log('Rendering image with URL:', imageUrl); // Add logging

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader className="flex flex-row items-center gap-2">
        <Image className="h-5 w-5" />
        <CardTitle className="text-lg">Imagem Gerada</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-64">
          <img
            src={imageUrl}
            alt={alt}
            className="rounded-md object-contain w-full h-full"
            onError={(e) => {
              console.error('Error loading image:', imageUrl);
              e.currentTarget.src = "https://cdn.jsdelivr.net/npm/boxicons@2.1.4/svg/regular/bx-image.svg";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
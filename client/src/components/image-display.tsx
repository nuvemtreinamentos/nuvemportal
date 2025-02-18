import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "lucide-react";

interface ImageDisplayProps {
  imageUrl: string;
  alt: string;
}

export function ImageDisplay({ imageUrl, alt }: ImageDisplayProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader className="flex flex-row items-center gap-2">
        <Image className="h-5 w-5" />
        <CardTitle className="text-lg">Generated Image</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-square">
          <img
            src={imageUrl}
            alt={alt}
            className="rounded-md object-cover w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}

import { Image, useImage } from "expo-image";

export default function DynamicImage({ source }: any) {
  const image = useImage(source);

  // Calculate aspect ratio once loaded
  const aspectRatio = image ? image.width / image.height : 1;

  return (
    <Image
      source={source}
      style={{ width: "100%", aspectRatio }}
      contentFit="contain"
    />
  );
}

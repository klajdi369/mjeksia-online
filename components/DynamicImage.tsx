import { Image, ImageSource } from "expo-image";

export default function DynamicImage({ source }: { source: ImageSource }) {
  return (
    <Image
      source={source}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 2,
      }}
      contentFit="contain"
    />
  );
}

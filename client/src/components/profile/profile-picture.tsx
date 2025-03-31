import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface ProfilePictureProps {
  src: string | null;
  alt: string;
  onFileSelect: (file: File) => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProfilePicture = ({
  src,
  alt,
  onFileSelect,
  editable = true,
  size = "md",
}: ProfilePictureProps) => {
  const [previewSrc, setPreviewSrc] = useState<string | null>(src);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass the file to the parent component
    onFileSelect(file);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const buttonSizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses[size]} object-cover`}>
        <AvatarImage src={previewSrc || ""} alt={alt} />
        <AvatarFallback>{getInitials(alt)}</AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={(input) => (fileInputRef[1] = input)}
          />
          <Button
            variant="secondary"
            size="icon"
            className={`absolute bottom-0 right-0 ${buttonSizeClasses[size]} rounded-full shadow-md hover:bg-blue-600 transition-colors duration-200`}
            onClick={() => fileInputRef[1]?.click()}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default ProfilePicture;

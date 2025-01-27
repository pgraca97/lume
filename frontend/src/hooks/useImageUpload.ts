import { useMutation } from "@apollo/client";
import { GET_UPLOAD_URL } from "../graphql/operations/review";

export const useImageUpload = () => {
  const [getUploadUrl] = useMutation(GET_UPLOAD_URL);

  const uploadImage = async (fileUri: string) => {
    try {
      console.log("File URI:", fileUri);

      // Step 1: Create a Blob or File from the URI
      const response = await fetch(fileUri);
      const blob = await response.blob();
      console.log("Blob:", blob);

      const fileName = fileUri.split("/").pop(); // Extract file name from URI
      const contentType = blob.type; // Use the Blob type as content type
      const fileSize = blob.size; // Get file size from the Blob

      console.log("File Name:", fileName);
      console.log("Content Type:", contentType);
      console.log("File Size:", fileSize);

      // Step 2: Get the upload URL
      const { data } = await getUploadUrl({
        variables: {
          input: {
            filename: fileName,
            contentType,
            size: fileSize,
          },
        },
      });

      console.log("Upload URL Response:", data);

      const uploadUrl = data?.getCookSnapUploadUrl?.uploadUrl;
      const blobPath = data?.getCookSnapUploadUrl?.blobPath;

      if (!uploadUrl || !blobPath) {
        throw new Error("Failed to get upload URL or blobPath");
      }

      // Step 3: Upload the file to Azure Blob Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": contentType,
        },
        body: blob,
      });

      console.log("Upload Response:", uploadResponse);

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to Azure Blob Storage");
      }

      // Step 4: Return the blobPath
      return blobPath;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  return { uploadImage };
};

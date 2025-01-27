import { tokens } from "@/src/theme/tokens";
import { Link, router } from "expo-router";
import {
  View,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import { Checkbox } from "react-native-paper";

import {
  BookMarked,
  BookmarkPlus,
  Pen,
  Pencil,
  PencilLine,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useUser } from "@/src/hooks/useUser";
import CustomRating from "@/src/components/form/Rating";
import { useImageUpload } from "@/src/hooks/useImageUpload";
import { useMutation } from "@apollo/client";
import {
  UPDATE_REVIEW,
  UPDATE_REVIEW_SNAPS,
  GET_UPLOAD_URL,
  DELETE_REVIEW,
} from "@/src/graphql/operations/review";

import ImagePicker from "react-native-image-crop-picker";

import { Platform, PermissionsAndroid } from "react-native";

import FastImage from "react-native-fast-image";

async function requestCameraAndStoragePermissions() {
  if (Platform.OS === "android") {
    try {
      const androidVersion = Platform.Version;

      let granted;
      if (androidVersion >= 33) {
        // For Android 13+ (API level 33+), request the new permission model
        granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      } else {
        // For older versions, request legacy permissions
        granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      }

      console.log(granted); // Log the permission results for debugging

      // Check if the camera permission is granted or denied with 'never_ask_again'
      if (
        granted["android.permission.CAMERA"] === "granted" ||
        granted["android.permission.READ_EXTERNAL_STORAGE"] === "granted"
      ) {
        return true;
      } else if (granted["android.permission.CAMERA"] === "never_ask_again") {
        // If the user has denied the permission with "Don't ask again"
        alert(
          "Camera permission is required. Please enable it in the app settings."
        );
        Linking.openSettings(); // Open the app settings
        return false;
      } else {
        alert("Permissions not granted. Please enable them in settings.");
        Linking.openSettings(); // Open app settings for the user to manually enable permissions
        return false;
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  }
  return true; // iOS permissions handled differently
}

interface ReviewProps {
  userId?: string;
  reviewId: string;
  name: string;
  comment?: string;
  rating?: number;
  images?: string[]; // Updated to array of images
  imagesBlobs?: string[];
  onUpdate: () => void;
}

export default function MyReviewItem(props: ReviewProps) {
  const { user, loading, error, refreshUser } = useUser();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false);

  const [rating, setRating] = useState<number>(props.rating || 0); // Initialize with review's rating
  const [selectedImages, setSelectedImages] = useState<string[]>(
    props.images || []
  );

  const [newImages, setNewImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedImageBlobs, setRemovedImageBlobs] = useState<string[]>([]);

  const [reviewText, setReviewText] = useState(props.comment || ""); // Initialize with review's comment

  const { uploadImage } = useImageUpload();
  const [updateReview] = useMutation(UPDATE_REVIEW);
  const [updateReviewSnaps] = useMutation(UPDATE_REVIEW_SNAPS);
  const [getUploadUrl] = useMutation(GET_UPLOAD_URL);
  const [deleteReview] = useMutation(DELETE_REVIEW);

  const handleRatingChange = (newRating) => {
    const roundedValue = Math.round(newRating * 2) / 2; // Round to nearest 0.5
    setRating(roundedValue);
  };

  const handleImageUpload = async () => {
    const hasPermission = await requestCameraAndStoragePermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const images = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: 8 - selectedImages.length,
        mediaType: "photo",
        compressImageQuality: 0.8,
      });

      const selectedUris = images.map((image) => image.path);
      setSelectedImages([...selectedImages, ...selectedUris]);
      setNewImages([...newImages, ...selectedUris]);
    } catch (error) {
      if (error.code !== "E_PICKER_CANCELLED") {
        console.error("ImagePicker Error: ", error);
      }
    }
  };

  const handleRemoveImage = (uriToRemove) => {
    if (props.images?.includes(uriToRemove)) {
      setRemovedImages((prev) => [...prev, uriToRemove]);

      const removedBlob =
        props.imagesBlobs?.[props.images.indexOf(uriToRemove)];
      if (removedBlob) {
        setRemovedImageBlobs((prev) => [...prev, removedBlob]);
      }
    }

    setSelectedImages((prev) => prev.filter((uri) => uri !== uriToRemove));
    setNewImages((prev) => prev.filter((uri) => uri !== uriToRemove));

    if (selectedImages.length === 1) {
      setSelectedImages([]);
    }
  };

  const handleReviewUpdate = async () => {
    try {
      const uploadedImageUrls = [];
      for (const image of newImages) {
        const blobPath = await uploadImage(image);
        if (blobPath) {
          uploadedImageUrls.push(blobPath);
        } else {
          throw new Error("Image upload failed");
        }
      }

      await updateReview({
        variables: {
          reviewId: props.reviewId,
          rating,
          comment: reviewText,
        },
      });

      if (newImages.length || removedImages.length) {
        await updateReviewSnaps({
          variables: {
            input: {
              reviewId: props.reviewId,
              imagesToAdd: uploadedImageUrls,
              imagesToRemove: removedImageBlobs,
            },
          },
        });
      }

      setModalVisible(false);

      props.onUpdate();

      router.back();

      alert("Review updated successfully");
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review. Please try again.");
    }
  };

  const handleEditClick = () => {
    setModalVisible(true);
  };

  const handleDeleteReview = async () => {
    try {
      await deleteReview({
        variables: {
          reviewId: props.reviewId,
        },
      });

      setModalDeleteVisible(false);
      props.onUpdate();
      console.log("Review deleted successfully");
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const handleDeleteClick = () => {
    setModalDeleteVisible(true);
  };

  return (
    <View style={styles.container}>
      <View>
        <Image
          source={require("../../../assets/images/tipsAvatar.png")}
          style={styles.avatar}
        />
      </View>
      <View>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{props.name}</Text>
          {props.userId === user?.id && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={handleEditClick}>
                <PencilLine size={25} color={tokens.colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteClick}>
                <Trash2 size={25} color={tokens.colors.text.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{props.rating}</Text>
          <Image
            source={require("../../../assets/images/rating.png")}
            style={styles.ratingImage}
          />
        </View>
        <Text style={styles.comment}>{props.comment}</Text>
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            style={{ flexDirection: "row", gap: 5, maxWidth: 200 }}
          >
            {props.images?.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image, cache: "reload" }}
                style={styles.image}
                onError={(error) =>
                  console.error(
                    `Error loading image at index ${index}:`,
                    error.nativeEvent.error
                  )
                }
              />
            ))}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={modalDeleteVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Are you sure you want to delete this review?
            </Text>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setModalDeleteVisible(!modalDeleteVisible)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rateButton}
                onPress={handleDeleteReview}
              >
                <Text style={styles.rateText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>How fire was the recipe ?</Text>
            <CustomRating rating={rating} onRatingChange={handleRatingChange} />
            <TextInput
              placeholder="Leave a comment..."
              style={styles.commentInput}
              onChangeText={setReviewText}
              value={reviewText}
            />
            {/* Display the selected image */}
            <ScrollView horizontal style={styles.allImages}>
              {selectedImages.map((uri) => (
                <View key={uri} style={styles.imageReviewContainer}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => {
                      handleRemoveImage(uri);
                    }}
                  >
                    <X size={24} color={tokens.colors.primary[200]} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleImageUpload}
            >
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                marginLeft: 80,
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rateButton,
                  selectedImages.length > 8 && styles.disabledButton,
                ]}
                onPress={handleReviewUpdate}
                disabled={selectedImages.length > 8}
              >
                <Text style={styles.rateText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.primary[50],
    borderRadius: 8, // Adds rounded corners
    padding: 10,
    width: Dimensions.get("window").width - 20, // Parent will handle layout width
    alignContent: "center",
    elevation: 2, // For Android shadow
    flexDirection: "row",
    paddingBottom: 20,
    marginBottom: 30,
  },
  avatar: {
    width: 50,
    height: 50,
    marginTop: 10,
  },
  name: {
    fontSize: tokens.fontSize.xxl,
    marginLeft: 20,
    fontWeight: tokens.fontWeight.normal,
  },
  comment: {
    fontSize: tokens.fontSize.md,
    width: Dimensions.get("window").width - 80,
    marginLeft: 20,
    marginTop: 5,
    paddingRight: 40,
  },
  rating: {
    fontSize: tokens.fontSize.xl,
    marginLeft: 20,
    fontWeight: tokens.fontWeight.medium,
  },
  ratingImage: {
    width: 20,
    height: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  imageContainer: {
    flexDirection: "row", // Ensures images are side by side
    marginTop: 20,
    marginLeft: 20,
  },
  image: {
    width: 60,
    height: 60,
    marginRight: 10, // Adds spacing between images
    borderRadius: tokens.borderRadius.lg,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actions: {
    flexDirection: "row",
    gap: 15,
    marginRight: 30,
  },
  delete: {
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.primary[500],
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.07)",
  },
  modalView: {
    backgroundColor: tokens.colors.background.primary,
    width: "80%",
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadius.md,
    padding: 20,
  },
  modalText: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    textAlign: "center",

    padding: 10,
  },
  closeModalButton: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[100],
    borderWidth: 2,
    borderRadius: tokens.borderRadius.full,
    flexWrap: "wrap",
    padding: 5,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  closeModalText: {
    color: tokens.colors.text.primary,
    fontWeight: tokens.fontWeight.normal,
    textAlign: "center",
    fontSize: tokens.fontSize.lg,
  },
  rateButton: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[100],
    borderWidth: 2,
    borderRadius: tokens.borderRadius.full,
    flexWrap: "wrap",
    padding: 5,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  rateText: {
    color: tokens.colors.text.primary,
    fontWeight: tokens.fontWeight.normal,
    textAlign: "center",
    fontSize: tokens.fontSize.lg,
  },
  disabledButton: {
    opacity: 0.1,
  },
  commentInput: {
    width: "80%",
    height: 100,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.md,
    padding: 10,
    paddingTop: 10,
    fontSize: tokens.fontSize.md,
    textAlignVertical: "top",
  },
  uploadButton: {
    marginTop: 10,
    borderColor: tokens.colors.primary[200],
    borderWidth: 1.5,
    borderRadius: tokens.borderRadius.full,
    padding: 10,
    paddingHorizontal: 20,
  },
  uploadButtonText: {
    color: tokens.colors.text.primary,
    fontWeight: tokens.fontWeight.normal,
    fontSize: tokens.fontSize.lg,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: tokens.borderRadius.md,
  },
  imageReviewContainer: {
    height: 140,
    alignItems: "flex-end",
    flexDirection: "column-reverse",
    justifyContent: "center",
    flexWrap: "wrap",
    paddingHorizontal: 5,
  },
  removeImage: {
    backgroundColor: tokens.colors.primary[50],
    justifyContent: "center",

    alignItems: "center",
    width: 20,
    height: 20,
    padding: 5,
    marginLeft: 30,
    marginBottom: 10,
    borderRadius: tokens.borderRadius.full,
  },
  allImages: {
    flexDirection: "row",
    alignContent: "center",

    marginTop: 20,
    gap: 10,

    width: "100%",
  },
});

import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  TouchableHighlight,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import Video, { VideoRef } from "react-native-video";
import { tokens } from "@/src/theme/tokens";
import { useRecipe } from "@/src/hooks/useRecipe";
import { useEffect, useRef, useState } from "react";
import { Progress } from "tamagui";

import { X } from "lucide-react-native";

import ImagePicker from "react-native-image-crop-picker";

import { Platform, PermissionsAndroid } from "react-native";

import CustomRating from "@/src/components/form/Rating";
import { useImageUpload } from "@/src/hooks/useImageUpload";
import { useMutation } from "@apollo/client";
import { ADD_REVIEW } from "@/src/graphql/operations/review";
import { useUser } from "@/src/hooks/useUser";

import {
  START_COOKING_SESSION,
  UPDATE_STEP_PROGRESS,
} from "@/src/graphql/operations/cookingSession";
interface ReviewType {
  userId: string;
}

interface ImagePickerResponse {
  path: string;
}

interface ImagePickerError extends Error {
  code?: string;
}

interface Review {
  userId: string;
  id: string;
}

interface RecipeDetails {
  id: string;
  title: string;
  totalTime: number;
  steps: Array<{
    video?: string;
    description: string;
    tips?: string;
  }>;
  reviews: Review[];
}

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

export default function StepByStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipeDetails, detailsLoading, detailsError } = useRecipe({
    id: id || "",
  }) as {
    recipeDetails: RecipeDetails | null;
    detailsLoading: boolean;
    detailsError: Error | null;
  };
  const { user } = useUser();

  const videoRef = useRef<VideoRef>(null);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalHasReviewVisible, setModalHasReviewVisible] = useState(false);
  const [rating, setRating] = useState<number>(0);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");

  const { uploadImage } = useImageUpload();

  const [hasReview, setHasReview] = useState(false);

  const [addReview, { loading }] = useMutation(ADD_REVIEW);
  const [startSession] = useMutation(START_COOKING_SESSION);
  const [updateProgress] = useMutation(UPDATE_STEP_PROGRESS);

  // Add these with your other state declarations
  const [cookingSessionId, setCookingSessionId] = useState<string | null>(null);
  const [previousStep, setPreviousStep] = useState<number | null>(null);

  const handleRatingChange = (newRating: number) => {
    const roundedValue = Math.round(newRating * 2) / 2;
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
        maxFiles: 8,
        mediaType: "photo",
        compressImageQuality: 0.8,
      });

      if (images.length + selectedImages.length > 8) {
        alert("You can upload a maximum of 8 images.");
        return;
      }

      const selectedImageUris = images.map(
        (image: ImagePickerResponse) => image.path
      );
      setSelectedImages([...selectedImages, ...selectedImageUris]);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error as ImagePickerError).code !== "E_PICKER_CANCELLED"
      ) {
        console.error("ImagePicker Error: ", error);
      }
    }
  };

  const handleRemoveImage = (uriToRemove: string) => {
    setSelectedImages(selectedImages.filter((uri) => uri !== uriToRemove));
  };

  const handleReviewSubmit = async () => {
    try {
      const uploadedImageUrls = [];

      for (const image of selectedImages) {
        const blobPath = await uploadImage(image); // Upload the image and get the blobPath
        if (blobPath) {
          uploadedImageUrls.push(blobPath); // Add the blobPath to the array
        } else {
          throw new Error("Image upload failed");
        }
      }

      const { data } = await addReview({
        variables: {
          recipeId: id,
          rating,
          comment: reviewText,
          cookSnaps: uploadedImageUrls, // Pass the uploaded URLs
        },
      });

      setRating(0);
      setReviewText("");
      setSelectedImages([]);
      setModalVisible(false);

      console.log("Review submitted successfully:", data);

      router.back();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review. Please try again.");
    }
  };

  useEffect(() => {
    if (recipeDetails) {
      setTotalSteps(recipeDetails.steps.length);

      const userReview = recipeDetails.reviews.some(
        (review: Review) => review.userId === user.id
      );
      if (userReview) {
        setHasReview(true);
      }
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.seek(0);
        videoRef.current.pause();
      }
    };
  }, [recipeDetails]);

  const handleEnd = () => {
    if (videoRef.current) {
      videoRef.current.seek(0);
      videoRef.current.pause();
    }
  };

  useEffect(() => {
    if (recipeDetails) {
      setTotalSteps(recipeDetails.steps.length);

      const userReview = recipeDetails.reviews.some(
        (review: ReviewType) => review.userId === user.id
      );
      if (userReview) {
        setHasReview(true);
      }
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.seek(0);
        videoRef.current.pause();
      }
    };
  }, [recipeDetails]);

  if (detailsLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (detailsError || !recipeDetails) {
    return (
      <View style={styles.container}>
        <Text>Error loading recipe steps</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recipeDetails.steps}
      keyExtractor={(item, index) => index.toString()}
      horizontal
      style={styles.container}
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onViewableItemsChanged={async ({ viewableItems }) => {
        if (viewableItems.length > 0) {
          const newStepIndex = viewableItems[0].index;
          setCurrentStep(newStepIndex);
          console.log(`Moving to step ${newStepIndex}`);

          if (
            cookingSessionId &&
            previousStep !== newStepIndex &&
            newStepIndex !== null
          ) {
            try {
              if (previousStep !== null && newStepIndex > previousStep) {
                console.log(`Completing step ${previousStep}`);
                await updateProgress({
                  variables: {
                    input: {
                      sessionId: cookingSessionId,
                      stepIndex: previousStep,
                      completed: true,
                    },
                  },
                });
                console.log(`Step ${previousStep} marked as completed`);
              } else if (previousStep !== null && newStepIndex < previousStep) {
                console.log(`Uncompleting step ${previousStep}`);
                await updateProgress({
                  variables: {
                    input: {
                      sessionId: cookingSessionId,
                      stepIndex: previousStep,
                      completed: false,
                    },
                  },
                });
                console.log(`Step ${previousStep} marked as uncompleted`);
              }

              setPreviousStep(newStepIndex);
            } catch (error) {
              console.error("Step progress update error:", error);
            }
          }
        }
      }}
      renderItem={({ item, index }) => (
        <View style={item.video ? styles.stepContainer : styles.stepContainer2}>
          {index === currentStep && item.video && (
            <View style={styles.videoContainer}>
              {isVideoLoading && (
                <ActivityIndicator
                  size="large"
                  color={tokens.colors.primary[500]}
                  style={styles.loadingIndicator}
                />
              )}
              <Video
                ref={videoRef}
                source={{ uri: item.video }}
                style={[styles.video, isVideoLoading && styles.hiddenVideo]}
                resizeMode="cover"
                repeat={false}
                paused={false}
                onEnd={handleEnd}
                onLoadStart={() => setIsVideoLoading(true)}
                onLoad={() => setIsVideoLoading(false)}
              />
            </View>
          )}

          <View style={{ paddingHorizontal: 30, alignItems: "center" }}>
            {/* Add the Tamagui Progress Bar */}
            <Progress
              value={Math.round(((currentStep ?? 0 + 1) / totalSteps) * 100)}
              size="$2"
              width={200}
            >
              <Progress.Indicator
                animation="bouncy"
                backgroundColor={tokens.colors.primary[500]}
              />
            </Progress>

            <Text style={styles.stepNumber}>
              Step {index + 1} of {totalSteps}
            </Text>

            <Text style={styles.stepText}>{item.description}</Text>
            <Text style={styles.stepTip}>{item.tips}</Text>
            {index === totalSteps - 1 && (
              <TouchableOpacity
                style={styles.finishContainer}
                onPress={() => {
                  if (hasReview) {
                    setModalHasReviewVisible(true);
                  } else {
                    setModalVisible(true);
                  }
                }}
              >
                <Text style={styles.finishText}>Finish Recipe</Text>
              </TouchableOpacity>
            )}
            <Modal
              visible={modalVisible}
              onDismiss={() => setModalVisible(false)}
              transparent={true}
              animationType="fade"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalView}>
                  <Text style={styles.modalText}>
                    How fire was the recipe ?
                  </Text>
                  <CustomRating
                    rating={rating}
                    onRatingChange={handleRatingChange}
                  />
                  <TextInput
                    placeholder="Leave a comment..."
                    style={styles.commentInput}
                    onChangeText={setReviewText}
                    value={reviewText}
                  />
                  {/* Display the selected image */}
                  <ScrollView horizontal style={styles.allImages}>
                    {selectedImages.map((uri) => (
                      <View key={uri} style={styles.imageContainer}>
                        <Image source={{ uri }} style={styles.selectedImage} />
                        <TouchableOpacity
                          style={styles.removeImage}
                          onPress={() => handleRemoveImage(uri)}
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
                      onPress={handleReviewSubmit}
                      disabled={selectedImages.length > 8}
                    >
                      <Text style={styles.rateText}>Rate</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.finishWithoutRatingContainer}
                    onPress={() => router.back()}
                  >
                    <Text style={styles.finishWithoutRating}>
                      Finish without rating
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal
              visible={modalHasReviewVisible}
              transparent={true}
              animationType="fade"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalView}>
                  <Text style={styles.modalText}>
                    Do u wish to edit ur review for this recipe ?
                  </Text>
                  <View style={{ flexDirection: "row", gap: 15 }}>
                    <TouchableOpacity
                      style={styles.closeModalButton}
                      onPress={() => router.back()}
                    >
                      <Text style={styles.closeModalText}>No</Text>
                    </TouchableOpacity>
                    <Link
                      style={styles.rateButton}
                      href={{
                        pathname: "/reviews/[id]",
                        params: { id: recipeDetails.id },
                      }}
                      onPress={() => {
                        setModalHasReviewVisible(false);
                      }}
                    >
                      <Text style={styles.rateText}>Yes</Text>
                    </Link>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Let's Cook!</Text>
          <Image
            source={require("../../assets/images/illustrationStep.png")}
            style={{ width: 250, height: 250, padding: 10 }}
          />
          <Text style={styles.subtitle}>Recipe</Text>
          <Text style={styles.recipeName}>{recipeDetails.title}</Text>
          <Text style={styles.totalTime}>{recipeDetails.totalTime} min</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    width: Dimensions.get("window").width,
    flex: 1,
  },
  title: {
    fontSize: tokens.fontSize.xxxl,
    fontWeight: tokens.fontWeight.medium,
  },
  subtitle: {
    fontSize: tokens.fontSize.xxl,
    textDecorationLine: "underline",
    fontWeight: tokens.fontWeight.medium,
    marginTop: 20,
  },
  recipeName: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: tokens.fontWeight.medium,
    marginTop: 20,
  },
  totalTime: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.medium,
    marginTop: 20,
    color: tokens.colors.text.secondary,
  },
  stepContainer: {
    width: Dimensions.get("window").width,
    alignItems: "center",
  },
  stepContainer2: {
    width: Dimensions.get("window").width,
    alignItems: "center",
    justifyContent: "center",
  },
  videoContainer: {
    width: "100%",
    height: 300,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  hiddenVideo: {
    display: "none",
  },
  loadingIndicator: {
    position: "absolute",
  },
  stepNumber: {
    fontSize: tokens.fontSize.xxxl,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.primary[500],
    marginBottom: 20,
    marginTop: 40,
  },
  stepText: {
    fontSize: tokens.fontSize.lg,
    textAlign: "center",
    color: tokens.colors.text.primary,
  },
  stepTip: {
    fontSize: tokens.fontSize.md,
    marginTop: 40,
    fontStyle: "italic",
    textAlign: "center",
    color: tokens.colors.text.primary,
  },
  finishContainer: {
    marginTop: 40,
    backgroundColor: tokens.colors.primary[200],
    borderRadius: tokens.borderRadius.full,
  },
  finishText: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    paddingVertical: 10,
    paddingHorizontal: 30,
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
  imageContainer: {
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
  finishWithoutRating: {
    color: tokens.colors.primary[500],
    fontWeight: tokens.fontWeight.normal,
    textAlign: "center",
    fontSize: tokens.fontSize.lg,
  },
  finishWithoutRatingContainer: {
    marginTop: 25,

    padding: 10,
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: 15,
  },
  allImages: {
    flexDirection: "row",
    alignContent: "center",

    marginTop: 20,
    gap: 10,

    width: "100%",
  },
});

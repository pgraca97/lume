import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Link, router, useLocalSearchParams, useRouter } from "expo-router";
import { tokens } from "@/src/theme/tokens";

import { useRecipe } from "@/src/hooks/useRecipe";

import MyReviewItem from "@/src/components/cards/ReviewCard";
import { useEffect, useState } from "react";

export default function RecipeReviews() {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipeDetails, detailsLoading, detailsError, refetchDetails } =
    useRecipe({
      id: id || "",
    });

  if (detailsLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (detailsError) {
    return (
      <View style={styles.container}>
        <Text>Error loading recipe: {detailsError.message}</Text>
      </View>
    );
  }

  if (!recipeDetails) {
    return (
      <View style={styles.container}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Reviews</Text>
        <Text style={styles.subtitle}>{recipeDetails.title}</Text>
      </View>
      <View style={styles.reviewContainer}>
        {recipeDetails.reviews && recipeDetails.reviews.length > 0 ? (
          recipeDetails.reviews.map((review, index) => (
            <MyReviewItem
              key={index}
              userId={review.userId}
              reviewId={review.id}
              name={review.user?.profile?.username || "Anonymous"}
              comment={review.comment}
              rating={review.rating}
              images={review.cookSnapsUrls || []}
              imagesBlobs={review.cookSnaps || []}
              onUpdate={() => refetchDetails()}
            />
          ))
        ) : (
          <View
            style={{
              justifyContent: "center",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              style={styles.noReviewImage}
              source={require("../../assets/images/noReviews.png")}
            />
            <Text style={styles.noReviewText}>
              No reviews for this recipe yet!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    padding: 10,
  },
  title: {
    fontSize: tokens.fontSize.xxxl,
  },
  subtitle: {
    fontSize: tokens.fontSize.xl,
    fontStyle: "italic",
  },
  titleContainer: {
    marginLeft: 50,
  },
  reviewContainer: {
    marginTop: 20,
  },
  noReviewImage: {
    marginRight: 10,
    marginTop: 40,
    width: 300,
  },
  noReviewText: {
    fontSize: tokens.fontSize.xl,

    marginTop: 20,
    color: tokens.colors.primary[400],
    fontWeight: tokens.fontWeight.medium,
  },
});

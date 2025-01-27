import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import Slider from "@react-native-community/slider"; // Import React Native's Slider component
import { tokens } from "@/src/theme/tokens"; // Import the design tokens

const CustomRating = ({ rating, onRatingChange }) => {
  const totalStars = 5; // Total number of stars

  // Function to handle the rating change via the slider
  const handleSliderChange = (value) => {
    const roundedValue = Math.round(value * 2) / 2; // Round to nearest 0.5
    onRatingChange(roundedValue); // Update the rating
  };

  const getRatingText = (rating) => {
    if (rating === 0) return "Slide to rate, don't be shy!";
    if (rating === 0.5) return "Half a star... tough crowd!";
    if (rating === 1) return "Yikes! This ain't it.";
    if (rating === 1.5) return "Kinda bad, but not the worst.";
    if (rating === 2) return "Meh, could be better.";
    if (rating === 2.5) return "Not bad, but not great either.";
    if (rating === 3) return "It's alright, nothing special.";
    if (rating === 3.5) return "Pretty decent, getting there!";
    if (rating === 4) return "Pretty solid, we like it!";
    if (rating === 4.5) return "Almost perfect, so close!";
    if (rating === 5) return "Absolutely amazing! Chef's kiss.";
  };

  return (
    <View style={styles.ratingContainer}>
      {/* Displaying the stars */}
      <View style={styles.starsContainer}>
        {Array.from({ length: totalStars }, (_, index) => {
          const starValue = index + 1;
          const isHalfStar = rating >= starValue - 0.5 && rating < starValue;
          const isFullStar = rating >= starValue;

          return (
            <Image
              key={index}
              source={
                isFullStar
                  ? require("../../../assets/images/rating.png") // Full star
                  : isHalfStar
                  ? require("../../../assets/images/ratingHalf.png") // Half star
                  : require("../../../assets/images/ratingEmpty.png") // Empty star
              }
              style={styles.starImage}
            />
          );
        })}
      </View>

      <View>
        <Text style={styles.textRating}>{getRatingText(rating)}</Text>
      </View>

      {/* Slider to change the rating */}
      <View style={styles.sliderContainer}>
        <Slider
          minimumValue={0}
          maximumValue={5}
          step={0.5} // Step of 0.5 for half-star precision
          value={rating}
          onSlidingComplete={handleSliderChange}
          style={styles.slider}
          maximumTrackTintColor={tokens.colors.primary[500]}
          minimumTrackTintColor={tokens.colors.primary[500]}
          thumbTintColor={tokens.colors.primary[500]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ratingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  starImage: {
    width: 40, // Adjust size as needed
    height: 40, // Adjust size as needed
    marginHorizontal: 2, // Spacing between stars
  },
  slider: {
    width: 220, // Adjust width as needed
    height: 40, // Height for visibility
    marginTop: 20,
    backgroundColor: tokens.colors.background.primary, // Background color to make slider visible
    borderRadius: 10, // To give it a rounded appearance

    color: tokens.colors.primary[500], // Color of the slider
  },
  textRating: {
    fontSize: tokens.fontSize.lg,
    fontStyle: "italic",
    color: "#fc4103",
  },
});

export default React.memo(CustomRating);

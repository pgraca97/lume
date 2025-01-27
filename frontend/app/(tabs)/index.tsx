import React, { useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableHighlight,
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  ScrollView,
  Alert 
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { useUser } from "@/src/hooks/useUser";
import { Button } from "@/src/components/form/Button";
import { tokens } from "@/src/theme/tokens";
import { BotMessageSquare } from "lucide-react-native";
import { useRecipeList } from "@/src/hooks/useRecipeList";
import MyRecipeCard from "@/src/components/cards/RecipeCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRecipeHistory } from "@/src/hooks/useRecipeHistory";
import MyRecentlyViewCard from "@/src/components/cards/RecentlyViewCard";

export default function ForYou() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  
  // Fetch recipes
  const { recipes, recipesLoading, recipesError, refetchRecipes } =
  useRecipeList({
    limit: 10,
    offset: 0,
  });
  
  const {
    recipes: difficulty1Recipes,
    recipesLoading: difficulty1Loading,
    recipesError: difficulty1Error,
  } = useRecipeList({
    limit: 10,
    offset: 0,
    difficulty: 1,
  });
  
  const {
    recipes: lunchRecipes,
    recipesLoading: lunchLoading,
    recipesError: lunchError,
  } = useRecipeList({
    limit: 10,
    offset: 0,
    tags: ["Lunch"],
  });
  
  const {
    recipes: budgetRecipes,
    recipesLoading: budgetLoading,
    recipesError: budgetError,
  } = useRecipeList({
    limit: 10,
    offset: 0,
    tags: ["Budget Friendly"],
  });
  
  const {
    recentRecipes: history,
    historyLoading,
    historyError,
    clearHistory
  } = useRecipeHistory();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };
  
  const handleGoToChat = () => {
    router.push("/chat");
  };
  
  // Render a horizontal list of recipes
  const renderRecipeList = (data, loading, error) => {
    if (loading) {
      return (
        <ActivityIndicator size="large" color={tokens.colors.primary[300]} />
      );
    }
    if (error) {
      return <Text>Failed to load recipes: {error.message}</Text>;
    }
    return (
      <FlatList
      horizontal
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <MyRecipeCard
        id={item.id}
        title={item.title}
        mainImage={item.mainImage}
        subtitle={item.subtitle}
        costPerServing={item.costPerServing}
        difficulty={item.difficulty}
        totalTime={item.totalTime}
        />
      )}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={3} // Only render 3 items initially
      windowSize={5} // Render items within a window of 5
      />
    );
  };
  
  return (
    <View style={styles.container}>
    <ScrollView
    contentContainerStyle={styles.scrollContent}
    nestedScrollEnabled={true}
    >
    {/* Freshly Added */}
    <View style={styles.slideContainer}>
    <Text style={styles.slideTitle}>Freshly Added</Text>
    {renderRecipeList(recipes, recipesLoading, recipesError)}
    </View>
    
    {/* Difficulty 1 Recipes Section */}
    <View style={styles.slideContainer}>
    <Text style={styles.slideTitle}>Easy Recipes</Text>
    {renderRecipeList(
      difficulty1Recipes,
      difficulty1Loading,
      difficulty1Error
    )}
    </View>
    
    {/* Lunch Recipes Section */}
    <View style={styles.slideContainer}>
    <Text style={styles.slideTitle}>Perfect for Lunch</Text>
    {renderRecipeList(lunchRecipes, lunchLoading, lunchError)}
    </View>
    
    {/* Budget Friendly Recipes Section */}
    <View style={styles.slideContainer}>
    <Text style={styles.slideTitle}>Low Budget</Text>
    {renderRecipeList(budgetRecipes, budgetLoading, budgetError)}
    </View>
    
{/* Recently Viewed Section */}
<View style={styles.slideContainer}>
  <View style={styles.headerContainer}>
    <Text style={styles.slideTitle}>Recently Viewed</Text>
    <TouchableOpacity 
      style={styles.clearButton}
      onPress={async () => {
        try {
          await clearHistory();
          Alert.alert("Success", "History cleared successfully!");
        } catch (error) {
          console.error("Error clearing history:", error);
          Alert.alert("Error", "Failed to clear history");
        }
      }}
    >
      <Text style={styles.clearButtonText}>Clear</Text>
    </TouchableOpacity>
  </View>
  
  {historyLoading ? (
    <ActivityIndicator size="large" color={tokens.colors.primary[300]} />
  ) : historyError ? (
    <Text>Failed to load history: {historyError.message}</Text>
  ) : history?.length > 0 ? (
    <FlatList
      horizontal
      data={history}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <MyRecipeCard
          id={item.id}
          title={item.title}
          mainImage={item.mainImage}
          subtitle={item.subtitle}
          costPerServing={item.costPerServing}
          difficulty={item.difficulty}
          totalTime={item.totalTime}
        />
      )}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={3}
      windowSize={5}
    />
  ) : (
    <Text style={styles.noHistoryText}>No recently viewed recipes</Text>
  )}
</View>
</ScrollView>

      <TouchableHighlight
        style={styles.chat}
        underlayColor={tokens.colors.primary[500]}
        onPress={handleGoToChat}
      >
        <BotMessageSquare size={32} color="white" />
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  welcome: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  subtitle: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  signOutButton: {
    marginLeft: tokens.spacing.md,
  },
  chat: {
    backgroundColor: tokens.colors.primary[300],
    position: "absolute",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    bottom: 50,
    right: 30,
  },
  slideContainer: {
    padding: 10,
  },
  slideTitle: {
    fontSize: tokens.fontSize.xxl,
    color: tokens.colors.text.primary,
    fontWeight: tokens.fontWeight.medium,
    paddingBottom: tokens.spacing.sm,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  clearButton: {
    backgroundColor: tokens.colors.primary[50],
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.primary[200],
  },
  clearButtonText: {
    color: tokens.colors.primary[500],
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  noHistoryText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.fontSize.md,
    textAlign: 'center',
    padding: tokens.spacing.lg,
  }
});



import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { useUser } from "@/src/hooks/useUser";
import { Button } from "@/src/components/form/Button";
import { tokens } from "@/src/theme/tokens";
import { BotMessageSquare, Search } from "lucide-react-native";
import { useTagsList } from "@/src/hooks/useTagsList";
import MyTagChip from "@/src/components/chips/TagChip";
import { useEffect, useState } from "react";
import { useRecipeList } from "@/src/hooks/useRecipeList";
import MyRecipeCard from "@/src/components/cards/RecipeCard";

export default function Explore() {
  const { user } = useUser();

  const router = useRouter();

  const handleGoToChat = () => {
    router.push("/chat");
  };
  const handleGoToSearch = () => {
    router.push("/search");
  };

  const { tags, tagsLoading, tagsError, refetchTags } = useTagsList();

  const [randomTags, setRandomTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  const {
    recipes = [],
    recipesLoading,
    recipesError,
    refetchRecipes,
  } = useRecipeList({
    limit: 67, // Adjust as needed
    offset: 0,
  });

  const sortedRecipesByCookCount = [...recipes].slice(0, 10).sort((a, b) => {
    const aCookCount = a?.reviewStats?.totalCookCount || 0;
    const bCookCount = b?.reviewStats?.totalCookCount || 0;
    return bCookCount - aCookCount; // Sort in descending order (most cooked first)
  });

  const sortedRecipesByRating = [...recipes].slice(0, 10).sort((a, b) => {
    const aAvgRating = a?.reviewStats?.avgRating || 0;
    const bAvgRating = b?.reviewStats?.avgRating || 0;
    return bAvgRating - aAvgRating; // Sort in descending order (higher avg rating first)
  });

  const flashRecipes = recipes
    .filter((recipe) => recipe.totalTime <= 15)
    .slice(0, 10);

  const handleTagPress = (tag) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const filteredRecipes =
    selectedTag === null
      ? []
      : recipes.filter((recipe) =>
          recipe.tags?.some((recipeTag) => recipeTag.name === selectedTag.name)
        );

  const shuffleTags = () => {
    if (tags) {
      const shuffledTags = [...tags]; // Make a copy of the tags array
      shuffledTags.sort(() => Math.random() - 0.5); // Shuffle the array
      setRandomTags(shuffledTags.slice(0, 15)); // Take the first 15 items
    }
  };

  useEffect(() => {
    shuffleTags();
  }, [tags]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          {/*Search Button*/}
          <View style={styles.searchContainer}>
            <TouchableHighlight
              style={styles.searchButton}
              underlayColor={tokens.colors.primary[500]}
              onPress={handleGoToSearch}
            >
              <Search size={25} color="white" />
            </TouchableHighlight>
          </View>
        </View>

        {/* Categories Slider */}
        <View style={styles.slideContainer}>
          <Text style={styles.slideTitle}>Categories</Text>

          {tagsLoading && (
            <ActivityIndicator
              size="large"
              color={tokens.colors.primary[300]}
            />
          )}
          {tagsError && <Text>Failed to load tags: {tagsError.message}</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.wrapContainerTags}>
              {randomTags?.map((tag, index) => (
                <MyTagChip
                  key={index}
                  name={tag.name}
                  category={tag.category}
                  onPress={() => handleTagPress(tag)}
                  isSelected={selectedTag?.name === tag.name}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {selectedTag ? (
          // Recipes for the selected category
          <View style={styles.slideContainer}>
            <Text style={styles.slideTitle}>{selectedTag.name}</Text>
            {recipesLoading && (
              <ActivityIndicator
                size="large"
                color={tokens.colors.primary[300]}
              />
            )}
            {recipesError && (
              <Text>Failed to load recipes: {recipesError.message}</Text>
            )}
            <View style={styles.wrapContainer}>
              {filteredRecipes.map((item) => (
                <MyRecipeCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  mainImage={item.mainImage}
                  subtitle={item.subtitle}
                  costPerServing={item.costPerServing}
                  difficulty={item.difficulty}
                  totalTime={item.totalTime}
                />
              ))}
            </View>
          </View>
        ) : (
          // Default sections (Trending, Best Rating, Flash Recipes)
          <>
            <View style={styles.slideContainer}>
              <Text style={styles.slideTitle}>Trending right now</Text>
              {recipesLoading && (
                <ActivityIndicator
                  size="large"
                  color={tokens.colors.primary[300]}
                />
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sortedRecipesByCookCount.map((recipe) => (
                  <MyRecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    mainImage={recipe.mainImage}
                    subtitle={recipe.subtitle}
                    costPerServing={recipe.costPerServing}
                    difficulty={recipe.difficulty}
                    totalTime={recipe.totalTime}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.slideContainer}>
              <Text style={styles.slideTitle}>Best Rating</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sortedRecipesByRating.map((recipe) => (
                  <MyRecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    mainImage={recipe.mainImage}
                    subtitle={recipe.subtitle}
                    costPerServing={recipe.costPerServing}
                    difficulty={recipe.difficulty}
                    totalTime={recipe.totalTime}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.slideContainer}>
              <Text style={styles.slideTitle}>Flash Recipes (0-15 min)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {flashRecipes.map((recipe) => (
                  <MyRecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    mainImage={recipe.mainImage}
                    subtitle={recipe.subtitle}
                    costPerServing={recipe.costPerServing}
                    difficulty={recipe.difficulty}
                    totalTime={recipe.totalTime}
                  />
                ))}
              </ScrollView>
            </View>
          </>
        )}
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
  title: {
    fontSize: tokens.fontSize.xl,
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
  list: {
    padding: tokens.spacing.md,
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
  scrollContent: {
    paddingBottom: 100,
  },
  slideTitle: {
    fontSize: tokens.fontSize.xxl,
    color: tokens.colors.text.primary,
    fontWeight: tokens.fontWeight.medium,
    paddingBottom: tokens.spacing.sm,
  },
  slideContainer: {
    padding: 10,
  },
  wrapContainerTags: {
    flexDirection: "row", // Lay items horizontally
    flexWrap: "wrap", // Move items to the next row when needed
    gap: 5, // Space between tags
    maxWidth: 1300,
  },
  wrapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  searchButton: {
    backgroundColor: tokens.colors.primary[300],
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  searchContainer: {
    alignItems: "flex-end",
    width: "100%",
    padding: 10,
    flex: 1,
  },
});

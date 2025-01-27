// app/search.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Keyboard,
  ScrollView,
} from "react-native";
import { Text } from "@/src/components/typography/Text";
import { tokens } from "@/src/theme/tokens";
import { useRecipeSearch } from "@/src/hooks/useRecipeSearch";
import { FilterModal } from "@/src/components/modal/FilterModal";
import RecipeCard from "@/src/components/cards/RecipeCard";

export default function Search() {
  const { recipes, loading, filters, updateFilters } = useRecipeSearch();
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    const trimmedText = searchText.trim();
    Keyboard.dismiss();

    updateFilters({
      query: trimmedText || undefined,
    });

    setSearchText("");
  };

  const removeFilter = (
    type: "query" | "tag" | "difficulty",
    value?: string
  ) => {
    switch (type) {
      case "query":
        updateFilters({ query: undefined });
        setSearchText("");
        break;
      case "tag":
        updateFilters({ tags: filters.tags?.filter((t) => t !== value) });
        break;
      case "difficulty":
        updateFilters({ difficulty: undefined });
        break;
    }
  };
  const handleResetAll = () => {
    updateFilters({
      query: undefined,
      tags: [],
      difficulty: undefined,
      limit: 10,
      offset: 0,
    });
    setSearchText("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            placeholder="Search recipes..."
            returnKeyType="search"
            placeholderTextColor={tokens.colors.text.secondary}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Filters Button Row */}
        <View style={styles.filterButtonContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters Row */}
      <ScrollView
        horizontal
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
        showsHorizontalScrollIndicator={false}
      >
        {filters.query && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{filters.query}</Text>
            <TouchableOpacity
              onPress={() => removeFilter("query")}
              style={styles.chipClose}
            >
              <Text style={styles.chipCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {filters.tags?.map((tag) => (
          <View style={styles.chip} key={tag}>
            <Text style={styles.chipText}>{tag}</Text>
            <TouchableOpacity
              onPress={() => removeFilter("tag", tag)}
              style={styles.chipClose}
            >
              <Text style={styles.chipCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {filters.difficulty && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              Difficulty: {filters.difficulty}
            </Text>
            <TouchableOpacity
              onPress={() => removeFilter("difficulty")}
              style={styles.chipClose}
            >
              <Text style={styles.chipCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={updateFilters}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={tokens.colors.primary[500]}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={recipes}
          renderItem={({ item }) => <RecipeCard {...item} />}
          contentContainerStyle={styles.recipeList}
          ListEmptyComponent={
            <Text style={styles.noResults}>
              No recipes found matching your criteria
            </Text>
          }
        />
      )}
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
  },
  searchContainer: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.primary,
  },
  searchButton: {
    backgroundColor: tokens.colors.primary[500],
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
  },
  searchButtonText: {
    color: "white",
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  filterButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  filterButton: {
    backgroundColor: tokens.colors.primary[100],
    borderWidth: 1,
    borderColor: tokens.colors.primary[300],
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
  },
  filterButtonText: {
    color: tokens.colors.primary[600],
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  filtersRow: {
    maxHeight: 60,
    paddingVertical: tokens.spacing.sm,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recipeList: {
    padding: tokens.spacing.md,
  },
  filtersContent: {
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 25,
    backgroundColor: tokens.colors.primary[50],
    borderWidth: 1,
    borderColor: tokens.colors.primary[300],
    borderRadius: tokens.borderRadius.full,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
  },
  chipText: {
    color: tokens.colors.primary[600],
    fontSize: tokens.fontSize.sm,
  },
  chipClose: {
    marginLeft: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.xs,
  },
  chipCloseText: {
    color: tokens.colors.primary[600],
    fontSize: tokens.fontSize.md,
    lineHeight: tokens.fontSize.md,
    justifyContent: "center",
  },
  noResults: {
    textAlign: "center",
    color: tokens.colors.text.secondary,
    padding: tokens.spacing.xl,
    justifyContent: "center",
  },
});

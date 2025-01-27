import { useQuery, useMutation, QueryHookOptions } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import {
  GET_TABLE,
  GET_MY_TABLES,
  GET_SAVED_RECIPES,
  GET_MY_TABLE_STATS,
  GET_COOKBOOK_STATS,
  CREATE_TABLE,
  UPDATE_TABLE,
  DELETE_TABLE,
  ADD_RECIPE_TO_TABLE,
  ADD_RECIPE_TO_UNPLANNED_MEALS,
  REMOVE_RECIPE_FROM_TABLE,
  ADD_TABLE_COLLABORATOR,
  REMOVE_TABLE_COLLABORATOR,
  UPDATE_TABLE_COLLABORATOR_ROLE,
} from "../graphql/operations/table";

import { useUser } from "@/src/hooks/useUser";
interface UseTableOptions {
  id?: string;
  filter?: any;
  limit?: number;
  offset?: number;
}

export const useTable = (options: UseTableOptions = {}) => {
  // Queries
  const {
    data: tableData,
    loading: tableLoading,
    error: tableError,
    refetch: refreshTable,
  } = useQuery(GET_TABLE, {
    variables: { id: options.id },
    skip: !options.id,
  });

  const {
    data: myTablesData,
    loading: myTablesLoading,
    error: myTablesError,
    refetch: refreshMyTables,
  } = useQuery(GET_MY_TABLES, {
    variables: {
      filter: options.filter,
      limit: options.limit,
      offset: options.offset,
    },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: tableStatsData,
    loading: tableStatsLoading,
    refetch: refreshTableStats,
  } = useQuery(GET_MY_TABLE_STATS);

  const {
    data: cookbookStatsData,
    loading: cookbookStatsLoading,
    refetch: refreshCookbookStats,
  } = useQuery(GET_COOKBOOK_STATS);

  const { fetchUserByEmail } = useUser();

  // Mutations
  const [createTableMutation] = useMutation(CREATE_TABLE);
  const [updateTableMutation] = useMutation(UPDATE_TABLE);
  const [deleteTableMutation] = useMutation(DELETE_TABLE);
  const [addRecipeToTableMutation] = useMutation(ADD_RECIPE_TO_TABLE);
  const [addRecipeToUnplannedMealsMutation] = useMutation(
    ADD_RECIPE_TO_UNPLANNED_MEALS
  );
  const [removeRecipeFromTableMutation] = useMutation(REMOVE_RECIPE_FROM_TABLE);
  const [addCollaboratorMutation] = useMutation(ADD_TABLE_COLLABORATOR);
  const [removeCollaboratorMutation] = useMutation(REMOVE_TABLE_COLLABORATOR);
  const [updateCollaboratorRoleMutation] = useMutation(
    UPDATE_TABLE_COLLABORATOR_ROLE
  );

  // Cache management
  const updateLocalCache = useCallback(async (table: any) => {
    try {
      await AsyncStorage.setItem(
        `@table_cache_${table.id}`,
        JSON.stringify({
          data: table,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error updating table cache:", error);
    }
  }, []);

  // Table operations
  const createTable = async (input: any) => {
    try {
      const { data } = await createTableMutation({
        variables: { input },
      });
      if (data?.createTable) {
        await updateLocalCache(data.createTable);
        await refreshMyTables();
        await refreshTableStats();
      }
      return data?.createTable;
    } catch (error) {
      console.error("Error creating table:", error);
      throw error;
    }
  };

  const updateTable = async (id: string, input: any) => {
    try {
      const { data } = await updateTableMutation({
        variables: { id, input },
      });
      if (data?.updateTable) {
        await updateLocalCache(data.updateTable);
        await refreshMyTables();
      }
      return data?.updateTable;
    } catch (error) {
      console.error("Error updating table:", error);
      throw error;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const { data } = await deleteTableMutation({
        variables: { id },
      });
      if (data?.deleteTable) {
        await AsyncStorage.removeItem(`@table_cache_${id}`);
        await refreshMyTables();
        await refreshTableStats();
      }
      return data?.deleteTable;
    } catch (error) {
      console.error("Error deleting table:", error);
      throw error;
    }
  };

  const addRecipeToTable = async (tableId: string, recipeId: string) => {
    try {
      // Execute the GraphQL mutation
      const { data } = await addRecipeToTableMutation({
        variables: { tableId, recipeId },
      });

      // Check if the mutation was successful
      if (data?.addRecipeToTable) {
        // Update the local cache with the new data
        await updateLocalCache(data.addRecipeToTable);

        // Refresh the table list
        await refreshTable();

        // Return the updated table data
        return data.addRecipeToTable;
      } else {
        // If no data is returned, throw an error
        throw new Error("Failed to add recipe to table: No data returned");
      }
    } catch (error: any) {
      console.error("Error adding recipe to table:", error);

      // Propagate the error to the caller
      throw error;
    }
  };

  const addRecipeToUnplannedMeals = async (recipeId: string) => {
    try {
      const { data } = await addRecipeToUnplannedMealsMutation({
        variables: { recipeId },
      });
      if (data?.addRecipeToUnplannedMeals) {
        await updateLocalCache(data.addRecipeToUnplannedMeals);
        await refreshCookbookStats();
      }
      return data?.addRecipeToUnplannedMeals;
    } catch (error) {
      console.error("Error adding recipe to unplanned meals:", error);
      throw error;
    }
  };

  const removeRecipeFromTable = async (tableId: string, recipeId: string) => {
    try {
      const { data } = await removeRecipeFromTableMutation({
        variables: { tableId, recipeId },
      });

      if (data?.removeRecipeFromTable) {
        await updateLocalCache(data.removeRecipeFromTable);
        await refreshTable();
      }

      return data?.removeRecipeFromTable;
    } catch (error) {
      console.error("Error removing recipe from table:", error);
      throw error;
    }
  };

  // Collaborator operations
  const addCollaborator = async (input: { tableId: string; email: string }) => {
    try {
      // Step 1: Fetch the user by email using fetchUserByEmail from useUser
      const user = await fetchUserByEmail(input.email);
      if (!user) {
        throw new Error("User not found. Please check the email address.");
      }

      // Step 2: Extract the user ID
      const userId = user.id;
      if (!userId) {
        throw new Error("User ID not found. Please try again.");
      }

      // Step 3: Prepare the input for the mutation
      const mutationInput = {
        tableId: input.tableId,
        userId: userId, // Use the fetched user ID
        role: "EDITOR", // Default role (can be dynamic if needed)
      };

      // Step 4: Call the mutation
      const { data } = await addCollaboratorMutation({
        variables: { input: mutationInput },
      });

      // Step 5: Update the local cache and refresh the table data
      if (data?.addTableCollaborator) {
        await updateLocalCache(data.addTableCollaborator);
        await refreshTable();
      }

      return data?.addTableCollaborator;
    } catch (error) {
      console.error("Error adding collaborator:", error);
      throw error;
    }
  };

  const removeCollaborator = async (tableId: string, userId: string) => {
    try {
      const { data } = await removeCollaboratorMutation({
        variables: { tableId, userId },
      });
      if (data?.removeTableCollaborator) {
        await updateLocalCache(data.removeTableCollaborator);
        await refreshTable();
      }
      return data?.removeTableCollaborator;
    } catch (error) {
      console.error("Error removing collaborator:", error);
      throw error;
    }
  };

  const updateCollaboratorRole = async (
    tableId: string,
    userId: string,
    role: string
  ) => {
    try {
      // Ensure the role is valid
      const validRoles = ["OWNER", "EDITOR", "VIEWER"]; // Adjust based on your schema
      if (!validRoles.includes(role)) {
        throw new Error(
          `Invalid role: ${role}. Valid roles are: ${validRoles.join(", ")}`
        );
      }

      const { data } = await updateCollaboratorRoleMutation({
        variables: { tableId, userId, role },
      });

      if (data?.updateTableCollaboratorRole) {
        await updateLocalCache(data.updateTableCollaboratorRole);
        await refreshTable();
      }

      return data?.updateTableCollaboratorRole;
    } catch (error) {
      console.error("Error updating collaborator role:", error);
      throw error;
    }
  };

  return {
    // Queries
    table: tableData?.table,
    tables: myTablesData?.myTables || [],
    tableStats: tableStatsData?.myTableStats,
    cookbookStats: cookbookStatsData?.cookbookStats,

    // Loading states
    loading: {
      table: tableLoading,
      tables: myTablesLoading,
      stats: tableStatsLoading,
      cookbook: cookbookStatsLoading,
    },

    // Errors
    error: {
      table: tableError,
      tables: myTablesError,
    },

    // Operations
    createTable,
    updateTable,
    deleteTable,
    addRecipeToTable,
    addRecipeToUnplannedMeals,
    removeRecipeFromTable,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,

    // Refresh functions
    refresh: {
      table: refreshTable,
      tables: refreshMyTables,
      stats: refreshTableStats,
      cookbook: refreshCookbookStats,
    },
  };
};

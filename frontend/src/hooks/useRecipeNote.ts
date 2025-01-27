import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RECIPE_NOTE,
  GET_MY_RECIPE_NOTES,
  SAVE_RECIPE_NOTE,
  DELETE_RECIPE_NOTE,
} from "../graphql/operations/recipeNote";
import { useRecipeList } from "./useRecipe";

// Types for the hook
interface UseRecipeNoteProps {
  recipeId: string; // Recipe ID to fetch or manipulate a specific note
}

interface SaveNoteInput {
  recipeId: string;
  content: string;
}

export const useRecipeNote = ({ recipeId }: UseRecipeNoteProps) => {
  // Query: Get a specific note for the provided recipe ID
  const {
    data: noteData,
    loading: noteLoading,
    error: noteError,
    refetch: refetchNote,
  } = useQuery(GET_RECIPE_NOTE, {
    variables: { recipeId },
    skip: !recipeId,
    fetchPolicy: "cache-and-network",
  });

  // Query: Get all notes for the current user
  const {
    data: allNotesData,
    loading: allNotesLoading,
    error: allNotesError,
    refetch: refetchAllNotes,
  } = useQuery(GET_MY_RECIPE_NOTES, {
    fetchPolicy: "cache-first",
  });

  // Mutation: Save or update a note
  const [saveNote] = useMutation(SAVE_RECIPE_NOTE);

  // Mutation: Delete a note
  const [deleteNote] = useMutation(DELETE_RECIPE_NOTE);

  
  return {
    // Single note data
    note: noteData?.recipeNote,
    noteLoading,
    noteError,
    refetchNote,

    // All user's notes
    allNotes: allNotesData?.myRecipeNotes,
    allNotesLoading,
    allNotesError,
    refetchAllNotes,


    // Save and delete functions
    handleSaveNote: async (input: SaveNoteInput) => {
      try {
        await saveNote({ variables: { input } });
      } catch (error) {
        console.error("Error in handleSaveNote:", error);
      }
    },
    handleDeleteNote: async (id: string) => { 
        try {
          
          await deleteNote({ variables: { recipeId: id } });
          
        } catch (error) {
          console.error("Error in handleDeleteNote:", error);
        }
      },
  };
};

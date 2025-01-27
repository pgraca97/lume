import { useQuery } from "@apollo/client";
import { GET_TAGS } from "../graphql/operations/recipe";

export const useTagsList = () => {
  // Query for fetching tags list
  const {
    data: tagsData,
    loading: tagsLoading,
    error: tagsError,
    refetch: refetchTags,
  } = useQuery(GET_TAGS, {
    fetchPolicy: "cache-and-network",
  });

  return {
    tags: tagsData?.getAllTags || [], // Assuming the API returns an array of tags under the 'tags' key
    tagsLoading,
    tagsError,
    refetchTags,
  };
};

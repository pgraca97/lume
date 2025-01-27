// src/hooks/useRecipeSearch.ts
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_RECIPES } from '../graphql/operations/recipe';

interface SearchFilters {
    query?: string;
    tags?: string[];
    difficulty?: number;
    limit?: number;
    offset?: number;
}

export const useRecipeSearch = () => {
    const [filters, setFilters] = useState<SearchFilters>({
        limit: 10,
        offset: 0
    });
    
    const { data, loading, error } = useQuery(GET_RECIPES, {
        variables: filters,
        fetchPolicy: 'network-only'
    });
    
    const updateFilters = (newFilters: Partial<SearchFilters>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            query: newFilters.query?.trim() || undefined,
            difficulty: newFilters.difficulty || undefined,
            offset: 0
        }));
    };
    
    return {
        recipes: data?.searchRecipes || [],
        loading,
        error,
        filters,
        updateFilters
    };
};
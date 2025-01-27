import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { tokens } from "@/src/theme/tokens";
import { ArrowRight } from "lucide-react-native";

interface RecipeNoteCardProps {
  title: string; // Título da receita (já obtido no RecipeNoteScreen)
  note: string; // Última nota feita para a receita
  onPress: () => void; // Função chamada ao clicar no card
}

const RecipeNoteCard: React.FC<RecipeNoteCardProps> = ({ title, note, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Conteúdo de texto */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note} numberOfLines={2}>
          {note}
        </Text>
      </View>

      {/* Ícone de seta */}
      <View style={styles.arrowContainer}>
        <ArrowRight size={20} color={tokens.colors.primary[400]} />
      </View>
    </TouchableOpacity>
  );
};

export default RecipeNoteCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: tokens.colors.background.secondary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: tokens.borderRadius.md,
    marginVertical: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  note: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 20,
  },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

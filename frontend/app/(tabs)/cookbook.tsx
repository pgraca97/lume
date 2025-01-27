import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableHighlight } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@/src/hooks/useUser";
import { tokens } from "@/src/theme/tokens";
import { BotMessageSquare } from "lucide-react-native";
import CardNote from "@/src/components/cards/NoteCard";
import { useRecipeNote } from "@/src/hooks/useRecipeNote";

export default function Cookbook() {
  const { user } = useUser();
  const { allNotes, allNotesLoading, refetchAllNotes } = useRecipeNote({
    recipeId: "",
  });
  const [noteCount, setNoteCount] = useState(0);
  const router = useRouter();

  const handleGoToChat = () => {
    router.push("/chat");
  };

  useEffect(() => {
    if (!allNotesLoading && allNotes) {
      setNoteCount(allNotes.length);
    }
  }, [allNotes, allNotesLoading]);

  useEffect(() => {
    const unsubscribe = router.events?.on("focus", () => {
      refetchAllNotes();
    });

    return () => {
      unsubscribe?.();
    };
  }, [router, refetchAllNotes]);

  return (
    <View style={styles.container}>
      <TouchableHighlight
        style={styles.chat}
        underlayColor={tokens.colors.primary[500]}
        onPress={handleGoToChat}
      >
        <BotMessageSquare size={32} color="white" />
      </TouchableHighlight>

      <View style={styles.container}>
        <View style={styles.containerNotes}>
          <CardNote
            title="Your Notes"
            subtitle={`${noteCount} receitas`}
            onPress={() => {
              console.log("Navigating to note page");
              router.push({ pathname: "/note/[id]", params: { id: user.id } });
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  containerNotes: {
    marginTop: 15,
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
});

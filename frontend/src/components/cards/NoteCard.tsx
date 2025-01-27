import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { tokens } from "@/src/theme/tokens"; 
import { ArrowRight } from "lucide-react-native"; 

interface CardNoteProps {
  title: string; //Mostra o titulo
  subtitle: string; 
  onPress: () => void; // Função chamada ao pressionar o card
}

const CardNote: React.FC<CardNoteProps> = ({ title, subtitle, onPress }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress}>
        {/* Ícone */}
        <View style={styles.iconContainer}>
          <Image
            source={require("../../../assets/images/notasIcon.png")}
            style={styles.icon}
          />
        </View>
  
        {/* Texto */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
  
        {/* Ícone de seta */}
        <View style={styles.arrowContainer}>
          <ArrowRight size={20} color={tokens.colors.primary[400]} />
        </View>
      </TouchableOpacity>
    );
  };
  
  export default CardNote;


  const styles = StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: tokens.colors.background.secondary,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: tokens.borderRadius.md,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      width: "90%",
      alignSelf: "center", 
    },
    iconContainer: {
     
      borderRadius: 50, 
      padding: 10,
    },
    icon: {
      width: 50,
      height: 50, 
    },
    textContainer: {
      flex: 1,
      paddingHorizontal: 10,
    },
    title: {
        fontSize: tokens.fontSize.lg,
        fontWeight: tokens.fontWeight.medium,
        color: tokens.colors.text.primary,
    },
    subtitle: {
        fontSize: tokens.fontSize.sm,
        color: tokens.colors.text.secondary,
        marginTop: 4,
      },
    arrowContainer: {
      paddingLeft: 10,
    },
  });
  
  
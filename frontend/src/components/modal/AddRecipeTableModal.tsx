import { tokens } from "@/src/theme/tokens";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from "react-native";

interface AddToCollectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  tables: Array<{
    id: string;
    title: string;
    recipeCount: number;
    emoji: string;
  }>;
  recipeId: string;
  onAddToTable: (tableId: string, recipeId: string) => void;
}

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isVisible,
  onClose,
  tables,
  recipeId,
  onAddToTable,
}) => {
  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Adicionar à Coleção</Text>
          </View>
          <FlatList
            data={tables}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <View>
                  <Text style={styles.tableName}>
                    {item.emoji} {item.title}
                  </Text>
                  <Text style={styles.recipeCount}>
                    {item.recipeCount} Receitas
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => onAddToTable(item.id, recipeId)}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#FFF8F2",
    borderRadius: tokens.borderRadius.xl,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#FFEED9",
    borderRadius: 8,
    marginBottom: 8,
    width: 220,
  },
  tableName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  recipeCount: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: "#FF9900",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  separator: {
    height: 8,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FF9900",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AddToCollectionModal;

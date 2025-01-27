import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { tokens } from "@/src/theme/tokens";

interface EditCollectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (title: string, subtitle: string, privacy: string) => void;
  initialTitle: string;
  initialSubtitle: string;
  initialPrivacy: string;
}

const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  isVisible,
  onClose,
  onSave,
  initialTitle,
  initialSubtitle,
  initialPrivacy,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [privacy, setPrivacy] = useState(initialPrivacy);

  const handleSave = () => {
    onSave(title, subtitle, privacy);
    onClose();
  };

  return (
    <Modal transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Editar Coleção</Text>
          <TextInput
            style={styles.input}
            placeholder="Título"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Subtítulo"
            value={subtitle}
            onChangeText={setSubtitle}
          />
          <View style={styles.privacyContainer}>
            <TouchableOpacity
              style={[styles.privacyOption, privacy === "PUBLIC" && styles.selectedPrivacy]}
              onPress={() => setPrivacy("PUBLIC")}
            >
              <Text>Público</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.privacyOption, privacy === "PRIVATE" && styles.selectedPrivacy]}
              onPress={() => setPrivacy("PRIVATE")}
            >
              <Text>Privado</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>
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
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  privacyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  privacyOption: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedPrivacy: {
    backgroundColor: tokens.colors.primary[100],
    borderColor: tokens.colors.primary[700],
  },
  saveButton: {
    backgroundColor: tokens.colors.primary[700],
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: tokens.colors.primary[700],
  },
  closeButtonText: {
    color: tokens.colors.primary[700],
  },
});

export default EditCollectionModal;
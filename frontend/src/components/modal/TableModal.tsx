import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableHighlight,
  StyleSheet,
  Alert,
} from "react-native";

const CreateTableModal = ({
  isVisible,
  onClose,
  onCreate,
}: {
  isVisible: boolean;
  onClose: () => void;
  onCreate: (tableData: any) => void;
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [privacy, setPrivacy] = useState("PRIVATE");

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Erro", "O título da coleção é obrigatório!");
      return;
    }

    const tableData = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      emoji,
      privacy,
    };

    onCreate(tableData);
    onClose();
    setTitle("");
    setSubtitle("");
    setEmoji("📚");
    setPrivacy("PRIVATE");
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Criar Nova Coleção</Text>
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
          <TextInput
            style={styles.input}
            placeholder="Emoji"
            value={emoji}
            onChangeText={setEmoji}
          />
          <TouchableHighlight
            style={styles.privacyButton}
            onPress={() => setPrivacy(privacy === "PRIVATE" ? "PUBLIC" : "PRIVATE")}
          >
            <Text style={styles.privacyButtonText}>
              Privacidade: {privacy === "PRIVATE" ? "Privada" : "Pública"}
            </Text>
          </TouchableHighlight>

          <View style={styles.buttonRow}>
            <TouchableHighlight style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableHighlight>
            <TouchableHighlight style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  privacyButton: {
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    marginBottom: 20,
  },
  privacyButtonText: {
    color: "#555",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    backgroundColor: "#f66",
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#4caf50",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CreateTableModal;

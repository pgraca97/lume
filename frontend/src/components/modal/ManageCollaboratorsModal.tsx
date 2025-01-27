import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Image } from "react-native";
import { tokens } from "@/src/theme/tokens";
import { ChevronLeft, Trash, UserPlus, UserCheck } from "lucide-react-native";

interface Collaborator {
  id: string;
  user: {
    id: string;
    profile: {
      username: string;
      profileImage: string;
    };
    email: string;
  };
  role: string;
}

interface ManageCollaboratorsModalProps {
  isVisible: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  isOwner: boolean;
  onDeleteCollaborator: (userId: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
  onAddCollaborator: (email: string) => void;
}

const ManageCollaboratorsModal: React.FC<ManageCollaboratorsModalProps> = ({
  isVisible,
  onClose,
  collaborators,
  isOwner,
  onDeleteCollaborator,
  onUpdateRole,
  onAddCollaborator,
}) => {
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  const handleAddCollaborator = async () => {
    try {
      await onAddCollaborator(newCollaboratorEmail);
      setNewCollaboratorEmail(""); // Clear the input field
    } catch (error) {
      console.error("Error adding collaborator:", error);
    }
  };

  const handleRoleChange = (userId: string, currentRole: string) => {
    // Toggle between VIEWER and EDITOR
    const newRole = currentRole === "VIEWER" ? "EDITOR" : "VIEWER";
    onUpdateRole(userId, newRole);
  };

  return (
    <Modal transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Gerir Participantes</Text>

          {/* Add Collaborator Section */}
          <View style={styles.addCollaboratorContainer}>
            <TextInput
              style={styles.input}
              placeholder="Adicionar por email"
              value={newCollaboratorEmail}
              onChangeText={setNewCollaboratorEmail}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCollaborator}>
              <UserPlus size={20} color={tokens.colors.primary[700]} />
            </TouchableOpacity>
          </View>

          {/* Collaborator List */}
          <FlatList
            data={collaborators}
            keyExtractor={(item) => item.user.id}
            renderItem={({ item }) => (
              <View style={styles.collaboratorItem}>
                <Image
                  source={{ uri: item.user.profile?.profileImage || "https://via.placeholder.com/150" }}
                  style={styles.profileImage}
                />
                <View style={styles.collaboratorInfo}>
                  <Text style={styles.collaboratorName}>
                    {item.user.profile?.username || item.user.email}
                  </Text>
                  <Text style={styles.collaboratorRole}>{item.role}</Text>
                </View>
                {isOwner && (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRoleChange(item.user.id, item.role)}
                    >
                      <UserCheck size={20} color={tokens.colors.primary[700]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onDeleteCollaborator(item.user.id)}
                    >
                      <Trash size={20} color={tokens.colors.primary[700]} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum colaborador encontrado.</Text>}
          />

          {/* Close Button */}
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
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  addCollaboratorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: tokens.colors.primary[100],
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  addButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: tokens.colors.primary[100],
  },
  collaboratorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.primary[100],
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  collaboratorRole: {
    fontSize: 14,
    color: tokens.colors.text.secondary,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 12,
  },
  emptyText: {
    fontSize: 16,
    color: tokens.colors.text.secondary,
    textAlign: "center",
    marginTop: 16,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: tokens.colors.primary[100],
  },
  closeButtonText: {
    fontSize: 16,
    color: tokens.colors.primary[700],
    fontWeight: "bold",
  },
});

export default ManageCollaboratorsModal;
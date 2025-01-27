import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Define the props interface
interface TableConfigModalProps {
  isVisible: boolean; // `isVisible` is a boolean
  onClose: () => void; // `onClose` is a function that returns void
  onEditCollection: () => void; // New prop to handle edit collection
  onManageCollaborator: () => void; // New prop to handle manage collaborators
}

const TableConfigModal: React.FC<TableConfigModalProps> = ({ isVisible, onClose, onEditCollection, onManageCollaborator }) => {
  return (
    <Modal
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Add onPress to open the EditCollectionModal */}
          <TouchableOpacity style={styles.modalOption} onPress={onEditCollection}>
            <Text style={styles.modalOptionText}>Editar Coleção</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={onManageCollaborator}>
            <Text style={styles.modalOptionText}>Gerir Participantes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption}>
            <Text style={styles.modalOptionText}>Eliminar Coleção</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ff4444',
  },
});

export default TableConfigModal;
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  Linking,
} from "react-native";
import { tokens } from "@/src/theme/tokens";
import { Pencil, X, UserRound } from "lucide-react-native";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import { useUser } from "@/src/hooks/useUser";

import ImagePicker from "react-native-image-crop-picker";
import { useImageUpload } from "@/src/hooks/useImageUpload";

async function requestCameraAndStoragePermissions() {
  if (Platform.OS === "android") {
    try {
      const androidVersion = Platform.Version;

      let granted;
      if (androidVersion >= 33) {
        // For Android 13+ (API level 33+), request the new permission model
        granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      } else {
        // For older versions, request legacy permissions
        granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      }

      console.log(granted); // Log the permission results for debugging

      // Check if the camera permission is granted or denied with 'never_ask_again'
      if (
        granted["android.permission.CAMERA"] === "granted" ||
        granted["android.permission.READ_EXTERNAL_STORAGE"] === "granted"
      ) {
        return true;
      } else if (granted["android.permission.CAMERA"] === "never_ask_again") {
        // If the user has denied the permission with "Don't ask again"
        alert(
          "Camera permission is required. Please enable it in the app settings."
        );
        Linking.openSettings(); // Open the app settings
        return false;
      } else {
        alert("Permissions not granted. Please enable them in settings.");
        Linking.openSettings(); // Open app settings for the user to manually enable permissions
        return false;
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  }
  return true; // iOS permissions handled differently
}

interface UserProfileCardProps {
  profileImage?: string;
  username?: string;
  bio?: string;
}

export function UserProfileCard(props: UserProfileCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState(props.username || "");
  const [newBio, setNewBio] = useState(props.bio || "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [reauthModalVisible, setReauthModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    props.profileImage || null
  );
  const [newImage, setNewImage] = useState<string | null>(null);
  const { uploadImage } = useImageUpload();

  const { updateProfile } = useUser();

  useEffect(() => {}, [modalVisible]);

  const handleImageUpload = async () => {
    const hasPermission = await requestCameraAndStoragePermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const image = await ImagePicker.openPicker({
        false: true,
        mediaType: "photo",
        compressImageQuality: 0.8,
      });

      const selectedUri = image.path;
      setSelectedImage(selectedUri);
      setNewImage(selectedUri);
    } catch (error) {
      if (error.code !== "E_PICKER_CANCELLED") {
        console.error("ImagePicker Error: ", error);
      }
    }
  };

  const handleSave = async () => {
    try {
      let profileImageInput = null;

      if (newImage) {
        const blobPath = await uploadImage(newImage);
        if (blobPath) {
          profileImageInput = {
            uploadedImage: {
              type: "UPLOAD", // Assuming "UPLOAD" is the correct type for uploaded images
              blobPath: blobPath,
            },
          };
        } else {
          throw new Error("Image upload failed");
        }
      }

      await updateProfile({
        variables: {
          input: {
            bio: newBio,
            profileImage: profileImageInput, // Pass the correctly structured object
            username: newUsername,
          },
        },
      });

      setPhotoModalVisible(false);
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const reauthenticate = async () => {
    const currentUser = auth().currentUser;
    if (currentUser && currentPassword) {
      const credential = auth.EmailAuthProvider.credential(
        currentUser.email || "",
        currentPassword
      );

      try {
        await currentUser.reauthenticateWithCredential(credential);
        Alert.alert("Sucesso", "Reautenticação concluída.");
        setReauthModalVisible(false);
        // Após reautenticar, prossegue com a atualização
      } catch (error: any) {
        Alert.alert("Erro", "Falha na reautenticação. Verifique sua senha.");
      }
    }
  };

  // Função de Logout
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Tem certeza de que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          onPress: async () => {
            try {
              await auth().signOut();
              Alert.alert("Logout realizado com sucesso!");
              setModalVisible(false); // Fecha o modal após logout
            } catch (error: any) {
              Alert.alert("Erro", "Não foi possível fazer logout.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View>
      <View style={styles.header}>
        {props.profileImage ? (
          <Image
            source={{ uri: props.profileImage }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <UserRound size={60} color={tokens.colors.text.primary} />
          </View>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.welcome}>
            {props.username || "Usuário Anônimo"}
          </Text>
          <Text style={styles.subtitle}>
            {props.bio || "Sem biografia disponível."}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.editButton}
        >
          <Pencil size={20} color={tokens.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Modal de Edição */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {editMode ? (
                  <>
                    {/*Modal Editar Perfil*/}
                    <TouchableOpacity
                      onPress={() => setEditMode(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color={tokens.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Editar Perfil</Text>

                    <TouchableOpacity
                      onPress={() => setPhotoModalVisible(true)}
                    >
                      <TouchableOpacity onPress={handleImageUpload}>
                        {selectedImage ? (
                          <Image
                            source={{ uri: selectedImage }}
                            style={styles.profileImageModal}
                          />
                        ) : (
                          <View style={styles.defaultAvatar}>
                            <UserRound
                              size={60}
                              color={tokens.colors.text.primary}
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>

                    <TextInput
                      style={styles.input}
                      value={newUsername}
                      onChangeText={setNewUsername}
                      placeholder="Nome de usuário"
                    />

                    <TextInput
                      style={styles.input}
                      value={newBio}
                      onChangeText={setNewBio}
                      placeholder="Biografia"
                    />

                    <TextInput
                      style={styles.input}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      placeholder="Email"
                      keyboardType="email-address"
                    />

                    <TextInput
                      style={styles.input}
                      onChangeText={setNewPassword}
                      placeholder={
                        newPassword === ""
                          ? "Digite uma nova senha"
                          : "Nova senha (mín. 6 caracteres)"
                      }
                      secureTextEntry
                    />

                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                    >
                      <Text style={styles.saveButtonText}>
                        Guardar alterações
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/*Modal opções*/}

                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color={tokens.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Opções</Text>
                    <TouchableOpacity
                      style={styles.option}
                      onPress={() => setEditMode(true)}
                    >
                      <Text style={styles.optionText}>Editar Perfil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option}>
                      <Text style={styles.optionText}>Avaliações</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option}>
                      <Text style={styles.optionText}>Questionário</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.option}
                      onPress={handleLogout}
                    >
                      <Text style={styles.optionText}>Logout</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/*Modal editar foto*/}
      <Modal
        animationType="slide"
        transparent={true}
        visible={photoModalVisible}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPhotoModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.photoModalContent}>
                <Text style={styles.modalTitle}>Alterar Foto de Perfil</Text>
                <TouchableOpacity style={styles.option}>
                  <Text style={styles.optionText}>Escolher da galeria</Text>
                  <Text>Seleciona uma foto existente</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.option}>
                  <Text style={styles.optionText}>Avatares Lume</Text>
                  <Text>Seleciona um avatar padrão do Lume</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal de Reautenticação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reauthModalVisible}
        onRequestClose={() => setReauthModalVisible(false)}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reautenticação</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Senha Atual"
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={reauthenticate}
              >
                <Text style={styles.saveButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImageModal: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    position: "relative",
  },
  headerContent: {
    marginLeft: 15,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colors.gray[200],
  },
  defaultAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colors.gray[200],
    marginBottom: 20,
  },
  welcome: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  subtitle: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  editButton: {
    position: "absolute",
    right: 20,
    top: 20,
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: tokens.colors.background.primary,
    padding: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.primary[500],
    marginBottom: 20,
  },
  photoModalContent: {
    backgroundColor: tokens.colors.background.primary,
    padding: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "flex-start",
    width: "100%",
  },
  photoModalTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: tokens.colors.gray[200],
    borderRadius: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: tokens.colors.primary[500],
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  option: {
    padding: 20,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
  },
  optionText: {
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.text.primary,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 20,
  },
});

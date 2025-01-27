import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useUser } from "@/src/hooks/useUser";
import { UserProfileCard } from "@/src/components/cards/UserProfileCard";
import { BotMessageSquare } from "lucide-react-native";
import { tokens } from "@/src/theme/tokens";
import { TopNavBar } from "@/src/components/Nav/TopBarProfile";
import { useState } from "react";
import MealPlanList from "@/src/components/cards/MealPlanCalendar";
import { useMealPlan } from "@/src/hooks/useMealPlan";
import TableCard from "@/src/components/cards/TableCard";
import { useTable } from "@/src/hooks/useTable";
import CreateTableModal from "@/src/components/modal/TableModal";
import { useRouter } from "expo-router";
import BadgesList from "@/src/components/cards/BadgesList";

export default function PrepStation() {
  const { user, loading: userLoading, error: userError } = useUser();
  const {
    tables,
    loading: tablesLoading,
    error: tableError,
    createTable,
    refresh: { tables: refreshMyTables },
  } = useTable();
  const [activeTab, setActiveTab] = useState<string>("basket");
  const [isModalVisible, setModalVisible] = useState(false);

  const router = useRouter();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    console.log("Aba ativa:", tab);
  };

  const handleCreateTable = async (createTable: any, tableData: any) => {
    try {
      const newTable = await createTable(tableData);
      Alert.alert("Sucesso", `Coleção "${newTable.title}" criada!`);
      await refreshMyTables();
    } catch (error) {
      console.error("Erro ao criar a coleção:", error);
      Alert.alert("Erro", "Não foi possível criar a coleção.");
    } finally {
      setModalVisible(false);
    }
  };

  // Function to render tab-specific text
  const renderTabContent = () => {
    switch (activeTab) {
      case "basket":
        return "Aqui estão seus itens do carrinho!";
      case "calendar":
        return (
          <>
            <MealPlanList />
          </>
        );
      case "badge":
        return (
          <>
            <BadgesList />
          </>
        );
      case "collection":
        return (
          <ScrollView style={styles.collectionContainer}>
            <TouchableHighlight
              style={styles.addButton}
              underlayColor={tokens.colors.primary[500]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Criar Nova Coleção</Text>
            </TouchableHighlight>

            <View style={styles.tablesContainer}>
              {tables && tables.length > 0 ? (
                tables.map((table) => {
                  // Ensure all fields are serialized
                  const serializedTable = {
                    ...table,
                    id: table.id.toString(), // Ensure table.id is a string
                    recipeCount: table.recipeCount || 0, // Ensure recipeCount is a number
                    collaboratorCount: table.collaborators?.length || 0, // Ensure collaboratorCount is a number
                    previewImages:
                      table.recipes
                        ?.slice(0, 3)
                        .map((recipe) => recipe.imageUrl) || [], // Ensure previewImages contains only strings
                  };

                  return (
                    <TouchableOpacity
                      key={serializedTable.id}
                      style={styles.tableCard}
                      onPress={() => {
                        console.log(
                          "Navigating to table detail page:",
                          serializedTable.id
                        );
                        router.push({
                          pathname: "/table/[id]",
                          params: { id: serializedTable.id },
                        });
                      }}
                    >
                      <TableCard
                        title={`${table.emoji || ""} ${
                          table.title || "Sem Título"
                        }`}
                        recipeCount={serializedTable.recipeCount}
                        collaboratorCount={serializedTable.collaboratorCount}
                        previewImages={serializedTable.previewImages}
                        isPrivate={table.privacy === "PRIVATE"}
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  {tablesLoading ? (
                    <ActivityIndicator
                      size="large"
                      color={tokens.colors.primary[500]}
                    />
                  ) : (
                    <Text style={styles.errorText}>
                      {tableError
                        ? "Erro ao carregar tabelas."
                        : "Nenhuma tabela disponível para exibir."}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <CreateTableModal
              isVisible={isModalVisible}
              onClose={() => setModalVisible(false)}
              onCreate={(tableData) =>
                handleCreateTable(createTable, tableData)
              }
            />
          </ScrollView>
        );
      default:
        return "Selecione uma aba.";
    }
  };

  return (
    <View style={styles.container}>
      <UserProfileCard
        profileImage={user?.profile?.profileImageUrl}
        username={user?.profile?.username}
        bio={user?.profile?.bio}
      />

      {/* Top Navigation Bar */}
      <TopNavBar onTabChange={handleTabChange} />

      {/* Render Tab Content */}
      <ScrollView style={styles.tabContent}>
        <Text style={styles.tabText}>{renderTabContent()}</Text>
      </ScrollView>

      <TouchableHighlight
        style={styles.chat}
        underlayColor={tokens.colors.primary[500]}
      >
        <BotMessageSquare size={32} color="white" />
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  tabContent: {
    marginTop: 20,
  },
  tabText: {
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.text.primary,
  },
  tablesContainer: {
    flex: 1,
    padding: 16,
  },
  tableCard: {
    marginBottom: 16,
    borderRadius: tokens.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  errorText: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.secondary,
    textAlign: "center",
  },
  addButton: {
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: tokens.colors.primary[500],
    borderRadius: 8,
    alignSelf: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: tokens.fontSize.md,
    fontWeight: "bold",
  },
  collectionContainer: {
    flex: 1,

    backgroundColor: tokens.colors.background.primary,
    width: Dimensions.get("window").width,
  },
});

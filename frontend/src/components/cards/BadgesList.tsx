import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { useBadges } from "@/src/hooks/useBadges";
import { useUser } from "@/src/hooks/useUser";
import { tokens } from "@/src/theme/tokens";
import { UtensilsCrossed } from "lucide-react-native";
import { Progress } from "tamagui";

const BadgesList = () => {
  const { user, refreshUser } = useUser();
  const [isUserBadges, setIsUserBadges] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const {
    unconqueredBadges,
    unconqueredBadgesLoading,
    unconqueredBadgesError,
    unconqueredBadgesRefetch,
  } = useBadges(user?.id); // Use optional chaining

  const {
    conqueredBadges,
    conqueredBadgesLoading,
    conqueredBadgesError,
    conqueredBadgesRefetch,
  } = useBadges(user?.id); // Use optional chaining

  // Fetch unconquered badges again when user changes
  useEffect(() => {
    refreshUser();
    if (user && user.id) {
      unconqueredBadgesRefetch(); // Make sure you call the function
      conqueredBadgesRefetch();
    }
  }, [user, unconqueredBadgesRefetch, conqueredBadgesRefetch]);

  // Open modal with milestones when user long presses on the badge icon
  const openModal = (badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  // Close the modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedBadge(null);
  };

  return (
    <ScrollView style={styles.page} nestedScrollEnabled={true}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={
            isUserBadges
              ? styles.buttonContainerSelected
              : styles.buttonContainer
          }
          onPress={() => setIsUserBadges(true)}
        >
          <Text style={styles.buttonText}>Unlocked Badges</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={
            isUserBadges
              ? styles.buttonContainer
              : styles.buttonContainerSelected
          }
          onPress={() => setIsUserBadges(false)}
        >
          <Text style={styles.buttonText}>Unconquered Badges</Text>
        </TouchableOpacity>
      </View>
      {isUserBadges ? (
        <View style={styles.listContainer}>
          {conqueredBadgesLoading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : conqueredBadges?.length > 0 ? (
            conqueredBadges.map((group, index) => (
              <View key={index}>
                {group.badges.map((badge, badgeIndex) => (
                  <View key={badgeIndex} style={styles.badgeItem}>
                    <View>
                      <Image
                        style={styles.badgeImage}
                        source={{ uri: badge.assetUrl }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.badgeTextContainer}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeDescription}>
                        {badge.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View
              style={{
                alignItems: "center",
                flex: 1,
                marginTop: 40,
                marginBottom: 50,
              }}
            >
              <Image
                style={styles.noBadgesImage}
                source={require("../../../assets/images/noBadges.png")}
                resizeMode="contain"
              />
              <Text style={styles.noBadgesText}>No badges unlocked yet!</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {unconqueredBadgesLoading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : unconqueredBadges?.length > 0 ? (
            unconqueredBadges.map((group, index) => (
              <View key={index}>
                {group.badges.map((badge, badgeIndex) => (
                  <View key={badgeIndex} style={styles.badgeItem}>
                    <View>
                      <Image
                        style={styles.badgeImage}
                        source={{ uri: badge.assetUrl }}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.badgeTextContainer}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeDescription}>
                        {badge.description}
                      </Text>
                      <View style={{ flexDirection: "row" }}>
                        <Progress
                          value={badge.userProgress.progress} // progress out of total milestones
                          height={6} // height of the progress bar
                          borderRadius={3} // rounded corners
                          width={180}
                          style={styles.progressBar} // Custom style for the progress bar
                        >
                          <Progress.Indicator
                            backgroundColor={tokens.colors.primary[500]}
                          />
                        </Progress>
                        <TouchableOpacity onPress={() => openModal(badge)}>
                          <UtensilsCrossed
                            size={25}
                            color={tokens.colors.text.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>All badges were conquered</Text>
          )}
        </View>
      )}

      {/* Modal to show milestones */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        onRequestClose={closeModal}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedBadge && (
              <ScrollView>
                <Text style={styles.modalTitle}>Milestones</Text>
                {selectedBadge.userProgress.milestones.map(
                  (milestone, index) => (
                    <View key={index} style={styles.milestoneContainer}>
                      <Text style={styles.milestoneDescription}>
                        {milestone.description}
                      </Text>
                      <View
                        style={{
                          justifyContent: "space-between",
                          flexDirection: "row",
                        }}
                      >
                        <Text style={styles.milestoneStatus}>
                          {milestone.completed ? "Completed" : "In Progress"}
                        </Text>
                        <Text style={styles.milestoneStatus}>
                          {milestone.currentCount}/{milestone.requiredCount}
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </ScrollView>
            )}
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: {
    width: "100%",
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    padding: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  buttonContainer: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[100],
    borderWidth: 2,
    borderRadius: tokens.borderRadius.full,
    flexWrap: "wrap",
    padding: 5,
    paddingHorizontal: 20,
  },
  buttonContainerSelected: {
    backgroundColor: tokens.colors.primary[200],
    borderColor: tokens.colors.primary[400],
    borderWidth: 2,
    borderRadius: tokens.borderRadius.full,
    flexWrap: "wrap",
    padding: 5,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  listContainer: {
    paddingBottom: 20,
    marginTop: 20,
  },
  badgeItem: {
    backgroundColor: tokens.colors.primary[50],
    padding: 15,
    borderRadius: tokens.borderRadius.md,
    marginBottom: 10,
    flexDirection: "row",
  },
  badgeImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeName: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: 5,
  },
  badgeDescription: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  progressBar: {
    marginTop: 10,
    backgroundColor: tokens.colors.primary[100],
    marginRight: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.secondary,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  modalContainer: {
    backgroundColor: tokens.colors.background.primary,
    width: "80%",
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadius.md,
    padding: 20,
  },
  closeButton: {
    padding: 10,
    backgroundColor: tokens.colors.primary[200],
    borderRadius: tokens.borderRadius.full,
    marginBottom: 20,
  },
  closeText: {
    textAlign: "center",
    color: tokens.colors.text.primary,
    fontSize: tokens.fontSize.md,
  },
  modalTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: 15,
  },
  milestoneContainer: {
    marginBottom: 25,
  },
  milestoneDescription: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.medium,
    marginBottom: 5,
  },
  milestoneStatus: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  noBadgesImage: {
    marginRight: 10,
    width: 175,
    height: 175,
  },
  noBadgesText: {
    fontSize: tokens.fontSize.xl,

    marginTop: 20,
    color: tokens.colors.primary[400],
    fontWeight: tokens.fontWeight.medium,
  },
});

export default BadgesList;

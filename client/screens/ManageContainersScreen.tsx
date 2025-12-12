import React, { useState, useRef } from "react";
import { View, StyleSheet, FlatList, Modal, ActivityIndicator, Pressable, Alert, Switch, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { ProgressBar } from "@/components/ProgressBar";
import { FilterChip } from "@/components/FilterChip";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { Spacing, BorderRadius, getFillLevelColor } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { CustomerContainer, WarehouseContainer } from "@shared/schema";

type ContainerType = "customer" | "warehouse";
type ModalMode = "view" | "create" | "edit";

interface ContainerFormData {
  id: string;
  customerName: string;
  location: string;
  materialType: string;
  maxCapacity: string;
  latitude: string;
  longitude: string;
}

const initialFormData: ContainerFormData = {
  id: "",
  customerName: "",
  location: "",
  materialType: "",
  maxCapacity: "",
  latitude: "",
  longitude: "",
};

export default function ManageContainersScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { theme, isDark } = useTheme();
  const resetAnimationOpacity = useSharedValue(1);

  const [activeTab, setActiveTab] = useState<ContainerType>("warehouse");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [selectedWarehouseContainer, setSelectedWarehouseContainer] = useState<WarehouseContainer | null>(null);
  const [selectedCustomerContainer, setSelectedCustomerContainer] = useState<CustomerContainer | null>(null);
  const [formData, setFormData] = useState<ContainerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<ContainerFormData>>({});
  const [recentlyResetId, setRecentlyResetId] = useState<string | null>(null);

  const { data: customerContainers = [], isLoading: loadingCustomer } = useQuery<CustomerContainer[]>({
    queryKey: ["/api/containers/customer"],
  });

  const { data: warehouseContainers = [], isLoading: loadingWarehouse } = useQuery<WarehouseContainer[]>({
    queryKey: ["/api/containers/warehouse"],
  });

  const isLoading = activeTab === "customer" ? loadingCustomer : loadingWarehouse;

  // QR codes are now generated server-side and remain stable
  // No frontend QR code generation - backend handles it

  const validateForm = (): boolean => {
    const errors: Partial<ContainerFormData> = {};
    
    if (!formData.id.trim()) {
      errors.id = "Container ID is required";
    }
    
    if (!formData.location.trim()) {
      errors.location = "Location is required";
    }
    
    if (!formData.materialType.trim()) {
      errors.materialType = "Material type is required";
    }
    
    if (activeTab === "customer" && !formData.customerName.trim()) {
      errors.customerName = "Customer name is required";
    }
    
    if (activeTab === "warehouse") {
      const capacity = parseFloat(formData.maxCapacity);
      if (isNaN(capacity) || capacity <= 0) {
        errors.maxCapacity = "Valid capacity is required";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setModalMode("create");
    setSelectedWarehouseContainer(null);
    setSelectedCustomerContainer(null);
    setModalVisible(true);
  };

  const openViewModal = (container: WarehouseContainer | CustomerContainer, type: ContainerType) => {
    if (type === "warehouse") {
      setSelectedWarehouseContainer(container as WarehouseContainer);
      setSelectedCustomerContainer(null);
    } else {
      setSelectedCustomerContainer(container as CustomerContainer);
      setSelectedWarehouseContainer(null);
    }
    setModalMode("view");
    setModalVisible(true);
  };

  const openEditModal = () => {
    if (selectedWarehouseContainer) {
      setFormData({
        id: selectedWarehouseContainer.id,
        customerName: "",
        location: selectedWarehouseContainer.location,
        materialType: selectedWarehouseContainer.materialType,
        maxCapacity: selectedWarehouseContainer.maxCapacity.toString(),
        latitude: "",
        longitude: "",
      });
    } else if (selectedCustomerContainer) {
      setFormData({
        id: selectedCustomerContainer.id,
        customerName: selectedCustomerContainer.customerName,
        location: selectedCustomerContainer.location,
        materialType: selectedCustomerContainer.materialType,
        maxCapacity: "",
        latitude: selectedCustomerContainer.latitude?.toString() || "",
        longitude: selectedCustomerContainer.longitude?.toString() || "",
      });
    }
    setFormErrors({});
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedWarehouseContainer(null);
    setSelectedCustomerContainer(null);
    setFormData(initialFormData);
    setFormErrors({});
    setModalMode("view");
  };

  const handleCreateContainer = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // QR code is generated server-side for stability
      if (activeTab === "warehouse") {
        await apiRequest("POST", "/api/containers/warehouse", {
          id: formData.id.trim(),
          location: formData.location.trim(),
          materialType: formData.materialType.trim(),
          maxCapacity: parseFloat(formData.maxCapacity),
          currentAmount: 0,
          isActive: true,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/containers/warehouse"] });
      } else {
        await apiRequest("POST", "/api/containers/customer", {
          id: formData.id.trim(),
          customerName: formData.customerName.trim(),
          location: formData.location.trim(),
          materialType: formData.materialType.trim(),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          isActive: true,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/containers/customer"] });
      }
      
      closeModal();
      showToast("Container wurde erfolgreich erstellt", "success");
    } catch (err) {
      console.error("Failed to create container:", err);
      showToast("Fehler beim Erstellen des Containers", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContainer = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (selectedWarehouseContainer) {
        await apiRequest("PATCH", `/api/containers/warehouse/${selectedWarehouseContainer.id}`, {
          location: formData.location.trim(),
          materialType: formData.materialType.trim(),
          maxCapacity: parseFloat(formData.maxCapacity),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/containers/warehouse"] });
      } else if (selectedCustomerContainer) {
        await apiRequest("PATCH", `/api/containers/customer/${selectedCustomerContainer.id}`, {
          customerName: formData.customerName.trim(),
          location: formData.location.trim(),
          materialType: formData.materialType.trim(),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/containers/customer"] });
      }
      
      closeModal();
      showToast("Container wurde erfolgreich aktualisiert", "success");
    } catch (err) {
      console.error("Failed to update container:", err);
      showToast("Fehler beim Aktualisieren des Containers", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    const container = selectedWarehouseContainer || selectedCustomerContainer;
    if (!container) return;
    
    const newStatus = !container.isActive;
    const type = selectedWarehouseContainer ? "warehouse" : "customer";
    
    setIsSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/containers/${type}/${container.id}`, {
        isActive: newStatus,
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${type}`] });
      
      if (selectedWarehouseContainer) {
        setSelectedWarehouseContainer({ ...selectedWarehouseContainer, isActive: newStatus });
      } else if (selectedCustomerContainer) {
        setSelectedCustomerContainer({ ...selectedCustomerContainer, isActive: newStatus });
      }
      
      showToast(`Container wurde ${newStatus ? "aktiviert" : "deaktiviert"}`, "success");
    } catch (err) {
      console.error("Failed to toggle container status:", err);
      showToast("Fehler beim Ändern des Container-Status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateQRCode = async () => {
    const container = selectedWarehouseContainer || selectedCustomerContainer;
    if (!container) return;
    
    const type = selectedWarehouseContainer ? "warehouse" : "customer";
    
    Alert.alert(
      "QR-Code neu generieren",
      "ACHTUNG: Beim Neugenerieren wird der alte QR-Code ungültig. Bitte den neuen Code ausdrucken und am Container anbringen. Fortfahren?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Ja, neu generieren",
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // Use dedicated regenerate endpoint - backend handles stable QR code generation
              const response = await apiRequest("POST", `/api/containers/${type}/${container.id}/regenerate-qr`, {
                userId: null, // Could pass current user ID if available
              });
              
              queryClient.invalidateQueries({ queryKey: [`/api/containers/${type}`] });
              
              // Update local state with new container data from response
              if (response.ok) {
                const updatedContainer = await response.json();
                if (selectedWarehouseContainer) {
                  setSelectedWarehouseContainer(updatedContainer);
                } else if (selectedCustomerContainer) {
                  setSelectedCustomerContainer(updatedContainer);
                }
              }
              
              showToast("QR-Code wurde erfolgreich neu generiert. Bitte neuen Code ausdrucken!", "success");
            } catch (err) {
              console.error("Failed to regenerate QR code:", err);
              showToast("Fehler beim Generieren des QR-Codes", "error");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const resetFillLevel = async () => {
    if (!selectedWarehouseContainer) return;
    
    Alert.alert(
      "Container leeren",
      `Möchtest du diesen Container wirklich leeren?\n\nContainer: ${selectedWarehouseContainer.id}\nAktueller Füllstand: ${selectedWarehouseContainer.currentAmount} ${selectedWarehouseContainer.quantityUnit}`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Ja, leeren",
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            const containerId = selectedWarehouseContainer.id;
            try {
              const response = await apiRequest("POST", `/api/containers/warehouse/${containerId}/reset`, {
                reason: "Manual container emptying via admin UI",
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to empty container");
              }
              
              const result = await response.json();
              
              queryClient.invalidateQueries({ queryKey: ["/api/containers/warehouse"] });
              setSelectedWarehouseContainer({
                ...selectedWarehouseContainer,
                currentAmount: 0,
                lastEmptied: new Date(),
              });
              setRecentlyResetId(containerId);
              resetAnimationOpacity.value = withSequence(
                withTiming(0.3, { duration: 150 }),
                withTiming(1, { duration: 300 })
              );
              setTimeout(() => setRecentlyResetId(null), 1000);
              showToast(result.message || "Container wurde erfolgreich geleert", "success");
            } catch (err) {
              console.error("Failed to reset fill level:", err);
              const errorMessage = err instanceof Error ? err.message : "Fehler beim Leeren des Containers";
              showToast(errorMessage, "error");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getFillColor = (percentage: number) => {
    return getFillLevelColor(percentage, isDark);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderWarehouseContainer = ({ item }: { item: WarehouseContainer }) => {
    const fillPercentage = (item.currentAmount / item.maxCapacity) * 100;
    const fillColor = getFillColor(fillPercentage);

    return (
      <Card style={[styles.containerCard, { backgroundColor: theme.cardSurface }, !item.isActive && styles.inactiveCard]} onPress={() => openViewModal(item, "warehouse")}>
        <View style={styles.cardHeader}>
          <View style={styles.containerInfo}>
            <Feather name="package" size={24} color={item.isActive ? theme.primary : theme.textTertiary} />
            <View>
              <View style={styles.idRow}>
                <ThemedText type="h4" style={[styles.containerId, { color: theme.primary }, !item.isActive && { color: theme.textTertiary }]}>{item.id}</ThemedText>
                {!item.isActive ? <StatusBadge status="cancelled" label="Inactive" size="small" /> : null}
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.location}</ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>

        <View style={styles.fillInfo}>
          <View style={styles.fillHeader}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.materialType}</ThemedText>
            <ThemedText type="body" style={[styles.fillPercentage, { color: fillColor }]}>
              {fillPercentage.toFixed(0)}%
            </ThemedText>
          </View>
          <ProgressBar progress={fillPercentage / 100} color={fillColor} />
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
            {item.currentAmount.toFixed(0)} / {item.maxCapacity} kg
          </ThemedText>
        </View>
      </Card>
    );
  };

  const renderCustomerContainer = ({ item }: { item: CustomerContainer }) => (
    <Card style={[styles.containerCard, { backgroundColor: theme.cardSurface }, !item.isActive && styles.inactiveCard]} onPress={() => openViewModal(item, "customer")}>
      <View style={styles.cardHeader}>
        <View style={styles.containerInfo}>
          <Feather name="package" size={24} color={item.isActive ? theme.primary : theme.textTertiary} />
          <View>
            <View style={styles.idRow}>
              <ThemedText type="h4" style={[styles.containerId, { color: theme.primary }, !item.isActive && { color: theme.textTertiary }]}>{item.id}</ThemedText>
              {!item.isActive ? <StatusBadge status="cancelled" label="Inactive" size="small" /> : null}
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.customerName}</ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.location}</ThemedText>
        </View>
        <View style={styles.detailItem}>
          <Feather name="tag" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.materialType}</ThemedText>
        </View>
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Last emptied: {formatDate(item.lastEmptied)}
      </ThemedText>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="package" size={48} color={theme.textSecondary} />
      <ThemedText type="h4">No containers</ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary }}>
        No {activeTab} containers found
      </ThemedText>
      <Button onPress={openCreateModal} style={styles.emptyButton}>
        Add Container
      </Button>
    </View>
  );

  const renderFormModal = () => (
    <KeyboardAwareScrollViewCompat contentContainerStyle={styles.formScrollContent}>
      <ThemedText type="h4" style={styles.formSectionTitle}>Container Information</ThemedText>
      
      <TextInput
        label="Container ID"
        value={formData.id}
        onChangeText={(text) => setFormData({ ...formData, id: text })}
        placeholder="e.g., WH-001 or CUST-001"
        error={formErrors.id}
        editable={modalMode === "create"}
      />
      
      {activeTab === "customer" ? (
        <TextInput
          label="Customer Name"
          value={formData.customerName}
          onChangeText={(text) => setFormData({ ...formData, customerName: text })}
          placeholder="e.g., ABC Manufacturing"
          error={formErrors.customerName}
        />
      ) : null}
      
      <TextInput
        label="Location"
        value={formData.location}
        onChangeText={(text) => setFormData({ ...formData, location: text })}
        placeholder="e.g., Building A, Floor 2"
        error={formErrors.location}
      />
      
      <TextInput
        label="Material Type"
        value={formData.materialType}
        onChangeText={(text) => setFormData({ ...formData, materialType: text })}
        placeholder="e.g., Plastic, Metal, Paper"
        error={formErrors.materialType}
      />
      
      {activeTab === "warehouse" ? (
        <TextInput
          label="Max Capacity (kg)"
          value={formData.maxCapacity}
          onChangeText={(text) => setFormData({ ...formData, maxCapacity: text })}
          placeholder="e.g., 1000"
          keyboardType="numeric"
          error={formErrors.maxCapacity}
        />
      ) : null}
      
      {activeTab === "customer" ? (
        <>
          <ThemedText type="h4" style={styles.formSectionTitle}>Location Coordinates (Optional)</ThemedText>
          <View style={styles.coordsRow}>
            <View style={styles.coordInput}>
              <TextInput
                label="Latitude"
                value={formData.latitude}
                onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                placeholder="e.g., 52.5200"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.coordInput}>
              <TextInput
                label="Longitude"
                value={formData.longitude}
                onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                placeholder="e.g., 13.4050"
                keyboardType="numeric"
              />
            </View>
          </View>
        </>
      ) : null}
      
      <View style={styles.formActions}>
        <Button
          variant="tertiary"
          onPress={modalMode === "edit" ? () => setModalMode("view") : closeModal}
          style={styles.formButton}
        >
          Cancel
        </Button>
        <Button
          onPress={modalMode === "create" ? handleCreateContainer : handleUpdateContainer}
          disabled={isSubmitting}
          style={styles.formButton}
        >
          {isSubmitting ? "Saving..." : modalMode === "create" ? "Create Container" : "Save Changes"}
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );

  const renderViewModal = () => {
    const container = selectedWarehouseContainer || selectedCustomerContainer;
    if (!container) return null;
    
    const isWarehouse = !!selectedWarehouseContainer;
    
    return (
      <ScrollView contentContainerStyle={styles.viewScrollContent}>
        <Card style={[styles.detailCard, { backgroundColor: theme.cardSurface }]}>
          <View style={styles.containerInfo}>
            <Feather name="package" size={32} color={container.isActive ? theme.primary : theme.textTertiary} />
            <View style={styles.containerHeaderText}>
              <ThemedText type="h4">{container.id}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {isWarehouse ? (container as WarehouseContainer).location : (container as CustomerContainer).customerName}
              </ThemedText>
            </View>
            <View style={styles.statusToggle}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                {container.isActive ? "Active" : "Inactive"}
              </ThemedText>
              <Switch
                value={container.isActive}
                onValueChange={handleToggleActive}
                disabled={isSubmitting}
                trackColor={{ false: theme.backgroundTertiary, true: theme.success }}
                thumbColor={theme.backgroundRoot}
              />
            </View>
          </View>

          <View style={styles.detailsList}>
            {!isWarehouse ? (
              <View style={styles.detailRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Customer</ThemedText>
                <ThemedText type="body">{(container as CustomerContainer).customerName}</ThemedText>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Location</ThemedText>
              <ThemedText type="body">{container.location}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Material</ThemedText>
              <ThemedText type="body">{container.materialType}</ThemedText>
            </View>
            {isWarehouse ? (
              <>
                <View style={styles.detailRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Current Fill</ThemedText>
                  <ThemedText type="body">
                    {(container as WarehouseContainer).currentAmount.toFixed(0)} / {(container as WarehouseContainer).maxCapacity} kg
                  </ThemedText>
                </View>
                <View style={styles.fillProgressContainer}>
                  <ProgressBar 
                    progress={((container as WarehouseContainer).currentAmount / (container as WarehouseContainer).maxCapacity)} 
                    color={getFillColor(((container as WarehouseContainer).currentAmount / (container as WarehouseContainer).maxCapacity) * 100)} 
                  />
                </View>
              </>
            ) : null}
            <View style={styles.detailRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Last Emptied</ThemedText>
              <ThemedText type="body">{formatDate(container.lastEmptied)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Created</ThemedText>
              <ThemedText type="body">{formatDate(container.createdAt)}</ThemedText>
            </View>
            {!isWarehouse && (container as CustomerContainer).latitude ? (
              <View style={styles.detailRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Coordinates</ThemedText>
                <ThemedText type="body">
                  {(container as CustomerContainer).latitude?.toFixed(4)}, {(container as CustomerContainer).longitude?.toFixed(4)}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Card>

        <Card style={[styles.qrCard, { backgroundColor: theme.cardSurface }]}>
          <View style={styles.qrHeader}>
            <Feather name="grid" size={20} color={theme.primary} />
            <ThemedText type="bodyBold" style={{ color: theme.primary }}>QR Code</ThemedText>
          </View>
          <ThemedText type="small" style={[styles.qrCode, { color: theme.textSecondary, backgroundColor: theme.backgroundSecondary }]}>{container.qrCode}</ThemedText>
          <Button
            variant="tertiary"
            size="small"
            onPress={handleRegenerateQRCode}
            disabled={isSubmitting}
            style={styles.regenerateButton}
          >
            <View style={styles.buttonContent}>
              <Feather name="refresh-cw" size={16} color={theme.text} />
              <ThemedText type="small" style={{ color: theme.text }}>Regenerate QR Code</ThemedText>
            </View>
          </Button>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            variant="secondary"
            onPress={openEditModal}
            style={styles.actionButton}
          >
            <View style={styles.buttonContent}>
              <Feather name="edit-2" size={18} color={theme.primary} />
              <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>Edit Details</ThemedText>
            </View>
          </Button>
          
          {isWarehouse ? (
            <Button
              onPress={resetFillLevel}
              disabled={isSubmitting}
              style={styles.actionButton}
            >
              <View style={styles.buttonContent}>
                <Feather name="refresh-ccw" size={18} color={theme.buttonText} />
                <ThemedText type="body" style={{ color: theme.buttonText, fontWeight: "600" }}>Container leeren</ThemedText>
              </View>
            </Button>
          ) : null}
        </View>
      </ScrollView>
    );
  };

  const getModalTitle = () => {
    if (modalMode === "create") return `Add ${activeTab === "warehouse" ? "Warehouse" : "Customer"} Container`;
    if (modalMode === "edit") return "Edit Container";
    return "Container Details";
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabContainer, { marginTop: headerHeight, backgroundColor: theme.backgroundDefault }]}>
        <FilterChip
          label="Warehouse"
          selected={activeTab === "warehouse"}
          onPress={() => setActiveTab("warehouse")}
        />
        <FilterChip
          label="Customer"
          selected={activeTab === "customer"}
          onPress={() => setActiveTab("customer")}
        />
        <View style={styles.tabSpacer} />
        <Pressable style={[styles.addButton, { backgroundColor: theme.accent }]} onPress={openCreateModal}>
          <Feather name="plus" size={24} color={theme.textOnAccent} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={activeTab === "warehouse" ? warehouseContainers : customerContainers}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === "warehouse" ? renderWarehouseContainer : renderCustomerContainer}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="h3">{getModalTitle()}</ThemedText>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            {modalMode === "view" ? renderViewModal() : renderFormModal()}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: "center",
  },
  tabSpacer: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  containerCard: {},
  inactiveCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  containerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  containerHeaderText: {
    flex: 1,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  containerId: {},
  fillInfo: {
    gap: Spacing.sm,
  },
  fillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fillPercentage: {
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  emptyButton: {
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  viewScrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formScrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formSectionTitle: {
    marginTop: Spacing.md,
  },
  coordsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  coordInput: {
    flex: 1,
  },
  formActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  formButton: {
    flex: 1,
  },
  detailCard: {},
  statusToggle: {
    alignItems: "flex-end",
  },
  detailsList: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fillProgressContainer: {
    marginTop: -Spacing.sm,
  },
  qrCard: {
    gap: Spacing.sm,
  },
  qrHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  qrCode: {
    fontFamily: "monospace",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  regenerateButton: {
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  actionButton: {
    width: "100%",
  },
});

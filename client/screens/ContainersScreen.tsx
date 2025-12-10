import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator, Linking, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { FilterChip } from "@/components/FilterChip";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { ContainersStackParamList } from "@/navigation/ContainersStackNavigator";
import { CustomerContainer, WarehouseContainer } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<ContainersStackParamList, "Containers">;

type TabType = "customer" | "warehouse";
type StatusFilter = "all" | "critical" | "normal";

export default function ContainersScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("customer");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");

  const { data: customerContainers = [], isLoading: loadingCustomer, refetch: refetchCustomer, isRefetching: refetchingCustomer } = useQuery<CustomerContainer[]>({
    queryKey: ["/api/containers/customer"],
  });

  const { data: warehouseContainers = [], isLoading: loadingWarehouse, refetch: refetchWarehouse, isRefetching: refetchingWarehouse } = useQuery<WarehouseContainer[]>({
    queryKey: ["/api/containers/warehouse"],
  });

  const isLoading = activeTab === "customer" ? loadingCustomer : loadingWarehouse;
  const isRefetching = activeTab === "customer" ? refetchingCustomer : refetchingWarehouse;
  const refetch = activeTab === "customer" ? refetchCustomer : refetchWarehouse;

  const getDaysSinceEmptied = (date: string | Date | null): number => {
    if (!date) return Infinity;
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isCustomerContainerCritical = (container: CustomerContainer): boolean => {
    const daysSince = getDaysSinceEmptied(container.lastEmptied);
    return daysSince > 30;
  };

  const isWarehouseContainerCritical = (container: WarehouseContainer): boolean => {
    const fillPercentage = (container.currentAmount / container.maxCapacity) * 100;
    return fillPercentage >= 80;
  };

  const getLastEmptiedColor = (date: string | Date | null) => {
    const daysSince = getDaysSinceEmptied(date);
    if (daysSince > 30) return theme.error;
    if (daysSince > 14) return theme.warning;
    return theme.success;
  };

  const getLastEmptiedLabel = (date: string | Date | null): string => {
    const daysSince = getDaysSinceEmptied(date);
    if (daysSince === Infinity) return "Nie geleert";
    if (daysSince === 0) return "Heute";
    if (daysSince === 1) return "Gestern";
    return `Vor ${daysSince} Tagen`;
  };

  const materialTypes = useMemo(() => {
    const containers = activeTab === "customer" ? customerContainers : warehouseContainers;
    const types = new Set(containers.map((c) => c.materialType));
    return ["all", ...Array.from(types)];
  }, [activeTab, customerContainers, warehouseContainers]);

  const filteredCustomerContainers = useMemo(() => {
    return customerContainers.filter((container) => {
      const matchesMaterial = materialFilter === "all" || container.materialType === materialFilter;
      const isCritical = isCustomerContainerCritical(container);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "critical" && isCritical) ||
        (statusFilter === "normal" && !isCritical);
      return matchesMaterial && matchesStatus;
    });
  }, [customerContainers, materialFilter, statusFilter]);

  const filteredWarehouseContainers = useMemo(() => {
    return warehouseContainers.filter((container) => {
      const matchesMaterial = materialFilter === "all" || container.materialType === materialFilter;
      const isCritical = isWarehouseContainerCritical(container);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "critical" && isCritical) ||
        (statusFilter === "normal" && !isCritical);
      return matchesMaterial && matchesStatus;
    });
  }, [warehouseContainers, materialFilter, statusFilter]);

  const criticalCount = useMemo(() => {
    if (activeTab === "customer") {
      return customerContainers.filter(isCustomerContainerCritical).length;
    }
    return warehouseContainers.filter(isWarehouseContainerCritical).length;
  }, [activeTab, customerContainers, warehouseContainers]);

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Nie";
    const d = new Date(date);
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
  };

  const getFillColor = (percentage: number) => {
    if (percentage >= 80) return theme.fillHigh;
    if (percentage >= 51) return theme.fillMedium;
    return theme.fillLow;
  };

  const openInMaps = (latitude: number | null, longitude: number | null, locationName: string) => {
    if (latitude && longitude) {
      const scheme = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(locationName)}@${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(locationName)})`,
        default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      });
      Linking.openURL(scheme);
    }
  };

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterRow}>
        <FilterChip
          label="Alle"
          selected={statusFilter === "all"}
          onPress={() => setStatusFilter("all")}
          small
        />
        <FilterChip
          label="Kritisch"
          selected={statusFilter === "critical"}
          onPress={() => setStatusFilter("critical")}
          color={theme.error}
          count={criticalCount}
          small
        />
        <FilterChip
          label="Normal"
          selected={statusFilter === "normal"}
          onPress={() => setStatusFilter("normal")}
          color={theme.success}
          small
        />
      </View>
      <FlatList
        data={materialTypes}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.materialFilterList}
        renderItem={({ item }) => (
          <FilterChip
            label={item === "all" ? "Alle Materialien" : item}
            selected={materialFilter === item}
            onPress={() => setMaterialFilter(item)}
            small
          />
        )}
      />
    </View>
  );

  const renderCustomerContainer = ({ item }: { item: CustomerContainer }) => {
    const isCritical = isCustomerContainerCritical(item);
    const lastEmptiedColor = getLastEmptiedColor(item.lastEmptied);
    const lastEmptiedLabel = getLastEmptiedLabel(item.lastEmptied);
    const hasCoordinates = item.latitude && item.longitude;

    return (
      <Card
        style={{ backgroundColor: theme.cardSurface, borderColor: isCritical ? theme.error : theme.cardBorder, borderWidth: isCritical ? 2 : 1 }}
        onPress={() => navigation.navigate("ContainerDetail", { containerId: item.id, type: "customer" })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.containerIdSection}>
            <View style={[styles.containerIdBadge, { backgroundColor: theme.primary }]}>
              <Feather name="package" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.containerIdText}>
              <ThemedText type="h4" style={{ color: theme.text, fontWeight: "700" }}>{item.id}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.customerName}</ThemedText>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            {isCritical ? (
              <View style={[styles.priorityBadge, { backgroundColor: theme.error }]}>
                <Feather name="alert-circle" size={12} color="#FFFFFF" />
                <ThemedText type="caption" style={styles.priorityBadgeText}>Kritisch</ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.lastEmptiedBanner, { backgroundColor: `${lastEmptiedColor}15` }]}>
          <View style={styles.lastEmptiedContent}>
            <View style={[styles.lastEmptiedDot, { backgroundColor: lastEmptiedColor }]} />
            <View>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>Zuletzt geleert</ThemedText>
              <ThemedText type="bodyBold" style={{ color: lastEmptiedColor }}>{lastEmptiedLabel}</ThemedText>
            </View>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{formatDate(item.lastEmptied)}</ThemedText>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>{item.location}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="tag" size={16} color={theme.textSecondary} />
            <View style={[styles.materialBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption" style={{ color: theme.text, fontWeight: "600" }}>{item.materialType}</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.actionButtons, { borderTopColor: theme.divider }]}>
          {hasCoordinates ? (
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={(e) => {
                e.stopPropagation();
                openInMaps(item.latitude, item.longitude, item.location);
              }}
            >
              <Feather name="navigation" size={16} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>Route</ThemedText>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => navigation.navigate("ContainerDetail", { containerId: item.id, type: "customer" })}
          >
            <Feather name="info" size={16} color={theme.text} />
            <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>Details</ThemedText>
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderWarehouseContainer = ({ item }: { item: WarehouseContainer }) => {
    const fillPercentage = (item.currentAmount / item.maxCapacity) * 100;
    const fillColor = getFillColor(fillPercentage);
    const isCritical = fillPercentage >= 80;

    return (
      <Card
        style={{ backgroundColor: theme.cardSurface, borderColor: isCritical ? theme.error : theme.cardBorder, borderWidth: isCritical ? 2 : 1 }}
        onPress={() => navigation.navigate("ContainerDetail", { containerId: item.id, type: "warehouse" })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.containerIdSection}>
            <View style={[styles.containerIdBadge, { backgroundColor: theme.accent }]}>
              <Feather name="home" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.containerIdText}>
              <ThemedText type="h4" style={{ color: theme.text, fontWeight: "700" }}>{item.id}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.location}</ThemedText>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            {isCritical ? (
              <View style={[styles.priorityBadge, { backgroundColor: theme.error }]}>
                <Feather name="alert-triangle" size={12} color="#FFFFFF" />
                <ThemedText type="caption" style={styles.priorityBadgeText}>Fast voll</ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.fillSection}>
          <View style={styles.fillHeader}>
            <View style={[styles.materialBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption" style={{ color: theme.text, fontWeight: "600" }}>{item.materialType}</ThemedText>
            </View>
            <View style={styles.fillPercentageContainer}>
              <ThemedText type="h3" style={{ color: fillColor, fontWeight: "700" }}>
                {fillPercentage.toFixed(0)}%
              </ThemedText>
            </View>
          </View>
          <ProgressBar
            progress={fillPercentage / 100}
            color={fillColor}
            style={styles.progressBar}
          />
          <View style={styles.capacityRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Kapazität
            </ThemedText>
            <ThemedText type="bodyBold" style={{ color: theme.text }}>
              {item.currentAmount.toFixed(0)} / {item.maxCapacity} kg
            </ThemedText>
          </View>
        </View>

        <View style={[styles.actionButtons, { borderTopColor: theme.divider }]}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => navigation.navigate("ContainerDetail", { containerId: item.id, type: "warehouse" })}
          >
            <Feather name="info" size={16} color={theme.text} />
            <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>Details</ThemedText>
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="package" size={48} color={theme.textSecondary} />
      <ThemedText type="h4" style={{ color: theme.text }}>
        Keine Container gefunden
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        {statusFilter !== "all" || materialFilter !== "all"
          ? "Keine Container entsprechen den Filterkriterien"
          : activeTab === "customer"
          ? "Keine Kundencontainer verfügbar"
          : "Keine Lagercontainer verfügbar"}
      </ThemedText>
      {(statusFilter !== "all" || materialFilter !== "all") ? (
        <Pressable
          style={[styles.resetFilterButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setStatusFilter("all");
            setMaterialFilter("all");
          }}
        >
          <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>Filter zurücksetzen</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.tabContainer, { marginTop: headerHeight, backgroundColor: theme.backgroundDefault }]}>
        <Pressable
          style={[styles.tab, activeTab === "customer" && { ...styles.activeTab, backgroundColor: theme.backgroundRoot }]}
          onPress={() => setActiveTab("customer")}
        >
          <Feather
            name="users"
            size={18}
            color={activeTab === "customer" ? theme.accent : theme.textSecondary}
          />
          <ThemedText
            type="body"
            style={{
              color: activeTab === "customer" ? theme.accent : theme.textSecondary,
              fontWeight: activeTab === "customer" ? "600" : "500",
            }}
          >
            Kunde
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "warehouse" && { ...styles.activeTab, backgroundColor: theme.backgroundRoot }]}
          onPress={() => setActiveTab("warehouse")}
        >
          <Feather
            name="home"
            size={18}
            color={activeTab === "warehouse" ? theme.accent : theme.textSecondary}
          />
          <ThemedText
            type="body"
            style={{
              color: activeTab === "warehouse" ? theme.accent : theme.textSecondary,
              fontWeight: activeTab === "warehouse" ? "600" : "500",
            }}
          >
            Lager
          </ThemedText>
        </Pressable>
      </View>

      {renderFilterSection()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={activeTab === "customer" ? filteredCustomerContainers : filteredWarehouseContainers}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === "customer" ? renderCustomerContainer : renderWarehouseContainer}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl, backgroundColor: theme.backgroundRoot },
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  activeTab: {
    borderRadius: BorderRadius.xs,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  materialFilterList: {
    gap: Spacing.sm,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  containerIdSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  containerIdBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  containerIdText: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  priorityBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  lastEmptiedBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  lastEmptiedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  lastEmptiedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  materialBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flex: 1,
  },
  fillSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  fillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fillPercentageContainer: {
    alignItems: "flex-end",
  },
  progressBar: {
    height: 12,
  },
  capacityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.md,
  },
  resetFilterButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
});

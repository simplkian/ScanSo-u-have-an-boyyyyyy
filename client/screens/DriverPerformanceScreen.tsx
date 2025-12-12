import React from "react";
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface DriverStats {
  id: string;
  name: string;
  email: string;
  totalAssigned: number;
  totalCompleted: number;
  completedToday: number;
  completedThisWeek: number;
  inProgress: number;
  completionRate: number;
  avgDeliveryTimeMinutes: number;
}

interface OverallStats {
  totalDrivers: number;
  activeDrivers: number;
  totalCompletedToday: number;
  totalCompletedThisWeek: number;
  avgCompletionRate: number;
}

interface PerformanceData {
  drivers: DriverStats[];
  overall: OverallStats;
}

export default function DriverPerformanceScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const { data, isLoading, refetch, isRefetching } = useQuery<PerformanceData>({
    queryKey: ["/api/analytics/driver-performance"],
  });

  const getIconBackground = (colorType: "primary" | "warning" | "success" | "accent" | "secondary") => {
    if (colorType === "primary") return isDark ? theme.backgroundSecondary : `${theme.primary}15`;
    if (colorType === "warning") return isDark ? theme.warningLight : `${theme.warning}15`;
    if (colorType === "success") return isDark ? theme.successLight : `${theme.success}15`;
    if (colorType === "accent") return isDark ? theme.backgroundSecondary : `${theme.accent}15`;
    if (colorType === "secondary") return isDark ? theme.backgroundSecondary : `${theme.textSecondary}15`;
    return isDark ? theme.backgroundSecondary : theme.backgroundSecondary;
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return theme.statusCompleted;
    if (rate >= 50) return theme.statusInProgress;
    return theme.statusCancelled;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.accent}
          />
        }
      >
        <Card style={{ ...styles.overviewCard, backgroundColor: theme.backgroundDefault }}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Teamübersicht
          </ThemedText>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: getIconBackground("primary") }]}>
                <Feather name="users" size={24} color={theme.primary} />
              </View>
              <ThemedText type="h3" style={styles.overviewValue}>
                {data?.overall.totalDrivers || 0}
              </ThemedText>
              <ThemedText type="small" style={[styles.overviewLabel, { color: theme.textSecondary }]}>
                Fahrer gesamt
              </ThemedText>
            </View>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: getIconBackground("warning") }]}>
                <Feather name="activity" size={24} color={theme.statusInProgress} />
              </View>
              <ThemedText type="h3" style={styles.overviewValue}>
                {data?.overall.activeDrivers || 0}
              </ThemedText>
              <ThemedText type="small" style={[styles.overviewLabel, { color: theme.textSecondary }]}>
                Heute aktiv
              </ThemedText>
            </View>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: getIconBackground("success") }]}>
                <Feather name="check-circle" size={24} color={theme.statusCompleted} />
              </View>
              <ThemedText type="h3" style={styles.overviewValue}>
                {data?.overall.totalCompletedThisWeek || 0}
              </ThemedText>
              <ThemedText type="small" style={[styles.overviewLabel, { color: theme.textSecondary }]}>
                Diese Woche
              </ThemedText>
            </View>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: getIconBackground("accent") }]}>
                <Feather name="trending-up" size={24} color={theme.accent} />
              </View>
              <ThemedText type="h3" style={styles.overviewValue}>
                {data?.overall.avgCompletionRate || 0}%
              </ThemedText>
              <ThemedText type="small" style={[styles.overviewLabel, { color: theme.textSecondary }]}>
                Durchschn. Abschluss
              </ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText type="h4" style={styles.sectionTitle}>
          Fahrerleistung
        </ThemedText>

        {data?.drivers.map((driver) => (
          <Card key={driver.id} style={{ ...styles.driverCard, backgroundColor: theme.backgroundDefault }}>
            <View style={styles.driverHeader}>
              <View style={styles.driverInfo}>
                <View style={[styles.driverAvatar, { backgroundColor: theme.primary }]}>
                  <Feather name="user" size={20} color={theme.textOnAccent} />
                </View>
                <View>
                  <ThemedText type="body" style={styles.driverName}>{driver.name}</ThemedText>
                  <ThemedText type="small" style={[styles.driverEmail, { color: theme.textSecondary }]}>{driver.email}</ThemedText>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                driver.inProgress > 0
                  ? { backgroundColor: getIconBackground("warning") }
                  : { backgroundColor: getIconBackground("secondary") }
              ]}>
                <ThemedText
                  type="small"
                  style={[
                    styles.badgeText,
                    { color: driver.inProgress > 0 ? theme.statusInProgress : theme.textSecondary }
                  ]}
                >
                  {driver.inProgress > 0 ? "Aktiv" : "Inaktiv"}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.statsRow, { borderColor: theme.border }]}>
              <View style={styles.statItem}>
                <ThemedText type="h4" style={styles.statValue}>{driver.completedToday}</ThemedText>
                <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>Heute</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="h4" style={styles.statValue}>{driver.completedThisWeek}</ThemedText>
                <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>Diese Woche</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="h4" style={styles.statValue}>{driver.totalCompleted}</ThemedText>
                <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>Gesamt</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="h4" style={styles.statValue}>
                  {driver.avgDeliveryTimeMinutes > 0 ? `${driver.avgDeliveryTimeMinutes}m` : "-"}
                </ThemedText>
                <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>Durchschn.</ThemedText>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText type="small" style={[styles.progressLabel, { color: theme.textSecondary }]}>Abschlussrate</ThemedText>
                <ThemedText type="body" style={[styles.progressValue, { color: getPerformanceColor(driver.completionRate) }]}>
                  {driver.completionRate}%
                </ThemedText>
              </View>
              <ProgressBar
                progress={driver.completionRate / 100}
                color={getPerformanceColor(driver.completionRate)}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.taskBreakdown}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: theme.statusCompleted }]} />
                <ThemedText type="small" style={[styles.breakdownText, { color: theme.textSecondary }]}>
                  {driver.totalCompleted} erledigt
                </ThemedText>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: theme.statusInProgress }]} />
                <ThemedText type="small" style={[styles.breakdownText, { color: theme.textSecondary }]}>
                  {driver.inProgress} in Bearbeitung
                </ThemedText>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: theme.statusOpen }]} />
                <ThemedText type="small" style={[styles.breakdownText, { color: theme.textSecondary }]}>
                  {driver.totalAssigned - driver.totalCompleted - driver.inProgress} offen
                </ThemedText>
              </View>
            </View>
          </Card>
        ))}

        {(!data?.drivers || data.drivers.length === 0) ? (
          <Card style={{ ...styles.emptyCard, backgroundColor: theme.backgroundDefault }}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              Keine Fahrer gefunden
            </ThemedText>
          </Card>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  overviewCard: {},
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  overviewItem: {
    width: "46%",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  overviewValue: {},
  overviewLabel: {},
  driverCard: {
    gap: Spacing.md,
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  driverName: {
    fontWeight: "600",
  },
  driverEmail: {},
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {},
  statLabel: {
    fontSize: 11,
  },
  progressSection: {
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {},
  progressValue: {
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
  },
  taskBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownText: {
    fontSize: 11,
  },
  emptyCard: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  emptyText: {},
});

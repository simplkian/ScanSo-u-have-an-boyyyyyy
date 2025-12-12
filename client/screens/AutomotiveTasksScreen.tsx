import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { TasksStackParamList } from "@/navigation/TasksStackNavigator";
import { Task, AUTOMOTIVE_TASK_STATUS_LABELS } from "@shared/schema";

type NavigationProp = NativeStackNavigationProp<TasksStackParamList, "Tasks">;
type StatusFilter = "all" | "open" | "in_progress" | "warehouse" | "completed";

const OPEN_STATUSES = ["OPEN"];
const IN_PROGRESS_STATUSES = ["PICKED_UP", "IN_TRANSIT"];
const WAREHOUSE_STATUSES = ["DROPPED_OFF", "TAKEN_OVER", "WEIGHED"];
const COMPLETED_STATUSES = ["DISPOSED"];
const ALL_ACTIVE_STATUSES = [...OPEN_STATUSES, ...IN_PROGRESS_STATUSES, ...WAREHOUSE_STATUSES];

type AutomotiveTask = Task;

export default function AutomotiveTasksScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: allTasks = [], isLoading, refetch, isRefetching } = useQuery<AutomotiveTask[]>({
    queryKey: ["/api/tasks"],
  });

  const automotiveTasks = allTasks.filter(
    (task) => task.boxId || task.taskType === "MANUAL" || task.taskType === "DAILY_FULL"
  );

  const { data: boxesData = [] } = useQuery<Array<{ id: string; serial: string; standId: string | null }>>({
    queryKey: ["/api/automotive/boxes"],
  });

  const { data: standsData = [] } = useQuery<Array<{ id: string; identifier: string; stationId: string }>>({
    queryKey: ["/api/automotive/stands"],
  });

  const { data: stationsData = [] } = useQuery<Array<{ id: string; name: string; hallId: string }>>({
    queryKey: ["/api/automotive/stations"],
  });

  const { data: hallsData = [] } = useQuery<Array<{ id: string; name: string; code: string }>>({
    queryKey: ["/api/automotive/halls"],
  });

  const getBoxById = (boxId: string | null) => boxesData.find((b) => b.id === boxId);
  const getStandById = (standId: string | null) => standsData.find((s) => s.id === standId);
  const getStationById = (stationId: string) => stationsData.find((s) => s.id === stationId);
  const getHallById = (hallId: string) => hallsData.find((h) => h.id === hallId);

  const getLocationString = (task: AutomotiveTask) => {
    const stand = getStandById(task.standId);
    if (!stand) return "Unbekannter Standort";
    
    const station = getStationById(stand.stationId);
    const hall = station ? getHallById(station.hallId) : null;
    
    const parts = [];
    if (hall) parts.push(hall.code);
    if (station) parts.push(station.name);
    parts.push(stand.identifier);
    
    return parts.join(" / ");
  };

  const getFilteredTasks = () => {
    return automotiveTasks.filter((task) => {
      if (task.status === "CANCELLED") return false;
      if (statusFilter === "all") return task.status !== "DISPOSED";
      if (statusFilter === "open") return OPEN_STATUSES.includes(task.status);
      if (statusFilter === "in_progress") return IN_PROGRESS_STATUSES.includes(task.status);
      if (statusFilter === "warehouse") return WAREHOUSE_STATUSES.includes(task.status);
      if (statusFilter === "completed") return COMPLETED_STATUSES.includes(task.status);
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  const getStatusColor = (status: string) => {
    if (OPEN_STATUSES.includes(status)) return theme.statusOpen;
    if (IN_PROGRESS_STATUSES.includes(status)) return theme.warning;
    if (WAREHOUSE_STATUSES.includes(status)) return theme.info;
    if (COMPLETED_STATUSES.includes(status)) return theme.statusCompleted;
    if (status === "CANCELLED") return theme.statusCancelled;
    return theme.statusOpen;
  };

  const getStatusIcon = (status: string): keyof typeof Feather.glyphMap => {
    switch (status) {
      case "OPEN": return "inbox";
      case "PICKED_UP": return "package";
      case "IN_TRANSIT": return "truck";
      case "DROPPED_OFF": return "download";
      case "TAKEN_OVER": return "user-check";
      case "WEIGHED": return "activity";
      case "DISPOSED": return "check-circle";
      case "CANCELLED": return "x-circle";
      default: return "circle";
    }
  };

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    const day = d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return `${day}, ${time}`;
  };

  const taskCounts = {
    all: automotiveTasks.filter(t => t.status !== "CANCELLED" && t.status !== "DISPOSED").length,
    open: automotiveTasks.filter(t => OPEN_STATUSES.includes(t.status)).length,
    in_progress: automotiveTasks.filter(t => IN_PROGRESS_STATUSES.includes(t.status)).length,
    warehouse: automotiveTasks.filter(t => WAREHOUSE_STATUSES.includes(t.status)).length,
    completed: automotiveTasks.filter(t => COMPLETED_STATUSES.includes(t.status)).length,
  };

  const renderTask = ({ item }: { item: AutomotiveTask }) => {
    const box = getBoxById(item.boxId);
    const statusLabel = AUTOMOTIVE_TASK_STATUS_LABELS[item.status] || item.status;

    return (
      <Card
        style={{ backgroundColor: theme.cardSurface, borderColor: theme.cardBorder }}
        onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
      >
        <View style={styles.taskRow}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <View style={styles.taskContent}>
            <View style={styles.taskMainInfo}>
              <View style={styles.taskTitleRow}>
                <Feather name={getStatusIcon(item.status)} size={18} color={getStatusColor(item.status)} />
                <ThemedText type="bodyBold" style={{ color: theme.text, marginLeft: Spacing.sm }}>
                  {box ? `Box ${box.serial}` : `Task ${item.id.substring(0, 8)}`}
                </ThemedText>
                <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                  <ThemedText type="captionBold" style={{ color: getStatusColor(item.status) }}>
                    {statusLabel}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.taskLocation}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.text, marginLeft: Spacing.xs, flex: 1 }} numberOfLines={1}>
                  {getLocationString(item)}
                </ThemedText>
              </View>

              <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    {formatDateTime(item.createdAt) || "Unbekannt"}
                  </ThemedText>
                </View>
                {item.taskType ? (
                  <View style={styles.metaItem}>
                    <Feather name="tag" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {item.taskType === "DAILY_FULL" ? "Tagesauftrag" : "Manuell"}
                    </ThemedText>
                  </View>
                ) : null}
                {item.weightKg ? (
                  <View style={styles.metaItem}>
                    <Feather name="activity" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {item.weightKg} kg
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.chevronContainer}>
              <Feather name="chevron-right" size={24} color={theme.textSecondary} />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const getEmptyStateMessage = () => {
    switch (statusFilter) {
      case "open":
        return "Keine offenen Aufgaben vorhanden";
      case "in_progress":
        return "Keine Aufgaben unterwegs";
      case "warehouse":
        return "Keine Aufgaben im Lager";
      case "completed":
        return "Noch keine abgeschlossenen Aufgaben";
      default:
        return "Keine Automotive-Aufgaben vorhanden";
    }
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="inbox"
      title="Keine Aufgaben"
      message={getEmptyStateMessage()}
    />
  );

  const FilterButton = ({ filter, label, count }: { filter: StatusFilter; label: string; count: number }) => {
    const isSelected = statusFilter === filter;
    return (
      <Pressable
        style={[
          styles.filterButton,
          {
            backgroundColor: isSelected ? theme.primary : theme.cardSurface,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
        onPress={() => setStatusFilter(filter)}
      >
        <ThemedText
          type="smallBold"
          numberOfLines={1}
          style={{ color: isSelected ? theme.textOnPrimary : theme.text }}
        >
          {label}
        </ThemedText>
        <View style={[
          styles.countBadge,
          { backgroundColor: isSelected ? theme.accent : theme.backgroundSecondary }
        ]}>
          <ThemedText
            type="captionBold"
            numberOfLines={1}
            style={{ color: isSelected ? theme.textOnAccent : theme.text }}
          >
            {count}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.filterContainer, { marginTop: headerHeight, backgroundColor: theme.backgroundDefault }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <FilterButton filter="all" label="Aktiv" count={taskCounts.all} />
          <FilterButton filter="open" label="Offen" count={taskCounts.open} />
          <FilterButton filter="in_progress" label="Unterwegs" count={taskCounts.in_progress} />
          <FilterButton filter="warehouse" label="Lager" count={taskCounts.warehouse} />
          <FilterButton filter="completed" label="Erledigt" count={taskCounts.completed} />
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingScreen fullScreen={false} message="Aufgaben werden geladen..." />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
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
  filterContainer: {
    paddingVertical: Spacing.md,
  },
  filterScrollContent: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  filterButton: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    minHeight: 40,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    minWidth: 24,
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statusIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  taskContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  taskMainInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    flexWrap: "wrap",
  },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  taskLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevronContainer: {
    paddingLeft: Spacing.sm,
  },
});

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, Linking } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { CustomerContainer, WarehouseContainer } from "@shared/schema";

type ContainerType = "customer" | "warehouse";

interface QRData {
  type: "container";
  containerType: ContainerType;
  id: string;
  version: number;
}

export default function QRGeneratorScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [selectedType, setSelectedType] = useState<ContainerType>("customer");
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);

  const { data: customerContainers = [], isLoading: loadingCustomer } = useQuery<CustomerContainer[]>({
    queryKey: ["/api/containers/customer"],
  });

  const { data: warehouseContainers = [], isLoading: loadingWarehouse } = useQuery<WarehouseContainer[]>({
    queryKey: ["/api/containers/warehouse"],
  });

  const containers = selectedType === "customer" ? customerContainers : warehouseContainers;
  const isLoading = selectedType === "customer" ? loadingCustomer : loadingWarehouse;

  const selectedContainerData = selectedType === "customer" 
    ? customerContainers.find(c => c.id === selectedContainer)
    : warehouseContainers.find(c => c.id === selectedContainer);

  const generateQRData = (): string => {
    if (!selectedContainer) return "";
    
    const data: QRData = {
      type: "container",
      containerType: selectedType,
      id: selectedContainer,
      version: 1,
    };
    
    return JSON.stringify(data);
  };

  const getQRCodeUrl = () => {
    if (!selectedContainer) return "";
    const data = encodeURIComponent(generateQRData());
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}`;
  };

  const handleDownloadQR = async () => {
    const url = getQRCodeUrl();
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      await Linking.openURL(url);
    }
  };

  const handlePrintQR = () => {
    const url = getQRCodeUrl();
    if (Platform.OS === "web") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR-Code - ${selectedContainer}</title>
              <style>
                body { 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: center; 
                  min-height: 100vh; 
                  margin: 0; 
                  font-family: sans-serif; 
                }
                .label { 
                  font-size: 24px; 
                  font-weight: bold; 
                  margin-top: 20px; 
                }
                .sublabel { 
                  font-size: 16px; 
                  color: #666; 
                  margin-top: 8px; 
                }
              </style>
            </head>
            <body>
              <img src="${url}" alt="QR Code" />
              <div class="label">${selectedContainer}</div>
              <div class="sublabel">${selectedType === "customer" ? "Kunden-Container" : "Lager-Container"}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getContainerLabel = (container: CustomerContainer | WarehouseContainer) => {
    if (selectedType === "customer") {
      const c = container as CustomerContainer;
      return `${c.customerName || c.location}`;
    } else {
      const c = container as WarehouseContainer;
      return `${c.materialType} (${c.location})`;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ backgroundColor: theme.cardSurface }}>
          <ThemedText type="h4" style={{ color: theme.primary, marginBottom: Spacing.md }}>
            Container-Typ
          </ThemedText>
          <View style={styles.typeSelector}>
            <Pressable
              style={[
                styles.typeButton,
                { 
                  backgroundColor: selectedType === "customer" ? theme.primary : theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                setSelectedType("customer");
                setSelectedContainer(null);
              }}
            >
              <Feather 
                name="users" 
                size={20} 
                color={selectedType === "customer" ? theme.textOnPrimary : theme.text} 
              />
              <ThemedText 
                type="bodyBold" 
                style={{ color: selectedType === "customer" ? theme.textOnPrimary : theme.text }}
              >
                Kunden
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                { 
                  backgroundColor: selectedType === "warehouse" ? theme.primary : theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                setSelectedType("warehouse");
                setSelectedContainer(null);
              }}
            >
              <Feather 
                name="package" 
                size={20} 
                color={selectedType === "warehouse" ? theme.textOnPrimary : theme.text} 
              />
              <ThemedText 
                type="bodyBold" 
                style={{ color: selectedType === "warehouse" ? theme.textOnPrimary : theme.text }}
              >
                Lager
              </ThemedText>
            </Pressable>
          </View>
        </Card>

        <Card style={{ backgroundColor: theme.cardSurface, marginTop: Spacing.lg }}>
          <ThemedText type="h4" style={{ color: theme.primary, marginBottom: Spacing.md }}>
            Container auswahlen
          </ThemedText>
          
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : containers.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={32} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                Keine Container vorhanden
              </ThemedText>
            </View>
          ) : (
            <View style={styles.containerList}>
              {containers.map((container) => {
                const isSelected = container.id === selectedContainer;
                return (
                  <Pressable
                    key={container.id}
                    style={[
                      styles.containerItem,
                      { 
                        backgroundColor: isSelected ? `${theme.accent}15` : theme.backgroundDefault,
                        borderColor: isSelected ? theme.accent : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedContainer(container.id)}
                  >
                    <View style={styles.containerInfo}>
                      <ThemedText type="bodyBold" style={{ color: theme.text }}>
                        {container.id}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
                        {getContainerLabel(container)}
                      </ThemedText>
                    </View>
                    {isSelected ? (
                      <View style={[styles.checkmark, { backgroundColor: theme.accent }]}>
                        <Feather name="check" size={16} color={theme.textOnAccent} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        {selectedContainer ? (
          <Card style={{ backgroundColor: theme.cardSurface, marginTop: Spacing.lg }}>
            <ThemedText type="h4" style={{ color: theme.primary, marginBottom: Spacing.lg }}>
              QR-Code Vorschau
            </ThemedText>
            
            <View style={styles.qrContainer}>
              <View style={[styles.qrWrapper, { backgroundColor: theme.cardSurface, borderColor: theme.border }]}>
                <View style={styles.qrImageContainer}>
                  {Platform.OS === "web" ? (
                    <img 
                      src={getQRCodeUrl()} 
                      alt="QR Code"
                      style={{ width: 200, height: 200 }}
                    />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <Feather name="external-link" size={40} color={theme.textSecondary} />
                      <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
                        Tippen Sie auf "Offnen", um den QR-Code anzuzeigen
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
              <ThemedText type="bodyBold" style={{ color: theme.text, marginTop: Spacing.md }}>
                {selectedContainer}
              </ThemedText>
              {selectedContainerData ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {selectedType === "customer" 
                    ? (selectedContainerData as CustomerContainer).customerName 
                    : (selectedContainerData as WarehouseContainer).materialType}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.qrActions}>
              {Platform.OS === "web" ? (
                <Button
                  style={[styles.actionButton, { backgroundColor: theme.accent }]}
                  onPress={handlePrintQR}
                >
                  <View style={styles.buttonContent}>
                    <Feather name="printer" size={20} color={theme.textOnAccent} />
                    <ThemedText type="bodyBold" style={{ color: theme.textOnAccent, marginLeft: Spacing.sm }}>
                      QR-Code drucken
                    </ThemedText>
                  </View>
                </Button>
              ) : null}
              
              <Button
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: Platform.OS === "web" ? theme.backgroundSecondary : theme.accent,
                    borderWidth: Platform.OS === "web" ? 2 : 0,
                    borderColor: theme.border,
                  }
                ]}
                onPress={handleDownloadQR}
              >
                <View style={styles.buttonContent}>
                  <Feather 
                    name="external-link" 
                    size={20} 
                    color={Platform.OS === "web" ? theme.text : theme.textOnAccent} 
                  />
                  <ThemedText 
                    type="bodyBold" 
                    style={{ 
                      color: Platform.OS === "web" ? theme.text : theme.textOnAccent, 
                      marginLeft: Spacing.sm 
                    }}
                  >
                    {Platform.OS === "web" ? "QR-Code offnen" : "QR-Code anzeigen"}
                  </ThemedText>
                </View>
              </Button>
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="info" size={18} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1, marginLeft: Spacing.sm }}>
                Dieser QR-Code enthalt die Container-ID. Beim Scannen werden die Live-Daten des Containers abgerufen.
              </ThemedText>
            </View>
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
  content: {
    padding: Spacing.lg,
  },
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  containerList: {
    gap: Spacing.sm,
  },
  containerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  containerInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  qrWrapper: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  qrImageContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  qrActions: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  actionButton: {
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
});

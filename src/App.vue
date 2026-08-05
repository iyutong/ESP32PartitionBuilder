<template>
  <v-app data-testid="app-shell">
    <v-app-bar :title="'ESP32 分区生成器 v' + APP_VERSION">
      <template v-slot:extension>
        <v-container fluid class="mb-1 ml-1">
          <partition-visualizer></partition-visualizer>
        </v-container>
      </template>
    </v-app-bar>
    <v-navigation-drawer permanent data-testid="sidebar" class="app-sidebar">
      <div class="app-sidebar__content">
        <div class="app-sidebar__controls">
          <div :class="availableMemoryColor()" data-testid="available-memory">
            <div>可用闪存:</div>
            <div>{{ store.partitionTables.getUnallocatedMemory() }} 字节 ({{
                store.hintDisplaySize(store.partitionTables.getUnallocatedMemory())
              }})
            </div>
          </div>
          <v-select data-testid="built-in-partitions-select" v-model="selectedPartitionSet" :items="partitionOptions"
                    item-value="value" item-title="text"
                    label="内置分区集" density="comfortable" hide-details></v-select>
          <v-select data-testid="flash-size-select" v-model="store.flashSize" :items="FLASH_SIZES" item-value="value"
                    item-title="text" label="闪存大小"
                    density="comfortable" hide-details @update:model-value="changeFlashSize"></v-select>
          <v-select
              data-testid="partition-table-offset-select"
              v-model="store.partitionTableOffset"
              :items="PARTITION_TABLE_OFFSET_OPTIONS"
              item-value="value"
              item-title="text"
              label="分区表偏移量"
              density="comfortable"
              hide-details
              @update:model-value="changePartitionTableOffset"
          ></v-select>
          <v-text-field
              data-testid="custom-offset-input"
              v-model="partitionTableOffsetText"
              label="自定义偏移量 (十六进制)"
              density="compact"
              hide-details="auto"
              persistent-hint
              hint="必须对齐到 0x1000; 保持 CSV 偏移量为空以自动对齐"
              :rules="[customOffsetRule]"
              append-inner-icon="mdi-check"
              @click:append-inner="applyCustomPartitionTableOffset(partitionTableOffsetText)"
              @change="applyCustomPartitionTableOffset($event)"
          ></v-text-field>
          <div class="target-chip-control">
            <v-select
                data-testid="target-chip-select"
                v-model="selectedChipTargetId"
                :items="CHIP_TARGETS"
                item-value="value"
                item-title="text"
                label="目标芯片型号"
                density="comfortable"
                hide-details
            ></v-select>
            <v-btn
                data-testid="flashing-hints-button"
                icon="mdi-information-outline"
                variant="text"
                density="comfortable"
                aria-label="显示烧录提示"
                @click="showFlashingHintsDialog = true"
            ></v-btn>
          </div>
          <v-select data-testid="display-size-select" v-model="store.displaySizes" :items="DISPLAY_SIZES"
                    item-value="value" item-title="text"
                    label="显示单位" density="comfortable" hide-details></v-select>
          <div v-if="store.partitionTables.hasOTAPartitions() && store.partitionTables.hasSubtype(PARTITION_NVS)"
               class="pl-2 pt-4">
            <v-icon color="green-darken-2" icon="mdi-wifi" size="large"></v-icon>
            OTA 更新能力
          </div>
          <v-alert
              data-testid="ota-nvs-warning"
              v-else-if="store.partitionTables.hasOTAPartitions()"
              type="warning"
              density="comfortable"
              border="start"
              class="ma-3 mt-4"
              variant="outlined"
              icon="mdi-alert"
          >
            <div class="font-weight-medium">需要 NVS 分区</div>
            <div class="text-body-2">添加 NVS 分区以恢复 OTA 更新能力。</div>
          </v-alert>
          <div v-if="store.partitionTables.hasOTAPartitions()" class="px-3 pt-2">
            <v-switch
                v-model="asymmetricOtaSlots"
                data-testid="asymmetric-ota-toggle"
                label="允许不相等 OTA 分区"
                color="primary"
                density="compact"
                hide-details
            ></v-switch>
            <div v-if="asymmetricOtaSlots" data-testid="asymmetric-ota-warning" class="text-caption pt-1">
              高级：更新必须适合非活动插槽。在刷写更大的镜像之前，可能需要一个小型引导固件。
            </div>
            <div v-else class="text-caption pt-1">保持插槽相等以进行标准的交替 OTA 更新。</div>
          </div>
        </div>
      </div>
    </v-navigation-drawer>
    <v-main class="d-flex align-top">
      <partition-editor
          @partitions-cleared="resetSelectedPartitionSet"
      ></partition-editor>
    </v-main>
    <v-snackbar v-model="showUrlNotification" location="top" data-testid="url-notification">
      {{ urlNotificationText }}
      <template #actions>
        <v-btn text @click="showUrlNotification = false">Close</v-btn>
      </template>
    </v-snackbar>
    <v-dialog v-model="showFlashingHintsDialog" width="560" data-testid="flashing-hints-dialog">
      <v-card color="white" class="flashing-dialog">
        <v-card-title class="flashing-dialog__title">{{ selectedChipTarget.text }} flashing hints</v-card-title>
        <v-card-text class="flashing-dialog__body">
          <div class="flashing-hints" data-testid="flashing-hints">
            <div class="flashing-hints__grid">
              <div class="flashing-hints__item">
                <span>芯片参数</span>
                <code>--chip {{ selectedChipTarget.esptoolChip }}</code>
              </div>
              <div class="flashing-hints__item">
                <span>引导加载程序</span>
                <code>{{ formatHex(selectedChipTarget.bootloaderOffset) }}</code>
              </div>
              <div class="flashing-hints__item">
                <span>分区表偏移量</span>
                <code>{{ formatHex(store.partitionTableOffset) }}</code>
              </div>
              <div class="flashing-hints__item">
                <span>应用镜像偏移量</span>
                <code>{{ formatHex(firstAppPartitionOffset) }}</code>
              </div>
            </div>
            <div class="flashing-hints__command-group">
              <div class="flashing-hints__label">命令格式</div>
              <code class="flashing-hints__command" data-testid="flashing-command">{{ flashingCommandPreview }}</code>
            </div>
            <v-alert
                v-if="hasCustomAppOffset"
                data-testid="app-offset-warning"
                type="warning"
                density="compact"
                variant="tonal"
                class="mt-3"
            >
              Arduino 上传必须配置为应用偏移量 {{ formatHex(firstAppPartitionOffset) }}; 否则固件可能仍会被写入 {{ formatHex(OFFSET_APP_TYPE) }}.
            </v-alert>
            <div class="flashing-hints__note">
              烧录前，使用 <code>gen_esp32part.py</code> 将 CSV 转换为 <code>partition-table.bin</code> 文件.
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn class="ms-auto" text="关闭" @click="showFlashingHintsDialog = false"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import {computed, ref, watch, inject, type Ref} from 'vue';
import PartitionEditor from './components/PartitionEditor.vue';
import PartitionVisualizer from './components/PartitionVisualizer.vue';
import {partitionStore} from '@/store';
import {CHIP_TARGETS} from '@/chipTargets';
import {
  FLASH_SIZES,
  APP_VERSION,
  DISPLAY_SIZES,
  PARTITION_NVS,
  PARTITION_TABLE_OFFSET_OPTIONS,
  OFFSET_DATA_TYPE,
  PARTITION_TABLE_SIZE,
  OFFSET_APP_TYPE,
  PARTITION_TYPE_APP
} from '@/const';
import {esp32Partitions} from '@/defaultPartitions';

const store = partitionStore();
const asymmetricOtaSlots = computed({
  get: () => store.partitionTables.allowsUnequalOtaSlots() || store.partitionTables.hasUnequalOtaSlots(),
  set: (allow: boolean) => store.partitionTables.setAllowUnequalOtaSlots(allow)
});
const urlPartitionMessage = inject<Ref<string | null> | null>('urlPartitionMessage', null);
const urlNotificationText = ref('');
const showUrlNotification = ref(false);
const showFlashingHintsDialog = ref(false);
if (urlPartitionMessage) {
  watch(
      urlPartitionMessage,
      (message) => {
        if (message) {
          urlNotificationText.value = message;
          showUrlNotification.value = true;
        }
      },
      {immediate: true}
  );
}

const firstPartitionSet = esp32Partitions[0];
const defaultPartitionName = firstPartitionSet ? firstPartitionSet.name : '';
const selectedPartitionSet = ref(defaultPartitionName);
const partitionTableOffsetText = ref(formatHex(store.partitionTableOffset));
const selectedChipTargetId = ref(CHIP_TARGETS[0]?.value ?? 'esp32');

const partitionOptions = esp32Partitions.map(set => ({
  text: set.name,
  value: set.name
}));
watch(selectedPartitionSet, () => {
  loadPartitions();
});

watch(() => store.partitionTableOffset, (val) => {
  partitionTableOffsetText.value = formatHex(val);
});

const selectedChipTarget = computed(() => {
  return CHIP_TARGETS.find(target => target.value === selectedChipTargetId.value) ?? CHIP_TARGETS[0]!;
});

const firstAppPartitionOffset = computed(() => {
  const appPartition = [...store.partitionTables.getPartitions()]
      .sort((a, b) => a.offset - b.offset)
      .find(partition => partition.type === PARTITION_TYPE_APP);

  return appPartition?.offset ?? OFFSET_APP_TYPE;
});

const hasCustomAppOffset = computed(() => firstAppPartitionOffset.value !== OFFSET_APP_TYPE);

const flashingCommandPreview = computed(() => {
  return [
    `esptool --chip ${selectedChipTarget.value.esptoolChip} write_flash`,
    `  ${formatHex(selectedChipTarget.value.bootloaderOffset)} bootloader.bin`,
    `  ${formatHex(store.partitionTableOffset)} partition-table.bin`,
    `  ${formatHex(firstAppPartitionOffset.value)} app.bin`
  ].join('\n');
});

function availableMemoryColor(): string {
  if (store.partitionTables.getUnallocatedMemory() == 0) {
    return 'pa-4 text-green'
  }
  if (store.partitionTables.getUnallocatedMemory() > 0) {
    return 'pa-4 text-yellow'
  }
  return 'pa-4 text-red'
}

function changeFlashSize() {
  store.partitionTables.releaseFixedOffsets();
  store.partitionTables.setFlashSize(store.flashSize)
}

function changePartitionTableOffset(offset: number) {
  store.partitionTables.releaseFixedOffsets();
  store.setPartitionTableOffset(offset);
}

function applyCustomPartitionTableOffset(value: string) {
  const parsed = parseOffset(value);
  if (parsed === null) {
    return;
  }
  const ruleResult = customOffsetRule(value);
  if (ruleResult !== true) {
    return;
  }
  store.partitionTables.releaseFixedOffsets();
  store.setPartitionTableOffset(parsed);
  partitionTableOffsetText.value = formatHex(parsed);
}

function parseOffset(value: string): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const cleaned = trimmed.toLowerCase().startsWith('0x') ? trimmed : `0x${trimmed}`;
  const parsed = parseInt(cleaned, 16);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatHex(value: number): string {
  return `0x${value.toString(16).toUpperCase()}`;
}

function customOffsetRule(value: string): true | string {
  const parsed = parseOffset(value);
  if (parsed === null) {
    return '请输入十六进制偏移量，例如 0x8000';
  }
  if (parsed % OFFSET_DATA_TYPE !== 0) {
    return '必须对齐到 0x1000';
  }
  if ((parsed + PARTITION_TABLE_SIZE) >= store.flashSizeBytes) {
    return '偏移量太大，无法适应闪存大小';
  }
  return true;
}

function loadPartitions() {
  const selectedSet = esp32Partitions.find(set => set.name === selectedPartitionSet.value);
  if (selectedSet) {
    store.partitionTables.clearPartitions();
    selectedSet.partitions.forEach(partition => {
      const fixedOffset = partition.fixedOffset ?? false;
      store.partitionTables.addPartition(
          partition.name,
          partition.type,
          partition.subtype,
          partition.size,
          partition.flags,
          fixedOffset ? partition.offset : undefined,
          fixedOffset,
          partition.custom ?? false
      );
    })
  }
}

function resetSelectedPartitionSet() {
  selectedPartitionSet.value = defaultPartitionName;
}

if (store.partitionTables.getPartitions().length === 0) {
  loadPartitions();
}

</script>

<style scoped>

.app-sidebar__content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.app-sidebar__controls {
  flex: 1 1 auto;
}

.target-chip-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px;
}

.flashing-dialog__title {
  padding: 22px 24px 8px;
  font-size: 1.08rem;
  font-weight: 600;
}

.flashing-dialog__body {
  padding-top: 8px;
}

.flashing-hints {
  color: #172033;
}

.flashing-hints__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.flashing-hints__item {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid #d6dee8;
  border-radius: 8px;
  background: #f8fafc;
}

.flashing-hints__item span,
.flashing-hints__label {
  color: #58667a;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.flashing-hints__item code,
.flashing-hints__note code {
  color: #172033;
  font-weight: 700;
}

.flashing-hints__command-group {
  margin-top: 14px;
}

.flashing-hints__command {
  display: block;
  margin-top: 6px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #111827;
  color: #e5edff;
  font-size: 0.78rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.flashing-hints__note {
  margin-top: 12px;
  padding: 10px 12px;
  border-left: 3px solid #2563eb;
  border-radius: 6px;
  background: #eff6ff;
  color: #314158;
  font-size: 0.8rem;
  line-height: 1.45;
}

@media (max-width: 600px) {
  .flashing-hints__grid {
    grid-template-columns: 1fr;
  }
}
</style>

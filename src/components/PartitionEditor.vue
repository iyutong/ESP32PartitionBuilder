<template>
  <v-container>
    <v-form ref="formRef" @submit.prevent="downloadCSV">
      <v-app-bar location="top" permanent>
        <v-btn data-testid="add-partition-button" color="primary" @click="addPartition">添加分区
          <v-menu activator="parent">
            <v-list v-if="store.partitionTables.getAvailableMemory() > 0" style="cursor: pointer;" data-testid="add-partition-menu">
              <v-tooltip location="end">
                <template #activator="{ props }">
                  <v-list-item data-testid="add-nvs-partition" v-bind="props" @click="addNVSPartition">
                    NVS (非易失性存储)
                  </v-list-item>
                </template>
                <span>使用 Wi-Fi、 BLE 或偏好设置 API 时需要。</span>
              </v-tooltip>
              <v-list-item data-testid="add-ota-partitions" @click="addOTAPartition">
                OTA (空中更新)
              </v-list-item>
              <v-list-item data-testid="add-factory-partition" @click="addFactoryPartition">
                工厂应用
              </v-list-item>
              <v-list-item data-testid="add-fat-partition" @click="addFATPartition">
                FAT 文件系统
              </v-list-item>
              <v-list-item data-testid="add-spiffs-partition" @click="addSPIFFPartition">
                SPIFFS 文件系统
              </v-list-item>
              <v-list-item data-testid="add-littlefs-partition" @click="addLittleFSPartition">
                LittleFS 文件系统
              </v-list-item>
              <v-list-item data-testid="add-ota-data-partition" @click="addOTADataPartition">
                OTA 数据
              </v-list-item>
              <v-list-item data-testid="add-coredump-partition" @click="addCoreDumpPartition">
                核心转储(Core Dump)
              </v-list-item>
              <v-list-item data-testid="add-test-partition" @click="addTestPartition">
                测试应用
              </v-list-item>
              <v-list-item data-testid="add-phy-partition" @click="addPhyPartition">
                PHY 初始化数据
              </v-list-item>
              <v-list-item data-testid="add-custom-partition" @click="addCustomPartition">
                自定义分区
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
        <v-btn data-testid="load-csv-button" color="primary" @click="loadCSV" density="comfortable" class="mr-2">加载 CSV
          <v-tooltip activator="parent" location="top">加载 CSV 分区文件</v-tooltip>
        </v-btn>
        <v-btn data-testid="paste-csv-button" color="primary" prepend-icon="mdi-content-paste" @click="pasteCSV" density="comfortable" class="mr-2">
          粘贴 CSV
          <v-tooltip activator="parent" location="top">从剪贴板导入一个 CSV 分区文件</v-tooltip>
        </v-btn>
        <input data-testid="csv-file-input" type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" accept=".csv" />
        <v-btn data-testid="copy-csv-button" color="primary" prepend-icon="mdi-content-copy" @click="copyCSV" density="comfortable" class="mr-2"
          :disabled="store.partitionTables.getPartitions().length == 0">
          复制 CSV
          <v-tooltip activator="parent" location="top">复制分区为 CSV 文件到剪贴板</v-tooltip>
        </v-btn>
        <v-btn data-testid="download-csv-button" color="primary" type="submit" density="comfortable"
          :disabled="store.partitionTables.getPartitions().length == 0">下载 CSV
          <v-tooltip activator="parent" location="top">下载分区为一个 CSV 文件</v-tooltip>
        </v-btn>
        <v-spacer></v-spacer>
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn data-testid="clear-partitions-button" icon v-bind="props" @click="clearPartitions" variant="text"
              :disabled="store.partitionTables.getPartitions().length == 0">
              <v-icon color="red-darken-4">
                mdi-trash-can
              </v-icon>
            </v-btn>
          </template>
          <span>删除所有分区</span>
        </v-tooltip>
      </v-app-bar>
      <div data-testid="partition-card" v-for="(partition, index) in store.partitionTables.getPartitions()" :key="index"
        class="partition mt-4" :style="partitionStyle(partition, index)">
        <div class="partition__tag">
          <div class="partition__label">
            <span class="partition__dot"></span>
            <span class="partition__tag-text">{{ partition.type }} / {{ partition.subtype }}</span>
          </div>
          <span class="partition__size">{{ store.hintDisplaySize(partition.size) }}</span>
        </div>
        <v-row density="comfortable">
          <v-col>
            <v-text-field data-testid="partition-name-input" v-model="partition.name" label="名称" density="compact"
              :rules="[partitionNameRule(partition.name, index)]"></v-text-field>
          </v-col>
          <v-col>
            <v-text-field v-if="isCustomPartition(partition)" data-testid="partition-type-input"
              v-model.trim="partition.type" label="Type" density="compact"
              :rules="[partitionTypeRule(partition.type)]" @change="updateSize(partition)"></v-text-field>
            <v-select v-else readonly v-model="partition.type" :items="PARTITION_TYPES" label="类型" density="compact"
              hide-details @update:model-value="validateType(partition)"></v-select>
          </v-col>
          <v-col>
            <v-text-field v-if="isCustomPartition(partition)" data-testid="partition-subtype-input"
              v-model.trim="partition.subtype" label="Subtype" density="compact"
              :rules="[partitionSubtypeRule(partition.subtype)]" @change="store.partitionTables.recalculateOffsets()"></v-text-field>
            <v-select v-else readonly v-model="partition.subtype" :items="getSubtypes(partition.type)" label="子类型"
              density="compact"></v-select>
          </v-col>
          <v-col>
            <v-text-field data-testid="partition-size-input" :readonly="!isCustomPartition(partition)" v-model.number="partition.size"
              label="大小 (字节)" density="compact" :type="isCustomPartition(partition) ? 'number' : undefined"
              :rules="[partitionSizeRule(partition)]" :hint="store.hintDisplaySize(partition.size)"
              persistent-hint @change="updateSize(partition)"></v-text-field>
          </v-col>
          <v-col>
            <v-text-field v-if="isCustomPartition(partition)" data-testid="partition-offset-input"
              :model-value="getOffsetInput(partition)" label="偏移量 (可选)" density="compact"
              hint="留空表示自动分配" persistent-hint @change="updateCustomOffset(partition, $event)"></v-text-field>
            <v-text-field v-else readonly active label="偏移量" density="compact">
              {{ getHexOffset(partition.offset) }}
            </v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn data-testid="remove-partition-button" icon v-bind="props" @click="removePartition(partition)" variant="text">
                  <v-icon color="red-darken-4">
                    mdi-trash-can
                  </v-icon>
                </v-btn>
              </template>
              <span>删除分区</span>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-row v-if="isCustomPartition(partition)" density="comfortable">
          <v-col cols="12" md="6">
            <v-text-field data-testid="partition-flags-input" v-model.trim="partition.flags" label="Flags"
              density="compact" hint="Optional, for example encrypted" persistent-hint></v-text-field>
          </v-col>
        </v-row>
        <v-slider :color="partitionAccentColor(partition, index)"
          :track-color="partitionAccentTrackColor(partition, index)" v-model="partition.size" thumb-label label="Size"
          :disabled="partition.subtype === 'ota_0' && isPairedOtaSlot(partition) && !asymmetricOtaSlots"
          :max="store.partitionTables.getTotalMemory()" @end="updateSize(partition)" density="comfortable" hide-details
          :step="stepSize(partition)" :min="stepSize(partition)">
          <template v-slot:prepend>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" @click="resizeToFit(partition)" variant="text"
                  :disabled="store.partitionTables.getAvailableMemory() >= 0">
                  <v-icon color="blue">
                    mdi-arrow-left-bold
                  </v-icon>
                </v-btn>
              </template>
              <span>调整为适合大小</span>
            </v-tooltip>
            <v-btn data-testid="decrement-partition-button" color="primary" icon="mdi-minus-box" size="small" variant="text"
              @click="decrement(partition)"></v-btn>
          </template>
          <template v-slot:append>
            <v-btn data-testid="increment-partition-button" color="primary" icon="mdi-plus-box" size="small" variant="text"
              @click="increment(partition)"></v-btn>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" @click="reclaimMemory(partition)" variant="text"
                  :disabled="getReclaimableMemory(partition) <= 0">
                  <v-icon color="blue">
                    mdi-arrow-right-bold
                  </v-icon>
                </v-btn>
              </template>
              <span>回收内存空间</span>
            </v-tooltip>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" @click="reszeToRecommendedValue(partition)" variant="text"
                  :disabled="!partitionNotRecommendedSize(partition)">
                  <v-icon color="blue">
                    mdi-check-underline
                  </v-icon>
                </v-btn>
              </template>
              <span>调整为推荐值</span>
            </v-tooltip>
          </template>
        </v-slider>
      </div>
    </v-form>
    <v-dialog v-model="showAlert" width="auto" data-testid="alert-dialog">
      <v-card max-width="400" prepend-icon="mdi-alert-circle-outline" color="white" :text="alertText"
        :title="alertTitle">
        <template v-slot:actions>
          <v-btn class="ms-auto" text="Ok" @click="showAlert = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showOverrideDialog" width="auto" data-testid="override-dialog">
      <v-card max-width="400" color="white" :title="dialogTitle">
        <v-card-text>{{ dialogText }}</v-card-text>
        <v-card-actions>
          <v-btn @click="showOverrideDialog = false">Cancel</v-btn>
          <v-btn data-testid="confirm-download-button" color="primary" @click="confirmOverride">Proceed</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showPasteDialog" width="720" data-testid="paste-csv-dialog">
      <v-card color="white" title="Paste CSV">
        <v-card-text>
          <v-textarea
            data-testid="paste-csv-textarea"
            v-model="pastedCsvText"
            label="CSV content"
            auto-grow
            rows="8"
            hide-details
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showPasteDialog = false">Cancel</v-btn>
          <v-btn data-testid="import-pasted-csv-button" color="primary" @click="importPastedCSV">Import CSV</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { loadPartitionsFromCsv } from '@/partitionLoader';
import { buildPartitionCsv } from '@/utils/partitionCsv';
import {
  PARTITION_TYPES, PARTITION_TYPE_DATA, PARTITION_TYPE_APP, PARTITION_APP_SUBTYPES,
  PARTITION_DATA_SUBTYPES, PARTITION_NVS, NVS_PARTITION_SIZE_RECOMMENDED, OTA_DATA_PARTITION_SIZE,
  OFFSET_DATA_TYPE, PARTITION_OTA, OFFSET_APP_TYPE, PARTITION_FAT, FAT_MIN_PARTITION_SIZE,
  PARTITION_SPIFFS, PARTITION_LITTLEFS, SPIFFS_MIN_PARTITION_SIZE, LITTLEFS_MIN_PARTITION_SIZE,
  COREDUMP_MIN_PARTITION_SIZE, PARTITION_COREDUMP, PARTITION_FACTORY, PARTITION_TEST, PHY_MIN_PARTITION_SIZE,
  PARTITION_PHY
} from '@/const';
import { partitionStore } from '@/store'
import type { Partition } from '@/types'
import { getAccessibleTextColor, getPartitionBaseColor, lightenColor } from '@/partitionColors';

const store = partitionStore();
const emit = defineEmits<{
  (event: 'partitions-cleared'): void
}>();
const formRef = ref();
const showAlert = ref(false);
const alertText = ref("")
const alertTitle = ref("")
const dialogText = ref("")
const dialogTitle = ref("")
const fileInput = ref<HTMLInputElement | null>(null);
const showOverrideDialog = ref(false);
const pendingCsvAction = ref<'download' | 'copy' | null>(null);
const showPasteDialog = ref(false);
const pastedCsvText = ref('');
const MAX_PARTITION_NAME_LENGTH = 16;
const CUSTOM_DATA_PARTITION_SIZE_STEP = 0x400;

const asymmetricOtaSlots = computed({
  get: () => store.partitionTables.allowsUnequalOtaSlots() || store.partitionTables.hasUnequalOtaSlots(),
  set: (allow: boolean) => store.partitionTables.setAllowUnequalOtaSlots(allow)
});

const isPairedOtaSlot = (partition: Partition): boolean =>
  store.partitionTables.hasOTAPartitions() && (partition.subtype === 'ota_0' || partition.subtype === 'ota_1');

const partitionStyle = (partition: Partition, index: number) => {
  const baseColor = getPartitionBaseColor(partition, index);
  return {
    '--partition-accent-color': baseColor,
    '--partition-accent-light': lightenColor(baseColor, 0.45),
    '--partition-accent-dark': lightenColor(baseColor, -0.2),
    '--partition-tag-background': lightenColor(baseColor, 0.25),
    '--partition-text-contrast': getAccessibleTextColor(baseColor)
  };
};

const partitionAccentColor = (partition: Partition, index: number) => {
  return getPartitionBaseColor(partition, index);
};

const partitionAccentTrackColor = (partition: Partition, index: number) => {
  return lightenColor(getPartitionBaseColor(partition, index), 0.65);
};



const partitionNameRule = (name: string, index: number) => {
  const nameConflict = store.partitionTables.getPartitions().some((p, i) => i !== index && p.name === name)
  if (!name) {
    return '名称为必填项'
  } else if (nameConflict) {
    return '名称已存在'
  } else if (name.length > MAX_PARTITION_NAME_LENGTH) {
    return `名称必须为 ${MAX_PARTITION_NAME_LENGTH} 个字符或更少`
  } else {
    return true
  }
};

const isCustomPartition = (partition: Partition): boolean => partition.custom === true;

const partitionTypeRule = (type: string) => {
  if (!type) {
    return '类型为必填项';
  }
  if (type === PARTITION_TYPE_APP || type === PARTITION_TYPE_DATA || isNumericPartitionValue(type)) {
    return true;
  }
  return '类型必须为 app、data 或从 0 到 254';
};

const partitionSubtypeRule = (subtype: string) => {
  return subtype ? true : '子类型为必填项';
};

const isNumericPartitionValue = (value: string): boolean => {
  const trimmed = value.trim();
  const parsed = trimmed.toLowerCase().startsWith('0x')
    ? parseInt(trimmed, 16)
    : parseInt(trimmed, 10);

  return /^\d+$/.test(trimmed) || /^0x[0-9a-f]+$/i.test(trimmed)
    ? Number.isInteger(parsed) && parsed >= 0 && parsed <= 254
    : false;
};

function partitionNotRecommendedSize(partition: Partition): boolean {
  if (isCustomPartition(partition)) {
    return false;
  }
  let recommendeSize: boolean
  switch (partition.subtype) {
    case PARTITION_NVS:
      recommendeSize = partition.size < NVS_PARTITION_SIZE_RECOMMENDED
      break;
    case PARTITION_OTA:
      recommendeSize = partition.size != OTA_DATA_PARTITION_SIZE
      break;
    case PARTITION_FAT:
      recommendeSize = partition.size < FAT_MIN_PARTITION_SIZE
      break;
    case PARTITION_SPIFFS:
      recommendeSize = partition.size < SPIFFS_MIN_PARTITION_SIZE
      break;
    case PARTITION_LITTLEFS:
      recommendeSize = partition.size < LITTLEFS_MIN_PARTITION_SIZE
      break;
    case PARTITION_COREDUMP:
      recommendeSize = partition.size < COREDUMP_MIN_PARTITION_SIZE
      break;
    default:
      recommendeSize = false;
      break;
  }
  return recommendeSize
}
function reszeToRecommendedValue(partition: Partition) {
  switch (partition.subtype) {
    case PARTITION_NVS:
      partition.size = NVS_PARTITION_SIZE_RECOMMENDED
      break;
    case PARTITION_OTA:
      partition.size = OTA_DATA_PARTITION_SIZE
      break;
    case PARTITION_FAT:
      partition.size = FAT_MIN_PARTITION_SIZE
      break;
    case PARTITION_SPIFFS:
      partition.size = SPIFFS_MIN_PARTITION_SIZE
      break;
    case PARTITION_LITTLEFS:
      partition.size = LITTLEFS_MIN_PARTITION_SIZE
      break;
    case PARTITION_COREDUMP:
      partition.size = COREDUMP_MIN_PARTITION_SIZE
      break;
  }
}

const partitionSizeRule = (partition: Partition) => {
  const alignment = stepSize(partition);
  if (!Number.isFinite(partition.size) || partition.size <= 0) {
    return '大小必须大于 0 字节';
  }
  if (partition.size % alignment !== 0) {
    return `大小必须对 ${getHexOffset(alignment)} 字节对齐`;
  }
  if (isCustomPartition(partition)) {
    return true;
  }

  switch (partition.subtype) {
    case PARTITION_NVS:
      if (partition.size < NVS_PARTITION_SIZE_RECOMMENDED) {
        return `NVS 分区大小必须至少为 ${NVS_PARTITION_SIZE_RECOMMENDED} 字节。 (${store.hintDisplaySize(NVS_PARTITION_SIZE_RECOMMENDED)})`;
      }
      break;
    case PARTITION_OTA:
      if (partition.size != OTA_DATA_PARTITION_SIZE) {
        return `OTA 数据分区大小必须为 ${OTA_DATA_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(OTA_DATA_PARTITION_SIZE)})`;
      }
      break;
    case PARTITION_FAT:
      if (partition.size < FAT_MIN_PARTITION_SIZE) {
        return `FAT 分区大小必须至少为 ${FAT_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(FAT_MIN_PARTITION_SIZE)})`;
      }
      break;
    case PARTITION_SPIFFS:
      if (partition.size < SPIFFS_MIN_PARTITION_SIZE) {
        return `SPIFFS 分区大小必须至少为 ${SPIFFS_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(SPIFFS_MIN_PARTITION_SIZE)})`;
      }
      break;
    case PARTITION_LITTLEFS:
      if (partition.size < LITTLEFS_MIN_PARTITION_SIZE) {
        return `LittleFS 分区大小必须至少为 ${LITTLEFS_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(LITTLEFS_MIN_PARTITION_SIZE)})`;
      }
      break;
    case PARTITION_COREDUMP:
      if (partition.size < COREDUMP_MIN_PARTITION_SIZE) {
        return `Core Dump 分区大小必须至少为 ${COREDUMP_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(COREDUMP_MIN_PARTITION_SIZE)})`;
      }
      break;
  }
  return true;
};

function stepSize(partition: Partition): number {
  if (isCustomPartition(partition) && partition.type !== PARTITION_TYPE_APP) {
    return CUSTOM_DATA_PARTITION_SIZE_STEP
  }
  return OFFSET_DATA_TYPE
}

function offsetAlignment(partition: Partition): number {
  if (partition.type === PARTITION_TYPE_APP) {
    return OFFSET_APP_TYPE
  }
  return OFFSET_DATA_TYPE
}

function decrement(partition: Partition) {
  const step_size = stepSize(partition)
  if (partition.size - step_size > 0) {
    partition.size -= step_size
    updateSize(partition)
  }
}

function increment(partition: Partition) {
  partition.size += stepSize(partition)
  updateSize(partition)
}

const getHexOffset = (offset: number): string => {
  return '0x' + offset.toString(16).toUpperCase();
};

const getOffsetInput = (partition: Partition): string => {
  return partition.fixedOffset ? getHexOffset(partition.offset) : '';
};

const getInputValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Event && value.target instanceof HTMLInputElement) {
    return value.target.value;
  }
  return String(value ?? '');
};

const parseHexInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.toLowerCase().startsWith('0x') ? trimmed : `0x${trimmed}`;
  const parsed = parseInt(normalized, 16);
  return Number.isNaN(parsed) ? null : parsed;
};

const updateCustomOffset = (partition: Partition, value: unknown) => {
  const rawOffset = getInputValue(value).trim();
  if (!rawOffset) {
    partition.fixedOffset = false;
    store.partitionTables.recalculateOffsets();
    return;
  }

  const parsedOffset = parseHexInput(rawOffset);
  if (parsedOffset === null) {
    showAlertMessage('无效偏移量', '请输入十六进制偏移量，例如 0xD000。');
    return;
  }

  const alignment = offsetAlignment(partition);
  if (parsedOffset < store.partitionTables.getPartitionTableBaseOffset()) {
    showAlertMessage('无效偏移量', `分区偏移量必须从或之后 ${getHexOffset(store.partitionTables.getPartitionTableBaseOffset())} 开始。`);
    return;
  }
  if (parsedOffset % alignment !== 0) {
    showAlertMessage('无效偏移量对齐方式', `此分区偏移量必须对齐到 ${getHexOffset(alignment)}。`);
    return;
  }

  partition.offset = parsedOffset;
  partition.fixedOffset = true;
  store.partitionTables.recalculateOffsets();
};

const downloadCSV = async () => {
  await requestCsvAction('download');
};

const copyCSV = async () => {
  await requestCsvAction('copy');
};

const requestCsvAction = async (action: 'download' | 'copy') => {
  if (formRef.value) {
    const { valid } = await formRef.value.validate();
    if (valid) {
      if (store.partitionTables.getAvailableMemory() < 0) {
        showCsvOverride(action, "内存警告", "分区内存超过闪存容量。是否继续？")
      } else {
        if (store.partitionTables.getAvailableMemory() > 0) {
          showCsvOverride(action, "内存警告", "您有可用的闪存内存。是否继续？")
        } else {
          await runCsvAction(action);
        }
      }
    } else {
      showCsvOverride(action, "分区规则警告", "分区存在验证错误。是否继续？")
    }
  }
};

const showCsvOverride = (action: 'download' | 'copy', title: string, text: string) => {
  pendingCsvAction.value = action;
  dialogText.value = text;
  dialogTitle.value = title;
  showOverrideDialog.value = true;
};

const confirmOverride = async () => {
  showOverrideDialog.value = false;
  const action = pendingCsvAction.value ?? 'download';
  pendingCsvAction.value = null;
  await runCsvAction(action);
};

const runCsvAction = async (action: 'download' | 'copy') => {
  const csvData = buildPartitionCsv(store.partitionTables.getPartitions());

  if (action === 'copy') {
    await copyCsvToClipboard(csvData);
    return;
  }

  downloadCsvFile(csvData);
};

const copyCsvToClipboard = async (csvData: string) => {
  try {
    await navigator.clipboard.writeText(csvData);
    showAlertMessage('CSV已复制', '分区CSV已复制到剪贴板。');
  } catch {
    showAlertMessage('剪贴板不可用', '浏览器无法写入剪贴板。请尝试下载CSV文件。');
  }
};

const downloadCsvFile = (csvData: string) => {
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "partitions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const validateType = (partition: Partition) => {
  const subtypes = getSubtypes(partition.type);
  const nextSubtype = subtypes[0];
  if (nextSubtype) {
    partition.subtype = nextSubtype;
  }
  store.partitionTables.recalculateOffsets()
};

const getSubtypes = (type: string) => {
  if (type === PARTITION_TYPE_APP) {
    return PARTITION_APP_SUBTYPES;
  } else if (type === PARTITION_TYPE_DATA) {
    return PARTITION_DATA_SUBTYPES;
  }
  return [];
};


const updateSize = (partition: Partition) => {
  store.partitionTables.updatePartitionSize(partition, partition.size);
};


const generatePartitionName = (baseName: string) => {
  if (!baseName || !store.partitionTables.getPartitions().some(p => p.name.startsWith(baseName))) {
    return baseName;
  }

  let index = 1;
  while (store.partitionTables.getPartitions().some(p => p.name === `${baseName}_${index}`)) {
    index++;
  }
  return `${baseName}_${index}`;
};

function showAlertMessage(title: string, message: string) {
  alertTitle.value = title
  alertText.value = message
  showAlert.value = true
}

const addPartition = () => {
  if (store.partitionTables.getAvailableMemory() <= 0) {
    showAlertMessage("无法添加新分区", "当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。")
  }
};

const addNVSPartition = () => {
  if (store.partitionTables.getAvailableMemory() < NVS_PARTITION_SIZE_RECOMMENDED) {
    showAlertMessage("无法添加NVS分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。NVS分区大小必须至少 ${NVS_PARTITION_SIZE_RECOMMENDED} 字节 (${store.hintDisplaySize(NVS_PARTITION_SIZE_RECOMMENDED)}。`)
  } else {
    const newName = generatePartitionName("nvs");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_NVS, NVS_PARTITION_SIZE_RECOMMENDED, "")
  }
};

const addFATPartition = () => {
  if (store.partitionTables.getAvailableMemory() < FAT_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加FAT分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。FAT分区大小必须至少 ${FAT_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(FAT_MIN_PARTITION_SIZE)}。`)
  } else {
    const newName = generatePartitionName("fat");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_FAT, FAT_MIN_PARTITION_SIZE, "")
  }
};
const addSPIFFPartition = () => {
  if (store.partitionTables.getAvailableMemory() < SPIFFS_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加SPIFFS分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。SPIFFS分区大小必须至少 ${SPIFFS_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(SPIFFS_MIN_PARTITION_SIZE)}。`)
  } else {
    const newName = generatePartitionName("spiffs");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_SPIFFS, SPIFFS_MIN_PARTITION_SIZE, "")
  }
};
const addLittleFSPartition = () => {
  if (store.partitionTables.getAvailableMemory() < LITTLEFS_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加LittleFS分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。LittleFS分区大小必须至少 ${LITTLEFS_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(LITTLEFS_MIN_PARTITION_SIZE)}。`)
  } else {
    const newName = generatePartitionName("littlefs");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_LITTLEFS, LITTLEFS_MIN_PARTITION_SIZE, "")
  }
};
const addCoreDumpPartition = () => {
  if (store.partitionTables.getAvailableMemory() < COREDUMP_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加Core Dump分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。Core Dump分区大小必须至少 ${COREDUMP_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(COREDUMP_MIN_PARTITION_SIZE)}。`)
  } else {
    const newName = generatePartitionName("coredump");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_COREDUMP, COREDUMP_MIN_PARTITION_SIZE, "")
  }
};
const addPhyPartition = () => {
  if (store.partitionTables.getAvailableMemory() < PHY_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加PHY分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。PHY分区大小必须至少 ${PHY_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(PHY_MIN_PARTITION_SIZE)}。`)
  } else {
    const newName = generatePartitionName("phy");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_PHY, PHY_MIN_PARTITION_SIZE, "")
  }
};
const addCustomPartition = () => {
  if (store.partitionTables.getAvailableMemory() < OFFSET_DATA_TYPE) {
    showAlertMessage("无法添加自定义分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。自定义分区大小必须至少 ${OFFSET_DATA_TYPE} 字节 (${store.hintDisplaySize(OFFSET_DATA_TYPE)}。`)
  } else {
    const newName = generatePartitionName("custom");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_FAT, OFFSET_DATA_TYPE, "", undefined, false, true)
  }
};
const addFactoryPartition = () => {
  if (store.partitionTables.getAvailableMemory() < OFFSET_APP_TYPE) {
    showAlertMessage("无法添加Factory App分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。Factory App分区大小必须至少 ${OFFSET_APP_TYPE} 字节 (${store.hintDisplaySize(OFFSET_APP_TYPE)}。`)
  } else {
    const newName = generatePartitionName("factory");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_APP, PARTITION_FACTORY, OFFSET_APP_TYPE, "")
  }
};
const addTestPartition = () => {
  if (store.partitionTables.getAvailableMemory() < OFFSET_APP_TYPE) {
    showAlertMessage("无法添加Test App分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。Test App分区大小必须至少 ${OFFSET_APP_TYPE} 字节 (${store.hintDisplaySize(OFFSET_APP_TYPE)}。`)
  } else {
    const newName = generatePartitionName("test");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_APP, PARTITION_TEST, OFFSET_APP_TYPE, "")
  }
};
const addOTADataPartition = () => {
  if (store.partitionTables.getAvailableMemory() < OTA_DATA_PARTITION_SIZE) {
    showAlertMessage("无法添加OTA Data分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。OTA Data分区大小必须至少 ${OTA_DATA_PARTITION_SIZE} 字节 (${store.hintDisplaySize(OTA_DATA_PARTITION_SIZE)}。`)
    return
  }
  if (store.partitionTables.hasSubtype(PARTITION_OTA)) {
    showAlertMessage("无法添加OTA Data分区", `只能有一个OTA Data分区`)
    return
  }
  const newName = generatePartitionName("otadata");
  store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_OTA, OTA_DATA_PARTITION_SIZE, "")

};

const addOTAPartition = () => {
  const needsNvs = !store.partitionTables.hasSubtype(PARTITION_NVS)
  const sizeNeeded = OTA_DATA_PARTITION_SIZE + OFFSET_APP_TYPE * 2 + (needsNvs ? NVS_PARTITION_SIZE_RECOMMENDED : 0)
  if (store.partitionTables.getAvailableMemory() < sizeNeeded) {
    const requirementMessage = needsNvs
      ? `您至少需要 ${sizeNeeded} 字节可用 (${store.hintDisplaySize(sizeNeeded)}) 用于 OTA 数据、两个 OTA 应用程序插槽和一个 NVS 分区。`
      : `您至少需要 ${sizeNeeded} 字节可用 (${store.hintDisplaySize(sizeNeeded)}) 用于 OTA 数据和两个 OTA 应用程序插槽。`
    showAlertMessage("无法添加OTA分区分区", `当前没有可用的闪存内存,请删除现有分区或调整现有分区大小。OTA分区大小必须至少 ${requirementMessage}`)
    return
  }
  let partitionName: string = ""
  if (needsNvs) {
    partitionName = generatePartitionName("nvs")
    store.partitionTables.addPartition(partitionName, PARTITION_TYPE_DATA, PARTITION_NVS, NVS_PARTITION_SIZE_RECOMMENDED, "")
  }
  partitionName = generatePartitionName("otadata")
  store.partitionTables.addPartition(partitionName, PARTITION_TYPE_DATA, PARTITION_OTA, OTA_DATA_PARTITION_SIZE, "")
  partitionName = generatePartitionName("app0")
  store.partitionTables.addPartition(partitionName, PARTITION_TYPE_APP, "ota_0", OFFSET_APP_TYPE, "")
  partitionName = generatePartitionName("app1")
  store.partitionTables.addPartition(partitionName, PARTITION_TYPE_APP, "ota_1", OFFSET_APP_TYPE, "")

};

const removePartition = (partition: Partition) => {
  store.partitionTables.removePartition(partition.name)
};

const clearPartitions = () => {
  store.partitionTables.clearPartitions()
  emit('partitions-cleared')
};

const reclaimMemory = (partition: Partition) => {
  const available = getReclaimableMemory(partition);
  if (available <= 0) {
    return;
  }
  const resizeOnOta = isPairedOtaSlot(partition) && !asymmetricOtaSlots.value;
  const targetSize = resizeOnOta
    ? partition.size + Math.floor(available / 2)
    : partition.size + available;
  store.partitionTables.updatePartitionSize(partition, targetSize);
};

const getReclaimableMemory = (partition: Partition): number => {
  const resizeOnOta = isPairedOtaSlot(partition) && !asymmetricOtaSlots.value;
  return resizeOnOta
    ? store.partitionTables.getAvailableMemory()
    : store.partitionTables.getReclaimableMemory(partition);
};

const resizeToFit = (partition: Partition) => {
  let resize: number
  const resizeOnOta = isPairedOtaSlot(partition) && !asymmetricOtaSlots.value
  if (resizeOnOta) {
    resize = partition.size * 2 + store.partitionTables.getAvailableMemory()
  } else {
    resize = partition.size + store.partitionTables.getAvailableMemory()
  }
  if (resize <= 0 || (partition.type === PARTITION_TYPE_APP && partition.size <= OFFSET_APP_TYPE)) {
    showAlertMessage("无法调整分区大小", `分区不够大，无法删除 ${store.partitionTables.getAvailableMemory()} 字节 (${store.hintDisplaySize(store.partitionTables.getAvailableMemory())})。`)
  } else {
    if (resizeOnOta) {
      store.partitionTables.updatePartitionSize(partition, Math.round(resize / 2));
      if (store.partitionTables.getAvailableMemory() < 0) {
        store.partitionTables.updatePartitionSize(partition, partition.size + store.partitionTables.getAvailableMemory());
      }
    } else {
      store.partitionTables.updatePartitionSize(partition, resize);
    }
  }
};

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        const csv = e.target.result;
        loadPartitionsFromCSV(csv);
      }
    };
    reader.readAsText(file);
    input.value = '';

  }
};

const loadPartitionsFromCSV = (csv: string): boolean => {
  const error = loadPartitionsFromCsv(csv, store);
  if (error) {
    showAlertMessage(error.title, error.text);
    return false;
  }
  return true;
};

const pasteCSV = async () => {
  try {
    const csv = await navigator.clipboard.readText();
    if (!csv.trim()) {
      showAlertMessage('剪贴板为空', '请先复制分区CSV文本，然后重试。');
      return;
    }
    if (loadPartitionsFromCSV(csv)) {
      showAlertMessage('CSV导入', '从剪贴板导入分区CSV。');
    }
  } catch {
    pastedCsvText.value = '';
    showPasteDialog.value = true;
  }
};

const importPastedCSV = () => {
  if (!pastedCsvText.value.trim()) {
    showAlertMessage('CSV不能为空', '请先输入分区CSV内容，然后重试。');
    return;
  }
  if (loadPartitionsFromCSV(pastedCsvText.value)) {
    showPasteDialog.value = false;
    pastedCsvText.value = '';
    showAlertMessage('CSV导入', '导入分区CSV。');
  }
};

const loadCSV = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

</script>

<style scoped>
.partition {
  position: relative;
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 18px 20px 22px 22px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.82));
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.partition::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  background: linear-gradient(to bottom,
      var(--partition-accent-light, rgba(59, 130, 246, 0.75)),
      var(--partition-accent-color, rgba(59, 130, 246, 0.95)));
  border-radius: 14px 0 0 14px;
}

.partition:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.35);
}

.partition__tag {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg,
      var(--partition-tag-background, rgba(255, 255, 255, 0.08)),
      rgba(255, 255, 255, 0.03));
  color: var(--partition-text-contrast, #e2e8f0);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.partition__label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.partition__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--partition-accent-color, rgba(59, 130, 246, 0.85));
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.partition__tag-text {
  white-space: nowrap;
}

.partition__size {
  font-weight: 600;
  opacity: 0.9;
}

.partition :deep(.v-field--variant-filled .v-field__overlay) {
  background-color: rgba(15, 23, 42, 0.35);
}

.partition :deep(.v-field--variant-filled .v-field__outline) {
  border-color: rgba(255, 255, 255, 0.08);
}

.partition :deep(.v-slider-track__fill),
.partition :deep(.v-slider-track__background) {
  border-radius: 999px;
}
</style>

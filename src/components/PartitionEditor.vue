<template>
  <v-container>
    <v-form ref="formRef" @submit.prevent="downloadCSV">
      <v-app-bar location="top" permanent>
        <v-btn color="primary" @click="addPartition">添加分区
          <v-menu activator="parent">
            <v-list v-if="store.partitionTables.getAvailableMemory() > 0" style="cursor: pointer;">
              <v-tooltip location="end">
                <template #activator="{ props }">
                  <v-list-item v-bind="props" @click="addNVSPartition">
                    NVS（非易失性存储）
                  </v-list-item>
                </template>
                <span>使用 Wi-Fi、BLE 或偏好设置 API 时必不可少。</span>
              </v-tooltip>
              <v-list-item @click="addOTAPartition">
                OTA (无线升级)
              </v-list-item>
              <v-list-item @click="addFactoryPartition">
                工厂应用
              </v-list-item>
              <v-list-item @click="addFATPartition">
                FAT文件系统
              </v-list-item>
              <v-list-item @click="addSPIFFPartition">
                SPIFFS文件系统
              </v-list-item>
              <v-list-item @click="addLittleFSPartition">
                LittleFS文件系统
              </v-list-item>
              <v-list-item @click="addOTADataPartition">
                OTA Data
              </v-list-item>
              <v-list-item @click="addCoreDumpPartition">
                Core Dump
              </v-list-item>
              <v-list-item @click="addTestPartition">
                Test App
              </v-list-item>
              <v-list-item @click="addPhyPartition">
                PHY 初始化数据
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
        <v-btn color="primary" @click="loadCSV" dense class="mr-2">加载 CSV
          <v-tooltip activator="parent" location="top">加载 CSV 分区文件</v-tooltip>
        </v-btn>
        <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" accept=".csv" />
        <v-btn color="primary" type="submit" dense
          :disabled="store.partitionTables.getPartitions().length == 0">下载 CSV
          <v-tooltip activator="parent" location="top">下载分区作为 CSV 文件</v-tooltip>
        </v-btn>
        <v-spacer></v-spacer>
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="store.partitionTables.clearPartitions()" variant="text"
              :disabled="store.partitionTables.getPartitions().length == 0">
              <v-icon color="red-darken-4">
                mdi-trash-can
              </v-icon>
            </v-btn>
          </template>
          <span>删除所有分区</span>
        </v-tooltip>
      </v-app-bar>
      <div v-for="(partition, index) in store.partitionTables.getPartitions()" :key="index"
        class="partition mt-4" :style="partitionStyle(partition, index)">
        <div class="partition__tag">
          <div class="partition__label">
            <span class="partition__dot"></span>
            <span class="partition__tag-text">{{ partition.type }} / {{ partition.subtype }}</span>
          </div>
          <span class="partition__size">{{ store.hintDisplaySize(partition.size) }}</span>
        </div>
        <v-row dense>
          <v-col>
            <v-text-field v-model="partition.name" label="Name" density="compact"
              :rules="[partitionNameRule(partition.name, index)]"></v-text-field>
          </v-col>
          <v-col>
            <v-select readonly v-model="partition.type" :items="PARTITION_TYPES" label="Type" density="compact"
              hide-details @update:model-value="validateType(partition)"></v-select>
          </v-col>
          <v-col>
            <v-select readonly v-model="partition.subtype" :items="getSubtypes(partition.type)" label="Subtype"
              density="compact" dense></v-select>
          </v-col>
          <v-col>
            <v-text-field readonly v-model.number="partition.size" label="Size (bytes)" density="compact"
              :rules="[partitionSizeRule(partition)]" :hint="store.hintDisplaySize(partition.size)"
              persistent-hint></v-text-field>
          </v-col>
          <v-col>
            <v-text-field readonly active label="offset" density="compact">
              {{ getHexOffset(partition.offset) }}
            </v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" @click="removePartition(partition)" variant="text">
                  <v-icon color="red-darken-4">
                    mdi-trash-can
                  </v-icon>
                </v-btn>
              </template>
              <span>删除分区</span>
            </v-tooltip>
          </v-col>
        </v-row>
        <v-slider :color="partitionAccentColor(partition, index)"
          :track-color="partitionAccentTrackColor(partition, index)" v-model="partition.size" thumb-label label="Size"
          :disabled="partition.subtype === 'ota_0' && store.partitionTables.hasOTAPartitions()"
          :max="store.partitionTables.getTotalMemory()" @end="updateSize(partition)" dense hide-details
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
              <span>调整大小以适应</span>
            </v-tooltip>
            <v-btn color="primary" icon="mdi-minus-box" size="small" variant="text"
              @click="decrement(partition)"></v-btn>
          </template>
          <template v-slot:append>
            <v-btn color="primary" icon="mdi-plus-box" size="small" variant="text"
              @click="increment(partition)"></v-btn>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" @click="reclaimMemory(partition)" variant="text"
                  :disabled="store.partitionTables.getAvailableMemory() <= 0">
                  <v-icon color="blue">
                    mdi-arrow-right-bold
                  </v-icon>
                </v-btn>
              </template>
              <span>回收内存</span>
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
              <span>调整大小以推荐值</span>
            </v-tooltip>
          </template>
        </v-slider>
      </div>
    </v-form>
    <v-dialog v-model="showAlert" width="auto">
      <v-card max-width="400" prepend-icon="mdi-alert-circle-outline" color="white" :text="alertText"
        :title="alertTitle">
        <template v-slot:actions>
          <v-btn class="ms-auto" text="Ok" @click="showAlert = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showOverrideDialog" width="auto">
      <v-card max-width="400" color="white" :title="dialogTitle">
        <v-card-text>{{ dialogText }}</v-card-text>
        <v-card-actions>
          <v-btn @click="showOverrideDialog = false">取消</v-btn>
          <v-btn color="primary" @click="confirmOverride">继续</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { loadPartitionsFromCsv } from '@/partitionLoader';
import {
  PARTITION_TYPES, PARTITION_TYPE_DATA, PARTITION_TYPE_APP, PARTITION_APP_SUBTYPES,
  PARTITION_DATA_SUBTYPES, PARTITION_NVS, NVS_PARTITION_SIZE_RECOMMENDED, OTA_DATA_PARTITION_SIZE,
  OFFSET_DATA_TYPE, PARTITION_OTA, OFFSET_APP_TYPE, PARTITION_FAT, FAT_MIN_PARTITION_SIZE,
  PARTITION_SPIFFS, PARTITION_LITTLEFS, SPIFFS_MIN_PARTITION_SIZE, LITTLEFS_MIN_PARTITION_SIZE,
  COREDUMP_MIN_PARTITION_SIZE, PARTITION_COREDUMP, PARTITION_FACTORY, PARTITION_TEST, PHY_MIN_PARTITION_SIZE,
  PARTITION_PHY,
  PARTITION_TABLE_SIZE,
  FLASH_SIZES
} from '@/const';
import { partitionStore } from '@/store'
import type { Partition } from '@/types'
import { getAccessibleTextColor, getPartitionBaseColor, lightenColor } from '@/partitionColors';

const store = partitionStore();
const formRef = ref();
const showAlert = ref(false);
const alertText = ref("")
const alertTitle = ref("")
const dialogText = ref("")
const dialogTitle = ref("")
const fileInput = ref<HTMLInputElement | null>(null);
const showOverrideDialog = ref(false);
const unlockPartitionOffsets = () => {
  store.partitionTables.releaseFixedOffsets();
};

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
  if (nameConflict) {
    console.log(name)
    return '名称已存在'
  } else {
    return true
  }
};

function partitionNotRecommendedSize(partition: Partition): boolean {
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
        return `FAT 分区最小推荐大小为 ${FAT_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(FAT_MIN_PARTITION_SIZE)})`;
      }
      break;
    case PARTITION_SPIFFS:
      if (partition.size < SPIFFS_MIN_PARTITION_SIZE) {
        return `SPIFFS 分区最小推荐大小为 ${SPIFFS_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(SPIFFS_MIN_PARTITION_SIZE)})`;
      }
      break;
    case PARTITION_LITTLEFS:
      if (partition.size < LITTLEFS_MIN_PARTITION_SIZE) {
        return `LittleFS 分区最小推荐大小为 ${LITTLEFS_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(LITTLEFS_MIN_PARTITION_SIZE)})`;
      }
      break;
    case PARTITION_COREDUMP:
      if (partition.size < COREDUMP_MIN_PARTITION_SIZE) {
        return `Core Dump 分区最小推荐大小为 ${COREDUMP_MIN_PARTITION_SIZE} 字节。 (${store.hintDisplaySize(COREDUMP_MIN_PARTITION_SIZE)})`;
      }
      break;
  }
  return true;
};

function stepSize(partition: Partition): number {
  if (partition.type === PARTITION_TYPE_DATA) {
    return OFFSET_DATA_TYPE
  } else {
    return OFFSET_APP_TYPE
  }
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

const downloadCSV = async () => {
  if (formRef.value) {
    const { valid } = await formRef.value.validate();
    if (valid) {
      if (store.partitionTables.getAvailableMemory() < 0) {
        dialogText.value = "分区内存超过闪存容量。你还想继续下载CSV吗？"
        dialogTitle.value = "内存警告"
        showOverrideDialog.value = true;
      } else {
        if (store.partitionTables.getAvailableMemory() > 0) {
          dialogText.value = "你还有可用的闪存内存。你还想继续下载CSV吗？"
          dialogTitle.value = "内存警告"
          showOverrideDialog.value = true;
        } else {
          generateCSV();
        }
      }
    } else {
      dialogText.value = "分区存在验证错误。你还想继续下载CSV吗？"
      dialogTitle.value = "分区规则警告"
      showOverrideDialog.value = true;
    }
  }
};

const confirmOverride = () => {
  showOverrideDialog.value = false;
  generateCSV();
};

const generateCSV = () => {
  const csvHeader = "# Name,   Type, SubType, Offset,  Size, Flags\n";
  const csvContent = store.partitionTables.getPartitions().map(p => {
    const sizeHex = '0x' + p.size.toString(16).toUpperCase();
    const offsetHex = '0x' + p.offset.toString(16).toUpperCase();
    return `${p.name},${p.type},${p.subtype},${offsetHex},${sizeHex},`;
  }).join("\n");
  const csvData = csvHeader + csvContent;
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "partitions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  unlockPartitionOffsets();
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
    showAlertMessage("无法添加新分区", "没有足够的内存来添加新分区。删除一个分区或调整现有分区的大小。")
  }
};

const addNVSPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < NVS_PARTITION_SIZE_RECOMMENDED) {
    showAlertMessage("无法添加NVS分区", `没有足够的内存来添加NVS分区。NVS分区大小必须至少为 ${NVS_PARTITION_SIZE_RECOMMENDED} 字节 (${store.hintDisplaySize(NVS_PARTITION_SIZE_RECOMMENDED)}).`)
  } else {
    const newName = generatePartitionName("nvs");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_NVS, NVS_PARTITION_SIZE_RECOMMENDED, "")
  }
};

const addFATPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < FAT_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加FAT分区", `没有足够的内存来添加FAT分区。FAT分区大小必须至少为 ${FAT_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(FAT_MIN_PARTITION_SIZE)}).`)
  } else {
    const newName = generatePartitionName("fat");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_FAT, FAT_MIN_PARTITION_SIZE, "")
  }
};
const addSPIFFPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < SPIFFS_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加SPIFFS分区", `没有足够的内存来添加SPIFFS分区。SPIFFS分区大小必须至少为 ${SPIFFS_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(SPIFFS_MIN_PARTITION_SIZE)}).`)
  } else {
    const newName = generatePartitionName("spiffs");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_SPIFFS, SPIFFS_MIN_PARTITION_SIZE, "")
  }
};
const addLittleFSPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < LITTLEFS_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加LittleFS分区", `没有足够的内存来添加LittleFS分区。LittleFS分区大小必须至少为 ${LITTLEFS_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(LITTLEFS_MIN_PARTITION_SIZE)}).`)
  } else {
    const newName = generatePartitionName("littlefs");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_LITTLEFS, LITTLEFS_MIN_PARTITION_SIZE, "")
  }
};
const addCoreDumpPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < COREDUMP_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加Core Dump分区", `没有足够的内存来添加Core Dump分区。Core Dump分区大小必须至少为 ${COREDUMP_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(COREDUMP_MIN_PARTITION_SIZE)}).`)
  } else {
    const newName = generatePartitionName("coredump");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_COREDUMP, COREDUMP_MIN_PARTITION_SIZE, "")
  }
};
const addPhyPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < PHY_MIN_PARTITION_SIZE) {
    showAlertMessage("无法添加PHY分区", `没有足够的内存来添加PHY分区。PHY分区大小必须至少为 ${PHY_MIN_PARTITION_SIZE} 字节 (${store.hintDisplaySize(PHY_MIN_PARTITION_SIZE)}).`)
  } else {
    const newName = generatePartitionName("phy");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_PHY, PHY_MIN_PARTITION_SIZE, "")
  }
};
const addFactoryPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < OFFSET_APP_TYPE) {
    showAlertMessage("无法添加Factory App分区", `没有足够的内存来添加Factory App分区。Factory App分区大小必须至少为 ${OFFSET_APP_TYPE} 字节 (${store.hintDisplaySize(OFFSET_APP_TYPE)}).`)
  } else {
    const newName = generatePartitionName("factory");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_APP, PARTITION_FACTORY, OFFSET_APP_TYPE, "")
  }
};
const addTestPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < OFFSET_APP_TYPE) {
    showAlertMessage("无法添加Test App分区", `没有足够的内存来添加Test App分区。Test App分区大小必须至少为 ${OFFSET_APP_TYPE} 字节 (${store.hintDisplaySize(OFFSET_APP_TYPE)}).`)
  } else {
    const newName = generatePartitionName("test");
    store.partitionTables.addPartition(newName, PARTITION_TYPE_APP, PARTITION_TEST, OFFSET_APP_TYPE, "")
  }
};
const addOTADataPartition = () => {
  unlockPartitionOffsets();
  if (store.partitionTables.getAvailableMemory() < OTA_DATA_PARTITION_SIZE) {
    showAlertMessage("无法添加OTA Data分区", `没有足够的内存来添加OTA Data分区。OTA Data分区大小必须至少为 ${OTA_DATA_PARTITION_SIZE} 字节 (${store.hintDisplaySize(OTA_DATA_PARTITION_SIZE)}).`)
    return
  }
  if (store.partitionTables.hasSubtype(PARTITION_OTA)) {
    showAlertMessage("无法添加OTA Data分区", `只能添加一个OTA Data分区`)
    return
  }
  const newName = generatePartitionName("otadata");
  store.partitionTables.addPartition(newName, PARTITION_TYPE_DATA, PARTITION_OTA, OTA_DATA_PARTITION_SIZE, "")

};

const addOTAPartition = () => {
  unlockPartitionOffsets();
  const needsNvs = !store.partitionTables.hasSubtype(PARTITION_NVS)
  const sizeNeeded = OTA_DATA_PARTITION_SIZE + OFFSET_APP_TYPE * 2 + (needsNvs ? NVS_PARTITION_SIZE_RECOMMENDED : 0)
  if (store.partitionTables.getAvailableMemory() < sizeNeeded) {
    const requirementMessage = needsNvs
      ? `您需要至少 ${sizeNeeded} 字节可用 (${store.hintDisplaySize(sizeNeeded)}) 用于OTA Data、两个OTA App插槽和一个NVS分区。`
      : `您需要至少 ${sizeNeeded} 字节可用 (${store.hintDisplaySize(sizeNeeded)}) 用于OTA Data和两个OTA App插槽。`
    showAlertMessage("无法添加OTA分区", `没有足够的内存来添加OTA支持。${requirementMessage}`)
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
  unlockPartitionOffsets();
  store.partitionTables.removePartition(partition.name)
};

const reclaimMemory = (partition: Partition) => {
  unlockPartitionOffsets();
  const available = store.partitionTables.getAvailableMemory();
  if (available <= 0) {
    return;
  }
  const resizeOnOta: boolean = (partition.subtype === 'ota_0' || partition.subtype === 'ota_1') && store.partitionTables.hasOTAPartitions();
  const targetSize = resizeOnOta
    ? partition.size + Math.floor(available / 2)
    : partition.size + available;
  store.partitionTables.updatePartitionSize(partition, targetSize);
};

const resizeToFit = (partition: Partition) => {
  unlockPartitionOffsets();
  let resize: number
  const resizeOnOta: boolean = (partition.subtype === 'ota_0' || partition.subtype === 'ota_1') && store.partitionTables.hasOTAPartitions()
  if (resizeOnOta) {
    resize = partition.size * 2 + store.partitionTables.getAvailableMemory()
  } else {
    resize = partition.size + store.partitionTables.getAvailableMemory()
  }
  if (resize <= 0 || (partition.type === PARTITION_TYPE_APP && partition.size <= OFFSET_APP_TYPE)) {
    showAlertMessage("无法调整分区大小", `分区大小不足以移除 ${store.partitionTables.getAvailableMemory()} 字节 (${store.hintDisplaySize(store.partitionTables.getAvailableMemory())}).`)
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

const loadPartitionsFromCSV = (csv: string) => {
  const error = loadPartitionsFromCsv(csv, store);
  if (error) {
    showAlertMessage(error.title, error.text);
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

<template>
  <v-app>
    <v-app-bar :title="'ESP32 Partition Builder v' + APP_VERSION">
      <v-btn @click="goToRepository" prepend-icon="mdi-help-box">
        寻求帮助
        <v-tooltip activator="parent" location="top">帮助与问题</v-tooltip>
      </v-btn>
      <template v-slot:extension>
        <v-container fluid class="mb-1 ml-1">
          <partition-visualizer></partition-visualizer>
        </v-container>
      </template>
    </v-app-bar>
    <v-navigation-drawer permanent>
      <div :class="availableMemoryColor()">
        <div>可用闪存:</div>
        <div>{{ store.partitionTables.getAvailableMemory() }} bytes ({{
          store.hintDisplaySize(store.partitionTables.getAvailableMemory()) }})
        </div>
      </div>
      <v-select v-model="selectedPartitionSet" :items="partitionOptions" item-value="value" item-title="text"
        label="内置分区" dense hide-details></v-select>
      <v-select v-model="store.flashSize" :items="FLASH_SIZES" item-value="value" item-title="text" label="Flash 大小"
        dense hide-details @update:model-value="changeFlashSize"></v-select>
      <v-select
        v-model="store.partitionTableOffset"
        :items="PARTITION_TABLE_OFFSET_OPTIONS"
        item-value="value"
        item-title="text"
        label="分区表偏移量"
        dense
        hide-details
        @update:model-value="changePartitionTableOffset"
      ></v-select>
      <v-text-field
        v-model="partitionTableOffsetText"
        label="自定义偏移 (hex)"
        density="compact"
        hide-details="auto"
        persistent-hint
        hint="必须与0x1000对齐;保持CSV偏移量为空以便自动对齐"
        :rules="[customOffsetRule]"
        append-inner-icon="mdi-check"
        @click:append-inner="applyCustomPartitionTableOffset(partitionTableOffsetText)"
        @change="applyCustomPartitionTableOffset($event)"
      ></v-text-field>
      <v-select v-model="store.displaySizes" :items="DISPLAY_SIZES" item-value="value" item-title="text"
        label="显示提示大小" dense hide-details></v-select>
      <div v-if="store.partitionTables.hasOTAPartitions() && store.partitionTables.hasSubtype(PARTITION_NVS)" class="pl-2 pt-4">
        <v-icon color="green-darken-2" icon="mdi-wifi" size="large"></v-icon>
        Over the air update capability
      </div>
      <v-alert
        v-else-if="store.partitionTables.hasOTAPartitions()"
        type="warning"
        density="comfortable"
        border="start"
        class="ma-3 mt-4"
        variant="outlined"
        icon="mdi-alert"
      >
        <div class="font-weight-medium">需要NVS分区</div>
        <div class="text-body-2">添加NVS分区以恢复空中更新能力。</div>
      </v-alert>
    </v-navigation-drawer>
    <v-main class="d-flex align-top">
      <partition-editor></partition-editor>
    </v-main>
    <v-snackbar v-model="showUrlNotification" location="top">
      {{ urlNotificationText }}
      <template #actions>
        <v-btn text @click="showUrlNotification = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch, inject, type Ref } from 'vue';
import PartitionEditor from './components/PartitionEditor.vue';
import PartitionVisualizer from './components/PartitionVisualizer.vue';
import { partitionStore } from '@/store';
import {
  FLASH_SIZES,
  APP_VERSION,
  DISPLAY_SIZES,
  PARTITION_NVS,
  PARTITION_TABLE_OFFSET_OPTIONS,
  OFFSET_DATA_TYPE,
  PARTITION_TABLE_SIZE
} from '@/const';
import { esp32Partitions } from '@/defaultPartitions';

const store = partitionStore();
const urlPartitionMessage = inject<Ref<string | null> | null>('urlPartitionMessage', null);
const urlNotificationText = ref('');
const showUrlNotification = ref(false);

if (urlPartitionMessage) {
  watch(
    urlPartitionMessage,
    (message) => {
      if (message) {
        urlNotificationText.value = message;
        showUrlNotification.value = true;
      }
    },
    { immediate: true }
  );
}

const firstPartitionSet = esp32Partitions[0];
const defaultPartitionName = firstPartitionSet ? firstPartitionSet.name : '';
const selectedPartitionSet = ref(defaultPartitionName);
const partitionTableOffsetText = ref(formatHex(store.partitionTableOffset));

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

function availableMemoryColor(): string {
  if (store.partitionTables.getAvailableMemory() == 0) {
    return 'pa-4 text-green'
  }
  if (store.partitionTables.getAvailableMemory() > 0) {
    return 'pa-4 text-yellow'
  }
  return 'pa-4 text-red'
}

function goToBuyMeACoffee() {
  window.open('https://www.buymeacoffee.com/thelastoutpostworkshop', '_blank');
}
function goToRepository() {
  window.open('https://github.com/thelastoutpostworkshop/ESP32PartitionBuilder', '_blank');
}
function goToYoutube() {
  window.open('https://youtu.be/EuHxodrye6E', '_blank');
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
    return '输入一个十六进制偏移量，例如0x8000';
  }
  if (parsed % OFFSET_DATA_TYPE !== 0) {
    return '必须与0x1000对齐';
  }
  if ((parsed + PARTITION_TABLE_SIZE) >= store.flashSizeBytes) {
    return '偏移太大，不适合 Flash 大小';
  }
  return true;
}

function loadPartitions() {
  const selectedSet = esp32Partitions.find(set => set.name === selectedPartitionSet.value);
  if (selectedSet) {
    store.partitionTables.clearPartitions();
    selectedSet.partitions.forEach(partition => {
      store.partitionTables.addPartition(partition.name, partition.type, partition.subtype, partition.size, "");
    })
  }
};
if (store.partitionTables.getPartitions().length === 0) {
  loadPartitions();
}

</script>

<style scoped></style>

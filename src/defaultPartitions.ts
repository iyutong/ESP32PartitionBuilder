import type { PartitionSet } from '@/types';

export const esp32Partitions: PartitionSet[] = [
  {
    name: '空 (无分区)',
    partitions: []
  },
  {
    name: '带Spiffs的OTA',
    partitions: [
      { name: 'nvs', type: 'data', subtype: 'nvs', size: 0x5000, offset: 0, flags: "" },
      { name: 'otadata', type: 'data', subtype: 'ota', size: 0x2000, offset: 0, flags: "" },
      { name: 'app0', type: 'app', subtype: 'ota_0', size: 0x140000, offset: 0, flags: "" },
      { name: 'app1', type: 'app', subtype: 'ota_1', size: 0x140000, offset: 0, flags: "" },
      { name: 'spiffs', type: 'data', subtype: 'spiffs', size: 0x160000, offset: 0, flags: "" },
      { name: 'coredump', type: 'data', subtype: 'coredump', size: 0x10000, offset: 0, flags: "" },
    ]
  },
  {
    name: '带FAT的OTA',
    partitions: [
      { name: 'nvs', type: 'data', subtype: 'nvs', size: 0x5000, offset: 0, flags: "" },
      { name: 'otadata', type: 'data', subtype: 'ota', size: 0x2000, offset: 0, flags: "" },
      { name: 'app0', type: 'app', subtype: 'ota_0', size: 0x140000, offset: 0, flags: "" },
      { name: 'app1', type: 'app', subtype: 'ota_1', size: 0x140000, offset: 0, flags: "" },
      { name: 'fat', type: 'data', subtype: 'fat', size: 0x160000, offset: 0, flags: "" },
      { name: 'coredump', type: 'data', subtype: 'coredump', size: 0x10000, offset: 0, flags: "" },
    ]
  },
  {
    name: '单应用工厂模式 (无OTA)',
    partitions: [
      { name: 'nvs', type: 'data', subtype: 'nvs', size: 0x5000, offset: 0, flags: "" },
      { name: 'factory', type: 'app', subtype: 'factory', size: 0x3F0000, offset: 0, flags: "" },
    ]
  },
];

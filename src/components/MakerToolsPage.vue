<script setup lang="ts">
import arduinoMakerWorkshopThumbnail from '@/assets/tool-thumbnails/arduino-maker-workshop.jpg';
import espBoardVaultThumbnail from '@/assets/tool-thumbnails/esp-board-vault.jpg';
import espConnectThumbnail from '@/assets/tool-thumbnails/espconnect.jpg';
import gpioViewerThumbnail from '@/assets/tool-thumbnails/gpio-viewer.jpg';
import partitionBuilderThumbnail from '@/assets/tool-thumbnails/partition-builder.jpg';
import videoConversionThumbnail from '@/assets/tool-thumbnails/video-conversion.jpg';

interface MakerTool {
  key: string;
  title: string;
  description: string;
  icon: string;
  thumbnailSrc: string;
  url?: string;
  actionLabel?: string;
  actionIcon?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  tutorialUrl?: string;
}

const coffeeUrl = 'https://buymeacoffee.com/thelastoutpostworkshop';

const makerTools: MakerTool[] = [
  {
    key: 'esp-board-vault',
    title: 'ESP Board Vault',
    icon: 'mdi-database-lock-outline',
    description:
      '一款面向 ESP32 创客的本地化桌面库存应用，用于扫描、识别、整理和跟踪开发板，包括硬件详情、分区图、照片、项目、清单和备份。',
    thumbnailSrc: espBoardVaultThumbnail,
    sourceUrl: 'https://github.com/thelastoutpostworkshop/ESPVault',
    sourceLabel: 'thelastoutpostworkshop/ESPVault',
    tutorialUrl: 'https://youtu.be/YwYP-eET9Oo'
  },
  {
    key: 'espconnect',
    title: 'ESPConnect',
    icon: 'mdi-connection',
    description:
      '一款基于浏览器的 ESP 设备实用工具。完全在现代 Chromium 浏览器中运行，可检查硬件详情、管理 SPIFFS、FAT 和 LittleFS 文件、备份闪存以及部署固件。',
    thumbnailSrc: espConnectThumbnail,
    url: 'https://thelastoutpostworkshop.github.io/ESPConnect/',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/ESPConnect',
    sourceLabel: 'thelastoutpostworkshop/ESPConnect',
    tutorialUrl: 'https://www.youtube.com/watch?v=-nhDKzBxHiI'
  },
  {
    key: 'partition-builder',
    title: 'ESP32 Partition Builder',
    icon: 'mdi-table-cog',
    description:
      '一款用于为 ESP32 开发板规划和创建自定义分区布局的 Web 工具。',
    thumbnailSrc: partitionBuilderThumbnail,
    url: 'https://thelastoutpostworkshop.github.io/ESP32PartitionBuilder/',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/ESP32PartitionBuilder',
    sourceLabel: 'thelastoutpostworkshop/ESP32PartitionBuilder',
    tutorialUrl: 'https://www.youtube.com/watch?v=EuHxodrye6E'
  },
  {
    key: 'video-conversion',
    title: 'Video Conversion Studio',
    icon: 'mdi-movie-cog-outline',
    description:
      '将视频和音频素材转换为适合 ESP32 显示项目的输出格式。',
    thumbnailSrc: videoConversionThumbnail,
    url: 'https://thelastoutpostworkshop.github.io/video_conversion/',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/video_conversion',
    sourceLabel: 'thelastoutpostworkshop/video_conversion',
    tutorialUrl: 'https://www.youtube.com/watch?v=bFq05qXqin0'
  },
  {
    key: 'gpio-viewer',
    title: 'GPIOViewer',
    icon: 'mdi-chip',
    description:
      '一款基于浏览器的实时 GPIO 引脚活动查看器，用于检查引脚状态、确认开发板行为以及排查接线或信号活动。',
    thumbnailSrc: gpioViewerThumbnail,
    url: 'https://www.youtube.com/watch?v=JJzRXcQrl3I',
    actionLabel: '观看教程',
    actionIcon: 'mdi-youtube',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/gpio_viewer',
    sourceLabel: 'thelastoutpostworkshop/gpio_viewer'
  },
  {
    key: 'arduino-maker-workshop',
    title: 'Arduino Maker Workshop',
    icon: 'mdi-microsoft-visual-studio-code',
    description:
      '一款面向 Arduino 创客开发的 VS Code 扩展，提供以草图为驱动的项目和面向开发板迭代的专注编辑工作流。',
    thumbnailSrc: arduinoMakerWorkshopThumbnail,
    url: 'https://marketplace.visualstudio.com/items?itemName=TheLastOutpostWorkshop.arduino-maker-workshop',
    sourceLabel: 'VS Code Marketplace 扩展',
    tutorialUrl: 'https://www.youtube.com/watch?v=rduTUUVkzqM'
  }
];
</script>

<template>
  <v-container data-testid="maker-tools-page" class="maker-tools-page" fluid>
    <section class="maker-tools-page__header">
      <div>
        <h1>创客工具</h1>
        <p>The Last Outpost Workshop 为 ESP32 和嵌入式项目提供的创客实用工具。</p>
      </div>
    </section>

    <section class="maker-tools-page__support">
      <v-icon icon="mdi-coffee-outline" size="32"></v-icon>
      <div class="maker-tools-page__support-copy">
        <h2>支持项目</h2>
        <p>这些创客工具是免费使用的。如果它们对你的工作有帮助，请喝杯咖啡支持持续开发。</p>
      </div>
      <v-btn prepend-icon="mdi-coffee-outline" :href="coffeeUrl" target="_blank" rel="noopener">
        请我喝杯咖啡
      </v-btn>
    </section>

    <section class="maker-tools-page__grid" aria-label="创客工具">
      <v-card
        v-for="tool in makerTools"
        :key="tool.key"
        class="maker-tools-page__card"
        data-testid="maker-tool-card"
        variant="elevated"
      >
        <a
          class="maker-tools-page__media"
          :href="tool.tutorialUrl ?? tool.url ?? tool.sourceUrl"
          target="_blank"
          rel="noopener"
          :aria-label="`${tool.title} 教程或工具链接`"
        >
          <img :src="tool.thumbnailSrc" :alt="`${tool.title} 缩略图`" loading="lazy">
          <span class="maker-tools-page__media-icon" aria-hidden="true">
            <v-icon :icon="tool.icon" size="20"></v-icon>
          </span>
        </a>

        <v-card-text class="maker-tools-page__copy">
          <h2>{{ tool.title }}</h2>
          <p>{{ tool.description }}</p>
          <a
            v-if="tool.sourceUrl && tool.sourceLabel"
            class="maker-tools-page__source"
            :href="tool.sourceUrl"
            target="_blank"
            rel="noopener"
          >
            {{ tool.sourceLabel }}
          </a>
          <span v-else-if="tool.sourceLabel" class="maker-tools-page__source-label">
            {{ tool.sourceLabel }}
          </span>
        </v-card-text>

        <v-card-actions class="maker-tools-page__actions">
          <v-btn
            v-if="tool.tutorialUrl"
            color="primary"
            prepend-icon="mdi-youtube"
            variant="text"
            :href="tool.tutorialUrl"
            target="_blank"
            rel="noopener"
          >
            观看教程
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="tool.url"
            :prepend-icon="tool.actionIcon ?? 'mdi-open-in-new'"
            variant="text"
            :href="tool.url"
            target="_blank"
            rel="noopener"
          >
            {{ tool.actionLabel ?? '打开工具' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </section>
  </v-container>
</template>

<style scoped>
.maker-tools-page {
  display: grid;
  gap: 18px;
  align-content: start;
  max-width: 1280px;
  padding: 24px;
}

.maker-tools-page__header h1 {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.2;
}

.maker-tools-page__header p {
  max-width: 720px;
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.5;
}

.maker-tools-page__support {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(125, 211, 252, 0.2);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(12, 74, 110, 0.28));
}

.maker-tools-page__support-copy h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.maker-tools-page__support-copy p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.45;
}

.maker-tools-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.maker-tools-page__card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
}

.maker-tools-page__media {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  color: inherit;
}

.maker-tools-page__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.maker-tools-page__media-icon {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.88);
  color: white;
}

.maker-tools-page__copy {
  display: grid;
  gap: 8px;
  flex: 1 1 auto;
}

.maker-tools-page__copy h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
}

.maker-tools-page__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.45;
}

.maker-tools-page__source,
.maker-tools-page__source-label {
  font-size: 0.85rem;
  color: rgb(var(--v-theme-primary));
  overflow-wrap: anywhere;
}

.maker-tools-page__actions {
  gap: 8px;
}

@media (max-width: 720px) {
  .maker-tools-page {
    padding: 16px;
  }

  .maker-tools-page__support {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .maker-tools-page__support .v-btn {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>

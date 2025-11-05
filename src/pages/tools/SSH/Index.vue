<template>
  <div class="tool-page ssh-tool">
    <!-- 顶部工具栏 -->
    <div class="ssh-toolbar">
      <div class="ssh-toolbar__left">
        <div class="ssh-toolbar__status">
          <i :class="connected ? 'i-mdi-check-circle' : 'i-mdi-circle-outline'" 
             :style="{ color: connected ? 'var(--neon-lime)' : 'var(--color-muted)' }" />
          <span>{{ connected ? `已连接: ${sshForm.username}@${sshForm.host}` : '未连接' }}</span>
        </div>
      </div>
      
      <div class="ssh-toolbar__right">
        <el-button
          v-if="!connected"
          type="primary"
          size="default"
          @click="showConfigDialog = true"
        >
          <i class="i-mdi-plus" /> 新建连接
        </el-button>
        
        <el-button
          size="default"
          @click="showHistoryManager = true"
        >
          <i class="i-mdi-history" /> 连接管理
          <el-badge :value="connectionHistory.length" :max="99" v-if="connectionHistory.length > 0" />
        </el-button>
        
        <el-button
          v-if="connected"
          type="success"
          size="default"
          @click="goToMySQLPage"
        >
          <i class="i-mdi-database" /> MySQL 查询
        </el-button>
        
        <el-button
          v-if="connected"
          type="danger"
          size="default"
          @click="disconnect"
        >
          <i class="i-mdi-close" /> 断开连接
        </el-button>
        
        <div v-if="connected" class="ssh-shortcuts-hint">
          <span class="shortcut-item">
            <i class="i-mdi-content-copy" />
            <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd> 复制
          </span>
          <span class="shortcut-item">
            <i class="i-mdi-content-paste" />
            <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> 粘贴
          </span>
        </div>
        
        <el-button
          size="default"
          @click="showLeftPanel = !showLeftPanel"
        >
          <i :class="showLeftPanel ? 'i-mdi-dock-left' : 'i-mdi-dock-right'" />
        </el-button>
      </div>
    </div>

    <!-- 文件传输进度条 -->
    <div v-if="transferProgress.show" class="transfer-progress">
      <div class="transfer-progress__info">
        <i :class="transferProgress.type === 'upload' ? 'i-mdi-upload' : 'i-mdi-download'" />
        <span>{{ transferProgress.type === 'upload' ? '上传' : '下载' }}: {{ transferProgress.fileName }}</span>
        <span class="transfer-progress__percent">{{ transferProgress.percent }}%</span>
      </div>
      <div class="transfer-progress__bar">
        <div 
          class="transfer-progress__bar-fill"
          :style="{ width: transferProgress.percent + '%' }"
        />
      </div>
      <div class="transfer-progress__size">
        {{ formatBytes(transferProgress.transferred) }} / {{ formatBytes(transferProgress.total) }}
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="tool-content ssh-content">
      <!-- 左侧快捷面板 -->
      <div v-if="showLeftPanel" class="ssh-sidebar">
        <!-- 历史连接（紧凑版） -->
        <div class="sidebar-section">
          <div class="sidebar-section__header">
            <span>历史连接</span>
            <span style="font-size: 12px; color: var(--color-muted);">{{ connectionHistory.length }}</span>
          </div>
          <div class="ssh-history-compact">
            <div
              v-for="(item, index) in connectionHistory.slice(0, 5)"
              :key="index"
              class="history-item-compact"
              @click="loadHistoryItem(item)"
              @dblclick="quickConnect(item)"
              :title="`${item.username}@${item.host}:${item.port}\n单击编辑，双击连接`"
            >
              <i class="i-mdi-server" />
              <div class="history-item-compact__text">
                <div>{{ item.name || `${item.username}@${item.host}` }}</div>
                <div class="history-item-compact__sub">{{ item.host }}:{{ item.port }}</div>
              </div>
              <i v-if="item.password" class="i-mdi-key" style="color: var(--neon-yellow); font-size: 12px;" title="已保存密码" />
            </div>
            <div v-if="connectionHistory.length === 0" class="empty-state-small">
              <i class="i-mdi-history" />
              <span>暂无记录</span>
            </div>
          </div>
        </div>

        <!-- 快捷命令面板（可折叠） -->
        <div v-if="connected" class="sidebar-section collapsible-section">
          <div class="sidebar-section__header" @click="showCommandsPanel = !showCommandsPanel" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i :class="showCommandsPanel ? 'i-mdi-chevron-down' : 'i-mdi-chevron-right'" style="font-size: 16px;" />
              <span>快捷命令</span>
            </div>
            <div v-if="showCommandsPanel" style="display: flex; gap: 4px;" @click.stop>
              <el-button
                type="primary"
                text
                size="small"
                @click="showCommandManager = true"
                title="管理命令"
              >
                <i class="i-mdi-cog" />
              </el-button>
            </div>
          </div>
          <div v-show="showCommandsPanel" class="quick-commands-compact">
            <!-- 系统内置命令 -->
            <div class="command-group-header" @click="systemCommandsCollapsed = !systemCommandsCollapsed" style="cursor: pointer;">
              <i :class="systemCommandsCollapsed ? 'i-mdi-chevron-right' : 'i-mdi-chevron-down'" style="font-size: 12px;" />
              <i class="i-mdi-monitor" style="font-size: 12px;" />
              <span>系统命令</span>
              <span class="command-count">({{ quickCommands.length }})</span>
            </div>
            <template v-if="!systemCommandsCollapsed">
              <div
                v-for="(cmd, index) in quickCommands"
                :key="index"
                class="quick-cmd-compact"
                @click="executeQuickCommand(cmd.command)"
                :title="cmd.command"
              >
                <i :class="cmd.icon" />
                <span>{{ cmd.name }}</span>
              </div>
            </template>
            
            <!-- 自定义命令分组 -->
            <template v-for="group in commandGroups" :key="group.id">
              <div class="command-group-header" @click="toggleGroup(group.id)" style="cursor: pointer;">
                <i :class="group.collapsed ? 'i-mdi-chevron-right' : 'i-mdi-chevron-down'" style="font-size: 12px;" />
                <i :class="group.icon" style="font-size: 12px;" />
                <span>{{ group.name }}</span>
                <span class="command-count">({{ group.commands.length }})</span>
              </div>
              <template v-if="!group.collapsed">
                <div
                  v-for="cmd in group.commands"
                  :key="cmd.id"
                  class="quick-cmd-compact quick-cmd-compact--custom"
                  @click="executeCommand(cmd)"
                  :title="cmd.type === 'multi' ? '多步骤命令' : cmd.command"
                >
                  <i :class="cmd.icon" />
                  <span>{{ cmd.name }}</span>
                  <i v-if="cmd.type === 'multi'" class="i-mdi-play-circle-outline" style="font-size: 12px; opacity: 0.6;" />
                  <i v-if="cmd.uploadFile" class="i-mdi-upload" style="font-size: 12px; opacity: 0.6; color: var(--neon-cyan);" title="需要上传文件" />
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- 文件浏览器面板（可折叠） -->
        <div v-if="connected" class="sidebar-section collapsible-section">
          <div class="sidebar-section__header" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;" @click="showFilesPanel = !showFilesPanel">
              <i :class="showFilesPanel ? 'i-mdi-chevron-down' : 'i-mdi-chevron-right'" style="font-size: 16px;" />
              <span>文件浏览</span>
            </div>
            <el-tooltip content="自动跟随终端目录" placement="top">
              <el-switch
                v-model="followTerminalPath"
                size="small"
                @click.stop
                style="--el-switch-on-color: var(--neon-cyan);"
              />
            </el-tooltip>
          </div>
          <div v-show="showFilesPanel" class="file-browser-compact">
            <div class="file-path">
              <el-input
                v-model="currentPath"
                size="small"
                placeholder="/"
                @keyup.enter="loadFiles"
              >
                <template #suffix>
                  <i class="i-mdi-folder-search" @click="loadFiles" style="cursor: pointer;" />
                </template>
              </el-input>
              <div v-if="followTerminalPath" style="font-size: 10px; color: var(--neon-cyan); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                <i class="i-mdi-sync path-follow-icon" />
                <span>自动跟随终端</span>
              </div>
            </div>
            
            <div class="file-actions">
              <el-button size="small" @click="uploadFile">
                <i class="i-mdi-upload" /> 上传
              </el-button>
              <el-button size="small" @click="refreshFiles">
                <i class="i-mdi-refresh" />
              </el-button>
            </div>

            <div v-if="isLoadingFiles" class="file-loading">
              <i class="i-mdi-loading" style="animation: spin 1s linear infinite;" />
              <span>加载中...</span>
            </div>

            <div v-else class="file-list">
              <div
                v-if="currentPath !== '/'"
                class="file-item"
                @click="goToParent"
              >
                <i class="i-mdi-arrow-up" style="color: var(--neon-yellow);" />
                <span>..</span>
              </div>

              <div
                v-for="(file, index) in fileList"
                :key="index"
                class="file-item"
                @click="fileClick(file)"
                @contextmenu.prevent="showFileMenu(file)"
              >
                <i :class="file.type === 'directory' ? 'i-mdi-folder' : 'i-mdi-file'" 
                   :style="{ color: file.type === 'directory' ? 'var(--neon-cyan)' : 'var(--color-muted)' }" />
                <span class="file-name">{{ file.name }}</span>
                <el-button
                  v-if="file.type === 'file'"
                  type="primary"
                  text
                  size="small"
                  @click.stop="downloadFile(file)"
                  title="下载"
                >
                  <i class="i-mdi-download" />
                </el-button>
              </div>
              
              <div v-if="fileList.length === 0" class="empty-state-small">
                <i class="i-mdi-folder-open" />
                <span>目录为空</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：终端输出 -->
      <div class="ssh-terminal">
        <neon-card title="终端输出">
          <div class="terminal-wrapper">
            <!-- Xterm.js 终端容器 -->
            <div ref="terminalContainer" class="xterm-container"></div>
            <!-- 连接前提示 -->
            <div v-if="!connected" class="terminal-empty-overlay">
              <i class="i-mdi-console" />
              <p>等待连接...</p>
              <p class="hint">连接后支持vim、nano等交互式应用</p>
            </div>
          </div>
        </neon-card>
      </div>
    </div>

    <!-- SSH连接历史管理对话框 -->
    <el-dialog
      v-model="showHistoryManager"
      title="SSH 连接管理"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="history-manager">
        <!-- 顶部操作栏 -->
        <div class="history-manager__toolbar">
          <el-input
            v-model="historySearchText"
            placeholder="搜索连接（名称、主机、用户名）"
            clearable
            style="width: 300px;"
          >
            <template #prefix>
              <i class="i-mdi-magnify" />
            </template>
          </el-input>
          <div style="flex: 1;"></div>
          <el-button
            type="primary"
            @click="createNewConnection"
          >
            <i class="i-mdi-plus" /> 新建连接
          </el-button>
          <el-button
            type="danger"
            :disabled="connectionHistory.length === 0"
            @click="confirmClearHistory"
          >
            <i class="i-mdi-delete-sweep" /> 清空全部
          </el-button>
        </div>

        <!-- 连接列表 -->
        <div class="history-list scrollbar-thin">
          <el-empty 
            v-if="filteredHistory.length === 0 && connectionHistory.length === 0"
            description="暂无连接记录"
          >
            <el-button type="primary" @click="createNewConnection">
              <i class="i-mdi-plus" /> 创建第一个连接
            </el-button>
          </el-empty>

          <el-empty 
            v-else-if="filteredHistory.length === 0"
            description="未找到匹配的连接"
          />

          <div v-else class="history-items">
            <div
              v-for="(item, index) in filteredHistory"
              :key="index"
              class="history-card"
            >
              <!-- 连接信息 -->
              <div class="history-card__content">
                <div class="history-card__header">
                  <div class="history-card__title">
                    <i class="i-mdi-server" style="color: var(--neon-cyan);" />
                    <span class="history-card__name">{{ item.name || `${item.username}@${item.host}` }}</span>
                    <el-tag v-if="item.authType === 'password'" size="small" type="warning">
                      <i class="i-mdi-key" /> 密码
                    </el-tag>
                    <el-tag v-else size="small" type="success">
                      <i class="i-mdi-key-variant" /> 密钥
                    </el-tag>
                  </div>
                  <div class="history-card__actions">
                    <el-button
                      type="primary"
                      size="small"
                      @click="editConnection(item, index)"
                    >
                      <i class="i-mdi-pencil" /> 编辑
                    </el-button>
                    <el-button
                      type="success"
                      size="small"
                      @click="quickConnectFromManager(item)"
                    >
                      <i class="i-mdi-connection" /> 连接
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      @click="confirmDeleteConnection(index)"
                    >
                      <i class="i-mdi-delete" />
                    </el-button>
                  </div>
                </div>
                
                <div class="history-card__details">
                  <div class="history-card__detail-item">
                    <i class="i-mdi-ip" />
                    <span>{{ item.host }}:{{ item.port }}</span>
                  </div>
                  <div class="history-card__detail-item">
                    <i class="i-mdi-account" />
                    <span>{{ item.username }}</span>
                  </div>
                  <div class="history-card__detail-item">
                    <i class="i-mdi-clock-outline" />
                    <span>最后使用: {{ formatLastUsed(item.lastUsed) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 连接配置对话框 -->
    <el-dialog
      v-model="showConfigDialog"
      :title="editingConnectionIndex !== null ? '编辑连接' : 'SSH 连接配置'"
      width="600px"
    >
      <el-form :model="sshForm" label-width="100px" size="default">
        <el-form-item label="主机地址">
          <el-input
            v-model="sshForm.host"
            placeholder="例如：192.168.1.100"
          />
        </el-form-item>

        <el-form-item label="端口">
          <el-input
            v-model.number="sshForm.port"
            placeholder="默认 22"
            type="number"
          />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input
            v-model="sshForm.username"
            placeholder="例如：root"
          />
        </el-form-item>

        <el-form-item label="认证方式">
          <el-radio-group v-model="sshForm.authType">
            <el-radio-button label="password">密码</el-radio-button>
            <el-radio-button label="key">密钥</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="sshForm.authType === 'password'" label="密码">
          <el-input
            v-model="sshForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <template v-if="sshForm.authType === 'key'">
          <el-form-item label="密钥方式">
            <el-radio-group v-model="sshForm.keyMode">
              <el-radio-button label="file">文件</el-radio-button>
              <el-radio-button label="text">文本</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="sshForm.keyMode === 'file'" label="密钥文件">
            <div style="display: flex; gap: 8px;">
              <el-input
                v-model="sshForm.keyPath"
                placeholder="选择密钥文件..."
                readonly
              />
              <el-button @click="selectKeyFile">
                <i class="i-mdi-folder-open" />
                选择文件
              </el-button>
            </div>
            <div v-if="sshForm.keyPath" style="margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary);">
              {{ sshForm.keyPath.startsWith('ssh-keys/') ? '✓ 已存储到本地' : '⚠️ 外部路径' }}
            </div>
          </el-form-item>

          <el-form-item v-if="sshForm.keyMode === 'text'" label="密钥内容">
            <el-input
              v-model="sshForm.keyText"
              type="textarea"
              :rows="6"
              placeholder="粘贴私钥内容"
            />
          </el-form-item>
        </template>

        <el-form-item label="连接名称">
          <el-input
            v-model="sshForm.name"
            placeholder="为此连接设置一个名称（可选）"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="sshForm.saveToHistory">
            保存到历史记录
          </el-checkbox>
          <div v-if="sshForm.saveToHistory && sshForm.authType === 'password'" style="margin-top: 8px; font-size: 12px; color: var(--neon-yellow);">
            ⚠️ 密码将以明文保存，请注意安全
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <NeonButton variant="outline" @click="cancelEdit">取消</NeonButton>
        <NeonButton
          v-if="editingConnectionIndex !== null"
          type="primary"
          @click="saveEditedConnection"
        >
          <i class="i-mdi-content-save" /> 保存
        </NeonButton>
        <NeonButton
          v-else
          type="primary"
          @click="connectFromDialog"
          :disabled="!canConnect"
        >
          <i class="i-mdi-connection" /> 连接
        </NeonButton>
      </template>
    </el-dialog>

    <!-- 添加自定义命令对话框 -->
    <el-dialog
      v-model="showAddCommand"
      title="添加自定义命令"
      width="600px"
    >
      <el-form label-width="80px">
        <el-form-item label="命令名称">
          <el-input v-model="newCommand.name" placeholder="例如：查看日志" />
        </el-form-item>
        <el-form-item label="命令">
          <el-input
            v-model="newCommand.command"
            type="textarea"
            :rows="3"
            placeholder="例如：mv ss.jar ss.jar_{DATE}"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            💡 支持动态变量：{DATE} {TIME} {DATETIME} {TIMESTAMP} 等
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <NeonButton variant="outline" @click="showAddCommand = false">取消</NeonButton>
        <NeonButton type="primary" @click="addCustomCommand">添加</NeonButton>
      </template>
    </el-dialog>

    <!-- 命令管理器对话框 -->
    <el-dialog
      v-model="showCommandManager"
      title="快捷命令管理"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="command-manager">
        <div class="manager-toolbar">
          <el-button type="primary" @click="openAddGroupDialog">
            <i class="i-mdi-folder-plus" />
            新建分组
          </el-button>
          <el-button @click="exportCommands">
            <i class="i-mdi-export" />
            导出
          </el-button>
          <el-button @click="importCommands">
            <i class="i-mdi-import" />
            导入
          </el-button>
          
          <!-- 🎯 动态变量提示 -->
          <el-tooltip placement="bottom" effect="dark" :show-after="200">
            <template #content>
              <div style="max-width: 480px; padding: 16px; font-family: 'Consolas', 'Monaco', monospace; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                <div style="font-weight: bold; margin-bottom: 16px; font-size: 16px; color: #22d3ee; text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);">💡 支持的动态变量</div>
                <div style="font-size: 14px; line-height: 2.2;">
                  <div style="margin-bottom: 4px;"><code style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 4px 10px; border-radius: 5px; color: #fff; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);">{DATE}</code> <span style="color: #f0f9ff; font-size: 15px;">→</span> <span style="color: #bef264; font-weight: bold; font-size: 14px;">20251028</span> <span style="color: #e2e8f0; font-size: 13px;">(日期)</span></div>
                  <div style="margin-bottom: 4px;"><code style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 4px 10px; border-radius: 5px; color: #fff; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);">{TIME}</code> <span style="color: #f0f9ff; font-size: 15px;">→</span> <span style="color: #bef264; font-weight: bold; font-size: 14px;">143050</span> <span style="color: #e2e8f0; font-size: 13px;">(时间)</span></div>
                  <div style="margin-bottom: 4px;"><code style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 4px 10px; border-radius: 5px; color: #fff; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);">{DATETIME}</code> <span style="color: #f0f9ff; font-size: 15px;">→</span> <span style="color: #bef264; font-weight: bold; font-size: 14px;">20251028_143050</span> <span style="color: #e2e8f0; font-size: 13px;">(日期+时间)</span></div>
                  <div style="margin-bottom: 4px;"><code style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 4px 10px; border-radius: 5px; color: #fff; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);">{TIMESTAMP}</code> <span style="color: #f0f9ff; font-size: 15px;">→</span> <span style="color: #bef264; font-weight: bold; font-size: 14px;">1730096630</span> <span style="color: #e2e8f0; font-size: 13px;">(时间戳)</span></div>
                  <div style="margin-bottom: 4px;"><code style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 4px 10px; border-radius: 5px; color: #fff; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);">{YEAR}</code> <span style="color: #f0f9ff; font-size: 15px;">→</span> <span style="color: #bef264; font-weight: bold; font-size: 14px;">2025</span> <span style="color: #e2e8f0; font-size: 13px;">(年)</span></div>
                  <div style="margin-bottom: 4px;"><code style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 4px 10px; border-radius: 5px; color: #fff; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);">{MONTH}</code> <span style="color: #f0f9ff; font-size: 15px;">→</span> <span style="color: #bef264; font-weight: bold; font-size: 14px;">10</span> <span style="color: #e2e8f0; font-size: 13px;">(月)</span></div>
                  <div style="margin-bottom: 4px;"><code style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 4px 10px; border-radius: 5px; color: #fff; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);">{DAY}</code> <span style="color: #f0f9ff; font-size: 15px;">→</span> <span style="color: #bef264; font-weight: bold; font-size: 14px;">28</span> <span style="color: #e2e8f0; font-size: 13px;">(日)</span></div>
                  <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid rgba(34, 211, 238, 0.3);">
                    <strong style="color: #fcd34d; font-size: 15px; text-shadow: 0 0 8px rgba(252, 211, 77, 0.5);">📝 示例：</strong><br>
                    <code style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 8px 12px; border-radius: 5px; color: #0f172a; font-size: 13px; display: inline-block; margin-top: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);">mv ss.jar ss.jar_{DATETIME}</code>
                  </div>
                </div>
              </div>
            </template>
            <el-button circle size="small" style="margin-left: 8px;">
              <i class="i-mdi-help-circle" style="font-size: 16px; color: #21e6ff;" />
            </el-button>
          </el-tooltip>
        </div>

        <div class="groups-list">
          <div v-for="group in commandGroups" :key="group.id" class="group-item">
            <div class="group-header">
              <i :class="group.icon" />
              <span class="group-name">{{ group.name }}</span>
              <span class="command-count">{{ group.commands.length }} 个命令</span>
              <div class="group-actions">
                <el-button text size="small" @click="openAddCommandDialog(group)">
                  <i class="i-mdi-plus" />
                  添加命令
                </el-button>
                <el-button text size="small" @click="editGroup(group)">
                  <i class="i-mdi-pencil" />
                </el-button>
                <el-button text type="danger" size="small" @click="deleteGroup(group)">
                  <i class="i-mdi-delete" />
                </el-button>
              </div>
            </div>
            
            <div v-if="group.commands.length > 0" class="commands-list">
              <div
                v-for="cmd in group.commands"
                :key="cmd.id"
                class="command-item"
              >
                <i :class="cmd.icon" />
                <span class="command-name">{{ cmd.name }}</span>
                <el-tag v-if="cmd.type === 'multi'" size="small" type="warning">
                  多步骤 ({{ cmd.steps?.length || 0 }})
                </el-tag>
                <el-tag v-else size="small">单步</el-tag>
                <el-tag v-if="cmd.uploadFile" size="small" type="info">
                  <i class="i-mdi-upload" /> 上传文件
                </el-tag>
                <div class="command-actions">
                  <el-button text size="small" @click="editCommand(group, cmd)">
                    <i class="i-mdi-pencil" />
                  </el-button>
                  <el-button text type="danger" size="small" @click="deleteCommand(group, cmd)">
                    <i class="i-mdi-delete" />
                  </el-button>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-group">
              暂无命令，点击"添加命令"开始创建
            </div>
          </div>
          
          <div v-if="commandGroups.length === 0" class="empty-state">
            <i class="i-mdi-folder-open-outline" style="font-size: 48px; opacity: 0.3;" />
            <p>还没有命令分组</p>
            <el-button type="primary" @click="openAddGroupDialog">创建第一个分组</el-button>
          </div>
        </div>
      </div>
      
      <template #footer>
        <NeonButton variant="outline" @click="showCommandManager = false">关闭</NeonButton>
      </template>
    </el-dialog>

    <!-- 分组编辑对话框 -->
    <el-dialog
      v-model="showGroupDialog"
      :title="editingGroup?.id ? '编辑分组' : '新建分组'"
      width="500px"
    >
      <el-form v-if="editingGroup" label-width="80px">
        <el-form-item label="分组名称">
          <el-input v-model="editingGroup.name" placeholder="例如：应用部署" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-selector">
            <el-radio-group v-model="editingGroup.icon">
              <el-radio-button label="i-mdi-star">⭐ 星标</el-radio-button>
              <el-radio-button label="i-mdi-rocket-launch">🚀 火箭</el-radio-button>
              <el-radio-button label="i-mdi-docker">🐳 Docker</el-radio-button>
              <el-radio-button label="i-mdi-database">💾 数据库</el-radio-button>
              <el-radio-button label="i-mdi-code-tags">💻 代码</el-radio-button>
              <el-radio-button label="i-mdi-server">🖥️ 服务器</el-radio-button>
              <el-radio-button label="i-mdi-cog">⚙️ 设置</el-radio-button>
              <el-radio-button label="i-mdi-console">📟 终端</el-radio-button>
            </el-radio-group>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <NeonButton variant="outline" @click="showGroupDialog = false">取消</NeonButton>
        <NeonButton type="primary" @click="saveGroup">保存</NeonButton>
      </template>
    </el-dialog>

    <!-- 命令编辑对话框 -->
    <el-dialog
      v-model="showCommandDialog"
      :title="editingCommand?.id ? '编辑命令' : '新建命令'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form v-if="editingCommand" label-width="90px">
        <el-form-item label="命令名称">
          <el-input v-model="editingCommand.name" placeholder="例如：部署前端应用" />
        </el-form-item>
        
        <el-form-item label="命令类型">
          <el-radio-group v-model="editingCommand.type">
            <el-radio-button label="single">单步命令</el-radio-button>
            <el-radio-button label="multi">多步骤命令</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="图标">
          <el-select v-model="editingCommand.icon" placeholder="选择图标">
            <el-option label="⭐ 星标" value="i-mdi-star" />
            <el-option label="🚀 火箭" value="i-mdi-rocket-launch" />
            <el-option label="🔄 刷新" value="i-mdi-refresh" />
            <el-option label="🔧 工具" value="i-mdi-wrench" />
            <el-option label="📦 包裹" value="i-mdi-package" />
            <el-option label="📊 图表" value="i-mdi-chart-line" />
            <el-option label="🌐 网络" value="i-mdi-web" />
            <el-option label="💾 保存" value="i-mdi-content-save" />
            <el-option label="📝 文档" value="i-mdi-file-document" />
            <el-option label="⚡ 闪电" value="i-mdi-flash" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="上传文件">
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <el-checkbox v-model="editingCommand.uploadFile">
              执行前需要上传文件
            </el-checkbox>
            <el-input
              v-if="editingCommand.uploadFile"
              v-model="editingCommand.targetPath"
              placeholder="目标路径（可选，留空则上传到当前目录）"
              size="small"
            >
              <template #prepend>
                <i class="i-mdi-folder" />
              </template>
            </el-input>
            <div v-if="editingCommand.uploadFile" style="font-size: 12px; color: var(--el-text-color-secondary);">
              💡 执行时会先弹出文件选择对话框，上传完成后再执行命令。可在命令中使用 $FILENAME 变量引用上传的文件名。
            </div>
          </div>
        </el-form-item>
        
        <!-- 单步命令 -->
        <template v-if="editingCommand.type === 'single'">
          <el-form-item label="命令内容">
            <el-input
              v-model="editingCommand.command"
              type="textarea"
              :rows="3"
              placeholder="例如：pm2 restart app"
            />
          </el-form-item>
        </template>
        
        <!-- 多步骤命令 -->
        <template v-else>
          <el-form-item label="命令步骤">
            <div class="steps-editor">
              <div
                v-for="(step, index) in editingCommand.steps"
                :key="index"
                class="step-item"
              >
                <div class="step-header">
                  <span class="step-number">步骤 {{ index + 1 }}</span>
                  <el-button
                    text
                    type="danger"
                    size="small"
                    @click="removeStep(index)"
                    :disabled="editingCommand.steps!.length === 1"
                  >
                    删除
                  </el-button>
                </div>
                <el-input
                  v-model="step.name"
                  size="small"
                  placeholder="步骤名称，例如：拉取代码"
                  style="margin-bottom: 8px;"
                />
                <el-input
                  v-model="step.command"
                  type="textarea"
                  :rows="2"
                  size="small"
                  placeholder="命令内容，例如：git pull origin main"
                  style="margin-bottom: 8px;"
                />
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 12px; color: var(--el-text-color-secondary);">延迟:</span>
                  <el-input-number
                    v-model="step.delay"
                    :min="0"
                    :step="500"
                    size="small"
                    style="width: 150px;"
                  />
                  <span style="font-size: 12px; color: var(--el-text-color-secondary);">毫秒</span>
                </div>
              </div>
              
              <el-button
                type="primary"
                text
                @click="addStep"
                style="width: 100%; margin-top: 8px;"
              >
                <i class="i-mdi-plus" />
                添加步骤
              </el-button>
            </div>
          </el-form-item>
        </template>
      </el-form>
      
      <template #footer>
        <NeonButton variant="outline" @click="showCommandDialog = false">取消</NeonButton>
        <NeonButton type="primary" @click="saveCommand">保存</NeonButton>
      </template>
    </el-dialog>

    <!-- MySQL面板已移至独立页面 /tools/mysql -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import NeonCard from '@/components/NeonCard.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import NeonButton from '@/components/NeonButton.vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useCommandHistoryStore } from '@/stores/command-history'

const router = useRouter()

// 声明 window.electron 类型
interface SSHConnectConfig {
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password?: string
  keyMode?: 'file' | 'text'
  keyPath?: string
  keyText?: string
}

declare global {
  interface Window {
    electron?: {
      ssh: {
        connect: (config: SSHConnectConfig) => Promise<{ success: boolean; error?: string }>
        disconnect: () => Promise<{ success: boolean }>
        sendCommand: (command: string) => Promise<{ success: boolean; error?: string }>
        sendData: (data: string) => Promise<{ success: boolean; error?: string }>
        resize: (cols: number, rows: number) => Promise<{ success: boolean; error?: string }>
        onOutput: (callback: (data: string) => void) => void
        onError: (callback: (error: string) => void) => void
        onClose: (callback: (code: number) => void) => void
        saveHistory: (history: any[]) => Promise<{ success: boolean; error?: string }>
        loadHistory: () => Promise<{ success: boolean; data?: any[]; error?: string }>
      }
      sftp: {
        listDir: (remotePath: string) => Promise<{ success: boolean; data?: any[]; error?: string }>
        downloadFile: (remotePath: string, localPath: string) => Promise<{ success: boolean; error?: string }>
        uploadFile: (localPath: string, remotePath: string) => Promise<{ success: boolean; error?: string }>
        deleteFile: (remotePath: string) => Promise<{ success: boolean; error?: string }>
        createDir: (remotePath: string) => Promise<{ success: boolean; error?: string }>
        onUploadProgress: (callback: (data: any) => void) => void
        onDownloadProgress: (callback: (data: any) => void) => void
      }
      dialog: {
        selectFile: () => Promise<{ success?: boolean; filePath?: string; canceled?: boolean }>
        selectSavePath: (defaultName: string) => Promise<{ success?: boolean; filePath?: string; canceled?: boolean }>
      }
    }
  }
}

interface SSHForm {
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password: string
  keyMode: 'file' | 'text'
  keyPath: string
  keyText: string
  name: string
  saveToHistory: boolean
}

interface ConnectionRecord {
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password?: string
  keyMode?: 'file' | 'text'
  keyPath?: string
  keyText?: string
  lastUsed: number
}

interface TerminalLine {
  time: string
  content: string
  type: 'info' | 'error' | 'success'
}

const sshForm = ref<SSHForm>({
  host: '',
  port: 22,
  username: '',
  authType: 'password',
  password: '',
  keyMode: 'file',
  keyPath: '',
  keyText: '',
  name: '',
  saveToHistory: true,
})

const connected = ref(false)
const connectionHistory = ref<ConnectionRecord[]>([])
const terminalLines = ref<TerminalLine[]>([])
const commandInput = ref('')
const terminalOutput = ref<HTMLElement | null>(null)
const commandInputRef = ref<HTMLTextAreaElement | null>(null)
const terminalContainer = ref<HTMLDivElement | null>(null)
let xterm: Terminal | null = null
let fitAddon: FitAddon | null = null
let pasteHandler: ((event: ClipboardEvent) => void) | null = null
const isLoadingHistory = ref(false)
const isConnecting = ref(false)
let connectTimeout: any = null
let clickTimeout: any = null

// MySQL功能已移至独立页面 /tools/mysql

// 快捷命令相关
const quickCommands = ref([
  { name: '列出文件', command: 'ls -lah', icon: 'i-mdi-file-document-multiple' },
  { name: '当前目录', command: 'pwd', icon: 'i-mdi-folder' },
  { name: '当前用户', command: 'whoami', icon: 'i-mdi-account' },
  { name: '系统信息', command: 'uname -a', icon: 'i-mdi-information' },
  { name: 'CPU使用', command: 'top -bn1 | head -20', icon: 'i-mdi-cpu-64-bit' },
  { name: '内存使用', command: 'free -h', icon: 'i-mdi-memory' },
  { name: '磁盘使用', command: 'df -h', icon: 'i-mdi-harddisk' },
  { name: '运行时间', command: 'uptime', icon: 'i-mdi-clock-outline' },
  { name: '查看进程', command: 'ps aux | head -20', icon: 'i-mdi-application' },
  { name: '网络连接', command: 'netstat -tulnp | head -20', icon: 'i-mdi-network' },
])

// 命令数据结构
interface CommandStep {
  name: string
  command: string
  delay?: number  // 延迟执行（毫秒）
}

interface Command {
  id: string
  name: string
  type: 'single' | 'multi'  // 单步或多步
  icon: string
  command?: string  // 单步命令
  steps?: CommandStep[]  // 多步骤命令
  uploadFile?: boolean  // 是否需要上传文件
  targetPath?: string  // 上传目标路径（相对于当前目录）
}

interface CommandGroup {
  id: string
  name: string
  icon: string
  collapsed?: boolean
  commands: Command[]
}

const commandGroups = ref<CommandGroup[]>([])
const showCommandManager = ref(false)
const editingGroup = ref<CommandGroup | null>(null)
const editingCommand = ref<Command | null>(null)
const showGroupDialog = ref(false)
const showCommandDialog = ref(false)
const systemCommandsCollapsed = ref(false)

// 过滤历史记录
const filteredHistory = computed(() => {
  if (!historySearchText.value.trim()) {
    return connectionHistory.value
  }
  
  const search = historySearchText.value.toLowerCase()
  return connectionHistory.value.filter(item =>
    (item.name && item.name.toLowerCase().includes(search)) ||
    item.host.toLowerCase().includes(search) ||
    item.username.toLowerCase().includes(search)
  )
})

// UI控制
const showConfigDialog = ref(false)
const showHistoryManager = ref(false)
const showLeftPanel = ref(true)
const activeTab = ref<'commands' | 'files'>('commands')
const showCommandsPanel = ref(true)
const showFilesPanel = ref(true)
const historySearchText = ref('')
const editingConnectionIndex = ref<number | null>(null)
const showAddCommand = ref(false)

// SFTP相关
const currentPath = ref('/')
const fileList = ref<Array<{ name: string; type: string; size: number; modified: number; permissions: string }>>([])
const isLoadingFiles = ref(false)
const showFileDialog = ref(false)
const followTerminalPath = ref(false)
const transferProgress = ref({
  show: false,
  type: 'upload' as 'upload' | 'download',
  fileName: '',
  percent: 0,
  transferred: 0,
  total: 0
})

// 命令历史store
const commandHistoryStore = useCommandHistoryStore()

// 性能优化：防抖保存函数
let saveHistoryTimer: any = null
const debouncedSaveHistory = () => {
  if (saveHistoryTimer) {
    clearTimeout(saveHistoryTimer)
  }
  saveHistoryTimer = setTimeout(() => {
    saveHistory()
    saveHistoryTimer = null
  }, 1000) // 1秒防抖
}

// 性能优化：缓存正则表达式
const PATH_LINE_REGEX = /^\/[^\s:]{1,200}$/
const PROMPT_PATH_REGEX = /@[^:]+:([/][^\u0007\s\]]+)/

// 性能优化：终端输出缓冲
let outputBuffer = ''
let outputRafId: number | null = null
let lastOutputTime = 0
const OUTPUT_THROTTLE_MS = 16 // 限制为60fps

// 性能优化：输出速率限制
const shouldThrottleOutput = () => {
  const now = Date.now()
  if (now - lastOutputTime < OUTPUT_THROTTLE_MS) {
    return true
  }
  lastOutputTime = now
  return false
}

const canConnect = computed(() => {
  if (!sshForm.value.host || !sshForm.value.username) {
    return false
  }
  
  if (sshForm.value.authType === 'password') {
    return !!sshForm.value.password
  } else {
    // 密钥认证
    if (sshForm.value.keyMode === 'file') {
      return !!sshForm.value.keyPath
    } else {
      return !!sshForm.value.keyText
    }
  }
})

// 加载历史记录
const loadHistory = async () => {
  console.log('Loading SSH history...')
  isLoadingHistory.value = true
  
  try {
    // 优先从 Electron 加载
    if (window.electron && window.electron.ssh) {
      try {
        const result = await window.electron.ssh.loadHistory()
        console.log('Electron history result:', result)
        if (result.success && result.data) {
          connectionHistory.value = result.data
          console.log('✓ Loaded', connectionHistory.value.length, 'history records from Electron file')
          return
        }
      } catch (e) {
        console.error('Failed to load history from Electron:', e)
      }
    }

    // 从 localStorage 加载
    const stored = localStorage.getItem('ssh-connection-history')
    if (stored) {
      try {
        connectionHistory.value = JSON.parse(stored)
        console.log('✓ Loaded', connectionHistory.value.length, 'history records from localStorage')
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    } else {
      console.log('No history found in localStorage')
    }
  } finally {
    isLoadingHistory.value = false
  }
}

// 保存历史记录
const saveHistory = async () => {
  console.log('Saving SSH history...', connectionHistory.value.length, 'records')
  
  try {
    // 双重清理：确保所有数据都是可序列化的纯对象
    const cleanHistory = connectionHistory.value.map(item => {
      // 只提取基本字段，确保可序列化
      const clean = {
        name: String(item.name || ''),
        host: String(item.host || ''),
        port: Number(item.port || 22),
        username: String(item.username || ''),
        authType: String(item.authType || 'password') as 'password' | 'key',
        password: item.password ? String(item.password) : undefined,
        keyMode: item.keyMode ? String(item.keyMode) as 'file' | 'text' : undefined,
        keyPath: item.keyPath ? String(item.keyPath) : undefined,
        keyText: item.keyText ? String(item.keyText) : undefined,
        lastUsed: Number(item.lastUsed || Date.now())
      }
      return clean
    })
    
    // 验证可序列化
    const testJson = JSON.stringify(cleanHistory)
    JSON.parse(testJson) // 测试是否可以反序列化
    
    console.log('Cleaned and validated', cleanHistory.length, 'records')
    
    // 保存到 localStorage
    localStorage.setItem('ssh-connection-history', testJson)
    console.log('✓ Saved to localStorage')
    
    // 如果在 Electron 环境，也保存到文件
    if (window.electron && window.electron.ssh) {
      try {
        // 传递已序列化的 JSON 数组
        const result = await window.electron.ssh.saveHistory(cleanHistory)
        console.log('Electron save result:', result)
        if (result.success) {
          console.log('✓ Saved to Electron file')
        } else {
          console.error('Failed to save to Electron:', result.error)
        }
      } catch (e: any) {
        console.error('Failed to save history to Electron:', e)
        console.error('Error message:', e.message)
        console.error('Error stack:', e.stack)
      }
    } else {
      console.log('Not in Electron environment, skipping file save')
    }
  } catch (e: any) {
    console.error('Save history error:', e)
    console.error('Error message:', e.message)
    console.error('Error stack:', e.stack)
  }
}

// 添加到历史记录
const addToHistory = async () => {
  if (!sshForm.value.saveToHistory) {
    console.log('saveToHistory is false, skipping')
    return
  }

  console.log('Adding to history...')

  // 创建干净的记录对象，只包含可序列化的纯数据
  const record: ConnectionRecord = {
    name: String(sshForm.value.name || '').trim(),
    host: String(sshForm.value.host).trim(),
    port: Number(sshForm.value.port),
    username: String(sshForm.value.username).trim(),
    authType: sshForm.value.authType,
    password: sshForm.value.authType === 'password' ? String(sshForm.value.password || '') : undefined,
    keyMode: sshForm.value.keyMode,
    keyPath: sshForm.value.keyMode === 'file' ? String(sshForm.value.keyPath || '').trim() : undefined,
    keyText: sshForm.value.keyMode === 'text' ? String(sshForm.value.keyText || '').trim() : undefined,
    lastUsed: Date.now(),
  }

  // 验证必填字段
  if (!record.host || !record.username) {
    console.error('Invalid record: missing host or username')
    return
  }

  // 验证端口范围
  if (record.port < 1 || record.port > 65535) {
    console.error('Invalid port:', record.port)
    return
  }

  console.log('Valid record created:', JSON.stringify(record))

  // 移除重复项（基于 host + username）
  const index = connectionHistory.value.findIndex(
    (item) => item.host === record.host && item.username === record.username
  )
  if (index > -1) {
    console.log('Removing duplicate at index:', index)
    connectionHistory.value.splice(index, 1)
  }

  // 添加到开头
  connectionHistory.value.unshift(record)
  console.log('✓ Record added, total:', connectionHistory.value.length)

  // 最多保存 20 条
  if (connectionHistory.value.length > 20) {
    connectionHistory.value = connectionHistory.value.slice(0, 20)
    console.log('Trimmed to 20 records')
  }

  // watch 会自动触发保存
  console.log('History updated, watch will trigger save')
}

// 加载历史项配置
const loadHistoryConfig = (item: ConnectionRecord) => {
  console.log('Loading history item config:', item)
  sshForm.value.host = item.host
  sshForm.value.port = item.port
  sshForm.value.username = item.username
  sshForm.value.authType = item.authType
  sshForm.value.name = item.name
  
  if (item.authType === 'password') {
    sshForm.value.password = item.password || ''
  } else {
    sshForm.value.keyMode = item.keyMode || 'file'
    sshForm.value.keyPath = item.keyPath || ''
    sshForm.value.keyText = item.keyText || ''
  }
}

// 单击历史项 - 延迟打开编辑（防止双击时触发）
const loadHistoryItem = (item: ConnectionRecord) => {
  // 清除之前的单击定时器
  if (clickTimeout) {
    clearTimeout(clickTimeout)
    clickTimeout = null
    return // 如果有双击，取消单击
  }
  
  // 延迟200ms执行单击操作（如果双击会被取消）
  clickTimeout = setTimeout(() => {
    loadHistoryConfig(item)
    showConfigDialog.value = true
    ElMessage.success('已加载连接配置，可编辑后连接')
    clickTimeout = null
  }, 200)
}

// 双击历史项自动连接（带防抖）
const quickConnect = async (item: ConnectionRecord) => {
  console.log('Quick connect requested to:', item.host)
  
  // 取消单击的延迟操作
  if (clickTimeout) {
    clearTimeout(clickTimeout)
    clickTimeout = null
  }
  
  // 清除之前的连接定时器
  if (connectTimeout) {
    console.log('Clearing previous connect timeout')
    clearTimeout(connectTimeout)
    connectTimeout = null
  }
  
  // 如果正在连接，忽略
  if (isConnecting.value) {
    console.log('Already connecting, ignoring')
    ElMessage.warning('正在连接中，请稍候...')
    return
  }
  
  // 先加载配置（不打开对话框）
  loadHistoryConfig(item)
  
  // 防抖延时 300ms，避免频繁点击
  connectTimeout = setTimeout(async () => {
    connectTimeout = null
    
    try {
      isConnecting.value = true
      
      // 如果已经连接，先断开
      if (connected.value) {
        console.log('Disconnecting previous connection...')
        await disconnect()
        // 等待一下确保断开完成
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // 等待表单更新
      await nextTick()
      
      // 自动连接
      if (canConnect.value) {
        console.log('Auto-connecting...')
        await connect()
      } else {
        ElMessage.warning('连接信息不完整，请补充后再连接')
      }
    } finally {
      isConnecting.value = false
    }
  }, 300)
  
  console.log('Connect scheduled in 300ms')
}

// 删除历史项
const removeHistoryItem = (index: number) => {
  console.log('Removing history item at index:', index)
  connectionHistory.value.splice(index, 1)
  // watch 会自动保存
  ElMessage.success('已删除')
}

// 清空历史
const clearHistory = () => {
  console.log('Clearing all history')
  connectionHistory.value = []
  // watch 会自动保存
  ElMessage.success('已清空历史记录')
}

// 确认清空历史
const confirmClearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有连接历史吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    clearHistory()
  } catch {
    // 用户取消
  }
}

// 确认删除连接
const confirmDeleteConnection = async (index: number) => {
  const item = connectionHistory.value[index]
  try {
    await ElMessageBox.confirm(
      `确定要删除连接 "${item.name || item.host}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    removeHistoryItem(index)
  } catch {
    // 用户取消
  }
}

// 创建新连接
const createNewConnection = () => {
  // 重置表单
  sshForm.value = {
    host: '',
    port: 22,
    username: '',
    authType: 'password',
    password: '',
    keyMode: 'file',
    keyPath: '',
    keyText: '',
    name: '',
    saveToHistory: true,
  }
  editingConnectionIndex.value = null
  showHistoryManager.value = false
  showConfigDialog.value = true
}

// 编辑连接
const editConnection = (item: ConnectionRecord, index: number) => {
  loadHistoryConfig(item)
  editingConnectionIndex.value = index
  showHistoryManager.value = false
  showConfigDialog.value = true
}

// 保存编辑的连接
const saveEditedConnection = () => {
  if (editingConnectionIndex.value === null) return
  
  // 验证必填字段
  if (!sshForm.value.host || !sshForm.value.username) {
    ElMessage.warning('请填写主机地址和用户名')
    return
  }
  
  // 更新记录
  const record: ConnectionRecord = {
    name: sshForm.value.name.trim(),
    host: sshForm.value.host.trim(),
    port: sshForm.value.port,
    username: sshForm.value.username.trim(),
    authType: sshForm.value.authType,
    password: sshForm.value.authType === 'password' ? sshForm.value.password : undefined,
    keyMode: sshForm.value.keyMode,
    keyPath: sshForm.value.keyMode === 'file' ? sshForm.value.keyPath.trim() : undefined,
    keyText: sshForm.value.keyMode === 'text' ? sshForm.value.keyText.trim() : undefined,
    lastUsed: connectionHistory.value[editingConnectionIndex.value].lastUsed,
  }
  
  connectionHistory.value[editingConnectionIndex.value] = record
  // watch 会自动保存
  
  ElMessage.success('连接已更新')
  showConfigDialog.value = false
  editingConnectionIndex.value = null
  showHistoryManager.value = true
}

// 取消编辑
const cancelEdit = () => {
  if (editingConnectionIndex.value !== null) {
    // 返回管理界面
    editingConnectionIndex.value = null
    showConfigDialog.value = false
    showHistoryManager.value = true
  } else {
    showConfigDialog.value = false
  }
}

// 从管理界面快速连接
const quickConnectFromManager = async (item: ConnectionRecord) => {
  showHistoryManager.value = false
  await nextTick()
  await quickConnect(item)
}

// 格式化最后使用时间
const formatLastUsed = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`
  } else {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}

// 测试保存和加载
const testSaveLoad = async () => {
  console.log('=== Testing Save/Load ===')
  console.log('Current history count:', connectionHistory.value.length)
  
  // 先保存
  await saveHistory()
  
  // 再加载
  await loadHistory()
  
  console.log('After reload, history count:', connectionHistory.value.length)
  ElMessage.success(`测试完成: ${connectionHistory.value.length} 条记录`)
}

// 执行快捷命令
const executeQuickCommand = async (command: string) => {
  if (!connected.value) {
    ElMessage.warning('请先连接SSH服务器')
    return
  }

  // 🎯 替换动态变量
  const processedCommand = replaceCommandVariables(command)
  
  console.log('Executing quick command:', command)
  if (processedCommand !== command) {
    console.log('After variable replacement:', processedCommand)
  }
  
  // 记录开始时间
  const startTime = Date.now()
  
  // 显示在终端（显示替换后的命令）
  addTerminalLine(`$ ${processedCommand}`, 'info')
  
  // 发送命令（使用替换后的命令）
  if (window.electron && window.electron.ssh) {
    const result = await window.electron.ssh.sendCommand(processedCommand)
    
    // 计算执行时长
    const duration = Date.now() - startTime
    
    // 记录到命令历史
    try {
      await commandHistoryStore.addCommand({
        command: command,
        serverHost: sshForm.value.host,
        serverName: sshForm.value.name || `${sshForm.value.username}@${sshForm.value.host}`,
        workingDirectory: currentPath.value || undefined,
        executedAt: new Date().toISOString(),
        duration: duration,
        exitCode: result.success ? 0 : 1,
      })
    } catch (error) {
      console.error('Failed to save command history:', error)
    }
    
    if (!result.success) {
      addTerminalLine(`执行失败: ${result.error}`, 'error')
      ElMessage.error('命令执行失败')
    }
  }
}

// 添加自定义命令
const addCustomCommand = () => {
  if (!newCommand.value.name.trim() || !newCommand.value.command.trim()) {
    ElMessage.warning('请填写命令名称和命令内容')
    return
  }

  customCommands.value.push({
    name: newCommand.value.name.trim(),
    command: newCommand.value.command.trim(),
    icon: newCommand.value.icon
  })

  // 保存到 localStorage
  localStorage.setItem('ssh-custom-commands', JSON.stringify(customCommands.value))
  
  // 重置表单
  newCommand.value = { name: '', command: '', icon: 'i-mdi-console' }
  showAddCommand.value = false
  
  ElMessage.success('自定义命令已添加')
}

// 删除自定义命令
const removeCustomCommand = (index: number) => {
  customCommands.value.splice(index, 1)
  localStorage.setItem('ssh-custom-commands', JSON.stringify(customCommands.value))
  ElMessage.success('已删除')
}

// 加载命令配置
const loadCommands = async () => {
  if (!window.electron?.ssh) {
    console.log('Not in Electron environment, skip loading commands')
    return
  }
  
  try {
    const result = await window.electron.ssh.loadCommands()
    
    if (result.success && result.data && result.data.length > 0) {
      commandGroups.value = result.data
      console.log('✓ Loaded', commandGroups.value.length, 'command groups')
    } else {
      // 初始化默认分组
      initializeDefaultGroups()
    }
  } catch (error) {
    console.error('Failed to load commands:', error)
    initializeDefaultGroups()
  }
}

// 保存命令配置
const saveCommands = async () => {
  if (!window.electron?.ssh) {
    console.log('Not in Electron environment, skip saving commands')
    return
  }
  
  try {
    // 转换为普通对象
    const plainGroups = JSON.parse(JSON.stringify(commandGroups.value))
    const result = await window.electron.ssh.saveCommands(plainGroups)
    
    if (result.success) {
      console.log('✓ Commands saved')
    } else {
      console.error('Failed to save commands:', result.error)
    }
  } catch (error) {
    console.error('Failed to save commands:', error)
  }
}

// 初始化默认分组
const initializeDefaultGroups = () => {
  commandGroups.value = [
    {
      id: 'group_default',
      name: '我的命令',
      icon: 'i-mdi-star',
      collapsed: false,
      commands: []
    }
  ]
}

// 切换分组折叠状态
const toggleGroup = (groupId: string) => {
  const group = commandGroups.value.find(g => g.id === groupId)
  if (group) {
    group.collapsed = !group.collapsed
    saveCommands()
  }
}

// 执行命令（单步或多步）
const executeCommand = async (cmd: Command) => {
  if (!connected.value) {
    ElMessage.warning('请先连接SSH服务器')
    return
  }
  
  let uploadedFileName = ''
  
  // 如果需要上传文件，先执行上传
  if (cmd.uploadFile) {
    uploadedFileName = await executeUploadBeforeCommand(cmd.targetPath)
    if (!uploadedFileName) {
      // 用户取消或上传失败
      return
    }
  }
  
  if (cmd.type === 'single' && cmd.command) {
    // 执行单步命令，替换 $FILENAME 变量
    const finalCommand = cmd.command.replace(/\$FILENAME/g, uploadedFileName)
    executeQuickCommand(finalCommand)
  } else if (cmd.type === 'multi' && cmd.steps && cmd.steps.length > 0) {
    // 执行多步骤命令，替换所有步骤中的 $FILENAME 变量
    const updatedCmd = JSON.parse(JSON.stringify(cmd))
    if (updatedCmd.steps) {
      updatedCmd.steps.forEach((step: CommandStep) => {
        step.command = step.command.replace(/\$FILENAME/g, uploadedFileName)
      })
    }
    await executeMultiStepCommand(updatedCmd)
  }
}

// 执行命令前上传文件
const executeUploadBeforeCommand = async (targetPath?: string): Promise<string> => {
  if (!window.electron?.dialog || !window.electron?.sftp) {
    ElMessage.warning('上传文件功能仅在桌面应用中可用')
    return ''
  }

  try {
    // 选择本地文件
    const selectResult = await window.electron.dialog.selectFile()
    if (selectResult.canceled) {
      return ''
    }

    const localPath = selectResult.filePath!
    const fileName = localPath.split('\\').pop() || localPath.split('/').pop() || 'file'
    
    // 确定远程路径
    let remotePath = ''
    if (targetPath && targetPath.trim()) {
      // 使用指定的目标路径
      remotePath = targetPath.endsWith('/') ? targetPath + fileName : targetPath + '/' + fileName
    } else {
      // 使用当前终端目录
      const termPath = currentPath.value || '/'
      remotePath = termPath.endsWith('/') ? termPath + fileName : termPath + '/' + fileName
    }

    console.log('Uploading for command:', localPath, '→', remotePath)

    // 显示进度
    transferProgress.value = {
      show: true,
      type: 'upload',
      fileName,
      percent: 0,
      transferred: 0,
      total: 0
    }

    // 执行上传
    const result = await window.electron.sftp.uploadFile(localPath, remotePath)
    
    if (result.success) {
      transferProgress.value.percent = 100
      setTimeout(() => {
        transferProgress.value.show = false
      }, 1000)
      ElMessage.success(`文件上传成功: ${fileName}`)
      
      // 如果文件浏览器在当前目录，刷新列表
      if (currentPath.value === (targetPath || currentPath.value)) {
        loadFiles()
      }
      
      return fileName
    } else {
      transferProgress.value.show = false
      ElMessage.error('上传失败: ' + result.error)
      return ''
    }
  } catch (e: any) {
    transferProgress.value.show = false
    ElMessage.error('上传失败: ' + e.message)
    return ''
  }
}

// 执行多步骤命令
const executeMultiStepCommand = async (cmd: Command) => {
  if (!cmd.steps || cmd.steps.length === 0) return
  
  addTerminalLine(`\n>>> 开始执行多步骤命令: ${cmd.name}`, 'info')
  
  for (let i = 0; i < cmd.steps.length; i++) {
    const step = cmd.steps[i]
    
    // 🎯 替换动态变量
    const processedCommand = replaceCommandVariables(step.command)
    
    // 显示步骤信息
    addTerminalLine(`[${i + 1}/${cmd.steps.length}] ${step.name}`, 'info')
    addTerminalLine(`$ ${processedCommand}`, 'info')
    
    // 发送命令（使用替换后的命令）
    if (window.electron?.ssh) {
      await window.electron.ssh.sendCommand(processedCommand)
    }
    
    // 延迟
    if (step.delay && step.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, step.delay))
    }
  }
  
  addTerminalLine(`✓ 多步骤命令执行完成: ${cmd.name}\n`, 'success')
}

// 加载自定义命令（兼容旧版本）
const loadCustomCommands = () => {
  const stored = localStorage.getItem('ssh-custom-commands')
  if (stored) {
    try {
      const oldCommands = JSON.parse(stored)
      console.log('Found old custom commands:', oldCommands.length)
      
      // 迁移到新格式
      if (oldCommands.length > 0) {
        migrateOldCommands(oldCommands)
      }
    } catch (e) {
      console.error('Failed to load custom commands:', e)
    }
  }
}

// 迁移旧命令到新格式
const migrateOldCommands = (oldCommands: any[]) => {
  // 查找或创建"自定义命令"分组
  let customGroup = commandGroups.value.find(g => g.name === '自定义命令')
  
  if (!customGroup) {
    customGroup = {
      id: 'group_migrated_' + Date.now(),
      name: '自定义命令',
      icon: 'i-mdi-star',
      collapsed: false,
      commands: []
    }
    commandGroups.value.push(customGroup)
  }
  
  // 转换旧命令
  oldCommands.forEach((old, index) => {
    const newCmd: Command = {
      id: `cmd_migrated_${Date.now()}_${index}`,
      name: old.name,
      type: 'single',
      icon: old.icon || 'i-mdi-console',
      command: old.command
    }
    customGroup!.commands.push(newCmd)
  })
  
  // 保存并清除旧数据
  saveCommands()
  localStorage.removeItem('ssh-custom-commands')
  ElMessage.success(`已迁移 ${oldCommands.length} 个旧命令`)
}

// ==================== 命令管理功能 ====================

// 打开新建分组对话框
const openAddGroupDialog = () => {
  editingGroup.value = {
    id: '',
    name: '',
    icon: 'i-mdi-star',
    collapsed: false,
    commands: []
  }
  showGroupDialog.value = true
}

// 编辑分组
const editGroup = (group: CommandGroup) => {
  editingGroup.value = JSON.parse(JSON.stringify(group))
  showGroupDialog.value = true
}

// 保存分组
const saveGroup = () => {
  if (!editingGroup.value) return
  
  if (!editingGroup.value.name.trim()) {
    ElMessage.warning('请输入分组名称')
    return
  }
  
  if (editingGroup.value.id) {
    // 更新现有分组
    const index = commandGroups.value.findIndex(g => g.id === editingGroup.value!.id)
    if (index !== -1) {
      commandGroups.value[index].name = editingGroup.value.name
      commandGroups.value[index].icon = editingGroup.value.icon
    }
  } else {
    // 新建分组
    editingGroup.value.id = 'group_' + Date.now()
    commandGroups.value.push(editingGroup.value)
  }
  
  saveCommands()
  showGroupDialog.value = false
  ElMessage.success('保存成功')
}

// 删除分组
const deleteGroup = async (group: CommandGroup) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组"${group.name}"吗？这将同时删除该分组下的所有命令。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = commandGroups.value.findIndex(g => g.id === group.id)
    if (index !== -1) {
      commandGroups.value.splice(index, 1)
      saveCommands()
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 打开新建命令对话框
const openAddCommandDialog = (group: CommandGroup) => {
  editingGroup.value = group
  editingCommand.value = {
    id: '',
    name: '',
    type: 'single',
    icon: 'i-mdi-console',
    command: '',
    steps: [
      { name: '', command: '', delay: 0 }
    ],
    uploadFile: false,
    targetPath: ''
  }
  showCommandDialog.value = true
}

// 编辑命令
const editCommand = (group: CommandGroup, cmd: Command) => {
  editingGroup.value = group
  editingCommand.value = JSON.parse(JSON.stringify(cmd))
  
  // 确保多步骤命令有步骤数组
  if (editingCommand.value.type === 'multi' && (!editingCommand.value.steps || editingCommand.value.steps.length === 0)) {
    editingCommand.value.steps = [
      { name: '', command: '', delay: 0 }
    ]
  }
  
  // 确保新字段存在（兼容旧版本）
  if (editingCommand.value.uploadFile === undefined) {
    editingCommand.value.uploadFile = false
  }
  if (editingCommand.value.targetPath === undefined) {
    editingCommand.value.targetPath = ''
  }
  
  showCommandDialog.value = true
}

// 保存命令
const saveCommand = () => {
  if (!editingCommand.value || !editingGroup.value) return
  
  if (!editingCommand.value.name.trim()) {
    ElMessage.warning('请输入命令名称')
    return
  }
  
  if (editingCommand.value.type === 'single') {
    if (!editingCommand.value.command?.trim()) {
      ElMessage.warning('请输入命令内容')
      return
    }
    // 清除多步骤数据
    delete editingCommand.value.steps
  } else {
    if (!editingCommand.value.steps || editingCommand.value.steps.length === 0) {
      ElMessage.warning('请至少添加一个步骤')
      return
    }
    
    // 验证步骤
    for (let i = 0; i < editingCommand.value.steps.length; i++) {
      const step = editingCommand.value.steps[i]
      if (!step.name.trim() || !step.command.trim()) {
        ElMessage.warning(`步骤 ${i + 1} 的名称和命令不能为空`)
        return
      }
    }
    
    // 清除单步命令数据
    delete editingCommand.value.command
  }
  
  // 查找分组
  const group = commandGroups.value.find(g => g.id === editingGroup.value!.id)
  if (!group) return
  
  if (editingCommand.value.id) {
    // 更新现有命令
    const index = group.commands.findIndex(c => c.id === editingCommand.value!.id)
    if (index !== -1) {
      group.commands[index] = editingCommand.value
    }
  } else {
    // 新建命令
    editingCommand.value.id = 'cmd_' + Date.now()
    group.commands.push(editingCommand.value)
  }
  
  saveCommands()
  showCommandDialog.value = false
  ElMessage.success('保存成功')
}

// 删除命令
const deleteCommand = async (group: CommandGroup, cmd: Command) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除命令"${cmd.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = group.commands.findIndex(c => c.id === cmd.id)
    if (index !== -1) {
      group.commands.splice(index, 1)
      saveCommands()
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 添加步骤
const addStep = () => {
  if (!editingCommand.value || !editingCommand.value.steps) return
  
  editingCommand.value.steps.push({
    name: '',
    command: '',
    delay: 1000
  })
}

// 删除步骤
const removeStep = (index: number) => {
  if (!editingCommand.value || !editingCommand.value.steps) return
  
  if (editingCommand.value.steps.length <= 1) {
    ElMessage.warning('至少需要保留一个步骤')
    return
  }
  
  editingCommand.value.steps.splice(index, 1)
}

// 导出命令
const exportCommands = () => {
  const data = JSON.stringify(commandGroups.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ssh-commands-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 导入命令
const importCommands = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!Array.isArray(data)) {
        ElMessage.error('文件格式不正确')
        return
      }
      
      commandGroups.value = data
      saveCommands()
      ElMessage.success('导入成功')
    } catch (error) {
      console.error('Import failed:', error)
      ElMessage.error('导入失败，请检查文件格式')
    }
  }
  input.click()
}

// SFTP - 加载文件列表
const loadFiles = async (path?: string) => {
  if (path) {
    currentPath.value = path
  }
  
  if (!window.electron?.sftp) {
    ElMessage.warning('SFTP功能仅在桌面应用中可用')
    return
  }

  isLoadingFiles.value = true
  
  try {
    const result = await window.electron.sftp.listDir(currentPath.value)
    if (result.success) {
      fileList.value = result.data.sort((a, b) => {
        // 目录排在前面
        if (a.type === 'directory' && b.type !== 'directory') return -1
        if (a.type !== 'directory' && b.type === 'directory') return 1
        return a.name.localeCompare(b.name)
      })
      console.log('✓ Loaded', fileList.value.length, 'files')
    } else {
      ElMessage.error('加载文件列表失败: ' + result.error)
    }
  } catch (e: any) {
    ElMessage.error('加载失败: ' + e.message)
  } finally {
    isLoadingFiles.value = false
  }
}

// 刷新文件列表
const refreshFiles = () => {
  loadFiles()
}

// 返回上级目录
const goToParent = () => {
  const parts = currentPath.value.split('/').filter(p => p)
  parts.pop()
  currentPath.value = '/' + parts.join('/')
  loadFiles()
}

// 文件点击
const fileClick = (file: any) => {
  if (file.type === 'directory') {
    // 进入目录
    currentPath.value = currentPath.value.endsWith('/') 
      ? currentPath.value + file.name
      : currentPath.value + '/' + file.name
    loadFiles()
  }
}

// 上传文件
const uploadFile = async () => {
  if (!window.electron?.dialog || !window.electron?.sftp) {
    ElMessage.warning('功能仅在桌面应用中可用')
    return
  }

  // 选择本地文件
  const selectResult = await window.electron.dialog.selectFile()
  if (selectResult.canceled) return

  const localPath = selectResult.filePath!
  const fileName = localPath.split('\\').pop() || localPath.split('/').pop() || 'file'
  const remotePath = currentPath.value.endsWith('/')
    ? currentPath.value + fileName
    : currentPath.value + '/' + fileName

  console.log('Uploading:', localPath, '→', remotePath)

  // 显示进度
  transferProgress.value = {
    show: true,
    type: 'upload',
    fileName,
    percent: 0,
    transferred: 0,
    total: 0
  }

  try {
    const result = await window.electron.sftp.uploadFile(localPath, remotePath)
    if (result.success) {
      transferProgress.value.percent = 100
      setTimeout(() => {
        transferProgress.value.show = false
      }, 1000)
      ElMessage.success('上传成功')
      loadFiles() // 刷新列表
    } else {
      transferProgress.value.show = false
      ElMessage.error('上传失败: ' + result.error)
    }
  } catch (e: any) {
    transferProgress.value.show = false
    ElMessage.error('上传失败: ' + e.message)
  }
}

// 下载文件
const downloadFile = async (file: any) => {
  if (!window.electron?.dialog || !window.electron?.sftp) {
    ElMessage.warning('功能仅在桌面应用中可用')
    return
  }

  const remotePath = currentPath.value.endsWith('/')
    ? currentPath.value + file.name
    : currentPath.value + '/' + file.name

  // 选择保存位置
  const saveResult = await window.electron.dialog.selectSavePath(file.name)
  if (saveResult.canceled) return

  const localPath = saveResult.filePath!

  console.log('Downloading:', remotePath, '→', localPath)

  // 显示进度
  transferProgress.value = {
    show: true,
    type: 'download',
    fileName: file.name,
    percent: 0,
    transferred: 0,
    total: file.size || 0
  }

  try {
    const result = await window.electron.sftp.downloadFile(remotePath, localPath)
    if (result.success) {
      transferProgress.value.percent = 100
      setTimeout(() => {
        transferProgress.value.show = false
      }, 1000)
      ElMessage.success('下载成功')
    } else {
      transferProgress.value.show = false
      ElMessage.error('下载失败: ' + result.error)
    }
  } catch (e: any) {
    transferProgress.value.show = false
    ElMessage.error('下载失败: ' + e.message)
  }
}

// 显示文件菜单
const showFileMenu = (file: any) => {
  console.log('File menu for:', file.name)
  // 可以实现右键菜单功能
}

// 🎯 替换命令中的动态变量
const replaceCommandVariables = (command: string): string => {
  const now = new Date()
  
  // 格式化数字（补零）
  const pad = (num: number, len: number = 2) => String(num).padStart(len, '0')
  
  // 变量映射
  const variables: Record<string, string> = {
    DATE: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
    TIME: `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    DATETIME: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    TIMESTAMP: String(Math.floor(now.getTime() / 1000)),
    YEAR: String(now.getFullYear()),
    MONTH: pad(now.getMonth() + 1),
    DAY: pad(now.getDate()),
    HOUR: pad(now.getHours()),
    MINUTE: pad(now.getMinutes()),
    SECOND: pad(now.getSeconds()),
  }
  
  // 替换所有变量
  let result = command
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  
  return result
}

// 格式化字节
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}


// 最大终端输出行数（防止性能问题）
const MAX_TERMINAL_LINES = 300  // 降低行数，避免 UI 卡死

// 添加终端输出
const addTerminalLine = (content: string, type: 'info' | 'error' | 'success' = 'info') => {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  
  terminalLines.value.push({
    time,
    content,
    type,
  })
  
  // 限制终端行数，防止内存占用过多和性能问题
  if (terminalLines.value.length > MAX_TERMINAL_LINES) {
    // 删除最旧的行，保留最新的 MAX_TERMINAL_LINES 行
    terminalLines.value.shift()  // 删除第一行，比 slice 更高效
  }

  // 如果启用了路径跟随，检测目录变化
  if (followTerminalPath.value && content) {
    // 检测pwd命令的输出（纯路径行）
    const pwdMatch = content.match(/^(\/[^\s\r\n]+)\s*$/)
    
    if (pwdMatch && pwdMatch[1]) {
      const detectedPath = pwdMatch[1].trim()
      if (detectedPath !== currentPath.value) {
        console.log('✓ Path detected from pwd:', detectedPath)
        currentPath.value = detectedPath
        // 延迟加载，避免频繁刷新
        setTimeout(() => {
          if (followTerminalPath.value && showFilesPanel.value) {
            console.log('Auto-loading files for:', detectedPath)
            loadFiles()
          }
        }, 300)
      }
    }
  }

  // 自动滚动到底部
  nextTick(() => {
    if (terminalOutput.value) {
      terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight
    }
  })
}

// 从对话框连接
const connectFromDialog = async () => {
  await connect()
  if (connected.value) {
    showConfigDialog.value = false
  }
}

// 选择密钥文件
const selectKeyFile = async () => {
  if (!window.electron?.dialog) {
    ElMessage.error('文件选择功能仅在 Electron 环境可用')
    return
  }
  
  try {
    // 打开文件选择对话框
    const result = await window.electron.dialog.selectFile()
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return
    }
    
    const selectedPath = result.filePaths[0]
    console.log('Selected key file:', selectedPath)
    
    // 复制文件到 toolData/ssh-keys
    if (window.electron?.ssh) {
      const copyResult = await window.electron.ssh.copyKeyFile(selectedPath)
      
      if (copyResult.success && copyResult.relativePath) {
        // 使用相对路径
        sshForm.value.keyPath = copyResult.relativePath
        ElMessage.success('密钥文件已复制到本地存储')
        console.log('Key file copied, relative path:', copyResult.relativePath)
      } else {
        ElMessage.error('复制密钥文件失败: ' + (copyResult.error || '未知错误'))
      }
    }
  } catch (error) {
    console.error('Failed to select key file:', error)
    ElMessage.error('选择文件失败')
  }
}

// 连接
const connect = async () => {
  if (!canConnect.value) {
    ElMessage.warning('请填写完整的连接信息')
    return
  }

  try {
    addTerminalLine(`正在连接到 ${sshForm.value.username}@${sshForm.value.host}:${sshForm.value.port}...`, 'info')

    // 构建 SSH 命令
    const args = [
      '-p', String(sshForm.value.port),
      `${sshForm.value.username}@${sshForm.value.host}`
    ]

    if (sshForm.value.authType === 'key' && sshForm.value.keyPath) {
      args.unshift('-i', sshForm.value.keyPath)
    }

    // 调用 Electron IPC（如果在 Electron 环境中）
    if (window.electron && window.electron.ssh) {
      const result = await window.electron.ssh.connect({
        host: sshForm.value.host,
        port: sshForm.value.port,
        username: sshForm.value.username,
        authType: sshForm.value.authType,
        password: sshForm.value.password,
        keyMode: sshForm.value.keyMode,
        keyPath: sshForm.value.keyPath,
        keyText: sshForm.value.keyText,
      })

      if (result.success) {
        connected.value = true
        
        // 初始化xterm终端
        await nextTick()
        initTerminal()
        
        // 显示欢迎信息
        if (xterm) {
          xterm.writeln('\r\n\x1b[32m✓ SSH 连接成功！\x1b[0m\r\n')
        }
        
        await addToHistory()
        ElMessage.success('SSH 连接成功')
      } else {
        if (xterm) {
          xterm.writeln(`\r\n\x1b[31m❌ 连接失败: ${result.error}\x1b[0m\r\n`)
        }
        ElMessage.error('连接失败')
      }
    } else {
      // 浏览器环境提示
      addTerminalLine('SSH 功能仅在桌面应用中可用', 'error')
      ElMessage.warning('SSH 功能仅在桌面应用中可用')
    }
  } catch (error: any) {
    addTerminalLine(`连接错误: ${error.message}`, 'error')
    ElMessage.error('连接失败')
  }
}

// 断开连接状态（防抖）
let isDisconnecting = false

// 断开连接
const disconnect = async () => {
  // 防止重复调用
  if (isDisconnecting) {
    console.log('Already disconnecting, ignoring duplicate call')
    return
  }
  
  if (!connected.value) {
    console.log('Not connected, ignoring disconnect call')
    return
  }
  
  isDisconnecting = true
  console.log('Disconnecting...')
  
  try {
    if (window.electron && window.electron.ssh) {
      await window.electron.ssh.disconnect()
    }
    
    connected.value = false
    
    // 销毁xterm终端
    destroyTerminal()
    
    // 清空文件列表
    fileList.value = []
    currentPath.value = '/'
    
    // 重置面板状态
    showCommandsPanel.value = true
    showFilesPanel.value = true
    
    ElMessage.success('已断开连接')
  } catch (error) {
    console.error('Disconnect error:', error)
    ElMessage.error('断开连接失败')
  } finally {
    // 延迟重置标志，避免快速重复点击
    setTimeout(() => {
      isDisconnecting = false
    }, 1000)
  }
}

// ==================== Xterm.js 终端管理 ====================

// 初始化xterm终端
const initTerminal = () => {
  if (!terminalContainer.value) {
    console.error('Terminal container not found')
    return
  }

  // 如果已存在，先销毁
  if (xterm) {
    xterm.dispose()
    xterm = null
  }

  // 创建终端实例（性能优化配置）
  xterm = new Terminal({
    // 性能优化：禁用光标闪烁减少重绘
    cursorBlink: false,
    cursorStyle: 'block',
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
      background: '#0a0e27',
      foreground: '#00ffff',
      cursor: '#00ffff',
      selection: 'rgba(0, 255, 255, 0.3)',
      black: '#000000',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#bfbfbf',
      brightBlack: '#4d4d4d',
      brightRed: '#ff6e67',
      brightGreen: '#5af78e',
      brightYellow: '#f4f99d',
      brightBlue: '#caa9fa',
      brightMagenta: '#ff92d0',
      brightCyan: '#9aedfe',
      brightWhite: '#e6e6e6',
    },
    cols: 100,
    rows: 30,
    // 性能优化：减少滚动缓冲区
    scrollback: 500,
    convertEol: true,
    // 性能优化：禁用平滑滚动
    smoothScrollDuration: 0,
    // 性能优化：快速滚动
    fastScrollModifier: 'shift',
    fastScrollSensitivity: 5,
  })

  // 创建自适应插件
  fitAddon = new FitAddon()
  xterm.loadAddon(fitAddon)

  // 挂载到容器
  xterm.open(terminalContainer.value)

  // 自适应大小
  setTimeout(() => {
    fitAddon?.fit()
  }, 100)

  // 用于累积命令输入的缓冲区
  let commandBuffer = ''
  
  // 监听用户输入
  xterm.onData((data) => {
    // 将用户输入发送到SSH
    if (connected.value && window.electron?.ssh) {
      window.electron.ssh.sendData(data)
      
      // 检测是否按下回车键（命令提交）
      if (data === '\r' || data === '\n') {
        const cmd = commandBuffer.trim()
        
        // 记录非空命令到历史
        if (cmd && cmd !== 'pwd') {  // 排除自动pwd命令
          try {
            commandHistoryStore.addCommand({
              command: cmd,
              serverHost: sshForm.value.host,
              serverName: sshForm.value.name || `${sshForm.value.username}@${sshForm.value.host}`,
              workingDirectory: currentPath.value || undefined,
              executedAt: new Date().toISOString(),
            })
          } catch (error) {
            console.error('Failed to save command history:', error)
          }
        }
        
        // 如果启用路径跟随且执行了cd或ls/ll命令，自动执行pwd获取新路径
        const shouldFollow = followTerminalPath.value && (
          cmd.startsWith('cd ') ||
          cmd === 'cd' ||
          cmd === 'll' ||
          cmd === 'ls' ||
          cmd === 'la' ||
          cmd.startsWith('ls ') ||
          cmd.startsWith('ll ')
        )
        
        if (shouldFollow) {
          console.log('Command triggers path follow:', cmd)
          setTimeout(async () => {
            console.log('Executing pwd to get current path...')
            await window.electron!.ssh.sendData('pwd\r')
          }, 300)
        }
        
        // 清空命令缓冲区
        commandBuffer = ''
      } else if (data === '\x7f' || data === '\b') {
        // 退格键：删除最后一个字符
        commandBuffer = commandBuffer.slice(0, -1)
      } else if (data === '\x03') {
        // Ctrl+C：清空缓冲区
        commandBuffer = ''
      } else if (data.length === 1 && data.charCodeAt(0) >= 32) {
        // 普通可见字符：添加到缓冲区
        commandBuffer += data
      }
    }
  })

  // 备用复制方法（当 Clipboard API 权限被拒绝时使用）
  const fallbackCopyTextToClipboard = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.width = '2em'
      textArea.style.height = '2em'
      textArea.style.padding = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'
      textArea.style.background = 'transparent'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (successful) {
          resolve()
        } else {
          reject(new Error('execCommand failed'))
        }
      } catch (err) {
        document.body.removeChild(textArea)
        reject(err)
      }
    })
  }
  
  // 添加复制粘贴功能 - 使用 xterm 的自定义键盘事件处理器
  xterm.attachCustomKeyEventHandler((event: KeyboardEvent) => {
    // Ctrl+Shift+C 复制
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
      event.preventDefault()
      const selection = xterm.getSelection()
      if (selection) {
        // 优先使用 Clipboard API，失败时使用备用方法
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(selection)
            .then(() => {
              console.log('✓ Text copied to clipboard (Clipboard API):', selection.substring(0, 50) + (selection.length > 50 ? '...' : ''))
              ElMessage.success('已复制到剪贴板')
            })
            .catch(err => {
              console.warn('Clipboard API failed, trying fallback method:', err)
              // 使用备用方法
              fallbackCopyTextToClipboard(selection)
                .then(() => {
                  console.log('✓ Text copied to clipboard (fallback):', selection.substring(0, 50) + (selection.length > 50 ? '...' : ''))
                  ElMessage.success('已复制到剪贴板')
                })
                .catch(fallbackErr => {
                  console.error('Failed to copy (both methods):', fallbackErr)
                  ElMessage.error('复制失败：请手动选中文本后按 Ctrl+C')
                })
            })
        } else {
          // 直接使用备用方法
          fallbackCopyTextToClipboard(selection)
            .then(() => {
              console.log('✓ Text copied to clipboard (fallback):', selection.substring(0, 50) + (selection.length > 50 ? '...' : ''))
              ElMessage.success('已复制到剪贴板')
            })
            .catch(err => {
              console.error('Failed to copy:', err)
              ElMessage.error('复制失败：请手动选中文本后按 Ctrl+C')
            })
        }
      } else {
        console.log('No text selected')
        ElMessage.warning('请先选中要复制的文本')
      }
      return false // 阻止 xterm 默认处理
    }
    
    // Ctrl+Shift+V 粘贴
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'v') {
      event.preventDefault()
      
      // 优先使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText()
          .then(text => {
            if (text && xterm) {
              xterm.paste(text)
              console.log('✓ Text pasted from clipboard (Clipboard API):', text.substring(0, 50) + (text.length > 50 ? '...' : ''))
              ElMessage.success('已粘贴')
            }
          })
          .catch(err => {
            console.warn('Clipboard API failed for paste, trying fallback...', err)
            // 备用方案：提示用户使用原生粘贴
            ElMessage.info({
              message: '请使用 Ctrl+V 或右键粘贴',
              duration: 2000
            })
          })
      } else {
        // Clipboard API 不可用时提示用户使用原生方法
        ElMessage.info({
          message: '请使用 Ctrl+V 或右键粘贴',
          duration: 2000
        })
      }
      return false // 阻止 xterm 默认处理
    }
    
    // 返回 true 让 xterm 正常处理其他按键
    return true
  })

  // 添加原生 paste 事件监听器（用于 Ctrl+V 粘贴）
  pasteHandler = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData('text')
    if (text && xterm) {
      event.preventDefault()
      xterm.paste(text)
      console.log('✓ Text pasted from clipboard (Ctrl+V):', text.substring(0, 50) + (text.length > 50 ? '...' : ''))
      ElMessage.success('已粘贴')
    }
  }
  terminalContainer.value?.addEventListener('paste', pasteHandler)

  // 窗口大小变化时自适应
  const handleResize = () => {
    if (fitAddon && xterm) {
      fitAddon.fit()
      // 通知后端更新终端大小
      if (window.electron?.ssh && connected.value) {
        window.electron.ssh.resize(xterm.cols, xterm.rows)
      }
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  console.log('✓ Xterm initialized with copy/paste support')
}

// 销毁xterm终端
const destroyTerminal = () => {
  // 清理 paste 事件监听器
  if (pasteHandler && terminalContainer.value) {
    terminalContainer.value.removeEventListener('paste', pasteHandler)
    pasteHandler = null
  }
  
  if (xterm) {
    xterm.dispose()
    xterm = null
  }
  if (fitAddon) {
    fitAddon = null
  }
  console.log('✓ Xterm destroyed')
}

// 清空终端
const clearTerminal = () => {
  if (xterm) {
    xterm.clear()
  } else {
    // 兼容旧版本
    terminalLines.value = []
  }
}

// 处理键盘按键
const handleKeydown = async (event: KeyboardEvent) => {
  if (!connected.value) return

  // Enter 键 - 发送命令
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    await sendCommand()
    return
  }

  // 特殊按键需要发送到 SSH
  let specialChar = ''
  let shouldPrevent = false

  // Ctrl 组合键
  if (event.ctrlKey) {
    switch (event.key.toLowerCase()) {
      case 'c':
        // Ctrl+C 使用专门的中断函数，支持多次发送
        event.preventDefault()
        await sendInterrupt()
        return
      case 'd':
        specialChar = '\x04' // Ctrl+D (EOF)
        shouldPrevent = true
        addTerminalLine('^D', 'info')
        break
      case 'z':
        specialChar = '\x1a' // Ctrl+Z (挂起)
        shouldPrevent = true
        addTerminalLine('^Z', 'info')
        break
    }
  }
  // ESC 键 - 对于 vim/vi 编辑器非常重要
  else if (event.key === 'Escape') {
    specialChar = '\x1b' // ESC
    shouldPrevent = true
    addTerminalLine('[ESC]', 'info')
  }
  // 方向键 - 对于编辑器导航很重要
  else if (event.key === 'ArrowUp') {
    specialChar = '\x1b[A' // 上箭头
    shouldPrevent = true
  }
  else if (event.key === 'ArrowDown') {
    specialChar = '\x1b[B' // 下箭头
    shouldPrevent = true
  }
  else if (event.key === 'ArrowRight') {
    specialChar = '\x1b[C' // 右箭头
    shouldPrevent = true
  }
  else if (event.key === 'ArrowLeft') {
    specialChar = '\x1b[D' // 左箭头
    shouldPrevent = true
  }
  // Tab 键
  else if (event.key === 'Tab') {
    specialChar = '\t' // Tab
    shouldPrevent = true
  }

  // 如果是特殊按键，发送到 SSH
  if (specialChar && window.electron?.ssh) {
    if (shouldPrevent) {
      event.preventDefault()
    }
    
    const result = await window.electron.ssh.sendCommand(specialChar)
    if (!result.success) {
      addTerminalLine(`发送按键失败: ${result.error}`, 'error')
    }
  }
}

// 发送中断信号 (Ctrl+C) - 兼容按钮点击
const sendInterrupt = async () => {
  if (!connected.value) return
  
  if (!window.electron?.ssh) {
    addTerminalLine('SSH API 不可用', 'error')
    return
  }
  
  addTerminalLine('正在中断...', 'info')
  
  // 发送 Ctrl+C 字符 (ASCII 3)
  // 某些程序（如 tail -f）可能需要多次发送才能中断
  const ctrlC = String.fromCharCode(3)  // 明确使用 ASCII 码创建
  console.log('[Frontend] Creating Ctrl+C with fromCharCode(3)')
  console.log('[Frontend] Character:', ctrlC, 'length:', ctrlC.length, 'charCode:', ctrlC.charCodeAt(0))
  
  // 连续发送 3 次 Ctrl+C，确保能够中断顽固的程序
  let successCount = 0
  for (let i = 0; i < 3; i++) {
    console.log(`[Frontend] Sending Ctrl+C attempt ${i + 1}/3`)
    const result = await window.electron.ssh.sendCommand(ctrlC)
    if (result.success) {
      successCount++
      console.log(`[Frontend] Attempt ${i + 1} succeeded`)
    } else {
      console.error(`[Frontend] Attempt ${i + 1} failed:`, result.error)
      addTerminalLine(`发送中断信号失败: ${result.error}`, 'error')
      break
    }
    // 每次间隔 150ms，给系统更多反应时间
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  }
  
  console.log(`[Frontend] Sent ${successCount} Ctrl+C signals`)
  
  if (successCount > 0) {
    addTerminalLine(`已发送 ${successCount} 次中断信号...`, 'info')
    
    // 2秒后检查是否还在疯狂输出，如果是则自动强制停止
    const checkTime = Date.now()
    setTimeout(async () => {
      const recentLines = terminalLines.value.slice(-100)
      
      // 如果最近有超过 80 行输出，说明程序还在运行且无法中断
      if (recentLines.length >= 80 && connected.value) {
        console.log('[Frontend] Program still running after interrupt, force killing session...')
        
        try {
          await ElMessageBox.confirm(
            'tail -f 等程序无法正常中断。是否强制停止并重启 Shell 会话？',
            '程序无法中断',
            {
              confirmButtonText: '强制停止',
              cancelButtonText: '取消',
              type: 'warning',
              closeOnClickModal: false,  // 点击遮罩不关闭
              center: true,  // 内容居中
              customClass: 'force-kill-dialog',  // 自定义类名
            }
          )
          
          // 用户点击了确定
          addTerminalLine('🔥 强制停止 Shell 会话...', 'info')
          const result = await window.electron.ssh.forceKillSession()
          if (result.success) {
            addTerminalLine('✓ Shell 会话已重启', 'success')
            ElMessage.success('Shell 会话已重启，可以继续使用')
          } else {
            addTerminalLine(`强制停止失败: ${result.error}`, 'error')
          }
        } catch (err) {
          // 用户点击了取消
          console.log('User cancelled force kill')
        }
      }
    }, 2000)
  }
}

// 发送命令
const sendCommand = async () => {
  if (!commandInput.value.trim() || !connected.value) return

  const cmd = commandInput.value
  addTerminalLine(`$ ${cmd}`, 'info')

  if (window.electron && window.electron.ssh) {
    const result = await window.electron.ssh.sendCommand(cmd)
    if (!result.success) {
      addTerminalLine(`发送命令失败: ${result.error}`, 'error')
    }
    
    // 如果启用路径跟随且执行了cd或ls/ll命令，自动执行pwd获取新路径
    const trimmedCmd = cmd.trim()
    const shouldFollow = followTerminalPath.value && (
      trimmedCmd.startsWith('cd ') ||
      trimmedCmd === 'll' ||
      trimmedCmd === 'ls' ||
      trimmedCmd === 'la' ||
      trimmedCmd.startsWith('ls ') ||
      trimmedCmd.startsWith('ll ')
    )
    
    if (shouldFollow) {
      console.log('Command triggers path follow:', trimmedCmd)
      setTimeout(async () => {
        console.log('Executing pwd to get current path...')
        await window.electron!.ssh.sendCommand('pwd')
      }, 300)
    }
  }

  commandInput.value = ''
}

// 格式化终端内容（处理换行符和ANSI转义）
const formatTerminalContent = (line: TerminalLine) => {
  // 移除 ANSI 转义码（颜色、样式等控制字符）
  let content = line.content
    // 移除 ANSI 转义序列（颜色等）
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\x1b\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGKHf]/g, '')
    // 移除终端标题设置序列 (]0;xxx, ]1;xxx, ]2;xxx)
    .replace(/\][0-2];[^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/\][0-2];[^\n]*/g, '')
    // 移除其他控制字符
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '')
    // 移除 BEL 字符
    .replace(/\x07/g, '')
  
  // 转义 HTML
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // 根据内容类型应用不同的样式类
  let cssClass = 'terminal-output-default'
  
  // 检测命令行（以 $ 开头或包含提示符）
  if (content.includes('$ ') || content.match(/^\[.*@.*\]/)) {
    cssClass = 'terminal-command'
  }
  // 检测目录（drwx 开头）
  else if (content.match(/^d[rwx-]{9}/)) {
    cssClass = 'terminal-directory'
  }
  // 检测文件（-rw 开头）
  else if (content.match(/^-[rwx-]{9}/)) {
    cssClass = 'terminal-file'
  }
  // 检测错误信息
  else if (line.type === 'error' || content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')) {
    cssClass = 'terminal-error'
  }
  // 检测成功信息
  else if (line.type === 'success' || content.includes('成功') || content.includes('✓')) {
    cssClass = 'terminal-success'
  }
  
  // 保留换行
  content = content.replace(/\r?\n/g, '<br>')
  
  return `<span class="${cssClass}">${content}</span>`
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

// 监听历史记录变化，自动保存（使用防抖优化性能）
watch(connectionHistory, (newHistory) => {
  if (isLoadingHistory.value) {
    console.log('Skipping auto-save during loading')
    return
  }
  console.log('History changed, scheduling save...', newHistory.length, 'records')
  debouncedSaveHistory()
}, { deep: true })

// 监听文件面板展开，自动加载文件列表
watch(showFilesPanel, (show) => {
  if (show && connected.value && fileList.value.length === 0) {
    console.log('Files panel opened, loading files...')
    loadFiles()
  }
})

// ========================================
// MySQL 功能（已移至独立页面）
// ========================================

/**
 * 跳转到MySQL查询页面
 */
function goToMySQLPage() {
  router.push('/tools/mysql')
}

// 监听 SSH 输出
onMounted(() => {
  console.log('SSH Tool mounted')
  console.log('window.electron:', window.electron)
  console.log('window.electron.ssh:', window.electron?.ssh)
  
  // 加载历史记录
  loadHistory().then(() => {
    console.log('Initial history loaded, count:', connectionHistory.value.length)
  })
  
  // 初始化命令历史store
  commandHistoryStore.initialize().then(() => {
    console.log('Command history store initialized')
  })
  
  // 加载命令配置（新版）
  loadCommands().then(() => {
    // 如果有旧的自定义命令，自动迁移
    loadCustomCommands()
  })

  // 监听 SSH 输出（性能优化：使用RAF批处理）
  if (window.electron && window.electron.ssh) {
    console.log('Setting up SSH listeners')
    window.electron.ssh.onOutput((data: string) => {
      // 性能优化：使用requestAnimationFrame批量写入终端
      if (xterm && connected.value) {
        outputBuffer += data
        
        // 性能优化：限制输出频率到60fps
        if (!outputRafId && !shouldThrottleOutput()) {
          outputRafId = requestAnimationFrame(() => {
            if (outputBuffer && xterm) {
              // 性能优化：限制单次写入的数据量
              const maxChunkSize = 4096 // 4KB per frame
              if (outputBuffer.length > maxChunkSize) {
                xterm.write(outputBuffer.substring(0, maxChunkSize))
                outputBuffer = outputBuffer.substring(maxChunkSize)
                // 继续处理剩余数据
                outputRafId = null
                if (outputBuffer.length > 0) {
                  requestAnimationFrame(() => {
                    if (outputBuffer && xterm) {
                      xterm.write(outputBuffer)
                      outputBuffer = ''
                    }
                  })
                }
              } else {
                xterm.write(outputBuffer)
                outputBuffer = ''
              }
            }
            outputRafId = null
          })
        }
        
        // 性能优化：路径跟随 - 提前过滤和快速检测
        if (followTerminalPath.value && showFilesPanel.value && data) {
          // 快速检测：只处理可能包含路径的短数据
          if (data.length > 200 || data.indexOf('/') === -1) {
            return
          }
          
          // 去除ANSI转义序列
          const cleanData = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
          
          if (cleanData.length === 0 || cleanData.length > 200) {
            return
          }
          
          // 检测pwd命令的输出 - 使用缓存的正则
          let detectedPath = ''
          
          // 优先匹配：pwd命令后的第一行路径
          const lines = cleanData.split(/[\r\n]+/)
          for (const line of lines) {
            if (PATH_LINE_REGEX.test(line)) {
              detectedPath = line
              break
            }
          }
          
          // 备用方案：从提示符提取路径
          if (!detectedPath) {
            const promptMatch = PROMPT_PATH_REGEX.exec(cleanData)
            if (promptMatch && promptMatch[1]) {
              detectedPath = promptMatch[1]
            }
          }
          
          if (detectedPath && detectedPath !== currentPath.value) {
            console.log('[Path Follow] Path changed to:', detectedPath)
            currentPath.value = detectedPath
            // 延迟加载，避免频繁刷新
            setTimeout(() => {
              if (followTerminalPath.value && showFilesPanel.value) {
                loadFiles()
              }
            }, 300)
          }
        }
      } else {
        // 连接前的输出（如错误信息）使用旧方式
        addTerminalLine(data, 'info')
      }
    })

    window.electron.ssh.onError((error: string) => {
      if (xterm && connected.value) {
        xterm.write(`\r\n\x1b[31m${error}\x1b[0m\r\n`)
      } else {
        addTerminalLine(error, 'error')
      }
    })

    window.electron.ssh.onClose(() => {
      connected.value = false
      if (xterm) {
        xterm.writeln('\r\n\x1b[33m连接已关闭\x1b[0m\r\n')
      }
      // 延迟销毁，确保用户看到关闭消息
      setTimeout(() => {
        destroyTerminal()
      }, 500)
    })
  } else {
    console.error('window.electron.ssh is not available!')
  }

  // 监听文件传输进度
  if (window.electron && window.electron.sftp) {
    console.log('Setting up SFTP progress listeners')
    
    window.electron.sftp.onUploadProgress((data: any) => {
      if (transferProgress.value.type === 'upload') {
        transferProgress.value.percent = data.percent
        transferProgress.value.transferred = data.transferred
        transferProgress.value.total = data.total
      }
    })

    window.electron.sftp.onDownloadProgress((data: any) => {
      if (transferProgress.value.type === 'download') {
        transferProgress.value.percent = data.percent
        transferProgress.value.transferred = data.transferred
        transferProgress.value.total = data.total
      }
    })
  }
})

// 组件卸载前清理
onBeforeUnmount(() => {
  console.log('SSH Tool unmounting, cleaning up...')
  
  // 清理定时器
  if (saveHistoryTimer) {
    clearTimeout(saveHistoryTimer)
    saveHistoryTimer = null
  }
  if (outputRafId) {
    cancelAnimationFrame(outputRafId)
    outputRafId = null
  }
  
  // 强制保存未保存的历史记录
  if (!isLoadingHistory.value) {
    saveHistory()
  }
  
  destroyTerminal()
  if (connected.value) {
    disconnect()
  }
})
</script>

<style scoped>
.ssh-tool {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
}

/* 工具栏 */
.ssh-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-panel);
  border-bottom: 2px solid var(--color-border);
  flex-shrink: 0;
}

.ssh-toolbar__left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.ssh-toolbar__status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.ssh-toolbar__status i {
  font-size: 16px;
}

.ssh-toolbar__right {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

/* 快捷键提示 */
.ssh-shortcuts-hint {
  display: flex;
  gap: 12px;
  padding: 6px 12px;
  background-color: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--neon-cyan);
}

.shortcut-item i {
  font-size: 14px;
}

.ssh-shortcuts-hint kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  font-family: var(--font-family-mono);
  color: var(--neon-lime);
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 文件传输进度条 */
.transfer-progress {
  position: relative;
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-panel);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.transfer-progress__info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.transfer-progress__info i {
  font-size: 16px;
  color: var(--neon-cyan);
}

.transfer-progress__percent {
  margin-left: auto;
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  font-family: var(--font-family-mono);
}

.transfer-progress__bar {
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.transfer-progress__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-cyan), var(--neon-cyan-light));
  box-shadow: 0 0 10px var(--neon-cyan);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.transfer-progress__size {
  font-size: 11px;
  color: var(--color-muted);
  text-align: right;
}

/* 内容区域 */
.ssh-content {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;
  padding: var(--spacing-lg);
}

.ssh-sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
  flex-shrink: 0;
}

.ssh-terminal {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  /* 移除固定高度限制，使用flex自适应 */
}

/* 侧边栏区块 */
.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.sidebar-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

/* 可折叠面板 */
.collapsible-section .sidebar-section__header:hover {
  background-color: var(--color-panel-hover);
  border-radius: var(--radius-sm);
}

/* 紧凑版历史记录 */
.ssh-history-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item-compact {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  /* 性能优化：明确指定transition属性，避免all */
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.history-item-compact:hover {
  border-color: var(--neon-cyan);
  /* 性能优化：减少模糊半径降低GPU负担 */
  box-shadow: 0 0 4px rgba(33, 230, 255, 0.3);
  /* 性能优化：使用translate3d开启硬件加速 */
  transform: translate3d(2px, 0, 0);
  will-change: transform;
}

.history-item-compact > i:first-child {
  font-size: 16px;
  color: var(--neon-cyan);
  flex-shrink: 0;
}

.history-item-compact__text {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.3;
}

.history-item-compact__text > div:first-child {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-compact__sub {
  font-size: 10px;
  color: var(--color-muted);
}

.empty-state-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-sm);
  color: var(--color-text-disabled);
  font-size: 12px;
  gap: var(--spacing-xs);
}

.empty-state-small i {
  font-size: 24px;
}

/* 紧凑版快捷命令 */
.quick-commands-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-cmd-compact {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-sm);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  /* 性能优化：明确指定transition属性 */
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  font-size: 12px;
  color: var(--color-text);
}

.quick-cmd-compact:hover {
  border-color: var(--neon-cyan);
  /* 性能优化：减少模糊半径 */
  box-shadow: 0 0 4px rgba(33, 230, 255, 0.3);
  /* 性能优化：使用translate3d */
  transform: translate3d(2px, 0, 0);
  will-change: transform;
}

.quick-cmd-compact i {
  font-size: 14px;
  color: var(--neon-cyan);
  flex-shrink: 0;
}

.quick-cmd-compact span {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-cmd-compact--custom {
  border-color: rgba(155, 92, 255, 0.3);
}

.quick-cmd-compact--custom i {
  color: var(--neon-purple);
}

.quick-cmd-compact--custom:hover {
  border-color: var(--neon-purple);
  /* 性能优化：减少模糊半径 */
  box-shadow: 0 0 4px rgba(155, 92, 255, 0.3);
}

/* 命令分组头部 */
.command-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--neon-yellow);
  background: rgba(255, 230, 0, 0.05);
  border-left: 2px solid var(--neon-yellow);
  user-select: none;
}

.command-group-header:first-child {
  margin-top: 0;
}

.command-count {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.6;
}

/* 文件浏览器 */
.file-browser-compact {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.file-path {
  flex-shrink: 0;
}

.file-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.file-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  font-size: 12px;
  color: var(--color-muted);
}

/* 性能优化：使用transform3d开启硬件加速 */
@keyframes spin {
  from { transform: rotate3d(0, 0, 1, 0deg); }
  to { transform: rotate3d(0, 0, 1, 360deg); }
}

/* 性能优化：仅当元素可见时运行动画 */
.file-loading .i-mdi-loading {
  animation: spin 1s linear infinite;
}

/* 路径跟随图标动画 - 性能优化 */
.path-follow-icon {
  font-size: 12px;
  animation: spin 2s linear infinite;
  /* 性能优化：使用will-change提示浏览器 */
  will-change: transform;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px var(--spacing-sm);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  /* 性能优化：明确指定transition属性 */
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  font-size: 12px;
}

.file-item:hover {
  border-color: var(--neon-cyan);
  /* 性能优化：减少模糊半径 */
  box-shadow: 0 0 3px rgba(33, 230, 255, 0.2);
  /* 性能优化：使用translate3d */
  transform: translate3d(2px, 0, 0);
  will-change: transform;
}

.file-item i {
  font-size: 14px;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text);
}

.file-item .el-button {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.file-item:hover .el-button {
  opacity: 1;
}

.ssh-terminal :deep(.neon-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0;
}

.terminal-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  max-height: 100%;
}

/* Xterm容器样式 */
.xterm-container {
  flex: 1;
  min-height: 0;
  padding: 8px;
  background-color: #0a0e27;
}

.terminal-empty-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(10, 14, 39, 0.95);
  color: #666;
  font-size: 1.2em;
  z-index: 1;
  pointer-events: none;
}

.terminal-empty-overlay i {
  font-size: 3em;
  margin-bottom: var(--spacing-md);
  color: var(--neon-cyan);
  opacity: 0.5;
}

.terminal-empty-overlay .hint {
  font-size: 0.8em;
  color: var(--neon-lime);
  margin-top: 8px;
  opacity: 0.7;
}

.terminal-output {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-md);
  background-color: #000;
  color: #0f0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.terminal-line {
  margin-bottom: 2px;
  word-break: break-all;
  line-height: 1.4;
}

/* 不同类型的终端输出颜色 */
:deep(.terminal-command) {
  color: var(--neon-cyan);
  font-weight: 500;
}

:deep(.terminal-directory) {
  color: #5fd7ff;
}

:deep(.terminal-file) {
  color: #d0d0d0;
}

:deep(.terminal-error) {
  color: var(--neon-pink);
}

:deep(.terminal-success) {
  color: var(--neon-lime);
}

:deep(.terminal-output-default) {
  color: #0f0;
}

.terminal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 1.2em;
}

.terminal-empty i {
  font-size: 3em;
  margin-bottom: var(--spacing-md);
}

.terminal-input {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg);
  align-items: center;
  flex-shrink: 0;
}

/* 覆盖 NeonTextarea 的默认样式 */
.terminal-input__field :deep(.neon-textarea) {
  padding: 0;
  background-color: #000;
  border: 1px solid var(--neon-cyan);
  border-radius: var(--radius-sm);
  box-shadow: none;
}

.terminal-input__field :deep(.neon-textarea--focused) {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.terminal-input__field :deep(.neon-textarea__inner) {
  flex: 1;
  min-height: 36px;
  max-height: 120px;
  padding: var(--spacing-sm) var(--spacing-md);
  color: #0f0;
  font-family: var(--font-family-mono);
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  box-sizing: border-box;
}

.terminal-input__field:focus {
  box-shadow: var(--glow-cyan);
}

.terminal-input__field::-webkit-scrollbar {
  width: 6px;
}

.terminal-input__field::-webkit-scrollbar-track {
  background: #111;
}

.terminal-input__field::-webkit-scrollbar-thumb {
  background: var(--neon-cyan);
  border-radius: 3px;
}

/* 历史记录 */
.ssh-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 300px;
  overflow-y: auto;
}

.ssh-history-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.ssh-history-item:hover {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.ssh-history-item__icon {
  font-size: 1.5em;
  color: var(--neon-cyan);
}

.ssh-history-item__info {
  flex: 1;
}

.ssh-history-item__name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.ssh-history-item__details {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.ssh-history-item__time {
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
  margin-top: var(--spacing-xs);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-disabled);
}

.empty-state i {
  font-size: 2em;
  margin-bottom: var(--spacing-sm);
}

.mt-4 {
  margin-top: var(--spacing-lg);
}

.mb-4 {
  margin-bottom: var(--spacing-lg);
}

/* 快捷命令面板 */
.quick-commands__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.quick-commands__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.quick-command-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  user-select: none;
}

.quick-command-btn i {
  font-size: 1.2em;
  color: var(--neon-cyan);
  flex-shrink: 0;
}

.quick-command-btn span {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-command-btn:hover {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
  transform: translateY(-1px);
}

.quick-command-btn:active {
  transform: scale(0.98);
}

.quick-command-btn--custom {
  border-color: var(--neon-purple);
}

.quick-command-btn--custom i {
  color: var(--neon-purple);
}

.quick-command-btn--custom:hover {
  border-color: var(--neon-purple);
  box-shadow: var(--glow-purple);
}

.quick-command-btn__delete {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  min-height: 20px;
  padding: 0;
  font-size: 16px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.quick-command-btn:hover .quick-command-btn__delete {
  opacity: 1;
}

/* 历史管理界面 */
.history-manager {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-manager__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.history-list {
  max-height: calc(70vh - 100px); /* 🔧 响应式高度 */
  overflow-y: auto;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-card {
  background: var(--color-panel);
  border: 2px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  transition: all var(--transition-base);
}

.history-card:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.2);
  transform: translateY(-2px);
}

.history-card__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.history-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.history-card__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.history-card__title i {
  font-size: 20px;
}

.history-card__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.history-card__actions {
  display: flex;
  gap: var(--spacing-xs);
}

.history-card__details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.history-card__detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.history-card__detail-item i {
  font-size: 14px;
  color: var(--neon-cyan);
}

/* 命令管理器 */
.command-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.manager-toolbar {
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.group-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px;
  background: var(--el-bg-color-page);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.group-header i {
  font-size: 18px;
  color: var(--neon-yellow);
}

.group-name {
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}

.group-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.commands-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 26px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  transition: all 0.2s;
}

.command-item:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 8px rgba(33, 230, 255, 0.2);
}

.command-item i {
  font-size: 16px;
  color: var(--neon-purple);
}

.command-name {
  flex: 1;
  font-size: 13px;
}

.command-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.empty-group {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
}

.empty-state p {
  margin: 12px 0 20px;
  font-size: 14px;
}

/* 图标选择器 */
.icon-selector {
  width: 100%;
}

.icon-selector .el-radio-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  width: 100%;
}

.icon-selector .el-radio-button {
  flex: 1;
}

/* 步骤编辑器 */
.steps-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.step-item {
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.step-number {
  font-weight: 600;
  font-size: 13px;
  color: var(--neon-cyan);
}

/* MySQL样式已移至独立页面 /tools/mysql */

</style>

<style>
/* 🔥 全局样式：修复弹窗位置 */
.force-kill-dialog {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

.el-message-box {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

.el-overlay {
  z-index: 9999 !important;
}
</style>


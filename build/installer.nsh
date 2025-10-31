; 自定义 NSIS 安装脚本
; 用于刷新 Windows 图标缓存，确保桌面图标正确显示

!macro customHeader
  ; 包含必要的头文件
!macroend

!macro customInstall
  ; 刷新文件关联和图标缓存 - 使用多种方法确保图标正确显示
  ; 方法1: 通知Shell图标已更改
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
  
  ; 方法2: 刷新桌面
  SendMessage $HWNDPARENT ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  ; 方法3: 更新系统参数
  System::Call 'user32.dll::SendMessageTimeout(i 0xFFFF, i 0x001A, i 0, i 0, i 2, i 5000, *i .r0)'
!macroend

!macro customInstallMode
  ; 在创建快捷方式后执行
!macroend

!macro customUnInstall
  ; 卸载时也刷新图标缓存
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

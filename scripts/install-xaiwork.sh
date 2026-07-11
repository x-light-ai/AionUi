#!/usr/bin/env bash
# FORK-CUSTOM: XAIWork 一键安装脚本（AionUi 本体 + 预装 officecli）
# ============================================================================
# XAIWork —— 一键安装脚本（仅 Linux / macOS）
# ============================================================================
# 用途：一次装齐 AionUi 运行所需的全部组件，全程走国内镜像加速：
#   - AionUi 本体：从 AionUi 统一下载地址拉取 web 版 tarball 并安装
#     （本体内置 managed ACP 适配器，自带 claude/codex 引擎，无需另装 CLI）
#   - officecli：从 AionUi 统一下载地址预下载二进制，装到 AionCore 约定路径
#
# 用法：
#   bash install-xaiwork.sh
#   # 指定下载地址与版本（下载地址会统一修改，可用环境变量临时覆盖）：
#   AIONUI_DOWNLOAD_URL=https://your.cdn/path AIONUI_VERSION=1.0.0 bash install-xaiwork.sh
# ============================================================================

set -euo pipefail

# ─── 默认配置（会统一修改的项集中在此）────────────────────────────────────────
# AionUi 统一下载地址：AionUi 本体 tarball 与 officecli 二进制均托管于此，后续统一在这里改动
AIONUI_DOWNLOAD_URL="${AIONUI_DOWNLOAD_URL:-__AIONUI_DOWNLOAD_URL__}"

# AionUi 版本号（安装本体时用于拼 tarball 名，占位符未替换时需通过 --version 指定）
AIONUI_VERSION="${AIONUI_VERSION:-__AIONUI_VERSION__}"

# AionUi 本体安装目录与可执行软链目录
INSTALL_DIR="${INSTALL_DIR:-${HOME}/.local/share/xaiwork-web}"
BIN_DIR="${BIN_DIR:-${HOME}/.local/bin}"

# officecli 安装目录：AionCore 的 resolve_officecli_path() 会在 ~/.local/bin/officecli 查找
OFFICECLI_BIN_DIR="${OFFICECLI_BIN_DIR:-${HOME}/.local/bin}"

# ─── 颜色定义 ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── 辅助函数 ─────────────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}[信息]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
error()   { echo -e "${RED}[✗]${NC} $*" >&2; }
die()     { error "$*"; exit 1; }

banner() {
    echo -e "${CYAN}${BOLD}"
    echo "  ╔══════════════════════════════════════════════╗"
    echo "  ║        XAIWork 一键安装器（国内镜像）         ║"
    echo "  ╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_help() {
    cat <<EOF
用法：install-xaiwork.sh [选项]

选项：
  --download-url <url>   AionUi 统一下载地址（本体 tarball 与 officecli 来源）
  --version <version>    AionUi 本体版本号
  --install-dir <path>   AionUi 本体安装目录（默认：${INSTALL_DIR}）
  --skip-aionui          跳过 AionUi 本体安装
  --skip-officecli       跳过 officecli 预装
  --help                 显示本帮助

环境变量：
  AIONUI_DOWNLOAD_URL    同 --download-url
  AIONUI_VERSION         同 --version
  INSTALL_DIR            同 --install-dir

示例：
  # 使用默认配置安装全部组件
  bash install-xaiwork.sh

  # 指定下载地址与版本
  AIONUI_DOWNLOAD_URL=https://your.cdn/path AIONUI_VERSION=1.0.0 bash install-xaiwork.sh
EOF
}

# ─── 命令行参数解析 ───────────────────────────────────────────────────────────
SKIP_AIONUI=0
SKIP_OFFICECLI=0
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --download-url)   AIONUI_DOWNLOAD_URL="$2"; shift 2 ;;
            --version)        AIONUI_VERSION="$2"; shift 2 ;;
            --install-dir)    INSTALL_DIR="$2"; shift 2 ;;
            --skip-aionui)    SKIP_AIONUI=1; shift ;;
            --skip-officecli) SKIP_OFFICECLI=1; shift ;;
            --help)           show_help; exit 0 ;;
            *)                warn "未知选项：$1"; show_help; exit 1 ;;
        esac
    done
}

# ─── 平台探测 ─────────────────────────────────────────────────────────────────
# 说明：AionUi 本体 tarball 用 x86_64/arm64 命名，officecli 用 x64/arm64 命名，分别映射
detect_platform_arch() {
    local os_type machine
    os_type="$(uname -s)"
    machine="$(uname -m)"

    case "$os_type" in
        Darwin) PLATFORM="darwin" ;;
        Linux)  PLATFORM="linux" ;;
        *)      die "不支持的操作系统：$os_type（本脚本仅支持 Linux / macOS）" ;;
    esac

    case "$machine" in
        x86_64|amd64)   TARBALL_ARCH="x86_64"; OFFICECLI_ARCH="x64" ;;
        aarch64|arm64)  TARBALL_ARCH="arm64";  OFFICECLI_ARCH="arm64" ;;
        *)              die "不支持的 CPU 架构：$machine（仅支持 x86_64/amd64 与 aarch64/arm64）" ;;
    esac

    info "检测到平台：${BOLD}${PLATFORM}-${machine}${NC}"

    # AionUi 本体 tarball 名 / officecli 二进制名（命名规则如有不同改这两行）
    TARBALL_NAME="xaiwork-web-${AIONUI_VERSION}-${PLATFORM}-${TARBALL_ARCH}.tar.gz"
    OFFICECLI_ASSET="officecli-${PLATFORM}-${OFFICECLI_ARCH}"
}

# ─── 校验下载地址已配置 ───────────────────────────────────────────────────────
require_download_url() {
    if [[ "$AIONUI_DOWNLOAD_URL" =~ __.*__ ]]; then
        die "AionUi 下载地址未配置，请通过 --download-url 或 AIONUI_DOWNLOAD_URL 指定"
    fi
}

# ─── 安装 AionUi 本体（web 版 tarball）────────────────────────────────────────
install_aionui() {
    require_download_url
    if [[ "$AIONUI_VERSION" =~ [a-zA-Z_] ]]; then
        die "AionUi 版本号未配置，请通过 --version 或 AIONUI_VERSION 指定（如 1.0.0）"
    fi

    local tarball_url="${AIONUI_DOWNLOAD_URL%/}/v${AIONUI_VERSION}/${TARBALL_NAME}"
    local temp_dir tarball_path
    temp_dir="$(mktemp -d)"
    tarball_path="${temp_dir}/${TARBALL_NAME}"

    info "正在下载 AionUi 本体：${BOLD}${tarball_url}${NC}"
    download_file "$tarball_url" "$tarball_path" || die "AionUi 本体下载失败"

    # 备份已存在的旧版本
    if [[ -d "$INSTALL_DIR" ]]; then
        local backup_dir="${INSTALL_DIR}.backup.$(date +%s)"
        warn "安装目录已存在，备份旧版本到：$backup_dir"
        mv "$INSTALL_DIR" "$backup_dir"
    fi
    mkdir -p "$(dirname "$INSTALL_DIR")"

    info "正在解压 ..."
    local extract_temp="${temp_dir}/extract"
    mkdir -p "$extract_temp"
    tar -xzf "$tarball_path" -C "$extract_temp" || die "解压失败"

    if [[ -d "${extract_temp}/xaiwork-web" ]]; then
        mv "${extract_temp}/xaiwork-web" "$INSTALL_DIR"
    else
        die "tarball 结构异常（缺少 xaiwork-web/ 目录）"
    fi

    chmod +x "${INSTALL_DIR}/xaiwork-web" 2>/dev/null || true
    if [[ "$PLATFORM" == "darwin" ]] && command -v xattr &>/dev/null; then
        xattr -dr com.apple.quarantine "${INSTALL_DIR}" 2>/dev/null || true
    fi
    [[ -x "${INSTALL_DIR}/xaiwork-web" ]] || die "安装失败：${INSTALL_DIR}/xaiwork-web 不存在或不可执行"

    # 创建软链
    mkdir -p "$BIN_DIR"
    local symlink_path="${BIN_DIR}/xaiwork-web"
    [[ -L "$symlink_path" ]] && rm "$symlink_path"
    if [[ -e "$symlink_path" ]]; then
        warn "$symlink_path 已存在且非软链，跳过软链创建"
    else
        ln -s "${INSTALL_DIR}/xaiwork-web" "$symlink_path"
    fi

    rm -rf "$temp_dir"
    success "AionUi 本体已安装到 ${INSTALL_DIR}"
}

# ─── 通用下载函数 ─────────────────────────────────────────────────────────────
download_file() {
    local url="$1" out="$2"
    if command -v curl &>/dev/null; then
        curl -fSL --progress-bar -o "$out" "$url"
    elif command -v wget &>/dev/null; then
        wget --show-progress -q -O "$out" "$url"
    else
        die "需要 curl 或 wget，请先安装其中之一"
    fi
}

# ─── 预装 officecli（从 AionUi 下载地址拉二进制）──────────────────────────────
install_officecli() {
    require_download_url

    local asset_url="${AIONUI_DOWNLOAD_URL%/}/${OFFICECLI_ASSET}"
    local target="${OFFICECLI_BIN_DIR}/officecli"
    local temp_dir temp_file
    temp_dir="$(mktemp -d)"
    temp_file="${temp_dir}/officecli"

    info "正在预下载 officecli：${BOLD}${asset_url}${NC}"
    download_file "$asset_url" "$temp_file" || die "officecli 下载失败"

    mkdir -p "$OFFICECLI_BIN_DIR"
    mv "$temp_file" "$target"
    chmod +x "$target"
    rm -rf "$temp_dir"

    # macOS 去除 quarantine 属性，避免 Gatekeeper 拦截未签名二进制
    if [[ "$PLATFORM" == "darwin" ]] && command -v xattr &>/dev/null; then
        xattr -dr com.apple.quarantine "$target" 2>/dev/null || true
    fi

    success "officecli 已安装到 ${target}"
}

# ─── 结果汇总 ─────────────────────────────────────────────────────────────────
print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}  🎉 XAIWork 安装完成${NC}"
    echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════${NC}"
    echo ""
    [[ "$SKIP_AIONUI" == "0" ]]    && echo -e "  ${BOLD}✓ AionUi 本体${NC}          已安装到 ${INSTALL_DIR}（软链 ${BIN_DIR}/xaiwork-web）"
    [[ "$SKIP_OFFICECLI" == "0" ]] && echo -e "  ${BOLD}✓ officecli${NC}            已安装到 ${OFFICECLI_BIN_DIR}/officecli"
    echo ""
    echo -e "  ${BOLD}提示：${NC}如命令未生效，请重启终端或将 ${BIN_DIR} 加入 PATH"
    if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
        echo -e "        ${BOLD}export PATH=\"${BIN_DIR}:\$PATH\"${NC}"
    fi
    echo ""
}

# ─── 主流程 ───────────────────────────────────────────────────────────────────
main() {
    banner
    parse_args "$@"
    detect_platform_arch

    [[ "$SKIP_AIONUI" == "0" ]]    && install_aionui
    [[ "$SKIP_OFFICECLI" == "0" ]] && install_officecli

    print_summary
}

main "$@"

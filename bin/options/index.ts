import path from 'path';
import fsExtra from 'fs-extra';
import logger from '@/options/logger';

import { handleIcon } from './icon';
import { getDomain } from '@/utils/url';
import {
  promptText,
  capitalizeFirstLetter,
  resolveIdentifier,
} from '@/utils/info';
import { generateLinuxPackageName } from '@/utils/name';
import { PakeAppOptions, PakeCliOptions } from '@/types';

const MOBILE_TARGET_GENERIC = 'apk';
const MOBILE_TARGET_ARM64 = 'apk-arm64-v8a';

function resolveAppName(name: string, platform: NodeJS.Platform): string {
  const domain = getDomain(name) || 'pake';
  return platform !== 'linux' ? capitalizeFirstLetter(domain) : domain;
}

function resolveLocalAppName(
  filePath: string,
  platform: NodeJS.Platform,
): string {
  const baseName = path.parse(filePath).name || 'pake-app';
  if (platform === 'linux') {
    return generateLinuxPackageName(baseName) || 'pake-app';
  }
  const normalized = baseName
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff -]/g, '')
    .replace(/^[ -]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || 'pake-app';
}

function isValidName(name: string, platform: NodeJS.Platform): boolean {
  const reg =
    platform === 'linux'
      ? /^[a-z0-9\u4e00-\u9fff][a-z0-9\u4e00-\u9fff-]*$/
      : /^[a-zA-Z0-9\u4e00-\u9fff][a-zA-Z0-9\u4e00-\u9fff- ]*$/;
  return !!name && reg.test(name);
}

function resolveAppVersion(options: PakeCliOptions): string {
  const appVersionProvided = process.argv.includes('--app-version');
  if (appVersionProvided && options.appVersion) {
    return options.appVersion;
  }

  if (options.versionScheme === 'date') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}.${month}.${options.versionPatch}`;
  }

  return options.appVersion || '1.0.0';
}

function resolveMobileTarget(targets: string): string {
  const normalized = (targets || '').trim().toLowerCase();
  if (
    normalized.length === 0 ||
    normalized === 'deb,appimage' ||
    normalized === MOBILE_TARGET_GENERIC
  ) {
    return MOBILE_TARGET_GENERIC;
  }

  if (normalized === MOBILE_TARGET_ARM64 || normalized === 'arm64-v8a') {
    return MOBILE_TARGET_ARM64;
  }

  throw new Error(
    `pake-mobile supports only '${MOBILE_TARGET_GENERIC}' and '${MOBILE_TARGET_ARM64}' targets.`,
  );
}

function warnUnsupportedMobileOptions(options: PakeCliOptions): void {
  const warnings: string[] = [];

  if (options.showSystemTray) warnings.push('--show-system-tray');
  if (options.startToTray) warnings.push('--start-to-tray');
  if (options.multiWindow) warnings.push('--multi-window');
  if (options.multiInstance) warnings.push('--multi-instance');
  if (options.hideTitleBar) warnings.push('--hide-title-bar');
  if (options.activationShortcut) warnings.push('--activation-shortcut');
  if (options.keepBinary) warnings.push('--keep-binary');
  if (options.hideOnClose !== undefined) warnings.push('--hide-on-close');
  if (options.install) warnings.push('--install');

  if (warnings.length > 0) {
    logger.warn(
      `✼ pake-mobile ignores desktop-only options on Android: ${warnings.join(', ')}`,
    );
  }
}

export default async function handleOptions(
  options: PakeCliOptions,
  url: string,
): Promise<PakeAppOptions> {
  const isMobileCli = process.env.PAKE_MOBILE_CLI === '1';
  const { platform } = process;
  const isActions = process.env.GITHUB_ACTIONS;
  let name = options.name;

  const pathExists = await fsExtra.pathExists(url);
  if (!options.name) {
    const defaultName = pathExists
      ? resolveLocalAppName(url, platform)
      : resolveAppName(url, platform);
    const promptMessage = 'Enter your application name';
    const namePrompt = await promptText(promptMessage, defaultName);
    name = namePrompt?.trim() || defaultName;
  }

  if (name && platform === 'linux') {
    name = generateLinuxPackageName(name);
  }

  if (name && !isValidName(name, platform)) {
    const LINUX_NAME_ERROR = `✕ Name should only include lowercase letters, numbers, and dashes (not leading dashes). Examples: com-123-xxx, 123pan, pan123, weread, we-read, 123.`;
    const DEFAULT_NAME_ERROR = `✕ Name should only include letters, numbers, dashes, and spaces (not leading dashes and spaces). Examples: 123pan, 123Pan, Pan123, weread, WeRead, WERead, we-read, We Read, 123.`;
    const errorMsg =
      platform === 'linux' ? LINUX_NAME_ERROR : DEFAULT_NAME_ERROR;
    logger.error(errorMsg);
    if (isActions) {
      name = resolveAppName(url, platform);
      logger.warn(`✼ Inside github actions, use the default name: ${name}`);
    } else {
      process.exit(1);
    }
  }

  const resolvedName = name || 'pake-app';

  const appOptions: PakeAppOptions = {
    ...options,
    name: resolvedName,
    identifier: resolveIdentifier(url, options.name, options.identifier),
    appVersion: resolveAppVersion(options),
    targets: isMobileCli ? resolveMobileTarget(options.targets) : options.targets,
  };

  if (isMobileCli) {
    warnUnsupportedMobileOptions(appOptions);
  }

  const iconPath = await handleIcon(appOptions, url);
  appOptions.icon = iconPath || '';

  return appOptions;
}

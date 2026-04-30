import path from 'path';
import fsExtra from 'fs-extra';
import BaseBuilder from './BaseBuilder';
import { PakeAppOptions } from '@/types';
import tauriConfig from '@/helpers/tauriConfig';
import { mergeConfig } from '@/helpers/merge';
import { npmDirectory } from '@/utils/dir';
import { getSpinner } from '@/utils/info';
import logger from '@/options/logger';
import { shellExec } from '@/utils/shell';

const ANDROID_TARGET_GENERIC = 'apk';
const ANDROID_TARGET_ARM64 = 'apk-arm64-v8a';

export default class AndroidBuilder extends BaseBuilder {
  private buildTarget: string;
  private readonly abi: 'universal' | 'arm64-v8a';

  constructor(options: PakeAppOptions) {
    super(options);

    const requestedTarget = (options.targets || '').trim();
    if (requestedTarget === ANDROID_TARGET_ARM64) {
      this.abi = 'arm64-v8a';
      this.buildTarget = ANDROID_TARGET_ARM64;
    } else {
      this.abi = 'universal';
      this.buildTarget = ANDROID_TARGET_GENERIC;
    }

    this.options.targets = this.buildTarget;
  }

  getFileName(): string {
    const { name = 'pake-app' } = this.options;
    const suffix = this.abi === 'arm64-v8a' ? 'arm64-v8a' : 'android';
    return `${name}_${tauriConfig.version}_${suffix}`;
  }

  async build(url: string) {
    await this.buildAndCopy(url, this.buildTarget);
  }

  protected getFileType(_target: string): string {
    return 'apk';
  }

  async buildAndCopy(url: string, target: string) {
    const { name = 'pake-app' } = this.options;
    await mergeConfig(url, this.options, tauriConfig);

    const packageManager = await this.detectPackageManager();
    const buildSpinner = getSpinner('Building Android app...');
    await new Promise((resolve) => setTimeout(resolve, 500));
    buildSpinner.stop();
    logger.warn('✸ Building Android APK...');

    const configPath = path.join('src-tauri', '.pake', 'tauri.conf.json');
    const argSeparator = packageManager === 'npm' ? ' --' : '';
    const archArg =
      target === ANDROID_TARGET_ARM64 ? ' --target aarch64-linux-android' : '';
    const debugArg = this.options.debug ? ' --debug --verbose' : '';
    const command = `${packageManager} run tauri${argSeparator} android build --apk --config "${configPath}"${archArg}${debugArg}`;

    await shellExec(command, 1800000);

    const apkPath = await this.findBuiltApkPath(target);
    const distPath = path.resolve(`${name}.${this.getFileType(target)}`);
    await fsExtra.copy(apkPath, distPath);

    logger.success('✔ Build success!');
    logger.success('✔ App installer located in', distPath);

    if (this.options.saveBuildCommand) {
      await this.saveBuildCommandArtifact(name, this.getFileType(target), target);
    }
  }

  private async findBuiltApkPath(target: string): Promise<string> {
    const outputsRoot = path.join(
      npmDirectory,
      'src-tauri',
      'gen',
      'android',
      'app',
      'build',
      'outputs',
      'apk',
    );

    if (!(await fsExtra.pathExists(outputsRoot))) {
      throw new Error(
        `Android APK output folder not found at ${outputsRoot}. Ensure Android prerequisites are installed and run 'pnpm run tauri android init' if needed.`,
      );
    }

    const allApks = await this.collectApkFiles(outputsRoot);
    const filtered =
      target === ANDROID_TARGET_ARM64
        ? allApks.filter((item) => item.includes('arm64-v8a'))
        : allApks;

    if (filtered.length === 0) {
      throw new Error(
        `No APK artifact found under ${outputsRoot} for target '${target}'.`,
      );
    }

    const stats = await Promise.all(
      filtered.map(async (filePath) => ({
        filePath,
        mtime: (await fsExtra.stat(filePath)).mtimeMs,
      })),
    );
    stats.sort((a, b) => b.mtime - a.mtime);
    return stats[0].filePath;
  }

  private async collectApkFiles(dirPath: string): Promise<string[]> {
    const entries = await fsExtra.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.collectApkFiles(fullPath)));
      } else if (entry.isFile() && entry.name.endsWith('.apk')) {
        files.push(fullPath);
      }
    }

    return files;
  }
}

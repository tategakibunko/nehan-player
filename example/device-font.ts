type FontGroup = "normal" | "gothic";
type OsGroup = "ios" | "windows" | "android" | "mac" | "chromeos" | "others";
type OsFonts = { [fg in FontGroup]: string };
type DefaultFonts = { [os in OsGroup]: OsFonts };

const defaultFonts: DefaultFonts = {
  'windows': {
    normal: '"游明朝", "Yu Mincho", YuMincho, "ipa-mincho", "IPA明朝", "IPA Mincho", "ＭＳ 明朝", "MS Mincho", monospace',
    gothic: '"游ゴシック", "Yu Gothic", YuGothic, "Meiryo", "メイリオ"',
  },
  'android': {
    normal: '"ipa-mincho", "IPA明朝", "IPA Mincho", monospace',
    gothic: '"游ゴシック", "Yu Gothic", YuGothic, "Osaka", "Meiryo", "メイリオ"',
  },
  'mac': {
    normal: '"ヒラギノ明朝 Pro W3", "Hiragino Mincho Pro", "Hiragino Mincho ProN", "HiraMinProN - W3", monospace',
    gothic: '"Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro W3", "Hiragino Sans", "Osaka", monospace',
  },
  'ios': {
    normal: '"ヒラギノ明朝 Pro W3", "Hiragino Mincho Pro", "Hiragino Mincho ProN", "HiraMinProN - W3", monospace',
    gothic: '"Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro W3", "Hiragino Sans", "Osaka", monospace',
  },
  'chromeos': {
    normal: '"ipa-mincho", "IPA明朝", "IPA Mincho", "ＭＳ 明朝", "MS Mincho", monospace',
    gothic: '"游ゴシック", "Yu Gothic", YuGothic, "Osaka", "Meiryo", "メイリオ"',
  },
  'others': {
    normal: '"ipa-mincho", "IPA明朝", "IPA Mincho", "ＭＳ 明朝", "MS Mincho", monospace',
    gothic: '"游ゴシック", "Yu Gothic", YuGothic, "Osaka", "Meiryo", "メイリオ"',
  }
};

function getOsGroup(ua: string): OsGroup {
  if (ua.indexOf('iphone') >= 0 || ua.indexOf('ipod') >= 0 || ua.indexOf('ipad') >= 0) {
    return 'ios';
  }
  if (ua.indexOf('windows') >= 0) {
    return 'windows';
  }
  if (ua.indexOf('android') >= 0) {
    return 'android';
  }
  if (ua.indexOf('macintosh') >= 0) {
    return 'mac';
  }
  if (ua.indexOf('cros') >= 0) {
    return 'chromeos';
  }
  return 'others';
};

export function getDeviceFontFamily(fontGroup: FontGroup): string {
  const ua = window.navigator.userAgent.toLowerCase();
  const osGroup = getOsGroup(ua);
  return defaultFonts[osGroup][fontGroup];
}

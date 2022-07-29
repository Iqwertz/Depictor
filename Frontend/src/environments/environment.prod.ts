import { Settings } from '../app/modules/shared/components/settings/settings.component';
const settings: Settings = {
  endGcode: 'M05;\nG01X0Y0;',
  startGcode: '$H\nG92X0Y0Z0\nF4000\nG21\nG90\nM05',
  penDownCommand: 'M03S500;',
  penUpCommand: 'M05;',
  avgTimePerLine: 0.096755719, //in s
  maxImageFileSize: 0.05, //in MB
  paperMax: [200, 162],
  drawingOffset: [0, 0],
  centerOnDrawingArea: true,
  gcodeDisplayTransform: [true, false, true],
  standardizeGcode: true,
  floatingPoints: 3,
  standardizerSettings: {
    convertG0: true,
    removeUnsupportedCommands: true,
    removeUnusedParameter: true,
    scaleToDrawingArea: true,
    transfromToPositiveSpace: true,
    supportedCommands: 'G1;G4;M3;M03;M5;M05;F;$',
  },
  port: '',
};

export const environment = {
  production: true,
  ip: '192.168.0.52:3001', //'localhost:3001',
  defaultPort: '3001',
  appStateCheckInterval: 4000,
  useCameraAPI: false,
  alertTime: 3,
  gcodeRendererDefault: {
    gcodeScale: 4.5,
    strokeColor: 'rgba(46, 46, 46, 0.8)',
    strokeColorPassive: '#9e9e9e',
    strokeWidth: 1,
  },
  defaultSettings: settings,
};

import { Settings } from '../app/modules/shared/components/settings/settings.component';
const settings: Settings = {
  endGcode: 'M05;\nG4P0.5;\nG01X0Y0;',
  startGcode: '$H\nG92X0Y0Z0\nF4000\nG21\nG90\nM05\nG4P0.5;',
  penDownCommand: 'M03S500;\nG4P0.5',
  penUpCommand: 'M05;\nG4P0.5;',
  traverseBoundingBox: false,
  traverseBoundingBoxSpeed: 1000,
  avgTimePerLine: 0.096755719, //in s
  maxImageFileSize: 0.05, //in MB
  paperProfiles: [
    {
      name: 'A5',
      paperMax: [210, 148],
      drawingOffset: [0, 0],
    },
    {
      name: 'A4',
      paperMax: [297, 210],
      drawingOffset: [0, 0],
    },
    {
      name: 'A3',
      paperMax: [420, 297],
      drawingOffset: [0, 0],
    },
  ],
  selectedPaperProfile: {
    name: 'A4',
    paperMax: [297, 210],
    drawingOffset: [0, 0],
  },
  centerOnDrawingArea: true,
  displayDefaultTransform: {
    rotate: 1,
    mirrorX: false,
    mirrorY: false,
  },
  gcodeDefaultTransform: {
    rotate: 0,
    mirrorX: false,
    mirrorY: false,
  },
  floatingPoints: 3,
  standardizeGcode: true,
  standardizerSettings: {
    convertG0: true,
    removeUnsupportedCommands: true,
    removeUnusedParameter: true,
    scaleToDrawingArea: true,
    transfromToPositiveSpace: true,
    supportedCommands: 'G1;G4;M3;M03;M5;M05;M226;F;$',
  },
  enablePenChange: true,
  penChangeSettings: {
    penChangeCommand: 'M226',
    penChangeParkGcode: 'G01X0Y0;',
    penChangeUnparkGcode: '$X\nG92X0Y0Z0\nF4000\nG21\nG90\nM05\nG4P0.5;',
  },
  port: '',
  converter: {
    availableConverter: [
      {
        name: 'DrawbotV2',
        needInputFile: true,
        inputFiletype: 'jpg',
        acceptedFiletypes: 'image/',
        isBinary: true,
      },
    ],
    selectedConverter: 'DrawbotV2',
  },
  autoSelectConverter: true,
  enableHardwareControlflow: true,
  enableBetaFeatures: false,
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

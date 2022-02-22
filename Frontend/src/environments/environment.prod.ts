export const environment = {
  production: true,
  version: 'v1.4.0', //this has to match the tag name of the release in a release
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
    drawingOffset: [25, 0],
  },
  defaultSettings: {
    endGcode: 'M05;\nG01X0Y0;',
    penDownCommand: 'M03S500;',
    avgTimePerLine: 0.096755719, //in s
    maxImageFileSize: 0.05, //in MB
  },
};

const xmlBuilder = require('../utils/xmlBuilder');

/**
 * Qo'llab-quvvatlanadigan kamera modellari va ularning ISAPI endpointlari.
 * Yangi model qo'shish uchun shu ob'ektga yangi kalit qo'shing.
 */
const CAMERA_MODELS = {
  'iDS-TCM203-A': {
    label: 'iDS-TCM203-A (Hikvision Parking)',
    getBarrierOpenRequests: () => [
      { method: 'PUT', url: '/ISAPI/Parking/channels/1/barrierGate',                              data: xmlBuilder.buildBarrierGateOpenXml() },
      { method: 'PUT', url: '/ISAPI/Traffic/channels/1/entranceAndExit/barrierGate/1/control',    data: xmlBuilder.buildBarrierGateControlOpenXml() },
      { method: 'PUT', url: '/ISAPI/Traffic/channels/1/barrierControl',                           data: xmlBuilder.buildBarrierControlOpenXml() },
      { method: 'PUT', url: '/ISAPI/System/IO/outputs/1/trigger',                                 data: xmlBuilder.buildIoportTriggerPulseXml() },
    ]
  },

  'DS-TCG205-E': {
    label: 'DS-TCG205-E (Hikvision ITC)',
    getBarrierOpenRequests: () => [
      { method: 'PUT', url: '/ISAPI/ITC/Entrance/barrierGateCtrl', data: xmlBuilder.buildTCG205BarrierCtrlXml(1, 'on') },
    ]
  },

  'DS-TCG406': {
    label: 'DS-TCG406 (Hikvision ITC)',
    getBarrierOpenRequests: () => [
      { method: 'PUT', url: '/ISAPI/ITC/Entrance/barrierGateCtrl', data: xmlBuilder.buildTCG205BarrierCtrlXml(1, 'on') },
      { method: 'PUT', url: '/ISAPI/Parking/channels/1/barrierGate', data: xmlBuilder.buildBarrierGateOpenXml() },
    ]
  }
};

/** Default model (hech narsa ko'rsatilmasa) */
const DEFAULT_MODEL = 'iDS-TCM203-A';

/**
 * Modelning barrier ochish so'rovlarini qaytaradi.
 * Noma'lum model bo'lsa default model ishlatiladi.
 */
function getBarrierRequests(modelName) {
  const model = CAMERA_MODELS[modelName] || CAMERA_MODELS[DEFAULT_MODEL];
  return model.getBarrierOpenRequests();
}

/** Barcha modellar ro'yxatini qaytaradi (frontend uchun) */
function getModelList() {
  return Object.entries(CAMERA_MODELS).map(([value, cfg]) => ({
    value,
    label: cfg.label
  }));
}

module.exports = { CAMERA_MODELS, DEFAULT_MODEL, getBarrierRequests, getModelList };

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Activity, 
  RefreshCw, 
  Info,
  Server,
  Key,
  Globe
} from 'lucide-react';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState(80);
  const [type, setType] = useState('ENTRY');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Uranch135');
  const [model, setModel] = useState('iDS-TCM203-A');
  const [cameraModels, setCameraModels] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  // Status mapping
  const [pingStates, setPingStates] = useState({});
  const [syncingStates, setSyncingStates] = useState({});

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/devices');
      setDevices(response.data);
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Modellar ro'yxatini serverdan olamiz
    axios.get('/api/camera-models').then(res => setCameraModels(res.data)).catch(() => {
      setCameraModels([
        { value: 'iDS-TCM203-A', label: 'iDS-TCM203-A (Hikvision Parking)' },
        { value: 'DS-TCG205-E',  label: 'DS-TCG205-E (Hikvision ITC)' },
        { value: 'DS-TCG406',    label: 'DS-TCG406 (Hikvision ITC)' },
      ]);
    });
  }, []);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!name || !ipAddress) return;

    setFormLoading(true);
    try {
      await axios.post('/api/devices', {
        name,
        ipAddress,
        port: parseInt(port),
        type,
        username,
        password,
        model
      });
      setName('');
      setIpAddress('');
      setPort(80);
      setType('ENTRY');
      setUsername('admin');
      setPassword('Uranch135');
      setModel('iDS-TCM203-A');
      fetchDevices();
      alert("Qurilma muvaffaqiyatli qo'shildi!");
    } catch (err) {
      console.error(err);
      alert('Xatolik yuz berdi: ' + (err.response?.data?.error || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!confirm("Ushbu qurilmani o'chirishni tasdiqlaysizmi?")) return;
    try {
      await axios.delete(`/api/devices/${id}`);
      fetchDevices();
      alert("Qurilma o'chirildi!");
    } catch (err) {
      console.error(err);
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const handlePingDevice = async (id) => {
    setPingStates(prev => ({ ...prev, [id]: 'pinging' }));
    try {
      const response = await axios.get(`/api/devices/${id}/ping`);
      setPingStates(prev => ({ ...prev, [id]: response.data.status }));
    } catch (err) {
      console.error('Ping failed:', err);
      setPingStates(prev => ({ ...prev, [id]: 'OFFLINE' }));
    }
  };

  const handleSyncDeviceLogs = async (id) => {
    setSyncingStates(prev => ({ ...prev, [id]: true }));
    try {
      const response = await axios.post(`/api/devices/${id}/sync`);
      alert(`Sinxronizatsiya yakunlandi: ${response.data.syncedCount} ta yangi mashina kiritildi.`);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Kameradagi loglarni sinxronlashda xatolik yuz berdi');
    } finally {
      setSyncingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-academic-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-ranch-red border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-academic-bg space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
      
      {/* Split grid: Device Form vs Devices List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Create Device form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-gray">
              <Camera className="w-5 h-5 text-ranch-red" />
              <h3 className="font-bold text-charcoal text-sm">Yangi kamera qo'shish</h3>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Kamera nomi</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="masalan, Kirish Kamera"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">IP Manzil</label>
                  <input
                    type="text"
                    required
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="masalan, 10.70.5.8"
                    className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Port</label>
                  <input
                    type="number"
                    required
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Qurilma turi</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
                >
                  <option value="ENTRY">KIRISH (Entry Camera)</option>
                  <option value="EXIT">ChIQISh (Exit Camera)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Kamera modeli</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
                >
                  {cameraModels.length > 0
                    ? cameraModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)
                    : <>
                        <option value="iDS-TCM203-A">iDS-TCM203-A (Hikvision Parking)</option>
                        <option value="DS-TCG205-E">DS-TCG205-E (Hikvision ITC)</option>
                        <option value="DS-TCG406">DS-TCG406 (Hikvision ITC)</option>
                      </>
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-surface-gray pt-4">
                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Login</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Parol</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 bg-ranch-red hover:bg-ranch-red/90 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Qurilmani saqlash
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Devices List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-charcoal text-sm">Ulangan IP Kameralar</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devices.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl border border-surface-gray p-8 text-center text-muted-slate text-xs font-semibold">
                Sizda hech qanday IP kameralar ulanmagan
              </div>
            ) : (
              devices.map((device) => {
                const status = pingStates[device.id] || device.status || 'ONLINE';
                const syncing = syncingStates[device.id] || false;

                return (
                  <div key={device.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
                    {/* Device Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-ranch-red/10 text-ranch-red flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-charcoal text-sm leading-tight">{device.name}</h4>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded-full ${
                            status === 'ONLINE'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-red-500/10 text-red-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status === 'ONLINE' ? 'bg-emerald-500 animate-status-pulse' : 'bg-red-500'}`}></span>
                            {status === 'pinging' ? 'Tekshirilmoqda...' : status}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-1.5 text-muted-slate hover:text-ranch-red hover:bg-ranch-red/10 rounded-lg transition-all"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2 border-t border-surface-gray/50 pt-3 text-xs font-semibold text-muted-slate">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-charcoal" />
                        <span>IP Manzil: <strong className="text-charcoal font-mono">{device.ipAddress}:{device.port}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-charcoal" />
                        <span>Qurilma turi: <strong className="text-charcoal">{device.type === 'ENTRY' ? 'KIRISH' : 'CHIQISH'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-charcoal" />
                        <span>Model: <strong className="text-charcoal font-mono">{device.model || 'iDS-TCM203-A'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-charcoal" />
                        <span>Kreditlar: <strong className="text-charcoal font-mono">{device.username}:***</strong></span>
                      </div>
                    </div>

                    {/* Footer Tools (Ping & Sync) */}
                    <div className="grid grid-cols-2 gap-3 border-t border-surface-gray/50 pt-4">
                      <button
                        onClick={() => handlePingDevice(device.id)}
                        disabled={pingStates[device.id] === 'pinging'}
                        className="py-2 px-3 border border-surface-gray hover:bg-academic-bg/50 rounded-lg text-[10px] font-bold text-charcoal transition-all flex items-center justify-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Aloqani tekshirish
                      </button>
                      <button
                        onClick={() => handleSyncDeviceLogs(device.id)}
                        disabled={syncing}
                        className="py-2 px-3 bg-ranch-red hover:bg-ranch-red/90 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        Arxivni sinxronlash
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Devices;

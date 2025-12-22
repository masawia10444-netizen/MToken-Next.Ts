import { useState, useEffect } from 'react';
import Head from 'next/head';
import { UserData } from '../types';

declare global {
  interface Window { czpSdk: any; }
}

export default function Home() {
  // State
  const [view, setView] = useState<'login' | 'processing' | 'register' | 'dashboard'>('login');
  const [loadingMsg, setLoadingMsg] = useState('กำลังตรวจสอบข้อมูล...');
  const [appId, setAppId] = useState('');
  const [mToken, setMToken] = useState('');
  
  // Data State
  const [userData, setUserData] = useState<UserData | null>(null);
  const [regForm, setRegForm] = useState<any>({});

  // Auto-Run Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let foundAppId = params.get('appId');
    let foundMToken = params.get('mToken');

    if (!foundAppId && typeof window !== 'undefined' && window.czpSdk) {
      try { foundAppId = window.czpSdk.getAppId(); } catch (e) {}
    }

    if (foundAppId) setAppId(foundAppId);
    if (foundMToken) setMToken(foundMToken);

    if (foundAppId && foundMToken) {
      handleLogin(foundAppId, foundMToken);
    }
  }, []);

  const handleLogin = async (appIdInput: string, mTokenInput: string) => {
    setView('processing');
    setLoadingMsg('กำลังตรวจสอบ Token...');

    try {
      const res = await fetch('test5/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: appIdInput, mToken: mTokenInput })
      });
      const result = await res.json();

      if (result.status === 'found') {
        setUserData(result.data);
        setView('dashboard');
      } else if (result.status === 'new_user') {
        setRegForm(result.data); // เก็บข้อมูลรัฐไว้ใช้ตอน Register
        setView('register');
      } else {
        alert('Login Error: ' + result.message);
        setView('login');
      }
    } catch (e: any) {
      alert('Network Error: ' + e.message);
      setView('login');
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMsg('กำลังบันทึกข้อมูล...');
    // setView('processing'); // ถ้าอยากให้ขึ้น Loading

    const payload = { ...regForm }; // รวมข้อมูลจากรัฐ + ข้อมูลใหม่ใน Form

    try {
      const res = await fetch('/test5/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.status === 'success') {
        alert('ลงทะเบียนสำเร็จ!');
        setUserData(payload);
        setView('dashboard');
      } else {
        alert('บันทึกไม่ผ่าน: ' + result.message);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{ fontFamily: 'Sarabun, sans-serif' }}>
      <Head>
        <title>Citizen Digital ID</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      </Head>

      <div className="card border-0 shadow-lg" style={{ maxWidth: '500px', width: '100%', borderRadius: '20px', overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="text-white text-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a, #2563eb)' }}>
          <i className="fa-solid fa-shield-halved fa-3x mb-2"></i>
          <h4 className="fw-bold m-0">ระบบยืนยันตัวตน</h4>
          <small className="opacity-75">Next.js TypeScript Edition</small>
        </div>

        <div className="p-4 bg-white">
          
          {/* 1. Login View */}
          {view === 'login' && (
            <div>
              <div className="mb-3">
                <label className="fw-bold">App ID</label>
                <input type="text" className="form-control" value={appId} onChange={e => setAppId(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="fw-bold">mToken</label>
                <textarea className="form-control" rows={3} value={mToken} onChange={e => setMToken(e.target.value)}></textarea>
              </div>
              <button onClick={() => handleLogin(appId, mToken)} className="btn btn-primary w-100 py-2">เข้าสู่ระบบ</button>
            </div>
          )}

          {/* 2. Processing */}
          {view === 'processing' && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3"></div>
              <p className="text-muted">{loadingMsg}</p>
            </div>
          )}

          {/* 3. Register View */}
          {view === 'register' && (
            <form onSubmit={submitRegister}>
              <div className="alert alert-info text-center"><small>ไม่พบข้อมูล กรุณาลงทะเบียน</small></div>
              <div className="mb-2">
                <label className="small text-muted">เลขบัตร (Locked)</label>
                <input type="text" className="form-control bg-light" value={regForm.citizenId || ''} readOnly />
              </div>
              <div className="row mb-2">
                <div className="col">
                  <input type="text" className="form-control bg-light" value={regForm.firstName || ''} readOnly />
                </div>
                <div className="col">
                  <input type="text" className="form-control bg-light" value={regForm.lastName || ''} readOnly />
                </div>
              </div>
              <div className="mb-2">
                <label className="fw-bold">เบอร์โทรศัพท์</label>
                <input type="tel" className="form-control" required 
                  value={regForm.mobile || ''} 
                  onChange={e => setRegForm({...regForm, mobile: e.target.value})} 
                />
              </div>
              <div className="mb-3">
                <label className="fw-bold">ที่อยู่</label>
                <textarea className="form-control" rows={2} 
                  value={regForm.additionalInfo || ''}
                  onChange={e => setRegForm({...regForm, additionalInfo: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-success w-100 py-2">ลงทะเบียนสมาชิก</button>
            </form>
          )}

          {/* 4. Dashboard */}
          {view === 'dashboard' && userData && (
            <div className="text-center">
              <div className="mb-3 text-success display-1"><i className="fa-solid fa-circle-check"></i></div>
              <h4>ยินดีต้อนรับ, {userData.firstName}</h4>
              <p className="text-muted">{userData.citizenId}</p>
              <div className="card bg-light p-3 text-start mb-3">
                <small>เบอร์โทร: {userData.mobile || '-'}</small><br/>
                <small>ข้อมูลเพิ่ม: {userData.additionalInfo || '-'}</small>
              </div>
              <button onClick={() => window.location.reload()} className="btn btn-outline-secondary w-100">ออกจากระบบ</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}